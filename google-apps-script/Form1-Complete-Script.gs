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

// Column mapping based on your sheet structure
function getColumnIndexes() {
  return {
    'date': 0,              // Column A
    'uid': 1,               // Column B  
    'type_of_visit': 2,     // Column C
    'kpo_group': 3,         // Column D - KP group
    'prep_site': 4,         // Column E - PrEP site
    'age': 5,               // Column F
    'weight': 6,            // Column G
    'resident': 7,          // Column H - Resident of
    'behavioral_risk': 8,   // Column I - BEHAVIORAL RISK ASSESSMENT
    'rapid_test_date': 9,   // Column J - HIV Test date
    'rapid_test_result': 10, // Column K - HIV Test result
    'generation_test_date': 11, // Column L - HIV 4th Generation date
    'generation_test_result': 12, // Column M - HIV 4th Generation result
    'start_prep': 13,       // Column N - Willing to start PrEP
    'follow_up': 14,        // Column O - Willing to return for follow-up
    'medicalInfo': 15,      // Column P - CLINICAL/MEDICAL ASSESSMENT
    'suitable_for_prep': 16, // Column Q - Suitable for PrEP
    'prep_initiation_date': 17, // Column R - initiation_date
    'prep_regimen': 18,     // Column S - Prep regimen
    'signature_date': 19,   // Column T - Prescriber's date
    'prescriber_name': 20,  // Column U - Prescriber's name
    'prescriber_designation': 21, // Column V - Prescriber's designation
    'bhc_no': 22           // Column W - Prescriber's BMHC no
  };
}

function getHeaderMapping() {
  return {
    'Date': 'date',
    'uid': 'participant_uid',
    'type_of_visit': 'type_of_visit',
    'KP group': 'kpo_group',
    'PrEP site': 'prep_site',
    'Age': 'age',
    'weight': 'weight',
    'Resident of': 'resident',
    'BEHAVIORAL RISK ASSESSMENT': 'behavioral_risk',
    'HIV Test date': 'rapid_test_date',
    'HIV Test result': 'rapid_test_result',
    'HIV 4th Generation date': 'generation_test_date',
    'HIV 4th Generation result': 'generation_test_result',
    'Willing to start PrEP': 'start_prep',
    'Willing to return for at least one follow-up visit?': 'follow_up',
    'CLINICAL/MEDICAL ASSESSMENT': 'medicalInfo',
    'Suitable for PrEP': 'suitable_for_prep',
    'initiation_date': 'prep_initiation_date',
    "Prescriber's date": 'signature_date',
    "Prescriber's name": 'prescriber_name',
    "Prescriber's designation": 'prescriber_designation',
    "Prescriber's BMHC no": 'bhc_no'
  };
}

function fetchAllData() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  return data;
}

function fetchById(uid) {
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) { // start from 1 to skip header
    if (data[i][1] && data[i][1].toString().toLowerCase() === uid.toLowerCase()) { // UID is in column B (index 1, which is 'uid' column)
      return data[i]; // return the entire row
    }
  }
  return null; // UID not found
}

// Fetch data for specific UID and visit type combination
function fetchByUidAndVisitType(uid, visitType) {
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) { // start from 1 to skip header
    if (data[i][1] && data[i][1].toString().toLowerCase() === uid.toLowerCase() &&
        data[i][2] && data[i][2].toString() === visitType) { // Check both UID and visit type
      return data[i]; // return the entire row
    }
  }
  return null; // Combination not found
}

// Get all available visit types for a specific UID
function getAvailableVisits(uid) {
  try {
    const data = fetchAllData();
    const visitTypes = [];
    const allPossibleVisits = [
      'Screening Visit MO',
      'End of M1',
      'End of M3', 
      'End of M6',
      'End of M9',
      'End of M12'
    ];
    
    // Initialize visitStatus for all possible visits
    const visitStatus = {};
    allPossibleVisits.forEach(visit => {
      visitStatus[visit] = 'No Data';
    });
    
    // Look for all rows with this UID and collect unique visit types that have data
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] && data[i][1].toString().toLowerCase() === uid.toLowerCase()) {
        const visitType = data[i][2]; // type_of_visit is in column C (index 2)
        if (visitType && visitType.toString().trim() !== '') {
          // Mark this visit as having data
          visitStatus[visitType] = 'Has Data';
          
          // Add to available visits if not already included
          if (!visitTypes.includes(visitType)) {
            visitTypes.push(visitType);
          }
        }
      }
    }
    
    return {
      status: 'success',
      availableVisits: visitTypes,
      visitStatus: visitStatus,
      message: `Found ${visitTypes.length} visit types for UID ${uid}`
    };
    
  } catch (error) {
    return {
      status: 'error',
      availableVisits: [],
      visitStatus: {},
      message: 'Error fetching available visits: ' + error.toString()
    };
  }
}

function getPrefillData(uid, visitType = null) {
  try {
    // If visitType is specified, fetch data for that specific combination
    const rowData = visitType ? fetchByUidAndVisitType(uid, visitType) : fetchById(uid);
    if (!rowData) {
      return {
        status: 'error',
        message: `Add data for ${uid}` // Positive message instead of "not found"
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
        
        // Handle arrays (semicolon-separated values)
        if (fieldName === 'behavioral_risk' || fieldName === 'medicalInfo') {
          if (typeof value === 'string' && value.includes(';')) {
            prefillObject[fieldName] = value.split(';').map(item => item.trim()).filter(item => item);
          } else if (typeof value === 'string' && value) {
            prefillObject[fieldName] = [value.trim()];
          } else {
            prefillObject[fieldName] = [];
          }
        }
        // Handle dates
        else if (fieldName.includes('date')) {
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
        // Handle numbers
        else if (fieldName === 'age' || fieldName === 'weight') {
          prefillObject[fieldName] = value ? Number(value) : null;
        }
        // Handle other fields
        else {
          prefillObject[fieldName] = value ? value.toString() : '';
        }
      }
    });

    return {
      status: 'success',
      data: prefillObject
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Error fetching data: ' + error.toString()
    };
  }
}

function updateRecord(uid, data) {
  try {
    const sheet = getSheet();
    const allData = fetchAllData();
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][1] && allData[i][1].toString().toLowerCase() === uid.toLowerCase()) {
        // Found the row, update it
        const rowNumber = i + 1; // +1 because sheet rows are 1-indexed
        
        // Update the row with new data
        sheet.getRange(rowNumber, 1, 1, 23).setValues([[
          data.date,
          data.participant_uid,
          data.type_of_visit,
          data.kpo_group,
          data.prep_site,
          data.age,
          data.weight,
          data.resident,
          data.behavioral_risk,
          data.rapid_test_date,
          data.rapid_test_result,
          data.generation_test_date,
          data.generation_test_result,
          data.start_prep,
          data.follow_up,
          data.medicalInfo,
          data.suitable_for_prep,
          data.prep_initiation_date,
          data.prep_regimen || '', // Added prep regimen field
          data.signature_date,
          data.prescriber_name,
          data.prescriber_designation,
          data.bhc_no
        ]]);
        
        return {
          status: 'success',
          message: 'Suitability Assessment updated successfully for UID: ' + uid
        };
      }
    }
    
    return {
      status: 'error',
      message: 'UID not found: ' + uid
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Error updating record: ' + error.toString()
    };
  }
}

function deleteRecord(uid) {
  try {
    const sheet = getSheet();
    const allData = fetchAllData();
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][1] && allData[i][1].toString().toLowerCase() === uid.toLowerCase()) {
        // Found the row, delete it
        const rowNumber = i + 1; // +1 because sheet rows are 1-indexed
        sheet.deleteRow(rowNumber);
        
        return {
          status: 'success',
          message: 'Suitability Assessment record deleted successfully for UID: ' + uid
        };
      }
    }
    
    return {
      status: 'error',
      message: 'UID not found: ' + uid
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
    if (data.action === 'getAvailableVisits') {
      delete data.callback;
      delete data.action;
      
      var result = getAvailableVisits(data.uid);
      
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService.createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    else if (data.action === 'prefill') {
      delete data.callback;
      delete data.action;
      
      var result = getPrefillData(data.uid);
      
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
      var uid = data.participant_uid;
      
      var result = updateRecord(uid, data);
      
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
      
      var result = deleteRecord(data.uid);
      
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
        data.date,
        data.participant_uid,
        data.type_of_visit,
        data.kpo_group,
        data.prep_site,
        data.age,
        data.weight,
        data.resident,
        data.behavioral_risk,
        data.rapid_test_date,
        data.rapid_test_result,
        data.generation_test_date,
        data.generation_test_result,
        data.start_prep,
        data.follow_up,
        data.medicalInfo,
        data.suitable_for_prep,
        data.prep_initiation_date,
        data.prep_regimen || '', // Added prep regimen field
        data.signature_date,
        data.prescriber_name,
        data.prescriber_designation,
        data.bhc_no
      ]);

      var response = {
        status: 'success',
        message: 'Suitability Assessment submitted successfully!'
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