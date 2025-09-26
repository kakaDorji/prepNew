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

// Helper function to add CORS headers to responses
function addCorsHeaders(response) {
  return response.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
}

// Main request handler
function handleRequest(e) {
  // Handle OPTIONS request (preflight)
  if (e.parameter && e.parameter.method == 'OPTIONS') {
    return addCorsHeaders(
      ContentService.createTextOutput('')
        .setMimeType(ContentService.MimeType.TEXT)
    );
  }

  try {
    console.log('=== UNSCHEDULED VISIT HANDLER DEBUG ===');
    console.log('e.parameter:', JSON.stringify(e.parameter));
    
    const action = safeGetParameter(e, 'action', 'add');
    console.log('Action:', action);
    
    switch (action) {
      case 'getVisitDates':
        const uidForVisits = safeGetParameter(e, 'uid');
        console.log('GetVisitDates - UID:', uidForVisits);
        
        if (!uidForVisits) {
          return addCorsHeaders(
            ContentService.createTextOutput(JSON.stringify({
              status: 'error',
              message: 'UID is required for getVisitDates'
            })).setMimeType(ContentService.MimeType.JSON)
          );
        }
        
        try {
          const availableVisits = getAvailableVisitDates(uidForVisits);
          console.log('Available visits found:', availableVisits);
          
          return addCorsHeaders(
            ContentService.createTextOutput(JSON.stringify({
              status: 'success',
              availableVisits: availableVisits
            })).setMimeType(ContentService.MimeType.JSON)
          );
        } catch (error) {
          console.error('Error in getVisitDates:', error);
          return addCorsHeaders(
            ContentService.createTextOutput(JSON.stringify({
              status: 'error',
              message: 'Error getting visit dates: ' + error.toString()
            })).setMimeType(ContentService.MimeType.JSON)
          );
        }
      
      case 'prefill':
        const uid = safeGetParameter(e, 'uid');
        const visitDate = safeGetParameter(e, 'visitDate');
        console.log('Prefill - UID:', uid, 'VisitDate:', visitDate);
        return addCorsHeaders(
          ContentService.createTextOutput(JSON.stringify(getPrefillData(uid, visitDate)))
                 .setMimeType(ContentService.MimeType.JSON)
        );
      
      case 'update':
        console.log('Update request');
        return addCorsHeaders(
          ContentService.createTextOutput(JSON.stringify(updateRecord(e)))
                 .setMimeType(ContentService.MimeType.JSON)
        );
      
      case 'delete':
        const deleteUid = safeGetParameter(e, 'uid');
        const deleteVisitDate = safeGetParameter(e, 'visitDate');
        console.log('Delete - UID:', deleteUid, 'VisitDate:', deleteVisitDate);
        return addCorsHeaders(
          ContentService.createTextOutput(JSON.stringify(deleteRecord(deleteUid, deleteVisitDate)))
                 .setMimeType(ContentService.MimeType.JSON)
        );
      
      default: // 'add' or no action
        console.log('Add new record request');
        return addCorsHeaders(
          ContentService.createTextOutput(JSON.stringify(addNewRecord(e)))
                 .setMimeType(ContentService.MimeType.JSON)
        );
    }
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return addCorsHeaders(
      ContentService.createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: 'Server error: ' + error.toString(),
        stack: error.stack
      })).setMimeType(ContentService.MimeType.JSON)
    );
  }
}

// Get the sheet - CHANGE 'Sheet1' to your actual sheet name if different
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

// Find record by UID only (first match)
function fetchByUid(uid) {
  if (!uid) return null;
  
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) {
    // Column 0 = uid
    if (data[i][0]?.toString().toLowerCase() === uid.toLowerCase()) {
      return { rowData: data[i], rowNumber: i + 1 };
    }
  }
  return null;
}

// Check if data exists for UID
function checkIfDataExists(uid) {
  if (!uid) return false;
  const data = fetchByUid(uid);
  return data !== null;
}

// Get list of visit dates that have data for UID
function getAvailableVisitDates(uid) {
  console.log('getAvailableVisitDates called with UID:', uid);
  
  if (!uid) {
    console.log('No UID provided');
    return [];
  }
  
  try {
    const data = fetchAllData();
    const visitDates = [];
    
    console.log('Total rows in sheet:', data.length);
    
    for (let i = 1; i < data.length; i++) {
      const rowUid = data[i][0]?.toString().toLowerCase();
      const currentUid = uid.toLowerCase();
      
      if (rowUid === currentUid) {
        const visitDate = data[i][2]?.toString(); // date column
        console.log('Found matching UID at row', i, 'with date:', visitDate);
        
        if (visitDate && !visitDates.includes(visitDate)) {
          visitDates.push(visitDate);
        }
      }
    }
    
    console.log('Final visit dates for', uid, ':', visitDates);
    return visitDates.sort().reverse(); // Sort newest first
  } catch (error) {
    console.error('Error in getAvailableVisitDates:', error);
    return [];
  }
}

// Column mapping based on your exact spreadsheet headers
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
    13: 'Abdominalcramps_ Resolved', // Note: your header shows 'Abdominalcramps_ Resolved' with space
    14: 'Fatigue',
    15: 'Fatigue_Ongoing',
    16: 'Fatigue_Resolved',
    17: 'Dizziness',
    18: 'Dizziness_Ongoing',
    19: 'Resolved', // Note: your header shows just 'Resolved' (missing Dizziness_ prefix)
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
    32: 'stopping_indicatte_reasons_ preferred_method', // Note: your header shows 'stopping_indicatte_reasons_ preferred_method' with space
    33: 'Other_notes',
    34: 'Date', // Interviewer date
    35: 'Name', // Interviewer name
    36: 'Designation',
    37: 'BMHC Number:' // Note: your header shows 'BMHC Number:' with colon
  };
}

// Get prefill data for specific UID and visit date
function getPrefillData(uid, visitDate) {
  try {
    console.log('getPrefillData called - UID:', uid, 'VisitDate:', visitDate);
    
    let data;
    
    if (!visitDate) {
      // No visitDate provided, get first record for this UID
      data = fetchByUid(uid);
      if (!data) {
        return { 
          status: 'error', 
          message: `No unscheduled visit data found for UID: ${uid}` 
        };
      }
    } else {
      // Specific visitDate provided
      data = fetchByUidAndVisitDate(uid, visitDate);
      if (!data) {
        return { 
          status: 'error', 
          message: `No unscheduled visit data found for UID: ${uid} on ${visitDate}` 
        };
      }
    }

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
      'Resolved': 'dizziness_resolved', // Assuming this is dizziness resolved
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
      if (value === null || value === undefined || value === '' || value === 'n/a' || value === 'undefined') {
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
        prefillObject[frontendFieldName] = value === 'Yes' || value === true || value === 'TRUE';
      } else {
        // Handle regular text fields
        prefillObject[frontendFieldName] = value.toString().trim();
      }
    });

    console.log('Prefill object created:', JSON.stringify(prefillObject));
    return { 
      status: 'success', 
      data: prefillObject 
    };
  } catch (error) {
    console.error('Error in getPrefillData:', error);
    return { 
      status: 'error', 
      message: 'Error fetching data: ' + error.message 
    };
  }
}

// Create the row data array matching your spreadsheet column order exactly
function createRowData(e) {
  return [
    // Column 0-4: Basic info
    safeGetParameter(e, 'uid', ''),
    safeGetParameter(e, 'prep_site', ''),
    safeGetParameter(e, 'date', ''),
    safeGetParameter(e, 'reason_for_this_visit', ''),
    safeGetParameter(e, 'other_describe', ''),
    
    // Column 5-26: Side effects
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
    safeGetParameter(e, 'dizziness_resolved', ''), // Column 19: "Resolved"
    safeGetParameter(e, 'headache', ''),
    safeGetParameter(e, 'headache_ongoing', ''),
    safeGetParameter(e, 'headache_resolved', ''),
    safeGetParameter(e, 'others', ''),
    safeGetParameter(e, 'others_ongoing', ''),
    safeGetParameter(e, 'others_resolved', ''),
    safeGetParameter(e, 'others_please_describe_below', ''),
    
    // Column 27-33: PrEP related
    safeGetParameter(e, 'challenges_taking_prep', ''),
    safeGetParameter(e, 'comments_challenges_faced', ''),
    safeGetParameter(e, 'additional_doses_above', ''),
    safeGetParameter(e, 'stop_or_continue', ''),
    safeGetParameter(e, 'stopping_reason', ''),
    safeGetParameter(e, 'stopping_indicate_reasons_preferred_method', ''),
    safeGetParameter(e, 'other_notes', ''),
    
    // Column 34-37: Interviewer info  - FIXED: Changed bhmc_number to bmhc_number
    safeGetParameter(e, 'interviewer_date', ''),
    safeGetParameter(e, 'interviewer_name', ''),
    safeGetParameter(e, 'designation', ''),
    safeGetParameter(e, 'bmhc_number', '') // FIXED: Was 'bhmc_number', now 'bmhc_number'
  ];
}

// Add new record - FIXED: Allow multiple visits per UID
function addNewRecord(e) {
  try {
    console.log('=== ADD NEW UNSCHEDULED VISIT RECORD ===');
    
    const uid = safeGetParameter(e, 'uid');
    const visitDate = safeGetParameter(e, 'date');
    console.log('Adding record for UID:', uid, 'Visit Date:', visitDate);
    
    if (!uid) {
      return { 
        status: 'error', 
        message: 'Missing UID - cannot create record' 
      };
    }
    
    // FIXED: Check if this specific UID + date combination exists (not just UID)
    if (visitDate) {
      const existingData = fetchByUidAndVisitDate(uid, visitDate);
      if (existingData) {
        return { 
          status: 'error', 
          message: `Unscheduled visit record already exists for UID: ${uid} on ${visitDate}. Use update instead.` 
        };
      }
    }

    const sheet = getSheet();
    const rowData = createRowData(e);
    console.log('New row data length:', rowData.length);
    console.log('New row data sample:', JSON.stringify(rowData.slice(0, 5)));

    // Add new row
    sheet.appendRow(rowData);
    
    console.log('✅ Record added successfully');
    return { 
      status: 'success', 
      message: `✅ Unscheduled visit record created successfully for UID: ${uid}` 
    };
  } catch (error) {
    console.error('❌ Error in addNewRecord:', error);
    return { 
      status: 'error', 
      message: '❌ Error creating record: ' + error.message 
    };
  }
}

// Update existing record - FIXED: Update by UID and date combination
function updateRecord(e) {
  try {
    console.log('=== UPDATE UNSCHEDULED VISIT RECORD ===');
    
    const uid = safeGetParameter(e, 'uid');
    const visitDate = safeGetParameter(e, 'date');
    console.log('Updating record for UID:', uid, 'Visit Date:', visitDate);
    
    if (!uid) {
      return { 
        status: 'error', 
        message: 'Missing UID - cannot update record' 
      };
    }
    
    // FIXED: Look for specific UID + date combination if date provided
    let existingData;
    if (visitDate) {
      existingData = fetchByUidAndVisitDate(uid, visitDate);
      if (!existingData) {
        return { 
          status: 'error', 
          message: `Unscheduled visit record for UID ${uid} on ${visitDate} not found - cannot update` 
        };
      }
    } else {
      // Fallback to first record for UID if no date provided
      existingData = fetchByUid(uid);
      if (!existingData) {
        return { 
          status: 'error', 
          message: `Unscheduled visit record for UID ${uid} not found - cannot update` 
        };
      }
    }

    const sheet = getSheet();
    const rowNumber = existingData.rowNumber;
    const rowData = createRowData(e);
    
    console.log('Updating row:', rowNumber);
    console.log('Updated row data length:', rowData.length);
    console.log('Updated row data sample:', JSON.stringify(rowData.slice(0, 5)));

    // Update the entire row
    sheet.getRange(rowNumber, 1, 1, rowData.length).setValues([rowData]);
    
    console.log('✅ Record updated successfully');
    return { 
      status: 'success', 
      message: `✅ Unscheduled visit record updated successfully for UID: ${uid}` 
    };
  } catch (error) {
    console.error('❌ Error in updateRecord:', error);
    return { 
      status: 'error', 
      message: '❌ Error updating record: ' + error.message 
    };
  }
}

// Delete record - FIXED: Delete by UID and date combination
function deleteRecord(uid, visitDate) {
  try {
    console.log('=== DELETE UNSCHEDULED VISIT RECORD ===');
    console.log('Deleting record for UID:', uid, 'Visit Date:', visitDate);
    
    if (!uid) {
      return { 
        status: 'error', 
        message: 'Missing UID - cannot delete record' 
      };
    }
    
    // FIXED: Look for specific UID + date combination if date provided
    let data;
    if (visitDate) {
      data = fetchByUidAndVisitDate(uid, visitDate);
      if (!data) {
        return { 
          status: 'error', 
          message: `Unscheduled visit record for UID ${uid} on ${visitDate} not found - cannot delete` 
        };
      }
    } else {
      // Fallback to first record for UID if no date provided
      data = fetchByUid(uid);
      if (!data) {
        return { 
          status: 'error', 
          message: `Unscheduled visit record for UID ${uid} not found - cannot delete` 
        };
      }
    }

    const sheet = getSheet();
    console.log('Deleting row:', data.rowNumber);
    
    // Delete the entire row
    sheet.deleteRow(data.rowNumber);
    
    console.log('✅ Record deleted successfully');
    return { 
      status: 'success', 
      message: `✅ Unscheduled visit record deleted successfully for UID: ${uid}` 
    };
  } catch (error) {
    console.error('❌ Error in deleteRecord:', error);
    return { 
      status: 'error', 
      message: '❌ Error deleting record: ' + error.message 
    };
  }
}

// Test function - you can run this to test if the script is working
function testScript() {
  console.log('=== TESTING FORM5 SCRIPT ===');
  
  try {
    const sheet = getSheet();
    console.log('✅ Sheet access: OK');
    console.log('Sheet name:', sheet.getName());
    
    const data = fetchAllData();
    console.log('✅ Data fetch: OK');
    console.log('Total rows:', data.length);
    console.log('Total columns:', data[0]?.length || 0);
    
    if (data.length > 1) {
      console.log('First data row UID:', data[1][0]);
      const testUid = data[1][0];
      
      if (testUid) {
        const exists = checkIfDataExists(testUid);
        console.log('✅ Check exists: OK -', exists);
        
        const visitDates = getAvailableVisitDates(testUid);
        console.log('✅ Available visit dates:', visitDates);
        
        const prefillData = getPrefillData(testUid, visitDates[0]);
        console.log('✅ Prefill data: OK -', prefillData.status);
      }
    }
    
    console.log('✅ All tests passed!');
    return '✅ Script is working correctly!';
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return '❌ Script test failed: ' + error.message;
  }
}