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

// Create CORS-enabled JSON response
function createCorsResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// Main request handler
function handleRequest(e) {
  // Handle OPTIONS request (preflight)
  if (e.parameter && e.parameter.method == 'OPTIONS') {
    return ContentService.createTextOutput('')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    console.log('=== PREP FOLLOWUP HANDLER DEBUG ===');
    console.log('e.parameter:', JSON.stringify(e.parameter));
    
    const action = safeGetParameter(e, 'action', 'add');
    console.log('Action:', action);
    
    switch (action) {
      case 'getVisitDates':
        const uidForVisits = safeGetParameter(e, 'uid');
        console.log('GetVisitDates - UID:', uidForVisits);
        
        if (!uidForVisits) {
          return createCorsResponse({
            status: 'error',
            message: 'UID is required for getVisitDates'
          });
        }
        
        try {
          const availableVisits = getAvailableVisitDates(uidForVisits);
          console.log('Available visits found:', availableVisits);
          
          return createCorsResponse({
            status: 'success',
            availableVisits: availableVisits
          });
        } catch (error) {
          console.error('Error in getVisitDates:', error);
          return createCorsResponse({
            status: 'error',
            message: 'Error getting visit dates: ' + error.toString()
          });
        }
      
      case 'prefill':
        const uid = safeGetParameter(e, 'uid');
        const visitDate = safeGetParameter(e, 'visitDate');
        console.log('Prefill - UID:', uid, 'VisitDate:', visitDate);
        return createCorsResponse(getPrefillData(uid, visitDate));
      
      case 'update':
        console.log('Update request');
        return createCorsResponse(updateRecord(e));
      
      case 'delete':
        const deleteUid = safeGetParameter(e, 'uid');
        const deleteVisitDate = safeGetParameter(e, 'visitDate');
        console.log('Delete - UID:', deleteUid, 'VisitDate:', deleteVisitDate);
        return createCorsResponse(deleteRecord(deleteUid, deleteVisitDate));
      
      default: // 'add' or no action
        console.log('Add new record request');
        return createCorsResponse(addNewRecord(e));
    }
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return createCorsResponse({ 
      status: 'error', 
      message: 'Server error: ' + error.toString(),
      stack: error.stack
    });
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
    // Column 0 = uid, Column 1 = date
    if (data[i][0]?.toString().toLowerCase() === uid.toLowerCase() && 
        data[i][1]?.toString() === visitDate) {
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
        const visitDate = data[i][1]?.toString(); // date column (column 1)
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

// CORRECTED: Column mapping based on your ACTUAL Google Sheet headers
function getColumnMapping() {
  return {
    0: 'uid',
    1: 'Date',
    2: 'PrEP site',
    3: 'TYPE OF VISIT',
    4: 'INTERVIEWER\'S NAME',
    5: 'DESIGNATION',
    6: 'BMHC Number',
    7: 'STATUS OF THE INTERVIEW',
    8: '1.1 Current occupation status:',
    9: 'other',
    10: '1.2 What is your current marital status:',
    11: 'other',
    12: '1.3 Do you currently live with your sex partner:',
    13: '1.4 If so, is your sex partner male, female, or TG? (tick all that apply):',
    14: '2.1 In general, to what extent do you consider yourself at risk of getting STI?',
    15: '2.2 In general, to what extent do you consider yourself at risk of getting HIV?',
    16: '2.3 Do you know the HIV status of your partner(s)',
    17: 'Steady partners:',
    18: 'Casual Partners:',
    19: 'Transactional partners:',
    20: '3.1 Can you tell the number of various partners you had anal sex with in the last one month?',
    21: 'Steady partners:',
    22: 'Casual Partners:',
    23: 'Transactional partners',
    24: '3.2 Can you tell the number of various partners you had vaginal sex with in the last one month?',
    25: '3.3 What days in the last week, did you have sex with your regular partner(s)?',
    26: '3.4 In the last week, how often did you use condom with your regular clients?',
    27: '3.5 Tell me about your last sex. Were condoms used the last time you had sex with regular partner(s)?',
    28: '3.6 Tell me about your clients. Do you have clients?',
    29: '3.7 Approximately, how many clients did you have last week?',
    30: '3.8 What days in the last week did you have sex with your clients? (NOT INCLUDING TODAY)',
    31: '3.9 In the last week, how do you describe your condom use while having sex with your clients?',
    32: '3.10 Tell me about your last sex. Were condoms used the last time you had sex with clients?',
    33: '3.11 What were the reasons of you having sex without condom?',
    34: 'others',
    35: '3.12 Do you think PrEP has changed your condom use?',
    36: '4.1 Which dosing regimen was prescribed to you in your previous (initial or follow-up visit)',
    37: '4.2 Did you change this regimen after the visit',
    38: '4.3 If yes, why did you change the dosing? Please explain the reason for changing:',
    39: 'Nausea',
    40: 'Ongoing',
    41: 'Resolved',
    42: 'Vomiting',
    43: 'Ongoing',
    44: 'Resolved',
    45: 'Fatigue',
    46: 'Ongoing',
    47: 'Resolved',
    48: 'Dizziness',
    49: 'Ongoing',
    50: 'Resolved',
    51: 'Headache',
    52: 'Ongoing',
    53: 'Resolved',
    54: 'Rash',
    55: 'Ongoing',
    56: 'Resolved',
    57: 'Abdominal pain',
    58: 'Ongoing',
    59: 'Resolved',
    60: 'Weight loss',
    61: 'Ongoing',
    62: 'Resolved',
    63: 'No response',
    64: 'Other',
    65: 'Others (Please specify)',
    66: '5.1 Which reason best applies to why you are on daily PrEP?',
    67: '5.1other',
    68: '5.a.1  which days you missed day1',
    69: '5.a.1 Day2',
    70: '5.a.1 Day3',
    71: '5.a.1 Day4',
    72: '5.a.1 Day5',
    73: '5.a.1 Day6',
    74: '5.a.1 Day7',
    75: '5.a.2 In the past month, what time of the day do you typically take your pill?',
    76: '5.a.2 other',
    77: '5.a.3 In the past month, how often did you take your pill at about the same time each day?',
    78: '5.a.4 In the past month, what has helped you remember to take your pill?',
    79: 'Other (Specify)',
    80: '5.a.5 Different circumstances may prevent participants from taking their pill daily.',
    81: '5.a.5 other',
    82: '5a.6 In the past month, what is the longest number of days in a row during which you did not take your pill?',
    83: '5a.7 In the past month, how many days in total did you not/could not take the pill?',
    84: '6.1 Approximately how many times did you have sex with a male partner(s) in the last month?',
    85: '6.1 other',
    86: '6.a1 Approximately how many times did you have sex with a male partner(s) in the last month?',
    87: '6.a2 Approximately how many times (or percentage of times) did you take PrEP tablets before having sex in the last 1 month (30 days)?',
    88: '6.a3 Approximately how many times (or percentage of times) did you take PrEP tablets after having sex in the last 1 month (30 days)?',
    89: '6.a4 Approximately how many times (or percentage of times) did you take your 1st PrEP tablet after having sex in the last 1 month (30 days)?',
    90: '6.a5 Approximately how many times (or percentage of times) did you take your 2nd PrEP tablet after having sex in the last 1 month (30 days)?',
    91: '6.a6 Last week, how many times did you have sex?',
    92: '6.a7 How many times did you take PrEP before the sex?',
    93: '6.a8 Approximately how many times (or percentage of times) did you take your 1st PrEP tablet after having sex in the last 1 week (7 days)?',
    94: '6.a9 Approximately how many times (or percentage of times) did you take your 2nd PrEP tablet after having sex in the last 1 week (7 days)?',
    95: '6.a10Which one of the statements describes your PrEP intake prior to the last sex? (Only 1 response applies)',
    96: '6.a10 othres',
    97: '6.a11 Which one of the statements describes your PrEP intake after the last sex? (Only 1 response applies)',
    98: '6.a.11 others',
    99: '7.1 In the past month, what has helped you remember to take your pills as prescribed?',
    100: '7.1 other',
    101: '7.2 Different circumstances may prevent persons from taking their pills as prescribed.',
    102: '7.3 Think about your experiences in the past month and please tell me all of the reasons that kept you from taking your pills',
    103: '7.2 other',
    104: '8.1 How easy or difficult do you think it was to remember to take your pills as needed?',
    105: '8.2 In the past month, how many of your pills did you give away, exchange, trade, or sell?',
    106: '8.3 Who did you give away, exchange, trade, or sell your pills to?',
    107: '8.3 other',
    108: '9.1 Have you visited the Pride Bhutan office in the last 3 months for reasons other than PrEP?',
    109: '9.2 If yes, was it for HIV testing?',
    110: '9.3 If yes, was it for STI testing?',
    111: '9.4 If other reason (Please specify):',
    112: '9.5 How many times were you met by an Outreach worker (ORW) in the field in the last 1 months?',
    113: '9.7 Have you received any condoms from HISC?',
    114: '9. Have you received any lubricants from HISC?',
    115: '10.1 Have you consumed alcohol in the last 3 months?',
    116: '10.2 How many days did you consume alcohol in the past one week?',
    117: '10.3 The last time you had sex with any of your sexual partners, did you consume alcoholic drinks before or during sex?',
    118: '10.4 Have you taken recreational drugs in the last 12 months?',
    119: '10.5 The last time you had sex with any of your sexual partners, did you take recreational drugs before or during sex?',
    120: '11.1 Taking PrEP makes me feel much more protected against HIV',
    121: '11.2 When taking PrEP I did not bother too much about other STIs since treatment for them is available',
    122: '11.3 PrEP is provided as a package of preventive services, including counseling, condoms, HIV tests, and other blood tests. What do you think of this?',
    123: '11.4 What did you like in participating in this PrEP implementation Phase 1',
    124: '11.4other',
    125: '11.5 What were the major challenges you faced while participating in PrEP Phase 1',
    126: '11.5 others',
    127: '11.6 How would you like PrEP medicines delivered to you post Phase 1 By outreach worker',
    128: '11.6 others',
    129: '11.7 How satisfied are you with PrEP?',
    130: '12.1 What are the reasons for discontinuing PrEP?',
    131: '12. other'
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
          message: `No follow-up data found for UID: ${uid}` 
        };
      }
    } else {
      // Specific visitDate provided
      data = fetchByUidAndVisitDate(uid, visitDate);
      if (!data) {
        return { 
          status: 'error', 
          message: `No follow-up data found for UID: ${uid} on ${visitDate}` 
        };
      }
    }

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
      } else if (fieldName.toLowerCase().includes('date')) {
        // Handle date fields
        if (value instanceof Date) {
          prefillObject[fieldName] = value.toISOString().split('T')[0];
        } else if (value) {
          const parsedDate = new Date(value);
          prefillObject[fieldName] = !isNaN(parsedDate) ? parsedDate.toISOString().split('T')[0] : '';
        } else {
          prefillObject[fieldName] = '';
        }
      } else if (fieldName.includes('Ongoing') || fieldName.includes('Resolved')) {
        // Handle boolean fields (Yes/No to true/false)
        prefillObject[fieldName] = value === 'Yes' || value === true || value === 'TRUE';
      } else {
        // Handle regular text fields
        prefillObject[fieldName] = value.toString().trim();
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
  const columnMapping = getColumnMapping();
  const rowData = [];
  
  // Create array in the exact order of columns
  for (let i = 0; i < Object.keys(columnMapping).length; i++) {
    const fieldName = columnMapping[i];
    const value = safeGetParameter(e, fieldName, '');
    rowData.push(value);
  }
  
  return rowData;
}

// Add new record
function addNewRecord(e) {
  try {
    console.log('=== ADD NEW FOLLOWUP RECORD ===');
    
    const uid = safeGetParameter(e, 'uid');
    const visitDate = safeGetParameter(e, 'Date');
    console.log('Adding record for UID:', uid, 'Visit Date:', visitDate);
    
    if (!uid) {
      return { 
        status: 'error', 
        message: 'Missing UID - cannot create record' 
      };
    }
    
    // Check if this specific UID + date combination exists
    if (visitDate) {
      const existingData = fetchByUidAndVisitDate(uid, visitDate);
      if (existingData) {
        return { 
          status: 'error', 
          message: `Follow-up record already exists for UID: ${uid} on ${visitDate}. Use update instead.` 
        };
      }
    }

    const sheet = getSheet();
    const rowData = createRowData(e);
    console.log('New row data length:', rowData.length);
    console.log('New row data sample:', JSON.stringify(rowData.slice(0, 10)));

    // Add new row
    sheet.appendRow(rowData);
    
    console.log('✅ Record added successfully');
    return { 
      status: 'success', 
      message: `✅ Follow-up record created successfully for UID: ${uid}` 
    };
  } catch (error) {
    console.error('❌ Error in addNewRecord:', error);
    return { 
      status: 'error', 
      message: '❌ Error creating record: ' + error.message 
    };
  }
}

// Update existing record
function updateRecord(e) {
  try {
    console.log('=== UPDATE FOLLOWUP RECORD ===');
    
    const uid = safeGetParameter(e, 'uid');
    const visitDate = safeGetParameter(e, 'Date');
    console.log('Updating record for UID:', uid, 'Visit Date:', visitDate);
    
    if (!uid) {
      return { 
        status: 'error', 
        message: 'Missing UID - cannot update record' 
      };
    }
    
    // Look for specific UID + date combination if date provided
    let existingData;
    if (visitDate) {
      existingData = fetchByUidAndVisitDate(uid, visitDate);
      if (!existingData) {
        return { 
          status: 'error', 
          message: `Follow-up record for UID ${uid} on ${visitDate} not found - cannot update` 
        };
      }
    } else {
      // Fallback to first record for UID if no date provided
      existingData = fetchByUid(uid);
      if (!existingData) {
        return { 
          status: 'error', 
          message: `Follow-up record for UID ${uid} not found - cannot update` 
        };
      }
    }

    const sheet = getSheet();
    const rowNumber = existingData.rowNumber;
    const rowData = createRowData(e);
    
    console.log('Updating row:', rowNumber);
    console.log('Updated row data length:', rowData.length);
    console.log('Updated row data sample:', JSON.stringify(rowData.slice(0, 10)));

    // Update the entire row
    sheet.getRange(rowNumber, 1, 1, rowData.length).setValues([rowData]);
    
    console.log('✅ Record updated successfully');
    return { 
      status: 'success', 
      message: `✅ Follow-up record updated successfully for UID: ${uid}` 
    };
  } catch (error) {
    console.error('❌ Error in updateRecord:', error);
    return { 
      status: 'error', 
      message: '❌ Error updating record: ' + error.message 
    };
  }
}

// Delete record
function deleteRecord(uid, visitDate) {
  try {
    console.log('=== DELETE FOLLOWUP RECORD ===');
    console.log('Deleting record for UID:', uid, 'Visit Date:', visitDate);
    
    if (!uid) {
      return { 
        status: 'error', 
        message: 'Missing UID - cannot delete record' 
      };
    }
    
    // Look for specific UID + date combination if date provided
    let data;
    if (visitDate) {
      data = fetchByUidAndVisitDate(uid, visitDate);
      if (!data) {
        return { 
          status: 'error', 
          message: `Follow-up record for UID ${uid} on ${visitDate} not found - cannot delete` 
        };
      }
    } else {
      // Fallback to first record for UID if no date provided
      data = fetchByUid(uid);
      if (!data) {
        return { 
          status: 'error', 
          message: `Follow-up record for UID ${uid} not found - cannot delete` 
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
      message: `✅ Follow-up record deleted successfully for UID: ${uid}` 
    };
  } catch (error) {
    console.error('❌ Error in deleteRecord:', error);
    return { 
      status: 'error', 
      message: '❌ Error deleting record: ' + error.message 
    };
  }
}

// Test function
function testScript() {
  console.log('=== TESTING FOLLOWUP SCRIPT ===');
  
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