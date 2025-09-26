function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

// Helper function to safely get parameter values
function safeGetParameter(e, paramName, defaultValue = '') {
  let value = null;
  
  if (e.parameter && e.parameter[paramName] !== undefined && e.parameter[paramName] !== null) {
    value = e.parameter[paramName];
  }
  else if (e.parameters && e.parameters[paramName] && Array.isArray(e.parameters[paramName])) {
    value = e.parameters[paramName][0];
  }
  
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
  try {
    console.log('=== PREP FOLLOWUP HANDLER ===');
    const action = safeGetParameter(e, 'action', 'add');
    console.log('Action:', action);
    
    switch (action) {
      case 'getVisitDates':
        const uidForVisits = safeGetParameter(e, 'uid');
        if (!uidForVisits) {
          return createCorsResponse({
            status: 'error',
            message: 'UID is required for getVisitDates'
          });
        }
        return createCorsResponse({
          status: 'success',
          availableVisits: getAvailableVisitDates(uidForVisits)
        });
      
      case 'prefill':
        const uid = safeGetParameter(e, 'uid');
        if (!uid) {
          return createCorsResponse({
            status: 'error',
            message: 'UID is required for prefill'
          });
        }
        return createCorsResponse(getPrefillData(uid));
      
      case 'update':
        return createCorsResponse(updateRecord(e));
      
      case 'delete':
        const deleteUid = safeGetParameter(e, 'uid');
        return createCorsResponse(deleteRecord(deleteUid));
      
      default:
        return createCorsResponse(addNewRecord(e));
    }
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return createCorsResponse({ 
      status: 'error', 
      message: 'Server error: ' + error.toString()
    });
  }
}

// Get the sheet - UPDATE THIS to your actual sheet name
function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1'); // Change to your sheet name
}

// Get all data from sheet
function fetchAllData() {
  return getSheet().getDataRange().getValues();
}

// Find record by UID only (first match)
function fetchByUid(uid) {
  if (!uid) return null;
  
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]?.toString().toLowerCase() === uid.toLowerCase()) {
      return { rowData: data[i], rowNumber: i + 1 };
    }
  }
  return null;
}

// Get visit dates for UID
function getAvailableVisitDates(uid) {
  if (!uid) return [];
  
  const data = fetchAllData();
  const visitDates = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]?.toString().toLowerCase() === uid.toLowerCase()) {
      const visitDate = data[i][1]?.toString();
      if (visitDate && !visitDates.includes(visitDate)) {
        visitDates.push(visitDate);
      }
    }
  }
  
  return visitDates.sort().reverse();
}

// Get prefill data using UID only
function getPrefillData(uid) {
  try {
    console.log('Getting prefill data for UID:', uid);
    
    const data = fetchByUid(uid);
    if (!data) {
      return { 
        status: 'error', 
        message: `No data found for UID: ${uid}` 
      };
    }

    const rowData = data.rowData;
    const allData = fetchAllData();
    const headers = allData[0]; // Get actual column headers from sheet
    const prefillObject = {};
    
    console.log('Sheet headers found:', headers.length, 'columns');
    
    // Use the ACTUAL headers from your sheet
    headers.forEach((header, index) => {
      if (header && rowData[index] !== undefined) {
        let value = rowData[index];
        const headerStr = header.toString().trim();
        
        console.log(`Column ${index}: "${headerStr}" = "${value}"`);
        
        // Handle different data types
        if (value === null || value === undefined || value === '' || value === 'n/a') {
          prefillObject[headerStr] = '';
        } else if (headerStr.toLowerCase().includes('date')) {
          // Handle dates
          if (value instanceof Date) {
            prefillObject[headerStr] = value.toISOString().split('T')[0];
          } else {
            prefillObject[headerStr] = value.toString();
          }
        } else if (headerStr.includes('Ongoing') || headerStr.includes('Resolved')) {
          // Handle booleans
          prefillObject[headerStr] = value === 'Yes' || value === true || value === 'TRUE';
        } else {
          // Handle regular text
          prefillObject[headerStr] = value.toString();
        }
      }
    });

    console.log('Prefill data created with', Object.keys(prefillObject).length, 'fields');
    return { 
      status: 'success', 
      data: prefillObject 
    };
  } catch (error) {
    console.error('Error in getPrefillData:', error);
    return { 
      status: 'error', 
      message: 'Error getting data: ' + error.message 
    };
  }
}

// Create row data for writing (using actual headers)
function createRowData(e) {
  const headers = fetchAllData()[0];
  const rowData = [];
  
  headers.forEach((header, index) => {
    const headerStr = header.toString().trim();
    const value = safeGetParameter(e, headerStr, '');
    rowData[index] = value;
  });
  
  return rowData;
}

// Add new record
function addNewRecord(e) {
  try {
    const uid = safeGetParameter(e, 'uid');
    if (!uid) {
      return { 
        status: 'error', 
        message: 'UID is required' 
      };
    }

    const sheet = getSheet();
    const rowData = createRowData(e);
    sheet.appendRow(rowData);
    
    return { 
      status: 'success', 
      message: `Record created for UID: ${uid}` 
    };
  } catch (error) {
    console.error('Error in addNewRecord:', error);
    return { 
      status: 'error', 
      message: 'Error creating record: ' + error.message 
    };
  }
}

// Update record using UID only
function updateRecord(e) {
  try {
    const uid = safeGetParameter(e, 'uid');
    if (!uid) {
      return { 
        status: 'error', 
        message: 'UID is required' 
      };
    }
    
    const existingData = fetchByUid(uid);
    if (!existingData) {
      return { 
        status: 'error', 
        message: `No record found for UID: ${uid}` 
      };
    }

    const sheet = getSheet();
    const rowData = createRowData(e);
    sheet.getRange(existingData.rowNumber, 1, 1, rowData.length).setValues([rowData]);
    
    return { 
      status: 'success', 
      message: `Record updated for UID: ${uid}` 
    };
  } catch (error) {
    console.error('Error in updateRecord:', error);
    return { 
      status: 'error', 
      message: 'Error updating record: ' + error.message 
    };
  }
}

// Delete record using UID only
function deleteRecord(uid) {
  try {
    if (!uid) {
      return { 
        status: 'error', 
        message: 'UID is required' 
      };
    }
    
    const data = fetchByUid(uid);
    if (!data) {
      return { 
        status: 'error', 
        message: `No record found for UID: ${uid}` 
      };
    }

    const sheet = getSheet();
    sheet.deleteRow(data.rowNumber);
    
    return { 
      status: 'success', 
      message: `Record deleted for UID: ${uid}` 
    };
  } catch (error) {
    console.error('Error in deleteRecord:', error);
    return { 
      status: 'error', 
      message: 'Error deleting record: ' + error.message 
    };
  }
}

// Debug function to see actual headers
function debugHeaders() {
  const data = fetchAllData();
  const headers = data[0];
  
  console.log('=== ACTUAL SHEET HEADERS ===');
  headers.forEach((header, index) => {
    console.log(`Column ${index}: "${header}"`);
  });
  
  if (data.length > 1) {
    console.log('=== SAMPLE DATA ROW ===');
    const sampleRow = data[1];
    headers.forEach((header, index) => {
      console.log(`${header}: "${sampleRow[index]}"`);
    });
  }
  
  return { headers: headers, sampleData: data.length > 1 ? data[1] : null };
}