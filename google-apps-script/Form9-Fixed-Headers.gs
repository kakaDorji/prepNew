function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

// Get target sheet
function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
}

// Map sheet headers → field names for frontend
function getHeaderMapping() {
  return {
    'Name of the person dispensing PrEP': 'person_dispensing',
    'Name of the Outreach Worker following up with Client': 'orw_followup',
    'Name of the client receiving PrEP': 'client_receiving',
    'uid': 'uid',
    'Medic taking for': 'medication',  // Visit type stored here
    
    // M1 fields (columns 6-12)
    'M1date': 'm1_date',
    'regimen_m1': 'regimen_m1',
    '# of bottle/s dispensed with corresponding lot/batch number': 'm1_bottles',  // Column 8
    'next_due_date': 'm1_next_due_date',
    'Signature of the person dispensing': 'm1_dispenser_signature',  // Column 10
    'Signature of the recipient': 'm1_recipient_signature',
    'Remarks': 'm1_remarks',
    
    // M3 fields (columns 13-19)
    'M3date': 'm3_date',
    'regimen_m3': 'regimen_m3',
    '# of bottle/s dispensed with corresponding lot/batch number.1': 'm3_bottles',  // Second occurrence
    'm3_next_due_date': 'm3_next_due_date',
    'Signature of the person dispensing.1': 'm3_dispenser_signature',  // Second occurrence
    'Signature of the recipient.1': 'm3_recipient_signature',
    'Remarks.1': 'm3_remarks',
    
    // M6 fields (columns 20-26)
    'M6date': 'm6_date',
    'regimen_m6': 'regimen_m6',
    '# of bottle/s dispensed with corresponding lot/batch number.2': 'm6_bottles',  // Third occurrence
    'm6_next_due_date': 'm6_next_due_date',
    'Signature of the person dispensing.2': 'm6_dispenser_signature',  // Third occurrence
    'Signature of the recipient.2': 'm6_recipient_signature',
    'Remarks.2': 'm6_remarks',
    
    // M9 fields (columns 27-33)
    'M9date': 'm9_date',
    'regimen_m9': 'regimen_m9',
    '# of bottle/s dispensed with corresponding lot/batch number.3': 'm9_bottles',  // Fourth occurrence
    'm9_next_due_date': 'm9_next_due_date',
    'Signature of the person dispensing.3': 'm9_dispenser_signature',  // Fourth occurrence
    'Signature of the recipient.3': 'm9_recipient_signature',
    'Remarks.3': 'm9_remarks',
    
    // M12 fields (columns 34-40)
    'M12date': 'm12_date',
    'regimen_m12': 'regimen_m12',
    '# of bottle/s dispensed with corresponding lot/batch number.4': 'm12_bottles',  // Fifth occurrence
    'm12_next_due_date': 'm12_next_due_date',
    'Signature of the person dispensing.4': 'm12_dispenser_signature',  // Fifth occurrence
    'Signature of the recipient.4': 'm12_recipient_signature',
    'Remarks.4': 'm12_remarks'
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

    const headers = getSheet().getRange(1, 1, 1, getSheet().getLastColumn()).getValues()[0];
    const headerMapping = getHeaderMapping();
    const prefillObject = {};

    // Map row values into object
    headers.forEach((header, i) => {
      const fieldName = headerMapping[header];
      if (fieldName) {
        const value = rowData[i];
        if (fieldName.includes('date')) {
          if (value instanceof Date) prefillObject[fieldName] = value.toISOString().split('T')[0];
          else if (value) {
            const parsedDate = new Date(value);
            prefillObject[fieldName] = !isNaN(parsedDate) ? parsedDate.toISOString().split('T')[0] : value;
          } else prefillObject[fieldName] = '';
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
          data.person_dispensing || '', data.orw_followup || '', data.client_receiving || '',
          data.uid || '', data.medication || '', data.m1_date || '', data.regimen_m1 || '',
          data.m1_bottles || '', data.m1_next_due_date || '', data.m1_dispenser_signature || '',
          data.m1_recipient_signature || '', data.m1_remarks || '', data.m3_date || '',
          data.regimen_m3 || '', data.m3_bottles || '', data.m3_next_due_date || '',
          data.m3_dispenser_signature || '', data.m3_recipient_signature || '', data.m3_remarks || '',
          data.m6_date || '', data.regimen_m6 || '', data.m6_bottles || '', data.m6_next_due_date || '',
          data.m6_dispenser_signature || '', data.m6_recipient_signature || '', data.m6_remarks || '',
          data.m9_date || '', data.regimen_m9 || '', data.m9_bottles || '', data.m9_next_due_date || '',
          data.m9_dispenser_signature || '', data.m9_recipient_signature || '', data.m9_remarks || '',
          data.m12_date || '', data.regimen_m12 || '', data.m12_bottles || '', data.m12_next_due_date || '',
          data.m12_dispenser_signature || '', data.m12_recipient_signature || '', data.m12_remarks || '',
          '', '', ''  // Extra empty columns if needed
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
        data.person_dispensing || '', data.orw_followup || '', data.client_receiving || '',
        data.uid || '', data.medication || '', data.m1_date || '', data.regimen_m1 || '',
        data.m1_bottles || '', data.m1_next_due_date || '', data.m1_dispenser_signature || '',
        data.m1_recipient_signature || '', data.m1_remarks || '', data.m3_date || '',
        data.regimen_m3 || '', data.m3_bottles || '', data.m3_next_due_date || '',
        data.m3_dispenser_signature || '', data.m3_recipient_signature || '', data.m3_remarks || '',
        data.m6_date || '', data.regimen_m6 || '', data.m6_bottles || '', data.m6_next_due_date || '',
        data.m6_dispenser_signature || '', data.m6_recipient_signature || '', data.m6_remarks || '',
        data.m9_date || '', data.regimen_m9 || '', data.m9_bottles || '', data.m9_next_due_date || '',
        data.m9_dispenser_signature || '', data.m9_recipient_signature || '', data.m9_remarks || '',
        data.m12_date || '', data.regimen_m12 || '', data.m12_bottles || '', data.m12_next_due_date || '',
        data.m12_dispenser_signature || '', data.m12_recipient_signature || '', data.m12_remarks || '',
        '', '', ''  // Extra empty columns if needed
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