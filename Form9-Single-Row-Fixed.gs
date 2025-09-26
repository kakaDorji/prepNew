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

// Column mapping for your actual sheet structure (single row with all visit types)
function getColumnMapping() {
  return {
    // Basic info columns
    0: 'person_dispensing',           // Name of the person dispensing PrEP
    1: 'orw_followup',               // Name of the Outreach Worker following up with Client
    2: 'client_receiving',           // Name of the client receiving PrEP
    3: 'uid',                        // uid
    4: 'medication',                 // Medic taking for
    
    // M1 columns (5-11)
    5: 'm1_date',                    // M1date
    6: 'regimen_m1',                 // regimen_m1
    7: 'm1_bottles',                 // # of bottle/s dispensed with corresponding lot/batch number
    8: 'm1_next_due_date',           // next_due_date
    9: 'm1_dispenser_signature',     // Signature of the person dispensing
    10: 'm1_recipient_signature',    // Signature of the recipient
    11: 'm1_remarks',                // Remarks
    
    // M3 columns (12-18)
    12: 'm3_date',                   // M3date
    13: 'regimen_m3',                // regimen_m3
    14: 'm3_bottles',                // # of bottle/s dispensed with corresponding lot/batch number
    15: 'm3_next_due_date',          // m3_next_due_date
    16: 'm3_dispenser_signature',    // Signature of the person dispensing
    17: 'm3_recipient_signature',    // Signature of the recipient
    18: 'm3_remarks',                // Remarks
    
    // M6 columns (19-25)
    19: 'm6_date',                   // M6date
    20: 'regimen_m6',                // regimen_m6
    21: 'm6_bottles',                // # of bottle/s dispensed with corresponding lot/batch number
    22: 'm6_next_due_date',          // m6_next_due_date
    23: 'm6_dispenser_signature',    // Signature of the person dispensing
    24: 'm6_recipient_signature',    // Signature of the recipient
    25: 'm6_remarks',                // Remarks
    
    // M9 columns (26-32)
    26: 'm9_date',                   // M9date
    27: 'regimen_m9',                // regimen_m9
    28: 'm9_bottles',                // # of bottle/s dispensed with corresponding lot/batch number
    29: 'm9_next_due_date',          // m9_next_due_date
    30: 'm9_dispenser_signature',    // Signature of the person dispensing
    31: 'm9_recipient_signature',    // Signature of the recipient
    32: 'm9_remarks',                // Remarks
    
    // M12 columns (33-39)
    33: 'm12_date',                  // M12date
    34: 'regimen_m12',               // regimen_m12
    35: 'm12_bottles',               // # of bottle/s dispensed with corresponding lot/batch number
    36: 'm12_next_due_date',         // m12_next_due_date
    37: 'm12_dispenser_signature',   // Signature of the person dispensing
    38: 'm12_recipient_signature',   // Signature of the recipient
    39: 'm12_remarks'                // Remarks
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

// Find record by UID (single row approach)
function fetchByUid(uid) {
  if (!uid) return null;
  
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) {
    if (data[i][3]?.toString().toLowerCase() === uid.toLowerCase()) {
      return { rowData: data[i], rowNumber: i + 1 };
    }
  }
  return null;
}

// Get list of visit types that have data for UID
function getAvailableVisitTypes(uid) {
  if (!uid) return [];
  
  const data = fetchByUid(uid);
  if (!data) return [];
  
  const rowData = data.rowData;
  const availableVisits = [];
  
  // Check which visit types have data
  if (rowData[5] || rowData[6] || rowData[7]) availableVisits.push('M1');  // M1 has date, regimen, or bottles
  if (rowData[12] || rowData[13] || rowData[14]) availableVisits.push('M3'); // M3 has date, regimen, or bottles
  if (rowData[19] || rowData[20] || rowData[21]) availableVisits.push('M6'); // M6 has date, regimen, or bottles
  if (rowData[26] || rowData[27] || rowData[28]) availableVisits.push('M9'); // M9 has date, regimen, or bottles
  if (rowData[33] || rowData[34] || rowData[35]) availableVisits.push('M12'); // M12 has date, regimen, or bottles
  
  return availableVisits;
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

    const data = fetchByUid(uid);
    if (!data) return { status: 'error', message: `Add ${visitType} data for ${uid}` };

    const rowData = data.rowData;
    const prefillObject = {};
    
    // Get basic info
    prefillObject.person_dispensing = rowData[0] || '';
    prefillObject.orw_followup = rowData[1] || '';
    prefillObject.client_receiving = rowData[2] || '';
    prefillObject.uid = rowData[3] || '';
    prefillObject.medication = visitType;
    
    // Get visit-specific data based on visitType
    let baseIndex;
    switch(visitType) {
      case 'M1':
        baseIndex = 5;
        prefillObject.visit_date = formatDate(rowData[5]);
        prefillObject.regimen = rowData[6] || '';
        prefillObject.bottles = rowData[7] || '';
        prefillObject.next_due_date = formatDate(rowData[8]);
        prefillObject.dispenser_signature = rowData[9] || '';
        prefillObject.recipient_signature = rowData[10] || '';
        prefillObject.remarks = rowData[11] || '';
        break;
      case 'M3':
        baseIndex = 12;
        prefillObject.visit_date = formatDate(rowData[12]);
        prefillObject.regimen = rowData[13] || '';
        prefillObject.bottles = rowData[14] || '';
        prefillObject.next_due_date = formatDate(rowData[15]);
        prefillObject.dispenser_signature = rowData[16] || '';
        prefillObject.recipient_signature = rowData[17] || '';
        prefillObject.remarks = rowData[18] || '';
        break;
      case 'M6':
        baseIndex = 19;
        prefillObject.visit_date = formatDate(rowData[19]);
        prefillObject.regimen = rowData[20] || '';
        prefillObject.bottles = rowData[21] || '';
        prefillObject.next_due_date = formatDate(rowData[22]);
        prefillObject.dispenser_signature = rowData[23] || '';
        prefillObject.recipient_signature = rowData[24] || '';
        prefillObject.remarks = rowData[25] || '';
        break;
      case 'M9':
        baseIndex = 26;
        prefillObject.visit_date = formatDate(rowData[26]);
        prefillObject.regimen = rowData[27] || '';
        prefillObject.bottles = rowData[28] || '';
        prefillObject.next_due_date = formatDate(rowData[29]);
        prefillObject.dispenser_signature = rowData[30] || '';
        prefillObject.recipient_signature = rowData[31] || '';
        prefillObject.remarks = rowData[32] || '';
        break;
      case 'M12':
        baseIndex = 33;
        prefillObject.visit_date = formatDate(rowData[33]);
        prefillObject.regimen = rowData[34] || '';
        prefillObject.bottles = rowData[35] || '';
        prefillObject.next_due_date = formatDate(rowData[36]);
        prefillObject.dispenser_signature = rowData[37] || '';
        prefillObject.recipient_signature = rowData[38] || '';
        prefillObject.remarks = rowData[39] || '';
        break;
      default:
        return { status: 'error', message: `Invalid visit type: ${visitType}` };
    }

    console.log('Prefill object created:', JSON.stringify(prefillObject));
    return { status: 'success', data: prefillObject, visitType };
  } catch (error) {
    console.error('Error in getPrefillData:', error);
    return { status: 'error', message: 'Error fetching data: ' + error };
  }
}

// Helper function to format dates
function formatDate(dateValue) {
  if (!dateValue) return '';
  
  try {
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    } else if (dateValue) {
      const parsedDate = new Date(dateValue);
      return !isNaN(parsedDate) ? parsedDate.toISOString().split('T')[0] : '';
    }
  } catch (error) {
    console.error('Date formatting error:', error);
  }
  
  return '';
}

// Update existing record
function updateRecord(e) {
  try {
    console.log('=== UPDATE RECORD ===');
    
    const uid = safeGetParameter(e, 'uid');
    const visitType = safeGetParameter(e, 'medication');
    
    console.log('Update parameters - UID:', uid, 'VisitType:', visitType);
    
    if (!uid || !visitType) {
      return { status: 'error', message: 'Missing UID or medication type' };
    }
    
    const existingData = fetchByUid(uid);
    if (!existingData) {
      return { status: 'error', message: `Record for UID ${uid} not found` };
    }

    const sheet = getSheet();
    const rowNumber = existingData.rowNumber;
    const currentRow = existingData.rowData;

    // Update basic info
    currentRow[0] = safeGetParameter(e, 'person_dispensing', currentRow[0] || '');
    currentRow[1] = safeGetParameter(e, 'orw_followup', currentRow[1] || '');
    currentRow[2] = safeGetParameter(e, 'client_receiving', currentRow[2] || '');
    currentRow[3] = uid;
    // Don't overwrite medication column - it will be updated at the end
    
    // Update visit-specific data based on visitType
    switch(visitType) {
      case 'M1':
        currentRow[5] = safeGetParameter(e, 'visit_date', '');
        currentRow[6] = safeGetParameter(e, 'regimen', '');
        currentRow[7] = safeGetParameter(e, 'bottles', '');
        currentRow[8] = safeGetParameter(e, 'next_due_date', '');
        currentRow[9] = safeGetParameter(e, 'dispenser_signature', '');
        currentRow[10] = safeGetParameter(e, 'recipient_signature', '');
        currentRow[11] = safeGetParameter(e, 'remarks', '');
        break;
      case 'M3':
        currentRow[12] = safeGetParameter(e, 'visit_date', '');
        currentRow[13] = safeGetParameter(e, 'regimen', '');
        currentRow[14] = safeGetParameter(e, 'bottles', '');
        currentRow[15] = safeGetParameter(e, 'next_due_date', '');
        currentRow[16] = safeGetParameter(e, 'dispenser_signature', '');
        currentRow[17] = safeGetParameter(e, 'recipient_signature', '');
        currentRow[18] = safeGetParameter(e, 'remarks', '');
        break;
      case 'M6':
        currentRow[19] = safeGetParameter(e, 'visit_date', '');
        currentRow[20] = safeGetParameter(e, 'regimen', '');
        currentRow[21] = safeGetParameter(e, 'bottles', '');
        currentRow[22] = safeGetParameter(e, 'next_due_date', '');
        currentRow[23] = safeGetParameter(e, 'dispenser_signature', '');
        currentRow[24] = safeGetParameter(e, 'recipient_signature', '');
        currentRow[25] = safeGetParameter(e, 'remarks', '');
        break;
      case 'M9':
        currentRow[26] = safeGetParameter(e, 'visit_date', '');
        currentRow[27] = safeGetParameter(e, 'regimen', '');
        currentRow[28] = safeGetParameter(e, 'bottles', '');
        currentRow[29] = safeGetParameter(e, 'next_due_date', '');
        currentRow[30] = safeGetParameter(e, 'dispenser_signature', '');
        currentRow[31] = safeGetParameter(e, 'recipient_signature', '');
        currentRow[32] = safeGetParameter(e, 'remarks', '');
        break;
      case 'M12':
        currentRow[33] = safeGetParameter(e, 'visit_date', '');
        currentRow[34] = safeGetParameter(e, 'regimen', '');
        currentRow[35] = safeGetParameter(e, 'bottles', '');
        currentRow[36] = safeGetParameter(e, 'next_due_date', '');
        currentRow[37] = safeGetParameter(e, 'dispenser_signature', '');
        currentRow[38] = safeGetParameter(e, 'recipient_signature', '');
        currentRow[39] = safeGetParameter(e, 'remarks', '');
        break;
    }

    // Ensure the row has enough columns (40 columns total)
    while (currentRow.length < 40) {
      currentRow.push('');
    }

    console.log('Updated row data:', JSON.stringify(currentRow));

    // Update the entire row
    sheet.getRange(rowNumber, 1, 1, currentRow.length).setValues([currentRow]);
    
    return { status: 'success', message: `Drug Distribution ${visitType} updated for UID: ${uid}` };
  } catch (error) {
    console.error('Error in updateRecord:', error);
    return { status: 'error', message: 'Error updating record: ' + error };
  }
}

// Add new record
function addNewRecord(e) {
  try {
    console.log('=== ADD NEW RECORD ===');
    
    const uid = safeGetParameter(e, 'uid');
    const visitType = safeGetParameter(e, 'medication');
    
    console.log('Add parameters - UID:', uid, 'VisitType:', visitType);
    
    if (!uid || !visitType) {
      return { status: 'error', message: 'Missing UID or medication type' };
    }
    
    const sheet = getSheet();
    let currentRow;
    
    // Check if a record already exists for this UID
    const existingData = fetchByUid(uid);
    if (existingData) {
      // Update existing record
      return updateRecord(e);
    } else {
      // Create new row with 40 empty columns
      currentRow = new Array(40).fill('');
      
      // Set basic info
      currentRow[0] = safeGetParameter(e, 'person_dispensing', '');
      currentRow[1] = safeGetParameter(e, 'orw_followup', '');
      currentRow[2] = safeGetParameter(e, 'client_receiving', '');
      currentRow[3] = uid;
      currentRow[4] = visitType;
      
      // Set visit-specific data
      switch(visitType) {
        case 'M1':
          currentRow[5] = safeGetParameter(e, 'visit_date', '');
          currentRow[6] = safeGetParameter(e, 'regimen', '');
          currentRow[7] = safeGetParameter(e, 'bottles', '');
          currentRow[8] = safeGetParameter(e, 'next_due_date', '');
          currentRow[9] = safeGetParameter(e, 'dispenser_signature', '');
          currentRow[10] = safeGetParameter(e, 'recipient_signature', '');
          currentRow[11] = safeGetParameter(e, 'remarks', '');
          break;
        case 'M3':
          currentRow[12] = safeGetParameter(e, 'visit_date', '');
          currentRow[13] = safeGetParameter(e, 'regimen', '');
          currentRow[14] = safeGetParameter(e, 'bottles', '');
          currentRow[15] = safeGetParameter(e, 'next_due_date', '');
          currentRow[16] = safeGetParameter(e, 'dispenser_signature', '');
          currentRow[17] = safeGetParameter(e, 'recipient_signature', '');
          currentRow[18] = safeGetParameter(e, 'remarks', '');
          break;
        case 'M6':
          currentRow[19] = safeGetParameter(e, 'visit_date', '');
          currentRow[20] = safeGetParameter(e, 'regimen', '');
          currentRow[21] = safeGetParameter(e, 'bottles', '');
          currentRow[22] = safeGetParameter(e, 'next_due_date', '');
          currentRow[23] = safeGetParameter(e, 'dispenser_signature', '');
          currentRow[24] = safeGetParameter(e, 'recipient_signature', '');
          currentRow[25] = safeGetParameter(e, 'remarks', '');
          break;
        case 'M9':
          currentRow[26] = safeGetParameter(e, 'visit_date', '');
          currentRow[27] = safeGetParameter(e, 'regimen', '');
          currentRow[28] = safeGetParameter(e, 'bottles', '');
          currentRow[29] = safeGetParameter(e, 'next_due_date', '');
          currentRow[30] = safeGetParameter(e, 'dispenser_signature', '');
          currentRow[31] = safeGetParameter(e, 'recipient_signature', '');
          currentRow[32] = safeGetParameter(e, 'remarks', '');
          break;
        case 'M12':
          currentRow[33] = safeGetParameter(e, 'visit_date', '');
          currentRow[34] = safeGetParameter(e, 'regimen', '');
          currentRow[35] = safeGetParameter(e, 'bottles', '');
          currentRow[36] = safeGetParameter(e, 'next_due_date', '');
          currentRow[37] = safeGetParameter(e, 'dispenser_signature', '');
          currentRow[38] = safeGetParameter(e, 'recipient_signature', '');
          currentRow[39] = safeGetParameter(e, 'remarks', '');
          break;
      }

      console.log('New row data:', JSON.stringify(currentRow));

      // Add new row
      sheet.appendRow(currentRow);
    }
    
    return { status: 'success', message: `New Drug Distribution ${visitType} record added for UID: ${uid}` };
  } catch (error) {
    console.error('Error in addNewRecord:', error);
    return { status: 'error', message: 'Error adding record: ' + error };
  }
}

// Delete specific visit type data for UID
function deleteRecord(uid, visitType) {
  try {
    console.log('=== DELETE RECORD ===');
    console.log('Delete parameters - UID:', uid, 'VisitType:', visitType);
    
    if (!uid || !visitType) {
      return { status: 'error', message: 'Missing UID or visit type for deletion' };
    }
    
    const data = fetchByUid(uid);
    if (!data) {
      return { status: 'error', message: `Record for UID ${uid} not found` };
    }

    const sheet = getSheet();
    const rowNumber = data.rowNumber;
    const currentRow = data.rowData;
    
    // Clear visit-specific data based on visitType
    switch(visitType) {
      case 'M1':
        for (let i = 5; i <= 11; i++) currentRow[i] = '';
        break;
      case 'M3':
        for (let i = 12; i <= 18; i++) currentRow[i] = '';
        break;
      case 'M6':
        for (let i = 19; i <= 25; i++) currentRow[i] = '';
        break;
      case 'M9':
        for (let i = 26; i <= 32; i++) currentRow[i] = '';
        break;
      case 'M12':
        for (let i = 33; i <= 39; i++) currentRow[i] = '';
        break;
      default:
        return { status: 'error', message: `Invalid visit type: ${visitType}` };
    }
    
    // Check if all visit data is now empty - if so, delete the entire row
    let hasAnyVisitData = false;
    for (let i = 5; i < 40; i++) {
      if (currentRow[i] && currentRow[i].toString().trim() !== '') {
        hasAnyVisitData = true;
        break;
      }
    }
    
    if (!hasAnyVisitData) {
      // Delete entire row
      sheet.deleteRow(rowNumber);
      return { status: 'success', message: `All data deleted for UID: ${uid}` };
    } else {
      // Update row with cleared visit data
      sheet.getRange(rowNumber, 1, 1, currentRow.length).setValues([currentRow]);
      return { status: 'success', message: `${visitType} data deleted for UID: ${uid}` };
    }
    
  } catch (error) {
    console.error('Error in deleteRecord:', error);
    return { status: 'error', message: 'Error deleting record: ' + error };
  }
}