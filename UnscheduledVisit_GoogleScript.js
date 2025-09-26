function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

// Helper function to safely get parameter values and prevent n/a
function safeGetParameter(e, paramName, defaultValue = '') {
  let value = null;
  
  // Try e.parameter first (for POST requests)
  if (e.parameter && e.parameter[paramName] !== undefined && e.parameter[paramName] !== null) {
    value = e.parameter[paramName];
  }
  // Then try e.parameters (for GET requests)
  else if (e.parameters && e.parameters[paramName] && Array.isArray(e.parameters[paramName])) {
    value = e.parameters[paramName][0];
  }
  
  // Handle various "empty" cases
  if (value === null || value === undefined || value === 'undefined' || value === 'null' || value === 'n/a' || value === '') {
    return defaultValue;
  }
  
  return value.toString().trim();
}

// Main request handler
function handleRequest(e) {
  // Handle OPTIONS request (preflight) - Google Apps Script handles CORS automatically for web apps
  if (e.parameter && e.parameter.method == 'OPTIONS') {
    return ContentService.createTextOutput('')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    console.log('=== UNSCHEDULED VISIT HANDLER DEBUG ===');
    console.log('e.parameter:', JSON.stringify(e.parameter));
    
    const action = safeGetParameter(e, 'action', 'add');
    console.log('Action:', action);
    
    switch (action) {
      case 'prefill':
        const uid = safeGetParameter(e, 'uid');
        const visitDate = safeGetParameter(e, 'visitDate');
        console.log('Prefill - UID:', uid, 'VisitDate:', visitDate);
        return ContentService.createTextOutput(JSON.stringify(getPrefillData(uid, visitDate)))
               .setMimeType(ContentService.MimeType.JSON);
      
      case 'getVisitDates':
        const uidForVisits = safeGetParameter(e, 'uid');
        const availableVisits = getAvailableVisitDates(uidForVisits);
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          availableVisits: availableVisits
        })).setMimeType(ContentService.MimeType.JSON);
      
      case 'update':
        return ContentService.createTextOutput(JSON.stringify(updateRecord(e)))
               .setMimeType(ContentService.MimeType.JSON);
      
      case 'delete':
        const deleteUid = safeGetParameter(e, 'uid');
        const deleteVisitDate = safeGetParameter(e, 'visitDate');
        return ContentService.createTextOutput(JSON.stringify(deleteRecord(deleteUid, deleteVisitDate)))
               .setMimeType(ContentService.MimeType.JSON);
      
      default:
        return ContentService.createTextOutput(JSON.stringify(addNewRecord(e)))
               .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: 'Server error: ' + error.toString(),
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Get the sheet
function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
}

// Get all data from sheet
function fetchAllData() {
  return getSheet().getDataRange().getValues();
}

// Find record by UID and visit date
function fetchByUidAndVisitDate(uid, visitDate) {
  if (!uid || !visitDate) return null;
  
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) {
    // Column 0 = uid, Column 2 = date
    if (data[i][0]?.toString().toLowerCase() === uid.toLowerCase() && 
        data[i][2]?.toString() === visitDate) {
      return { rowData: data[i], rowNumber: i + 1 };
    }
  }
  return null;
}

// Get list of visit dates that have data for UID
function getAvailableVisitDates(uid) {
  if (!uid) return [];
  
  const data = fetchAllData();
  const visitDates = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]?.toString().toLowerCase() === uid.toLowerCase()) {
      const visitDate = data[i][2]?.toString(); // date column
      if (visitDate && !visitDates.includes(visitDate)) {
        visitDates.push(visitDate);
      }
    }
  }
  
  return visitDates.sort().reverse(); // Sort newest first
}

// Column mapping for prefill (based on your CSV headers)
function getColumnMapping() {
  return {
    0: 'uid',
    1: 'prep_site', 
    2: 'date',
    3: 'reason_for_this_visit',
    4: 'other_describe',
    5: 'nausea',
    6: 'nausea_ongoing',
    7: 'nausea_resolved',
    8: 'vomiting',
    9: 'vomiting_ongoing',
    10: 'vomiting_resolved',
    11: 'abdominal_cramps',
    12: 'abdominal_cramps_ongoing',
    13: 'abdominal_cramps_resolved',
    14: 'fatigue',
    15: 'fatigue_ongoing',
    16: 'fatigue_resolved',
    17: 'dizziness',
    18: 'dizziness_ongoing',
    19: 'dizziness_resolved',
    20: 'headache',
    21: 'headache_ongoing',
    22: 'headache_resolved',
    23: 'others',
    24: 'others_ongoing',
    25: 'others_resolved',
    26: 'others_please_describe_below',
    27: 'challenges_taking_prep',
    28: 'comments_challenges_faced',
    29: 'additional_doses_above',
    30: 'stop_or_continue',
    31: 'stopping_reason',
    32: 'stopping_indicate_reasons_preferred_method',
    33: 'other_notes',
    34: 'interviewer_date',
    35: 'interviewer_name',
    36: 'designation',
    37: 'bhmc_number'
  };
}

// Get prefill data for specific UID and visit date
function getPrefillData(uid, visitDate) {
  try {
    console.log('getPrefillData called - UID:', uid, 'VisitDate:', visitDate);
    
    if (!visitDate) {
      const availableVisits = getAvailableVisitDates(uid);
      if (availableVisits.length === 0) return { status: 'error', message: `Add unscheduled visit data for ${uid}` };
      return { status: 'success', availableVisits, message: 'Select a visit date to load data' };
    }

    const data = fetchByUidAndVisitDate(uid, visitDate);
    if (!data) return { status: 'error', message: `Add unscheduled visit data for ${uid} on ${visitDate}` };

    const rowData = data.rowData;
    const columnMapping = getColumnMapping();
    const prefillObject = {};
    
    // Map row values to form fields
    Object.keys(columnMapping).forEach(position => {
      const index = parseInt(position);
      const fieldName = columnMapping[position];
      
      let value = rowData[index];
      
      // Handle empty/null/undefined values
      if (value === null || value === undefined || value === '' || value === 'n/a' || value === 'undefined') {
        prefillObject[fieldName] = '';
      } else if (fieldName.includes('date')) {
        // Handle date fields
        if (value instanceof Date) {
          prefillObject[fieldName] = value.toISOString().split('T')[0];
        } else if (value) {
          const parsedDate = new Date(value);
          prefillObject[fieldName] = !isNaN(parsedDate) ? parsedDate.toISOString().split('T')[0] : '';
        } else {
          prefillObject[fieldName] = '';
        }
      } else {
        // Handle regular text fields
        prefillObject[fieldName] = value.toString().trim();
      }
    });

    console.log('Prefill object created:', JSON.stringify(prefillObject));
    return { status: 'success', data: prefillObject, visitDate };
  } catch (error) {
    console.error('Error in getPrefillData:', error);
    return { status: 'error', message: 'Error fetching data: ' + error };
  }
}

// Create the row data array for unscheduled visit
function createRowData(e) {
  return [
    // Basic info
    safeGetParameter(e, 'uid', ''),
    safeGetParameter(e, 'prep_site', ''),
    safeGetParameter(e, 'date', ''),
    safeGetParameter(e, 'reason_for_this_visit', ''),
    safeGetParameter(e, 'other_describe', ''),
    
    // Side effects
    safeGetParameter(e, 'nausea', ''),
    safeGetParameter(e, 'nausea_ongoing', ''),
    safeGetParameter(e, 'nausea_resolved', ''),
    safeGetParameter(e, 'vomiting', ''),
    safeGetParameter(e, 'vomiting_ongoing', ''),
    safeGetParameter(e, 'vomiting_resolved', ''),
    safeGetParameter(e, 'abdominal_cramps', ''),
    safeGetParameter(e, 'abdominal_cramps_ongoing', ''),
    safeGetParameter(e, 'abdominal_cramps_resolved', ''),
    safeGetParameter(e, 'fatigue', ''),
    safeGetParameter(e, 'fatigue_ongoing', ''),
    safeGetParameter(e, 'fatigue_resolved', ''),
    safeGetParameter(e, 'dizziness', ''),
    safeGetParameter(e, 'dizziness_ongoing', ''),
    safeGetParameter(e, 'dizziness_resolved', ''),
    safeGetParameter(e, 'headache', ''),
    safeGetParameter(e, 'headache_ongoing', ''),
    safeGetParameter(e, 'headache_resolved', ''),
    safeGetParameter(e, 'others', ''),
    safeGetParameter(e, 'others_ongoing', ''),
    safeGetParameter(e, 'others_resolved', ''),
    safeGetParameter(e, 'others_please_describe_below', ''),
    
    // PrEP related
    safeGetParameter(e, 'challenges_taking_prep', ''),
    safeGetParameter(e, 'comments_challenges_faced', ''),
    safeGetParameter(e, 'additional_doses_above', ''),
    safeGetParameter(e, 'stop_or_continue', ''),
    safeGetParameter(e, 'stopping_reason', ''),
    safeGetParameter(e, 'stopping_indicate_reasons_preferred_method', ''),
    safeGetParameter(e, 'other_notes', ''),
    
    // Interviewer info
    safeGetParameter(e, 'interviewer_date', ''),
    safeGetParameter(e, 'interviewer_name', ''),
    safeGetParameter(e, 'designation', ''),
    safeGetParameter(e, 'bhmc_number', '')
  ];
}

// Add new record
function addNewRecord(e) {
  try {
    console.log('=== ADD NEW UNSCHEDULED VISIT RECORD ===');
    
    const uid = safeGetParameter(e, 'uid');
    const visitDate = safeGetParameter(e, 'date');
    
    console.log('Add parameters - UID:', uid, 'VisitDate:', visitDate);
    
    if (!uid || !visitDate) {
      return { status: 'error', message: 'Missing UID or visit date' };
    }
    
    // Check if this specific UID + visit date combination already exists
    const existingData = fetchByUidAndVisitDate(uid, visitDate);
    if (existingData) {
      return { status: 'error', message: `Unscheduled visit record already exists for UID: ${uid} on ${visitDate}. Use update instead.` };
    }

    const sheet = getSheet();
    const rowData = createRowData(e);

    console.log('New row data:', JSON.stringify(rowData));

    // Add new row
    sheet.appendRow(rowData);
    
    return { status: 'success', message: `Unscheduled Visit submitted successfully for UID: ${uid} on ${visitDate}` };
  } catch (error) {
    console.error('Error in addNewRecord:', error);
    return { status: 'error', message: 'Error adding record: ' + error };
  }
}

// Update existing record
function updateRecord(e) {
  try {
    console.log('=== UPDATE UNSCHEDULED VISIT RECORD ===');
    
    const uid = safeGetParameter(e, 'uid');
    const visitDate = safeGetParameter(e, 'date');
    
    console.log('Update parameters - UID:', uid, 'VisitDate:', visitDate);
    
    if (!uid || !visitDate) {
      return { status: 'error', message: 'Missing UID or visit date' };
    }
    
    const existingData = fetchByUidAndVisitDate(uid, visitDate);
    if (!existingData) {
      return { status: 'error', message: `Unscheduled visit record for UID ${uid} on ${visitDate} not found` };
    }

    const sheet = getSheet();
    const rowNumber = existingData.rowNumber;
    const rowData = createRowData(e);

    console.log('Updated row data:', JSON.stringify(rowData));

    // Update the row
    sheet.getRange(rowNumber, 1, 1, rowData.length).setValues([rowData]);
    
    return { status: 'success', message: `Unscheduled visit updated for UID: ${uid} on ${visitDate}` };
  } catch (error) {
    console.error('Error in updateRecord:', error);
    return { status: 'error', message: 'Error updating record: ' + error };
  }
}

// Delete record
function deleteRecord(uid, visitDate) {
  try {
    console.log('=== DELETE UNSCHEDULED VISIT RECORD ===');
    console.log('Delete parameters - UID:', uid, 'VisitDate:', visitDate);
    
    if (!uid || !visitDate) {
      return { status: 'error', message: 'Missing UID or visit date for deletion' };
    }
    
    const data = fetchByUidAndVisitDate(uid, visitDate);
    if (!data) {
      return { status: 'error', message: `Unscheduled visit record for UID ${uid} on ${visitDate} not found` };
    }

    const sheet = getSheet();
    
    // Delete the entire row
    sheet.deleteRow(data.rowNumber);
    
    return { status: 'success', message: `Unscheduled visit record deleted for UID: ${uid} on ${visitDate}` };
  } catch (error) {
    console.error('Error in deleteRecord:', error);
    return { status: 'error', message: 'Error deleting record: ' + error };
  }
}