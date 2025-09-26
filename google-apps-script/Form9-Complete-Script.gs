function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function getSheet() {
  const sheetName = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  return sheetName;
}

function getHeaderMapping() {
  return {
    'Name of the person dispensing PrEP': 'person_dispensing',
    'Name of the Outreach Worker following up with Client': 'orw_followup',
    'Name of the client receiving PrEP': 'client_receiving',
    'uid': 'uid',
    'Medic taking for': 'medication',
    'M1date': 'm1_date',
    'regimen_m1': 'regimen_m1',
    '# of bottle/s dispensed with corresponding lot/batch number': 'm1_bottles',
    'next_due_date': 'm1_next_due_date',
    'Signature of the person dispensing': 'm1_dispenser_signature',
    'Signature of the recipient': 'm1_recipient_signature',
    'Remarks': 'm1_remarks',
    'M3date': 'm3_date',
    'regimen_m3': 'regimen_m3',
    '# of bottle/s dispensed with corresponding lot/batch number': 'm3_bottles',
    'm3_next_due_date': 'm3_next_due_date',
    'Signature of the person dispensing': 'm3_dispenser_signature',
    'Signature of the recipient': 'm3_recipient_signature',
    'Remarks': 'm3_remarks',
    'M6date': 'm6_date',
    'regimen_m6': 'regimen_m6',
    '# of bottle/s dispensed with corresponding lot/batch number': 'm6_bottles',
    'm6_next_due_date': 'm6_next_due_date',
    'Signature of the person dispensing': 'm6_dispenser_signature',
    'Signature of the recipient': 'm6_recipient_signature',
    'Remarks': 'm6_remarks',
    'M9date': 'm9_date',
    'regimen_m9': 'regimen_m9',
    '# of bottle/s dispensed with corresponding lot/batch number': 'm9_bottles',
    'm9_next_due_date': 'm9_next_due_date',
    'Signature of the person dispensing': 'm9_dispenser_signature',
    'Signature of the recipient': 'm9_recipient_signature',
    'Remarks': 'm9_remarks',
    'M12date': 'm12_date',
    'regimen_m12': 'regimen_m12',
    '# of bottle/s dispensed with corresponding lot/batch number': 'm12_bottles',
    'm12_next_due_date': 'm12_next_due_date',
    'Signature of the person dispensing': 'm12_dispenser_signature',
    'Signature of the recipient': 'm12_recipient_signature',
    'Remarks': 'm12_remarks'
  };
}

function fetchAllData() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  return data;
}

function fetchByUidAndVisit(uid, visitType) {
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) { // start from 1 to skip header
    if (data[i][3] && data[i][3].toString().toLowerCase() === uid.toLowerCase() && 
        data[i][4] && data[i][4].toString() === visitType) { // UID in column D (index 3), Visit Type in column E (index 4)
      return data[i]; // return the entire row
    }
  }
  return null; // UID + Visit Type combination not found
}

function getAvailableVisitTypes(uid) {
  const data = fetchAllData();
  const visitTypes = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] && data[i][3].toString().toLowerCase() === uid.toLowerCase()) { // UID in column D (index 3)
      const visitType = data[i][4]; // Visit Type in column E (index 4)
      if (visitType && !visitTypes.includes(visitType)) {
        visitTypes.push(visitType);
      }
    }
  }
  
  return visitTypes;
}

function getPrefillData(uid, visitType) {
  try {
    if (!visitType) {
      // Return available visit types for this UID
      const availableVisits = getAvailableVisitTypes(uid);
      
      if (availableVisits.length === 0) {
        return {
          status: 'error',
          message: `Add data for ${uid}`
        };
      }
      
      return {
        status: 'success',
        availableVisits: availableVisits,
        message: 'Select a visit type to load data'
      };
    }
    
    const rowData = fetchByUidAndVisit(uid, visitType);
    if (!rowData) {
      return {
        status: 'error',
        message: `Add ${visitType} data for ${uid}`
      };
    }

    const sheet = getSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const headerMapping = getHeaderMapping();
    
    const prefillObject = {};
    
    headers.forEach((header, index) => {
      const fieldName = headerMapping[header];
      if (fieldName && rowData[index] !== undefined && rowData[index] !== null) {
        let value = rowData[index];
        
        // Handle dates
        if (fieldName.includes('date')) {
          if (value instanceof Date) {
            prefillObject[fieldName] = value.toISOString().split('T')[0];
          } else if (typeof value === 'string' && value) {
            // Try to parse the date
            const parsedDate = new Date(value);
            if (!isNaN(parsedDate.getTime())) {
              prefillObject[fieldName] = parsedDate.toISOString().split('T')[0];
            } else {
              prefillObject[fieldName] = value;
            }
          } else {
            prefillObject[fieldName] = '';
          }
        }
        // Handle other fields
        else {
          prefillObject[fieldName] = value ? value.toString() : '';
        }
      }
    });

    return {
      status: 'success',
      data: prefillObject,
      visitType: visitType
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Error fetching data: ' + error.toString()
    };
  }
}

function updateRecord(uid, visitType, data) {
  try {
    const sheet = getSheet();
    const allData = fetchAllData();
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][3] && allData[i][3].toString().toLowerCase() === uid.toLowerCase() &&
          allData[i][4] && allData[i][4].toString() === visitType) {
        // Found the row, update it
        const rowNumber = i + 1; // +1 because sheet rows are 1-indexed
        
        // Update the row with new data
        sheet.getRange(rowNumber, 1, 1, 37).setValues([[
          data.person_dispensing || '',
          data.orw_followup || '',
          data.client_receiving || '',
          data.uid || '',
          data.medication || '',
          data.m1_date || '',
          data.regimen_m1 || '',
          data.m1_bottles || '',
          data.m1_next_due_date || '',
          data.m1_dispenser_signature || '',
          data.m1_recipient_signature || '',
          data.m1_remarks || '',
          data.m3_date || '',
          data.regimen_m3 || '',
          data.m3_bottles || '',
          data.m3_next_due_date || '',
          data.m3_dispenser_signature || '',
          data.m3_recipient_signature || '',
          data.m3_remarks || '',
          data.m6_date || '',
          data.regimen_m6 || '',
          data.m6_bottles || '',
          data.m6_next_due_date || '',
          data.m6_dispenser_signature || '',
          data.m6_recipient_signature || '',
          data.m6_remarks || '',
          data.m9_date || '',
          data.regimen_m9 || '',
          data.m9_bottles || '',
          data.m9_next_due_date || '',
          data.m9_dispenser_signature || '',
          data.m9_recipient_signature || '',
          data.m9_remarks || '',
          data.m12_date || '',
          data.regimen_m12 || '',
          data.m12_bottles || '',
          data.m12_next_due_date || '',
          data.m12_dispenser_signature || '',
          data.m12_recipient_signature || '',
          data.m12_remarks || ''
        ]]);
        
        return {
          status: 'success',
          message: `Drug Distribution ${visitType} updated successfully for UID: ${uid}`
        };
      }
    }
    
    return {
      status: 'error',
      message: `${visitType} record not found for UID: ${uid}`
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Error updating record: ' + error.toString()
    };
  }
}

function deleteRecord(uid, visitType) {
  try {
    const sheet = getSheet();
    const allData = fetchAllData();
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][3] && allData[i][3].toString().toLowerCase() === uid.toLowerCase() &&
          allData[i][4] && allData[i][4].toString() === visitType) {
        // Found the row, delete it
        const rowNumber = i + 1; // +1 because sheet rows are 1-indexed
        sheet.deleteRow(rowNumber);
        
        return {
          status: 'success',
          message: `Drug Distribution ${visitType} record deleted successfully for UID: ${uid}`
        };
      }
    }
    
    return {
      status: 'error',
      message: `${visitType} record not found for UID: ${uid}`
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Error deleting record: ' + error.toString()
    };
  }
}

function handleRequest(e) {
  var data = e.parameter;
  var callback = data.callback || '';
  
  try {
    // Handle different actions
    if (data.action === 'prefill') {
      delete data.callback;
      delete data.action;
      
      var result = getPrefillData(data.uid, data.visitType);
      
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService.createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    else if (data.action === 'getVisitTypes') {
      delete data.callback;
      delete data.action;
      
      var availableVisits = getAvailableVisitTypes(data.uid);
      var result = {
        status: 'success',
        availableVisits: availableVisits
      };
      
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService.createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    else if (data.action === 'update') {
      delete data.callback;
      delete data.action;
      var uid = data.uid;
      var visitType = data.medication; // The visit type is stored in medication field
      
      var result = updateRecord(uid, visitType, data);
      
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService.createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    else if (data.action === 'delete') {
      delete data.callback;
      delete data.action;
      
      var result = deleteRecord(data.uid, data.visitType);
      
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService.createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    else {
      // Default action: add new record
      delete data.callback;
      var sheet = getSheet();
      
      sheet.appendRow([
        data.person_dispensing || '',
        data.orw_followup || '',
        data.client_receiving || '',
        data.uid || '',
        data.medication || '',
        data.m1_date || '',
        data.regimen_m1 || '',
        data.m1_bottles || '',
        data.m1_next_due_date || '',
        data.m1_dispenser_signature || '',
        data.m1_recipient_signature || '',
        data.m1_remarks || '',
        data.m3_date || '',
        data.regimen_m3 || '',
        data.m3_bottles || '',
        data.m3_next_due_date || '',
        data.m3_dispenser_signature || '',
        data.m3_recipient_signature || '',
        data.m3_remarks || '',
        data.m6_date || '',
        data.regimen_m6 || '',
        data.m6_bottles || '',
        data.m6_next_due_date || '',
        data.m6_dispenser_signature || '',
        data.m6_recipient_signature || '',
        data.m6_remarks || '',
        data.m9_date || '',
        data.regimen_m9 || '',
        data.m9_bottles || '',
        data.m9_next_due_date || '',
        data.m9_dispenser_signature || '',
        data.m9_recipient_signature || '',
        data.m9_remarks || '',
        data.m12_date || '',
        data.regimen_m12 || '',
        data.m12_bottles || '',
        data.m12_next_due_date || '',
        data.m12_dispenser_signature || '',
        data.m12_recipient_signature || '',
        data.m12_remarks || ''
      ]);

      var response = {
        status: 'success',
        message: 'Drug Distribution record submitted successfully!'
      };

      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(response) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService.createTextOutput(JSON.stringify(response))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  } catch (error) {
    var errorResponse = {
      status: 'error',
      message: 'Error: ' + error.toString()
    };

    if (callback) {
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(errorResponse) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(JSON.stringify(errorResponse))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}