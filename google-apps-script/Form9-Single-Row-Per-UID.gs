function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

// Get target sheet
function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
}

// Map column positions → field names for frontend
function getPositionMapping() {
  return {
    0: 'person_dispensing',           // 'Name of the person dispensing PrEP'
    1: 'orw_followup',              // 'Name of the Outreach Worker following up with Client'
    2: 'client_receiving',          // 'Name of the client receiving PrEP'
    3: 'uid',                       // 'uid'
    4: 'medication',                // 'Medic taking for' - NOT USED in single row mode
    
    // M1 fields (columns 5-11)
    5: 'm1_date',                   // 'M1date'
    6: 'regimen_m1',               // 'regimen_m1'
    7: 'm1_bottles',               // '# of bottle/s dispensed with corresponding lot/batch number'
    8: 'm1_next_due_date',         // 'next_due_date'
    9: 'm1_dispenser_signature',   // 'Signature of the person dispensing'
    10: 'm1_recipient_signature',  // 'Signature of the recipient'
    11: 'm1_remarks',              // 'Remarks'
    
    // M3 fields (columns 12-18)
    12: 'm3_date',                 // 'M3date'
    13: 'regimen_m3',             // 'regimen_m3'
    14: 'm3_bottles',             // '# of bottle/s dispensed with corresponding lot/batch number'
    15: 'm3_next_due_date',       // 'm3_next_due_date'
    16: 'm3_dispenser_signature', // 'Signature of the person dispensing'
    17: 'm3_recipient_signature', // 'Signature of the recipient'
    18: 'm3_remarks',             // 'Remarks'
    
    // M6 fields (columns 19-25)
    19: 'm6_date',                // 'M6date'
    20: 'regimen_m6',            // 'regimen_m6'
    21: 'm6_bottles',            // '# of bottle/s dispensed with corresponding lot/batch number'
    22: 'm6_next_due_date',      // 'm6_next_due_date'
    23: 'm6_dispenser_signature',// 'Signature of the person dispensing'
    24: 'm6_recipient_signature',// 'Signature of the recipient'
    25: 'm6_remarks',            // 'Remarks'
    
    // M9 fields (columns 26-32)
    26: 'm9_date',               // 'M9date'
    27: 'regimen_m9',           // 'regimen_m9'
    28: 'm9_bottles',           // '# of bottle/s dispensed with corresponding lot/batch number'
    29: 'm9_next_due_date',     // 'm9_next_due_date'
    30: 'm9_dispenser_signature',// 'Signature of the person dispensing'
    31: 'm9_recipient_signature',// 'Signature of the recipient'
    32: 'm9_remarks',           // 'Remarks'
    
    // M12 fields (columns 33-39)
    33: 'm12_date',             // 'M12date'
    34: 'regimen_m12',         // 'regimen_m12'
    35: 'm12_bottles',         // '# of bottle/s dispensed with corresponding lot/batch number'
    36: 'm12_next_due_date',   // 'm12_next_due_date'
    37: 'm12_dispenser_signature',// 'Signature of the person dispensing'
    38: 'm12_recipient_signature',// 'Signature of the recipient'
    39: 'm12_remarks'          // 'Remarks'
  };
}

// Get all data from sheet
function fetchAllData() {
  return getSheet().getDataRange().getValues();
}

// Find record by UID only (not visit type)
function fetchByUid(uid) {
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
  const data = fetchByUid(uid);
  if (!data) return [];
  
  const rowData = data.rowData;
  const visitTypes = [];
  
  console.log('DEBUG: Row data for UID ' + uid + ':', rowData);
  console.log('DEBUG: Checking positions for visit types...');
  
  // Check which months have data (your actual data positions)
  // M1 data should be in positions 5-11
  if (rowData[5] || rowData[6] || rowData[7]) {
    visitTypes.push('M1');
    console.log('DEBUG: M1 found - positions 5-7:', rowData[5], rowData[6], rowData[7]);
  }
  
  // M3 data should be in positions 12-18
  if (rowData[12] || rowData[13] || rowData[14]) {
    visitTypes.push('M3');
    console.log('DEBUG: M3 found - positions 12-14:', rowData[12], rowData[13], rowData[14]);
  }
  
  // M6 data should be in positions 19-25
  if (rowData[19] || rowData[20] || rowData[21]) {
    visitTypes.push('M6');
    console.log('DEBUG: M6 found - positions 19-21:', rowData[19], rowData[20], rowData[21]);
  }
  
  // M9 data should be in positions 26-32
  if (rowData[26] || rowData[27] || rowData[28]) {
    visitTypes.push('M9');
    console.log('DEBUG: M9 found - positions 26-28:', rowData[26], rowData[27], rowData[28]);
  }
  
  // M12 data should be in positions 33-39
  if (rowData[33] || rowData[34] || rowData[35]) {
    visitTypes.push('M12');
    console.log('DEBUG: M12 found - positions 33-35:', rowData[33], rowData[34], rowData[35]);
  }
  
  console.log('DEBUG: Found visit types:', visitTypes);
  return visitTypes;
}

// Prefill data for UID and specific visit type
function getPrefillData(uid, visitType) {
  try {
    // If no visit type, return list of available ones
    if (!visitType) {
      const availableVisits = getAvailableVisitTypes(uid);
      if (availableVisits.length === 0) return { status: 'error', message: `Add data for ${uid}` };
      return { status: 'success', availableVisits, message: 'Select a visit type to load data' };
    }

    // Get the single row for this UID
    const data = fetchByUid(uid);
    if (!data) return { status: 'error', message: `Add ${visitType} data for ${uid}` };

    const rowData = data.rowData;
    const positionMapping = getPositionMapping();
    const prefillObject = {};

    // Map ALL row values (not just specific visit type)
    Object.keys(positionMapping).forEach(position => {
      const index = parseInt(position);
      const fieldName = positionMapping[position];
      
      if (rowData[index] !== undefined && rowData[index] !== null) {
        const value = rowData[index];
        
        if (fieldName.includes('date')) {
          if (value instanceof Date) {
            prefillObject[fieldName] = value.toISOString().split('T')[0];
          } else if (value) {
            const parsedDate = new Date(value);
            prefillObject[fieldName] = !isNaN(parsedDate) ? parsedDate.toISOString().split('T')[0] : value;
          } else {
            prefillObject[fieldName] = '';
          }
        } else {
          prefillObject[fieldName] = value ? value.toString() : '';
        }
      }
    });

    // Set the medication to the requested visit type
    prefillObject.medication = visitType;

    return { status: 'success', data: prefillObject, visitType };
  } catch (error) {
    return { status: 'error', message: 'Error fetching data: ' + error };
  }
}

// Update existing record - updates ONLY the specific month fields
function updateRecord(uid, visitType, data) {
  try {
    const existingData = fetchByUid(uid);
    if (!existingData) {
      return { status: 'error', message: `UID ${uid} not found` };
    }

    const sheet = getSheet();
    const rowNumber = existingData.rowNumber;
    const currentRow = existingData.rowData;

    // Create new row with current data
    const newRow = [...currentRow]; // Copy existing data
    
    // Update basic info (always update these)
    newRow[0] = data.person_dispensing || currentRow[0] || '';
    newRow[1] = data.orw_followup || currentRow[1] || '';
    newRow[2] = data.client_receiving || currentRow[2] || '';
    newRow[3] = data.uid || currentRow[3] || '';
    // Skip column 4 (medication) as it's not stored in single-row mode

    // Update ONLY the specific month fields based on visitType
    if (visitType === 'M1') {
      newRow[5] = data.m1_date || '';
      newRow[6] = data.regimen_m1 || '';
      newRow[7] = data.m1_bottles || '';
      newRow[8] = data.m1_next_due_date || '';
      newRow[9] = data.m1_dispenser_signature || '';
      newRow[10] = data.m1_recipient_signature || '';
      newRow[11] = data.m1_remarks || '';
    } else if (visitType === 'M3') {
      newRow[12] = data.m3_date || '';
      newRow[13] = data.regimen_m3 || '';
      newRow[14] = data.m3_bottles || '';
      newRow[15] = data.m3_next_due_date || '';
      newRow[16] = data.m3_dispenser_signature || '';
      newRow[17] = data.m3_recipient_signature || '';
      newRow[18] = data.m3_remarks || '';
    } else if (visitType === 'M6') {
      newRow[19] = data.m6_date || '';
      newRow[20] = data.regimen_m6 || '';
      newRow[21] = data.m6_bottles || '';
      newRow[22] = data.m6_next_due_date || '';
      newRow[23] = data.m6_dispenser_signature || '';
      newRow[24] = data.m6_recipient_signature || '';
      newRow[25] = data.m6_remarks || '';
    } else if (visitType === 'M9') {
      newRow[26] = data.m9_date || '';
      newRow[27] = data.regimen_m9 || '';
      newRow[28] = data.m9_bottles || '';
      newRow[29] = data.m9_next_due_date || '';
      newRow[30] = data.m9_dispenser_signature || '';
      newRow[31] = data.m9_recipient_signature || '';
      newRow[32] = data.m9_remarks || '';
    } else if (visitType === 'M12') {
      newRow[33] = data.m12_date || '';
      newRow[34] = data.regimen_m12 || '';
      newRow[35] = data.m12_bottles || '';
      newRow[36] = data.m12_next_due_date || '';
      newRow[37] = data.m12_dispenser_signature || '';
      newRow[38] = data.m12_recipient_signature || '';
      newRow[39] = data.m12_remarks || '';
    }

    // Update the entire row
    sheet.getRange(rowNumber, 1, 1, newRow.length).setValues([newRow]);
    
    return { status: 'success', message: `Drug Distribution ${visitType} updated for UID: ${uid}` };
  } catch (error) {
    return { status: 'error', message: 'Error updating record: ' + error };
  }
}

// Add new record - creates ONE row for the UID with data in specific month columns
function addNewRecord(data) {
  try {
    const sheet = getSheet();
    const visitType = data.medication;
    
    // Create empty row with 40 columns
    const newRow = new Array(40).fill('');
    
    // Set basic info
    newRow[0] = data.person_dispensing || '';
    newRow[1] = data.orw_followup || '';
    newRow[2] = data.client_receiving || '';
    newRow[3] = data.uid || '';
    // Skip column 4 (medication) in single-row mode

    // Set data for specific month only
    if (visitType === 'M1') {
      newRow[5] = data.m1_date || '';
      newRow[6] = data.regimen_m1 || '';
      newRow[7] = data.m1_bottles || '';
      newRow[8] = data.m1_next_due_date || '';
      newRow[9] = data.m1_dispenser_signature || '';
      newRow[10] = data.m1_recipient_signature || '';
      newRow[11] = data.m1_remarks || '';
    } else if (visitType === 'M3') {
      newRow[12] = data.m3_date || '';
      newRow[13] = data.regimen_m3 || '';
      newRow[14] = data.m3_bottles || '';
      newRow[15] = data.m3_next_due_date || '';
      newRow[16] = data.m3_dispenser_signature || '';
      newRow[17] = data.m3_recipient_signature || '';
      newRow[18] = data.m3_remarks || '';
    } else if (visitType === 'M6') {
      newRow[19] = data.m6_date || '';
      newRow[20] = data.regimen_m6 || '';
      newRow[21] = data.m6_bottles || '';
      newRow[22] = data.m6_next_due_date || '';
      newRow[23] = data.m6_dispenser_signature || '';
      newRow[24] = data.m6_recipient_signature || '';
      newRow[25] = data.m6_remarks || '';
    } else if (visitType === 'M9') {
      newRow[26] = data.m9_date || '';
      newRow[27] = data.regimen_m9 || '';
      newRow[28] = data.m9_bottles || '';
      newRow[29] = data.m9_next_due_date || '';
      newRow[30] = data.m9_dispenser_signature || '';
      newRow[31] = data.m9_recipient_signature || '';
      newRow[32] = data.m9_remarks || '';
    } else if (visitType === 'M12') {
      newRow[33] = data.m12_date || '';
      newRow[34] = data.regimen_m12 || '';
      newRow[35] = data.m12_bottles || '';
      newRow[36] = data.m12_next_due_date || '';
      newRow[37] = data.m12_dispenser_signature || '';
      newRow[38] = data.m12_recipient_signature || '';
      newRow[39] = data.m12_remarks || '';
    }

    sheet.appendRow(newRow);
    return { status: 'success', message: `Drug Distribution ${visitType} added for UID: ${data.uid}` };
  } catch (error) {
    return { status: 'error', message: 'Error adding record: ' + error };
  }
}

// Delete specific visit data (sets month columns to empty)
function deleteVisitData(uid, visitType) {
  try {
    const existingData = fetchByUid(uid);
    if (!existingData) {
      return { status: 'error', message: `UID ${uid} not found` };
    }

    const sheet = getSheet();
    const rowNumber = existingData.rowNumber;
    const currentRow = existingData.rowData;
    const newRow = [...currentRow];

    // Clear ONLY the specific month fields
    if (visitType === 'M1') {
      newRow[5] = newRow[6] = newRow[7] = newRow[8] = newRow[9] = newRow[10] = newRow[11] = '';
    } else if (visitType === 'M3') {
      newRow[12] = newRow[13] = newRow[14] = newRow[15] = newRow[16] = newRow[17] = newRow[18] = '';
    } else if (visitType === 'M6') {
      newRow[19] = newRow[20] = newRow[21] = newRow[22] = newRow[23] = newRow[24] = newRow[25] = '';
    } else if (visitType === 'M9') {
      newRow[26] = newRow[27] = newRow[28] = newRow[29] = newRow[30] = newRow[31] = newRow[32] = '';
    } else if (visitType === 'M12') {
      newRow[33] = newRow[34] = newRow[35] = newRow[36] = newRow[37] = newRow[38] = newRow[39] = '';
    }

    // Update the row
    sheet.getRange(rowNumber, 1, 1, newRow.length).setValues([newRow]);
    
    return { status: 'success', message: `${visitType} data deleted for UID: ${uid}` };
  } catch (error) {
    return { status: 'error', message: 'Error deleting visit data: ' + error };
  }
}

// Main request handler
function handleRequest(e) {
  var data = e.parameter;
  var callback = data.callback || '';
  try {
    let result;
    if (data.action === 'prefill') result = getPrefillData(data.uid, data.visitType);
    else if (data.action === 'getVisitTypes') result = { status: 'success', availableVisits: getAvailableVisitTypes(data.uid) };
    else if (data.action === 'update') result = updateRecord(data.uid, data.medication, data);
    else if (data.action === 'delete') result = deleteVisitData(data.uid, data.visitType);
    else {
      // Check if UID already exists
      const existingData = fetchByUid(data.uid);
      if (existingData) {
        // Update existing row with new visit data
        result = updateRecord(data.uid, data.medication, data);
      } else {
        // Create new row
        result = addNewRecord(data);
      }
    }
    return ContentService.createTextOutput(callback ? `${callback}(${JSON.stringify(result)})` : JSON.stringify(result))
      .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
  } catch (error) {
    var errorResponse = { status: 'error', message: 'Error: ' + error };
    return ContentService.createTextOutput(callback ? `${callback}(${JSON.stringify(errorResponse)})` : JSON.stringify(errorResponse))
      .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
  }
}