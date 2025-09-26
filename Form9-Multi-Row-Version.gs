function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

// Get target sheet
function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
}

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
  
  // Handle various "empty" cases that could result in "n/a"
  if (value === null || value === undefined || value === 'undefined' || value === 'null' || value === 'n/a' || value === '') {
    return defaultValue;
  }
  
  return value.toString().trim();
}

// Column mapping for MULTI-ROW approach (one row per visit type)
function getColumnMapping() {
  return {
    0: 'person_dispensing',           // Name of the person dispensing PrEP
    1: 'orw_followup',               // Name of the Outreach Worker following up with Client
    2: 'client_receiving',           // Name of the client receiving PrEP
    3: 'uid',                        // uid
    4: 'medication',                 // Medic taking for (M1, M3, M6, M9, M12)
    5: 'visit_date',                 // Visit date for the specific month
    6: 'regimen',                    // Regimen for the specific month
    7: 'bottles',                    // # of bottle/s dispensed with corresponding lot/batch number
    8: 'next_due_date',             // next_due_date
    9: 'dispenser_signature',       // Signature of the person dispensing
    10: 'recipient_signature',      // Signature of the recipient
    11: 'remarks'                   // Remarks
  };
}

// Main request handler
function handleRequest(e) {
  try {
    console.log('=== FORM9 HANDLER DEBUG ===');
    console.log('e.parameter:', JSON.stringify(e.parameter));
    
    const action = safeGetParameter(e, 'action', 'add');
    console.log('Action:', action);
    
    switch (action) {
      case 'prefill':
        const uid = safeGetParameter(e, 'uid');
        const visitType = safeGetParameter(e, 'visitType');
        console.log('Prefill - UID:', uid, 'VisitType:', visitType);
        return ContentService.createTextOutput(JSON.stringify(getPrefillData(uid, visitType)))
               .setMimeType(ContentService.MimeType.JSON);
      
      case 'getVisitTypes':
        const uidForVisits = safeGetParameter(e, 'uid');
        const availableVisits = getAvailableVisitTypes(uidForVisits);
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          availableVisits: availableVisits
        })).setMimeType(ContentService.MimeType.JSON);
      
      case 'update':
        return ContentService.createTextOutput(JSON.stringify(updateRecord(e)))
               .setMimeType(ContentService.MimeType.JSON);
      
      case 'delete':
        const deleteUid = safeGetParameter(e, 'uid');
        const deleteVisitType = safeGetParameter(e, 'visitType');
        return ContentService.createTextOutput(JSON.stringify(deleteRecord(deleteUid, deleteVisitType)))
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

// Get all data from sheet
function fetchAllData() {
  return getSheet().getDataRange().getValues();
}

// Find record by UID AND visit type (multi-row approach)
function fetchByUidAndVisitType(uid, visitType) {
  if (!uid || !visitType) return null;
  
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) {
    if (data[i][3]?.toString().toLowerCase() === uid.toLowerCase() && 
        data[i][4]?.toString().toLowerCase() === visitType.toLowerCase()) {
      return { rowData: data[i], rowNumber: i + 1 };
    }
  }
  return null;
}

// Get list of visit types that have data for UID
function getAvailableVisitTypes(uid) {
  if (!uid) return [];
  
  const data = fetchAllData();
  const visitTypes = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][3]?.toString().toLowerCase() === uid.toLowerCase()) {
      const visitType = data[i][4]?.toString();
      if (visitType && !visitTypes.includes(visitType)) {
        visitTypes.push(visitType);
      }
    }
  }
  
  // Sort visit types in logical order
  const order = ['M1', 'M3', 'M6', 'M9', 'M12'];
  visitTypes.sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    return indexA - indexB;
  });
  
  return visitTypes;
}

// Get prefill data for specific visit type
function getPrefillData(uid, visitType) {
  try {
    console.log('getPrefillData called - UID:', uid, 'VisitType:', visitType);
    
    if (!visitType) {
      const availableVisits = getAvailableVisitTypes(uid);
      if (availableVisits.length === 0) return { status: 'error', message: `Add data for ${uid}` };
      return { status: 'success', availableVisits, message: 'Select a visit type to load data' };
    }

    const data = fetchByUidAndVisitType(uid, visitType);
    if (!data) return { status: 'error', message: `Add ${visitType} data for ${uid}` };

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
    return { status: 'success', data: prefillObject, visitType };
  } catch (error) {
    console.error('Error in getPrefillData:', error);
    return { status: 'error', message: 'Error fetching data: ' + error };
  }
}

// Update existing record (for specific UID + visit type)
function updateRecord(e) {
  try {
    console.log('=== UPDATE RECORD ===');
    
    const uid = safeGetParameter(e, 'uid');
    const visitType = safeGetParameter(e, 'medication');
    
    console.log('Update parameters - UID:', uid, 'VisitType:', visitType);
    
    if (!uid || !visitType) {
      return { status: 'error', message: 'Missing UID or medication type' };
    }
    
    const existingData = fetchByUidAndVisitType(uid, visitType);
    if (!existingData) {
      return { status: 'error', message: `${visitType} record for UID ${uid} not found` };
    }

    const sheet = getSheet();
    const rowNumber = existingData.rowNumber;

    // Create new row data - 12 columns for multi-row approach
    const newRow = [
      safeGetParameter(e, 'person_dispensing', ''),
      safeGetParameter(e, 'orw_followup', ''),
      safeGetParameter(e, 'client_receiving', ''),
      uid,
      visitType,
      safeGetParameter(e, 'visit_date', ''),
      safeGetParameter(e, 'regimen', ''),
      safeGetParameter(e, 'bottles', ''),
      safeGetParameter(e, 'next_due_date', ''),
      safeGetParameter(e, 'dispenser_signature', ''),
      safeGetParameter(e, 'recipient_signature', ''),
      safeGetParameter(e, 'remarks', '')
    ];

    console.log('Updated row data:', JSON.stringify(newRow));

    // Update the row
    sheet.getRange(rowNumber, 1, 1, newRow.length).setValues([newRow]);
    
    return { status: 'success', message: `Drug Distribution ${visitType} updated for UID: ${uid}` };
  } catch (error) {
    console.error('Error in updateRecord:', error);
    return { status: 'error', message: 'Error updating record: ' + error };
  }
}

// Add new record (creates NEW ROW for each visit type)
function addNewRecord(e) {
  try {
    console.log('=== ADD NEW RECORD ===');
    
    const uid = safeGetParameter(e, 'uid');
    const visitType = safeGetParameter(e, 'medication');
    
    console.log('Add parameters - UID:', uid, 'VisitType:', visitType);
    
    if (!uid || !visitType) {
      return { status: 'error', message: 'Missing UID or medication type' };
    }
    
    // Check if this specific UID + visit type combination already exists
    const existingData = fetchByUidAndVisitType(uid, visitType);
    if (existingData) {
      return { status: 'error', message: `${visitType} record already exists for UID: ${uid}. Use update instead.` };
    }

    const sheet = getSheet();
    
    // Create new row data - 12 columns for multi-row approach
    const newRow = [
      safeGetParameter(e, 'person_dispensing', ''),
      safeGetParameter(e, 'orw_followup', ''),
      safeGetParameter(e, 'client_receiving', ''),
      uid,
      visitType,
      safeGetParameter(e, 'visit_date', ''),
      safeGetParameter(e, 'regimen', ''),
      safeGetParameter(e, 'bottles', ''),
      safeGetParameter(e, 'next_due_date', ''),
      safeGetParameter(e, 'dispenser_signature', ''),
      safeGetParameter(e, 'recipient_signature', ''),
      safeGetParameter(e, 'remarks', '')
    ];

    console.log('New row data:', JSON.stringify(newRow));

    // Add NEW ROW (this is the key change!)
    sheet.appendRow(newRow);
    
    return { status: 'success', message: `New Drug Distribution ${visitType} record added for UID: ${uid}` };
  } catch (error) {
    console.error('Error in addNewRecord:', error);
    return { status: 'error', message: 'Error adding record: ' + error };
  }
}

// Delete specific visit type record for UID
function deleteRecord(uid, visitType) {
  try {
    console.log('=== DELETE RECORD ===');
    console.log('Delete parameters - UID:', uid, 'VisitType:', visitType);
    
    if (!uid || !visitType) {
      return { status: 'error', message: 'Missing UID or visit type for deletion' };
    }
    
    const data = fetchByUidAndVisitType(uid, visitType);
    if (!data) {
      return { status: 'error', message: `${visitType} record for UID ${uid} not found` };
    }

    const sheet = getSheet();
    
    // Delete the entire row for this UID + visit type
    sheet.deleteRow(data.rowNumber);
    
    return { status: 'success', message: `${visitType} record deleted for UID: ${uid}` };
  } catch (error) {
    console.error('Error in deleteRecord:', error);
    return { status: 'error', message: 'Error deleting record: ' + error };
  }
}