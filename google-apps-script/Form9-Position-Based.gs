function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

// Get target sheet
function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
}

// Map column positions → field names for frontend
// Based on your actual headers array
function getPositionMapping() {
  return {
    0: 'person_dispensing',           // 'Name of the person dispensing PrEP'
    1: 'orw_followup',              // 'Name of the Outreach Worker following up with Client'
    2: 'client_receiving',          // 'Name of the client receiving PrEP'
    3: 'uid',                       // 'uid'
    4: 'medication',                // 'Medic taking for'
    
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

// Find record by UID + visit type
function fetchByUidAndVisit(uid, visitType) {
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) {
    if (data[i][3]?.toString().toLowerCase() === uid.toLowerCase() && 
        data[i][4]?.toString() === visitType) {
      return data[i];
    }
  }
  return null;
}

// Get list of visit types available for UID
function getAvailableVisitTypes(uid) {
  const data = fetchAllData();
  const visitTypes = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][3]?.toString().toLowerCase() === uid.toLowerCase()) {
      const visitType = data[i][4];
      if (visitType && !visitTypes.includes(visitType)) visitTypes.push(visitType);
    }
  }
  return visitTypes;
}

// Prefill data for UID (and optional visitType)
function getPrefillData(uid, visitType) {
  try {
    // If no visit type, return list of available ones
    if (!visitType) {
      const availableVisits = getAvailableVisitTypes(uid);
      if (availableVisits.length === 0) return { status: 'error', message: `Add data for ${uid}` };
      return { status: 'success', availableVisits, message: 'Select a visit type to load data' };
    }

    // Otherwise, fetch data for UID + visit
    const rowData = fetchByUidAndVisit(uid, visitType);
    if (!rowData) return { status: 'error', message: `Add ${visitType} data for ${uid}` };

    const positionMapping = getPositionMapping();
    const prefillObject = {};

    // Map row values by position instead of header name
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

    return { status: 'success', data: prefillObject, visitType };
  } catch (error) {
    return { status: 'error', message: 'Error fetching data: ' + error };
  }
}

// Update existing record
function updateRecord(uid, visitType, data) {
  try {
    const allData = fetchAllData();
    const sheet = getSheet();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][3]?.toString().toLowerCase() === uid.toLowerCase() &&
          allData[i][4]?.toString() === visitType) {
        const rowNumber = i + 1;
        
        // Update row with new values (40 columns to match your sheet)
        sheet.getRange(rowNumber, 1, 1, 40).setValues([[
          data.person_dispensing || '',      // 0
          data.orw_followup || '',           // 1
          data.client_receiving || '',       // 2
          data.uid || '',                    // 3
          data.medication || '',             // 4
          data.m1_date || '',               // 5
          data.regimen_m1 || '',            // 6
          data.m1_bottles || '',            // 7
          data.m1_next_due_date || '',      // 8
          data.m1_dispenser_signature || '',// 9
          data.m1_recipient_signature || '',// 10
          data.m1_remarks || '',            // 11
          data.m3_date || '',               // 12
          data.regimen_m3 || '',            // 13
          data.m3_bottles || '',            // 14
          data.m3_next_due_date || '',      // 15
          data.m3_dispenser_signature || '',// 16
          data.m3_recipient_signature || '',// 17
          data.m3_remarks || '',            // 18
          data.m6_date || '',               // 19
          data.regimen_m6 || '',            // 20
          data.m6_bottles || '',            // 21
          data.m6_next_due_date || '',      // 22
          data.m6_dispenser_signature || '',// 23
          data.m6_recipient_signature || '',// 24
          data.m6_remarks || '',            // 25
          data.m9_date || '',               // 26
          data.regimen_m9 || '',            // 27
          data.m9_bottles || '',            // 28
          data.m9_next_due_date || '',      // 29
          data.m9_dispenser_signature || '',// 30
          data.m9_recipient_signature || '',// 31
          data.m9_remarks || '',            // 32
          data.m12_date || '',              // 33
          data.regimen_m12 || '',           // 34
          data.m12_bottles || '',           // 35
          data.m12_next_due_date || '',     // 36
          data.m12_dispenser_signature || '',// 37
          data.m12_recipient_signature || '',// 38
          data.m12_remarks || ''            // 39
        ]]);
        
        return { status: 'success', message: `Drug Distribution ${visitType} updated for UID: ${uid}` };
      }
    }
    return { status: 'error', message: `${visitType} record not found for UID: ${uid}` };
  } catch (error) {
    return { status: 'error', message: 'Error updating record: ' + error };
  }
}

// Delete record by UID + visit type
function deleteRecord(uid, visitType) {
  try {
    const allData = fetchAllData();
    const sheet = getSheet();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][3]?.toString().toLowerCase() === uid.toLowerCase() &&
          allData[i][4]?.toString() === visitType) {
        sheet.deleteRow(i + 1);
        return { status: 'success', message: `Drug Distribution ${visitType} deleted for UID: ${uid}` };
      }
    }
    return { status: 'error', message: `${visitType} record not found for UID: ${uid}` };
  } catch (error) {
    return { status: 'error', message: 'Error deleting record: ' + error };
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
    else if (data.action === 'delete') result = deleteRecord(data.uid, data.visitType);
    else {
      // Default = add new record
      getSheet().appendRow([
        data.person_dispensing || '',      // 0
        data.orw_followup || '',           // 1
        data.client_receiving || '',       // 2
        data.uid || '',                    // 3
        data.medication || '',             // 4
        data.m1_date || '',               // 5
        data.regimen_m1 || '',            // 6
        data.m1_bottles || '',            // 7
        data.m1_next_due_date || '',      // 8
        data.m1_dispenser_signature || '',// 9
        data.m1_recipient_signature || '',// 10
        data.m1_remarks || '',            // 11
        data.m3_date || '',               // 12
        data.regimen_m3 || '',            // 13
        data.m3_bottles || '',            // 14
        data.m3_next_due_date || '',      // 15
        data.m3_dispenser_signature || '',// 16
        data.m3_recipient_signature || '',// 17
        data.m3_remarks || '',            // 18
        data.m6_date || '',               // 19
        data.regimen_m6 || '',            // 20
        data.m6_bottles || '',            // 21
        data.m6_next_due_date || '',      // 22
        data.m6_dispenser_signature || '',// 23
        data.m6_recipient_signature || '',// 24
        data.m6_remarks || '',            // 25
        data.m9_date || '',               // 26
        data.regimen_m9 || '',            // 27
        data.m9_bottles || '',            // 28
        data.m9_next_due_date || '',      // 29
        data.m9_dispenser_signature || '',// 30
        data.m9_recipient_signature || '',// 31
        data.m9_remarks || '',            // 32
        data.m12_date || '',              // 33
        data.regimen_m12 || '',           // 34
        data.m12_bottles || '',           // 35
        data.m12_next_due_date || '',     // 36
        data.m12_dispenser_signature || '',// 37
        data.m12_recipient_signature || '',// 38
        data.m12_remarks || ''            // 39
      ]);
      result = { status: 'success', message: 'Drug Distribution record added successfully!' };
    }
    return ContentService.createTextOutput(callback ? `${callback}(${JSON.stringify(result)})` : JSON.stringify(result))
      .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
  } catch (error) {
    var errorResponse = { status: 'error', message: 'Error: ' + error };
    return ContentService.createTextOutput(callback ? `${callback}(${JSON.stringify(errorResponse)})` : JSON.stringify(errorResponse))
      .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
  }
}

// Debug function to see headers
function debugHeaders() {
  const sheet = getSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  console.log('Actual headers:', headers);
  return headers;
}