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

function fetchAllData() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  return data;
}

// Find UID column automatically (should be first column based on your mapping)
function findUidColumn() {
  const data = fetchAllData();
  if (data.length === 0) return 0;
  
  const headers = data[0];
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toString().toLowerCase();
    if (header === 'uid' || header.includes('participant')) {
      return i;
    }
  }
  return 0; // Default to first column
}

// Find visit type column automatically (should be column D based on your mapping)
function findVisitTypeColumn() {
  const data = fetchAllData();
  if (data.length === 0) return 3;
  
  const headers = data[0];
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toString().toLowerCase();
    if (header.includes('visit') || header.includes('type_of_visit')) {
      return i;
    }
  }
  return 3; // Default to column D (index 3)
}

function fetchById(uid) {
  const data = fetchAllData();
  const uidColumn = findUidColumn();
  
  for (let i = 1; i < data.length; i++) { // start from 1 to skip header
    if (data[i][uidColumn] && data[i][uidColumn].toString().toLowerCase() === uid.toLowerCase()) {
      return data[i]; // return the entire row
    }
  }
  return null; // UID not found
}

// Fetch data for specific UID and visit type combination
function fetchByUidAndVisitType(uid, visitType) {
  const data = fetchAllData();
  const uidColumn = findUidColumn();
  const visitTypeColumn = findVisitTypeColumn();
  
  for (let i = 1; i < data.length; i++) { // start from 1 to skip header
    if (data[i][uidColumn] && data[i][uidColumn].toString().toLowerCase() === uid.toLowerCase() &&
        data[i][visitTypeColumn] && data[i][visitTypeColumn].toString() === visitType) {
      return data[i]; // return the entire row
    }
  }
  return null; // Combination not found
}

// Get all available visit types for a specific UID
function getAvailableVisits(uid) {
  try {
    const data = fetchAllData();
    const uidColumn = findUidColumn();
    const visitTypeColumn = findVisitTypeColumn();
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
      if (data[i][uidColumn] && data[i][uidColumn].toString().toLowerCase() === uid.toLowerCase()) {
        const visitType = data[i][visitTypeColumn];
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
        message: `No data found for UID ${uid}${visitType ? ' with visit type ' + visitType : ''}`
      };
    }

    const sheet = getSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const prefillObject = {};
    
    // Map the data using the field structure you provided
    const fieldMapping = {
      0: 'participant_uid',
      1: 'date', 
      2: 'prep_site',
      3: 'visit_type',
      4: 'interviewer_name',
      5: 'designation',
      6: 'bmhc_number',
      7: 'interview_status',
      8: 'occupation_status',
      9: 'occupation_other',
      10: 'marital_status', 
      11: 'marital_other',
      12: 'live_with_partner',
      13: 'partner_gender',
      
      // Section 2
      14: 'sti_risk',
      15: 'hiv_risk', 
      16: 'partner_hiv_status',
      
      // Section 3
      17: 'steady_anal_partners',
      18: 'casual_anal_partners',
      19: 'transactional_anal_partners',
      20: 'anal_sex',
      21: 'steady_vaginal_partners',
      22: 'casual_vaginal_partners',
      23: 'transactional_vaginal_partners',
      24: 'vaginal_sex',
      25: 'sex_days',
      26: 'regular_condom_use',
      27: 'last_sex_condom_use',
      28: 'have_clients',
      29: 'clients_last_week',
      30: 'sex_days_clients',
      31: 'clients_condom_use',
      32: 'last_sex_with_clients_condom_use',
      33: 'sex_without_condom_reason',
      34: 'sex_without_condom_reason_other',
      35: 'prep_change_condom_use',
      
      // Section 4
      36: 'dosing_regimen',
      37: 'change_regimen',
      38: 'reason_change',
      39: 'nausea',
      40: 'nausea_ongoing',
      41: 'nausea_resolved',
      42: 'vomiting',
      43: 'vomiting_ongoing',
      44: 'vomiting_resolved',
      45: 'fatigue',
      46: 'fatigue_ongoing',
      47: 'fatigue_resolved',
      48: 'dizziness',
      49: 'dizziness_ongoing',
      50: 'dizziness_resolved',
      51: 'headache',
      52: 'headache_ongoing',
      53: 'headache_resolved',
      54: 'rash',
      55: 'rash_ongoing',
      56: 'rash_resolved',
      57: 'abdominal_pain',
      58: 'abdominal_pain_ongoing',
      59: 'abdominal_pain_resolved',
      60: 'weight_loss',
      61: 'weight_loss_ongoing',
      62: 'weight_loss_resolved',
      63: 'no_response',
      64: 'other_symptoms',
      65: 'other_symptoms_specified',
      
      // Section 5
      66: 'prep_reason',
      67: 'other_reason',
      68: 'day_1_pill',
      69: 'day_2_pill',
      70: 'day_3_pill',
      71: 'day_4_pill',
      72: 'day_5_pill',
      73: 'day_6_pill',
      74: 'day_7_pill',
      75: 'pill_time',
      76: 'pill_time_other',
      77: 'pill_frequency',
      78: 'pill_reminder',
      79: 'pill_reminder_other',
      80: 'missed_pill_reason',
      81: 'missed_pill_other_reason',
      82: 'longest_no_pill',
      83: 'total_no_pill_days',
      
      // Section 6
      84: 'ed_prep_reason',
      85: 'other_ed_prep_reason',
      86: 'sex_last_month',
      87: 'prep_before_sex',
      88: 'prep_after_sex',
      89: 'first_prep_after_sex',
      90: 'second_prep_after_sex',
      91: 'sex_last_week',
      92: 'prep_before_sex_week',
      93: 'first_prep_after_sex_week',
      94: 'second_prep_after_sex_week',
      95: 'prep_before_last_sex',
      96: 'prep_before_last_sex_other',
      97: 'prep_after_last_sex',
      98: 'prep_after_last_sex_other',
      
      // Section 7
      99: 'pill_remember',
      100: 'pill_remember_other',
      101: 'pill_missed',
      102: 'pill_missed_experiences',
      103: 'pill_missed_experiences_other',
      
      // Section 8
      104: 'pill_remember_difficulty',
      105: 'pill_sharing',
      106: 'pill_recipient',
      107: 'pill_recipient_other',
      
      // Section 9
      108: 'visited_pride_bhutan',
      109: 'hiv_testing_reason',
      110: 'sti_testing_reason',
      111: 'other_reason_visited',
      112: 'orw_meeting_one',
      113: 'received_condoms',
      114: 'received_lubricant',
      
      // Section 10
      115: 'consumed_alcohol',
      116: 'alcohol_days',
      117: 'alcohol_before_during_sex',
      118: 'taken_drugs',
      119: 'drugs_before_during_sex',
      
      // Section 11
      120: 'protection_feeling',
      121: 'sti_concern',
      122: 'prep_package_opinion',
      123: 'participation_likes',
      124: 'participation_likes_other',
      125: 'participation_challenges',
      126: 'participation_challenges_other',
      127: 'delivery_preference',
      128: 'delivery_preference_other',
      129: 'satisfaction_level',
      
      // Section 12
      130: 'discontinuation_reasons',
      131: 'discontinuation_other'
    };
    
    // Map the data using field mapping
    Object.keys(fieldMapping).forEach(index => {
      const columnIndex = parseInt(index);
      const fieldName = fieldMapping[index];
      
      if (rowData[columnIndex] !== undefined && rowData[columnIndex] !== null && rowData[columnIndex] !== '') {
        let value = rowData[columnIndex];
        
        // Handle dates
        if (fieldName.toLowerCase().includes('date')) {
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
          }
        }
        // Handle numbers
        else if (typeof value === 'number') {
          prefillObject[fieldName] = value;
        }
        // Handle other fields
        else {
          prefillObject[fieldName] = value.toString();
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
      message: 'Error fetching prefill data: ' + error.toString()
    };
  }
}

function updateRecord(uid, visitType, data) {
  try {
    const sheet = getSheet();
    const allData = fetchAllData();
    const uidColumn = findUidColumn();
    const visitTypeColumn = findVisitTypeColumn();
    
    // Find the specific row with both UID and visit type
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][uidColumn] && allData[i][uidColumn].toString().toLowerCase() === uid.toLowerCase() &&
          allData[i][visitTypeColumn] && allData[i][visitTypeColumn].toString() === visitType) {
        
        // Found the row, update it with all the new data
        const rowNumber = i + 1; // +1 because sheet rows are 1-indexed
        
        // Prepare the data array based on your field mapping
        const rowData = [
          data.participant_uid || '',
          data.date || '',
          data.prep_site || '',
          data.visit_type || '',
          data.interviewer_name || '',
          data.designation || '',
          data.bmhc_number || '',
          data.interview_status || '',
          data.occupation_status || '',
          data.occupation_other || '',
          data.marital_status || '',
          data.marital_other || '',
          data.live_with_partner || '',
          data.partner_gender || '',
          
          // Section 2
          data.sti_risk || '',
          data.hiv_risk || '',
          data.partner_hiv_status || '',
          
          // Section 3
          data.steady_anal_partners || '',
          data.casual_anal_partners || '',
          data.transactional_anal_partners || '',
          data.anal_sex || '',
          data.steady_vaginal_partners || '',
          data.casual_vaginal_partners || '',
          data.transactional_vaginal_partners || '',
          data.vaginal_sex || '',
          data.sex_days || '',
          data.regular_condom_use || '',
          data.last_sex_condom_use || '',
          data.have_clients || '',
          data.clients_last_week || '',
          data.sex_days_clients || '',
          data.clients_condom_use || '',
          data.last_sex_with_clients_condom_use || '',
          data.sex_without_condom_reason || '',
          data.sex_without_condom_reason_other || '',
          data.prep_change_condom_use || '',
          
          // Section 4
          data.dosing_regimen || '',
          data.change_regimen || '',
          data.reason_change || '',
          data.nausea || '',
          data.nausea_ongoing || '',
          data.nausea_resolved || '',
          data.vomiting || '',
          data.vomiting_ongoing || '',
          data.vomiting_resolved || '',
          data.fatigue || '',
          data.fatigue_ongoing || '',
          data.fatigue_resolved || '',
          data.dizziness || '',
          data.dizziness_ongoing || '',
          data.dizziness_resolved || '',
          data.headache || '',
          data.headache_ongoing || '',
          data.headache_resolved || '',
          data.rash || '',
          data.rash_ongoing || '',
          data.rash_resolved || '',
          data.abdominal_pain || '',
          data.abdominal_pain_ongoing || '',
          data.abdominal_pain_resolved || '',
          data.weight_loss || '',
          data.weight_loss_ongoing || '',
          data.weight_loss_resolved || '',
          data.no_response || '',
          data.other_symptoms || '',
          data.other_symptoms_specified || '',
          
          // Section 5
          data.prep_reason || '',
          data.other_reason || '',
          data.day_1_pill || '',
          data.day_2_pill || '',
          data.day_3_pill || '',
          data.day_4_pill || '',
          data.day_5_pill || '',
          data.day_6_pill || '',
          data.day_7_pill || '',
          data.pill_time || '',
          data.pill_time_other || '',
          data.pill_frequency || '',
          data.pill_reminder || '',
          data.pill_reminder_other || '',
          data.missed_pill_reason || '',
          data.missed_pill_other_reason || '',
          data.longest_no_pill || '',
          data.total_no_pill_days || '',
          
          // Section 6
          data.ed_prep_reason || '',
          data.other_ed_prep_reason || '',
          data.sex_last_month || '',
          data.prep_before_sex || '',
          data.prep_after_sex || '',
          data.first_prep_after_sex || '',
          data.second_prep_after_sex || '',
          data.sex_last_week || '',
          data.prep_before_sex_week || '',
          data.first_prep_after_sex_week || '',
          data.second_prep_after_sex_week || '',
          data.prep_before_last_sex || '',
          data.prep_before_last_sex_other || '',
          data.prep_after_last_sex || '',
          data.prep_after_last_sex_other || '',
          
          // Section 7
          data.pill_remember || '',
          data.pill_remember_other || '',
          data.pill_missed || '',
          data.pill_missed_experiences || '',
          data.pill_missed_experiences_other || '',
          
          // Section 8
          data.pill_remember_difficulty || '',
          data.pill_sharing || '',
          data.pill_recipient || '',
          data.pill_recipient_other || '',
          
          // Section 9
          data.visited_pride_bhutan || '',
          data.hiv_testing_reason || '',
          data.sti_testing_reason || '',
          data.other_reason_visited || '',
          data.orw_meeting_one || '',
          data.received_condoms || '',
          data.received_lubricant || '',
          
          // Section 10
          data.consumed_alcohol || '',
          data.alcohol_days || '',
          data.alcohol_before_during_sex || '',
          data.taken_drugs || '',
          data.drugs_before_during_sex || '',
          
          // Section 11
          data.protection_feeling || '',
          data.sti_concern || '',
          data.prep_package_opinion || '',
          data.participation_likes || '',
          data.participation_likes_other || '',
          data.participation_challenges || '',
          data.participation_challenges_other || '',
          data.delivery_preference || '',
          data.delivery_preference_other || '',
          data.satisfaction_level || '',
          
          // Section 12
          data.discontinuation_reasons || '',
          data.discontinuation_other || ''
        ];
        
        // Update the entire row
        sheet.getRange(rowNumber, 1, 1, rowData.length).setValues([rowData]);
        
        return {
          status: 'success',
          message: `Exit form record updated successfully for UID: ${uid}, Visit: ${visitType}`
        };
      }
    }
    
    return {
      status: 'error',
      message: `No record found for UID: ${uid} with visit type: ${visitType}`
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
    const uidColumn = findUidColumn();
    const visitTypeColumn = findVisitTypeColumn();
    
    // Find the specific row with both UID and visit type
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][uidColumn] && allData[i][uidColumn].toString().toLowerCase() === uid.toLowerCase() &&
          allData[i][visitTypeColumn] && allData[i][visitTypeColumn].toString() === visitType) {
        // Found the row, delete it
        const rowNumber = i + 1; // +1 because sheet rows are 1-indexed
        sheet.deleteRow(rowNumber);
        
        return {
          status: 'success',
          message: `Exit form record deleted successfully for UID: ${uid}, Visit: ${visitType}`
        };
      }
    }
    
    return {
      status: 'error',
      message: `No record found for UID: ${uid} with visit type: ${visitType}`
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Error deleting record: ' + error.toString()
    };
  }
}

function createRecord(data) {
  try {
    const sheet = getSheet();
    
    // Prepare the data array based on your field mapping
    const rowData = [
      data.participant_uid || '',
      data.date || '',
      data.prep_site || '',
      data.visit_type || '',
      data.interviewer_name || '',
      data.designation || '',
      data.bmhc_number || '',
      data.interview_status || '',
      data.occupation_status || '',
      data.occupation_other || '',
      data.marital_status || '',
      data.marital_other || '',
      data.live_with_partner || '',
      data.partner_gender || '',
      
      // Section 2
      data.sti_risk || '',
      data.hiv_risk || '',
      data.partner_hiv_status || '',
      
      // Section 3
      data.steady_anal_partners || '',
      data.casual_anal_partners || '',
      data.transactional_anal_partners || '',
      data.anal_sex || '',
      data.steady_vaginal_partners || '',
      data.casual_vaginal_partners || '',
      data.transactional_vaginal_partners || '',
      data.vaginal_sex || '',
      data.sex_days || '',
      data.regular_condom_use || '',
      data.last_sex_condom_use || '',
      data.have_clients || '',
      data.clients_last_week || '',
      data.sex_days_clients || '',
      data.clients_condom_use || '',
      data.last_sex_with_clients_condom_use || '',
      data.sex_without_condom_reason || '',
      data.sex_without_condom_reason_other || '',
      data.prep_change_condom_use || '',
      
      // Section 4
      data.dosing_regimen || '',
      data.change_regimen || '',
      data.reason_change || '',
      data.nausea || '',
      data.nausea_ongoing || '',
      data.nausea_resolved || '',
      data.vomiting || '',
      data.vomiting_ongoing || '',
      data.vomiting_resolved || '',
      data.fatigue || '',
      data.fatigue_ongoing || '',
      data.fatigue_resolved || '',
      data.dizziness || '',
      data.dizziness_ongoing || '',
      data.dizziness_resolved || '',
      data.headache || '',
      data.headache_ongoing || '',
      data.headache_resolved || '',
      data.rash || '',
      data.rash_ongoing || '',
      data.rash_resolved || '',
      data.abdominal_pain || '',
      data.abdominal_pain_ongoing || '',
      data.abdominal_pain_resolved || '',
      data.weight_loss || '',
      data.weight_loss_ongoing || '',
      data.weight_loss_resolved || '',
      data.no_response || '',
      data.other_symptoms || '',
      data.other_symptoms_specified || '',
      
      // Section 5
      data.prep_reason || '',
      data.other_reason || '',
      data.day_1_pill || '',
      data.day_2_pill || '',
      data.day_3_pill || '',
      data.day_4_pill || '',
      data.day_5_pill || '',
      data.day_6_pill || '',
      data.day_7_pill || '',
      data.pill_time || '',
      data.pill_time_other || '',
      data.pill_frequency || '',
      data.pill_reminder || '',
      data.pill_reminder_other || '',
      data.missed_pill_reason || '',
      data.missed_pill_other_reason || '',
      data.longest_no_pill || '',
      data.total_no_pill_days || '',
      
      // Section 6
      data.ed_prep_reason || '',
      data.other_ed_prep_reason || '',
      data.sex_last_month || '',
      data.prep_before_sex || '',
      data.prep_after_sex || '',
      data.first_prep_after_sex || '',
      data.second_prep_after_sex || '',
      data.sex_last_week || '',
      data.prep_before_sex_week || '',
      data.first_prep_after_sex_week || '',
      data.second_prep_after_sex_week || '',
      data.prep_before_last_sex || '',
      data.prep_before_last_sex_other || '',
      data.prep_after_last_sex || '',
      data.prep_after_last_sex_other || '',
      
      // Section 7
      data.pill_remember || '',
      data.pill_remember_other || '',
      data.pill_missed || '',
      data.pill_missed_experiences || '',
      data.pill_missed_experiences_other || '',
      
      // Section 8
      data.pill_remember_difficulty || '',
      data.pill_sharing || '',
      data.pill_recipient || '',
      data.pill_recipient_other || '',
      
      // Section 9
      data.visited_pride_bhutan || '',
      data.hiv_testing_reason || '',
      data.sti_testing_reason || '',
      data.other_reason_visited || '',
      data.orw_meeting_one || '',
      data.received_condoms || '',
      data.received_lubricant || '',
      
      // Section 10
      data.consumed_alcohol || '',
      data.alcohol_days || '',
      data.alcohol_before_during_sex || '',
      data.taken_drugs || '',
      data.drugs_before_during_sex || '',
      
      // Section 11
      data.protection_feeling || '',
      data.sti_concern || '',
      data.prep_package_opinion || '',
      data.participation_likes || '',
      data.participation_likes_other || '',
      data.participation_challenges || '',
      data.participation_challenges_other || '',
      data.delivery_preference || '',
      data.delivery_preference_other || '',
      data.satisfaction_level || '',
      
      // Section 12
      data.discontinuation_reasons || '',
      data.discontinuation_other || ''
    ];
    
    // Add the new row
    sheet.appendRow(rowData);
    
    return {
      status: 'success',
      message: `Exit form record created successfully for UID: ${data.participant_uid}`
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Error creating record: ' + error.toString()
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
      var visitType = data.visit_type; // Get visit_type if provided
      
      var result = getPrefillData(data.uid, visitType);
      
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
      var visitType = data.visit_type;
      
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
      
      var result = deleteRecord(data.uid, data.visit_type);
      
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService.createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    else {
      // Default action: create new record
      delete data.callback;
      
      var result = createRecord(data);

      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService.createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  } catch (error) {
    var errorResponse = {
      status: 'error',
      message: 'Server error: ' + error.toString()
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