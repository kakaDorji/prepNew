function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

// Get target sheet
function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
}

// Main request handler
function handleRequest(e) {
  try {
    const action = e.parameter.action || e.parameters.action?.[0];
    
    switch (action) {
      case 'prefill':
        const uid = e.parameter.uid || e.parameters.uid?.[0];
        const visitType = e.parameter.visitType || e.parameters.visitType?.[0];
        return ContentService.createTextOutput(JSON.stringify(getPrefillData(uid, visitType)))
               .setMimeType(ContentService.MimeType.JSON);
      
      case 'getVisitTypes':
        const uidForVisits = e.parameter.uid || e.parameters.uid?.[0];
        const availableVisits = getAvailableVisitTypes(uidForVisits);
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          availableVisits: availableVisits
        })).setMimeType(ContentService.MimeType.JSON);
      
      case 'update':
        return ContentService.createTextOutput(JSON.stringify(updateRecord(e)))
               .setMimeType(ContentService.MimeType.JSON);
      
      case 'delete':
        const deleteUid = e.parameter.uid || e.parameters.uid?.[0];
        const deleteVisitType = e.parameter.visitType || e.parameters.visitType?.[0];
        return ContentService.createTextOutput(JSON.stringify(deleteRecord(deleteUid, deleteVisitType)))
               .setMimeType(ContentService.MimeType.JSON);
      
      default:
        return ContentService.createTextOutput(JSON.stringify(addNewRecord(e)))
               .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: 'Server error: ' + error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Column mapping for the multi-row approach
function getColumnMapping() {
  return {
    0: 'person_dispensing',           // 'Name of the person dispensing PrEP'
    1: 'orw_followup',              // 'Name of the Outreach Worker following up with Client'
    2: 'client_receiving',          // 'Name of the client receiving PrEP'
    3: 'uid',                       // 'uid'
    4: 'medication',                // 'Medic taking for' (M1, M3, M6, M9, M12)
    5: 'visit_date',               // Visit date for the specific month
    6: 'regimen',                  // Regimen for the specific month
    7: 'bottles',                  // '# of bottle/s dispensed with corresponding lot/batch number'
    8: 'next_due_date',           // 'next_due_date'
    9: 'dispenser_signature',     // 'Signature of the person dispensing'
    10: 'recipient_signature',    // 'Signature of the recipient'
    11: 'remarks'                 // 'Remarks'
  };
}

// Get all data from sheet
function fetchAllData() {
  return getSheet().getDataRange().getValues();
}

// Find record by UID and visit type
function fetchByUidAndVisitType(uid, visitType) {
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

// Prefill data for UID and specific visit type
function getPrefillData(uid, visitType) {
  try {
    // If no visit type, return list of available ones
    if (!visitType) {
      const availableVisits = getAvailableVisitTypes(uid);
      if (availableVisits.length === 0) return { status: 'error', message: `Add data for ${uid}` };
      return { status: 'success', availableVisits, message: 'Select a visit type to load data' };
    }

    // Get the specific row for this UID and visit type
    const data = fetchByUidAndVisitType(uid, visitType);
    if (!data) return { status: 'error', message: `Add ${visitType} data for ${uid}` };

    const rowData = data.rowData;
    const columnMapping = getColumnMapping();
    const prefillObject = {};

    // Map row values to form fields
    Object.keys(columnMapping).forEach(position => {
      const index = parseInt(position);
      const fieldName = columnMapping[position];
      
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
function updateRecord(e) {
  try {
    const uid = e.parameter.uid || e.parameters.uid?.[0];
    const visitType = e.parameter.medication || e.parameters.medication?.[0];
    
    const existingData = fetchByUidAndVisitType(uid, visitType);
    if (!existingData) {
      return { status: 'error', message: `${visitType} record for UID ${uid} not found` };
    }

    const sheet = getSheet();
    const rowNumber = existingData.rowNumber;

    // Create new row data
    const newRow = [
      e.parameter.person_dispensing || e.parameters.person_dispensing?.[0] || '',
      e.parameter.orw_followup || e.parameters.orw_followup?.[0] || '',
      e.parameter.client_receiving || e.parameters.client_receiving?.[0] || '',
      uid,
      visitType,
      e.parameter.visit_date || e.parameters.visit_date?.[0] || '',
      e.parameter.regimen || e.parameters.regimen?.[0] || '',
      e.parameter.bottles || e.parameters.bottles?.[0] || '',
      e.parameter.next_due_date || e.parameters.next_due_date?.[0] || '',
      e.parameter.dispenser_signature || e.parameters.dispenser_signature?.[0] || '',
      e.parameter.recipient_signature || e.parameters.recipient_signature?.[0] || '',
      e.parameter.remarks || e.parameters.remarks?.[0] || ''
    ];

    // Update the row
    sheet.getRange(rowNumber, 1, 1, newRow.length).setValues([newRow]);
    
    return { status: 'success', message: `Drug Distribution ${visitType} updated for UID: ${uid}` };
  } catch (error) {
    return { status: 'error', message: 'Error updating record: ' + error };
  }
}

// Add new record
function addNewRecord(e) {
  try {
    const uid = e.parameter.uid || e.parameters.uid?.[0];
    const visitType = e.parameter.medication || e.parameters.medication?.[0];
    
    // Check if record already exists
    const existingData = fetchByUidAndVisitType(uid, visitType);
    if (existingData) {
      return { status: 'error', message: `${visitType} record already exists for UID: ${uid}. Use update instead.` };
    }

    const sheet = getSheet();
    
    // Create new row data
    const newRow = [
      e.parameter.person_dispensing || e.parameters.person_dispensing?.[0] || '',
      e.parameter.orw_followup || e.parameters.orw_followup?.[0] || '',
      e.parameter.client_receiving || e.parameters.client_receiving?.[0] || '',
      uid,
      visitType,
      e.parameter.visit_date || e.parameters.visit_date?.[0] || '',
      e.parameter.regimen || e.parameters.regimen?.[0] || '',
      e.parameter.bottles || e.parameters.bottles?.[0] || '',
      e.parameter.next_due_date || e.parameters.next_due_date?.[0] || '',
      e.parameter.dispenser_signature || e.parameters.dispenser_signature?.[0] || '',
      e.parameter.recipient_signature || e.parameters.recipient_signature?.[0] || '',
      e.parameter.remarks || e.parameters.remarks?.[0] || ''
    ];

    // Add new row
    sheet.appendRow(newRow);
    
    return { status: 'success', message: `New Drug Distribution ${visitType} record added for UID: ${uid}` };
  } catch (error) {
    return { status: 'error', message: 'Error adding record: ' + error };
  }
}

// Delete record
function deleteRecord(uid, visitType) {
  try {
    const data = fetchByUidAndVisitType(uid, visitType);
    if (!data) {
      return { status: 'error', message: `${visitType} record for UID ${uid} not found` };
    }

    const sheet = getSheet();
    sheet.deleteRow(data.rowNumber);
    
    return { status: 'success', message: `${visitType} record deleted for UID: ${uid}` };
  } catch (error) {
    return { status: 'error', message: 'Error deleting record: ' + error };
  }
}