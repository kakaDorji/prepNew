function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

// Helper function to safely get parameter values
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
  try {
    console.log('=== UNSCHEDULED VISIT HANDLER ===');
    console.log('e.parameter:', JSON.stringify(e.parameter));
    
    const action = safeGetParameter(e, 'action', 'add');
    console.log('Action:', action);
    
    switch (action) {
      case 'checkData':
        const uidForCheck = safeGetParameter(e, 'uid');
        const hasData = checkIfDataExists(uidForCheck);
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          hasData: hasData
        })).setMimeType(ContentService.MimeType.JSON);
      
      case 'prefill':
        const uid = safeGetParameter(e, 'uid');
        console.log('Prefill - UID:', uid);
        return ContentService.createTextOutput(JSON.stringify(getPrefillData(uid)))
               .setMimeType(ContentService.MimeType.JSON);
      
      case 'update':
        return ContentService.createTextOutput(JSON.stringify(updateRecord(e)))
               .setMimeType(ContentService.MimeType.JSON);
      
      case 'delete':
        const deleteUid = safeGetParameter(e, 'uid');
        return ContentService.createTextOutput(JSON.stringify(deleteRecord(deleteUid)))
               .setMimeType(ContentService.MimeType.JSON);
      
      default:
        return ContentService.createTextOutput(JSON.stringify(addNewRecord(e)))
               .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: 'Server error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
}

function fetchAllData() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  return data;
}

// Find record by UID and return with row number
function fetchByUid(uid) {
  if (!uid) return null;
  
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) { // start from 1 to skip header
    if (data[i][0]?.toString().toLowerCase() === uid.toLowerCase()) {
      return { rowData: data[i], rowNumber: i + 1 }; // return row data + row number
    }
  }
  return null; // UID not found
}

// Check if data exists for UID
function checkIfDataExists(uid) {
  if (!uid) return false;
  const data = fetchByUid(uid);
  return data !== null;
}

// Column mapping based on your exact headers
function getColumnMapping() {
  return {
    0: 'uid',
    1: 'prep_site', 
    2: 'date',
    3: 'reason_for_this_visit',
    4: 'Other_describe',
    5: 'Nausea',
    6: 'Nausea_Ongoing',
    7: 'Nausea_Resolved',
    8: 'Vomiting',
    9: 'Vomiting_Ongoing',
    10: 'Vomiting_Resolved',
    11: 'Abdominalcramps',
    12: 'Abdominalcramps_Ongoing',
    13: 'Abdominalcramps_ Resolved', // Note: space in header
    14: 'Fatigue',
    15: 'Fatigue_Ongoing',
    16: 'Fatigue_Resolved',
    17: 'Dizziness',
    18: 'Dizziness_Ongoing',
    19: 'Resolved', // Dizziness resolved
    20: 'Headache',
    21: 'Headache_Ongoing',
    22: 'Headache_Resolved',
    23: 'Others',
    24: 'Others_Ongoing',
    25: 'Others_Resolved',
    26: 'Others_please_describe_below',
    27: 'challenges_taking_PrEP',
    28: 'comments_challenges_faced',
    29: 'Additional_doses_above',
    30: 'stop_or_continue',
    31: 'stopping_reason',
    32: 'stopping_indicatte_reasons_ preferred_method',
    33: 'Other_notes',
    34: 'Date', // Interviewer date
    35: 'Name', // Interviewer name
    36: 'Designation',
    37: 'BMHC Number:' // With colon
  };
}

// Get prefill data for specific UID
function getPrefillData(uid) {
  try {
    console.log('getPrefillData called - UID:', uid);
    
    const data = fetchByUid(uid);
    if (!data) return { status: 'error', message: `No data found for ${uid}` };

    const rowData = data.rowData;
    const columnMapping = getColumnMapping();
    const prefillObject = {};
    
    // Backend to Frontend field mapping
    const fieldMapping = {
      'uid': 'participant_uid',
      'reason_for_this_visit': 'reason_visit',
      'Other_describe': 'other_reason_visit', 
      'Others_please_describe_below': 'others_description',
      'challenges_taking_PrEP': 'challenges_prep',
      'comments_challenges_faced': 'challenges_details',
      'Additional_doses_above': 'additional_doses_details',
      'stop_or_continue': 'prep_continue',
      'stopping_reason': 'stopping_reasons',
      'stopping_indicatte_reasons_ preferred_method': 'stopping_Preventionmethod',
      'Other_notes': 'other_notes',
      'Date': 'interviewer_date',
      'Name': 'interviewer_name',
      'Designation': 'designation',
      'BMHC Number:': 'bmhc_number',
      'Nausea': 'nausea',
      'Nausea_Ongoing': 'nausea_ongoing',
      'Nausea_Resolved': 'nausea_resolved',
      'Vomiting': 'vomiting',
      'Vomiting_Ongoing': 'vomiting_ongoing', 
      'Vomiting_Resolved': 'vomiting_resolved',
      'Abdominalcramps': 'abdominal_cramps',
      'Abdominalcramps_Ongoing': 'abdominal_cramps_ongoing',
      'Abdominalcramps_ Resolved': 'abdominal_cramps_resolved',
      'Fatigue': 'fatigue',
      'Fatigue_Ongoing': 'fatigue_ongoing',
      'Fatigue_Resolved': 'fatigue_resolved',
      'Dizziness': 'dizziness',
      'Dizziness_Ongoing': 'dizziness_ongoing',
      'Resolved': 'dizziness_resolved',
      'Headache': 'headache',
      'Headache_Ongoing': 'headache_ongoing',
      'Headache_Resolved': 'headache_resolved',
      'Others': 'others',
      'Others_Ongoing': 'others_ongoing',
      'Others_Resolved': 'others_resolved'
    };
    
    // Map row values to form fields
    Object.keys(columnMapping).forEach(position => {
      const index = parseInt(position);
      const backendFieldName = columnMapping[position];
      const frontendFieldName = fieldMapping[backendFieldName] || backendFieldName.toLowerCase();
      
      let value = rowData[index];
      
      // Handle empty/null/undefined values
      if (value === null || value === undefined || value === '' || value === 'n/a') {
        prefillObject[frontendFieldName] = '';
      } else if (backendFieldName.toLowerCase().includes('date')) {
        // Handle date fields
        if (value instanceof Date) {
          prefillObject[frontendFieldName] = value.toISOString().split('T')[0];
        } else if (value) {
          const parsedDate = new Date(value);
          prefillObject[frontendFieldName] = !isNaN(parsedDate) ? parsedDate.toISOString().split('T')[0] : '';
        } else {
          prefillObject[frontendFieldName] = '';
        }
      } else if (backendFieldName === 'reason_for_this_visit') {
        // Handle reason_visit as array
        prefillObject[frontendFieldName] = value ? value.toString().split('; ') : [];
      } else if (backendFieldName.includes('_Ongoing') || backendFieldName.includes('_Resolved') || backendFieldName === 'Resolved') {
        // Handle boolean fields (Yes/No to true/false)
        prefillObject[frontendFieldName] = value === 'Yes' || value === true;
      } else {
        // Handle regular text fields
        prefillObject[frontendFieldName] = value.toString().trim();
      }
    });

    console.log('Prefill object created:', JSON.stringify(prefillObject));
    return { status: 'success', data: prefillObject };
  } catch (error) {
    console.error('Error in getPrefillData:', error);
    return { status: 'error', message: 'Error fetching data: ' + error };
  }
}

// Create row data for spreadsheet
function createRowData(e) {
  return [
    // Basic info (columns 0-4)
    safeGetParameter(e, 'uid', ''),
    safeGetParameter(e, 'prep_site', ''),
    safeGetParameter(e, 'date', ''),
    safeGetParameter(e, 'reason_for_this_visit', ''),
    safeGetParameter(e, 'other_describe', ''),
    
    // Side effects (columns 5-26)
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
    
    // PrEP related (columns 27-33)
    safeGetParameter(e, 'challenges_taking_prep', ''),
    safeGetParameter(e, 'comments_challenges_faced', ''),
    safeGetParameter(e, 'additional_doses_above', ''),
    safeGetParameter(e, 'stop_or_continue', ''),
    safeGetParameter(e, 'stopping_reason', ''),
    safeGetParameter(e, 'stopping_indicate_reasons_preferred_method', ''),
    safeGetParameter(e, 'other_notes', ''),
    
    // Interviewer info (columns 34-37)
    safeGetParameter(e, 'interviewer_date', ''),
    safeGetParameter(e, 'interviewer_name', ''),
    safeGetParameter(e, 'designation', ''),
    safeGetParameter(e, 'bmhc_number', '')
  ];
}

// Add new record
function addNewRecord(e) {
  try {
    console.log('=== ADD NEW RECORD ===');
    
    const uid = safeGetParameter(e, 'uid');
    console.log('Add - UID:', uid);
    
    if (!uid) {
      return { status: 'error', message: 'Missing UID' };
    }
    
    // Check if this UID already has data
    const existingData = fetchByUid(uid);
    if (existingData) {
      return { status: 'error', message: `Record already exists for UID: ${uid}. Use update instead.` };
    }

    const sheet = getSheet();
    const rowData = createRowData(e);
    console.log('New row data:', JSON.stringify(rowData));

    // Add new row
    sheet.appendRow(rowData);
    
    return { status: 'success', message: `Unscheduled Visit submitted successfully for UID: ${uid}` };
  } catch (error) {
    console.error('Error in addNewRecord:', error);
    return { status: 'error', message: 'Error adding record: ' + error };
  }
}

// Update existing record
function updateRecord(e) {
  try {
    console.log('=== UPDATE RECORD ===');
    
    const uid = safeGetParameter(e, 'uid');
    console.log('Update - UID:', uid);
    
    if (!uid) {
      return { status: 'error', message: 'Missing UID' };
    }
    
    const existingData = fetchByUid(uid);
    if (!existingData) {
      return { status: 'error', message: `Record for UID ${uid} not found` };
    }

    const sheet = getSheet();
    const rowNumber = existingData.rowNumber;
    const rowData = createRowData(e);
    console.log('Updated row data:', JSON.stringify(rowData));

    // Update the row
    sheet.getRange(rowNumber, 1, 1, rowData.length).setValues([rowData]);
    
    return { status: 'success', message: `Unscheduled visit updated for UID: ${uid}` };
  } catch (error) {
    console.error('Error in updateRecord:', error);
    return { status: 'error', message: 'Error updating record: ' + error };
  }
}

// Delete record
function deleteRecord(uid) {
  try {
    console.log('=== DELETE RECORD ===');
    console.log('Delete - UID:', uid);
    
    if (!uid) {
      return { status: 'error', message: 'Missing UID for deletion' };
    }
    
    const data = fetchByUid(uid);
    if (!data) {
      return { status: 'error', message: `Record for UID ${uid} not found` };
    }

    const sheet = getSheet();
    
    // Delete the entire row
    sheet.deleteRow(data.rowNumber);
    
    return { status: 'success', message: `Unscheduled visit record deleted for UID: ${uid}` };
  } catch (error) {
    console.error('Error in deleteRecord:', error);
    return { status: 'error', message: 'Error deleting record: ' + error };
  }
}