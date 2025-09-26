function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

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
  
  // Handle various "empty" cases
  if (value === null || value === undefined || value === 'undefined' || value === 'null' || value === 'n/a' || value === '') {
    return defaultValue;
  }
  
  return value.toString().trim();
}

// Main request handler
function handleRequest(e) {
  // Handle OPTIONS request (preflight) - Google Apps Script handles CORS automatically for web apps
  if (e.parameter && e.parameter.method == 'OPTIONS') {
    return ContentService.createTextOutput('')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    console.log('=== FOLLOW-UP HANDLER DEBUG ===');
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
      message: 'Server error: ' + error.toString(),
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Get the sheet
function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
}

// Get all data from sheet
function fetchAllData() {
  return getSheet().getDataRange().getValues();
}

// Find record by UID and visit type
function fetchByUidAndVisitType(uid, visitType) {
  if (!uid || !visitType) return null;
  
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) {
    // Column 0 = participant_uid, Column 3 = type_of_visit
    if (data[i][0]?.toString().toLowerCase() === uid.toLowerCase() && 
        data[i][3]?.toString().toLowerCase() === visitType.toLowerCase()) {
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
    if (data[i][0]?.toString().toLowerCase() === uid.toLowerCase()) {
      const visitType = data[i][3]?.toString(); // type_of_visit column
      if (visitType && !visitTypes.includes(visitType)) {
        visitTypes.push(visitType);
      }
    }
  }
  
  return visitTypes.sort(); // Sort alphabetically
}

// Column mapping for prefill (based on your actual data structure)
function getColumnMapping() {
  return {
    0: 'participant_uid',
    1: 'date', 
    2: 'prep_site',
    3: 'type_of_visit',
    4: 'interviewer_name',
    5: 'designation',
    6: 'bhmc_registration',
    7: 'interview_status',
    8: 'occupation_status',
    9: 'occupation_other',
    10: 'marital_status',
    11: 'marital_other',
    12: 'live_with_partner',
    13: 'partner_gender',
    14: 'sti_risk',
    15: 'hiv_risk',
    16: 'hiv_risk_management',
    17: 'other_hiv_risk',
    18: 'partner_hiv_status',
    19: 'steady_anal_partners',
    20: 'casual_anal_partners',
    21: 'transactional_anal_partners',
    22: 'anal_sex',
    23: 'steady_vaginal_partners',
    24: 'casual_vaginal_partners',
    25: 'transactional_vaginal_partners',
    26: 'vaginal_sex',
    27: 'condom_used_last_time',
    28: 'days_sex_regular_partner',
    29: 'condom_use_regular_clients',
    30: 'transactional_partners',
    31: 'num_clients_last_week',
    32: 'days_sex_clients',
    33: 'condom_use_clients',
    34: 'last_sex_clients_condom_use',
    35: 'condomless_sex_reason',
    36: 'condomless_other_reason', 
    37: 'prep_change_condom_use',
    38: 'dosing_regimen',
    39: 'change_regimen',
    40: 'reason_change',
    41: 'nausea',
    42: 'nausea_ongoing',
    43: 'nausea_resolved',
    44: 'vomiting',
    45: 'vomiting_ongoing',
    46: 'vomiting_resolved',
    47: 'fatigue',
    48: 'fatigue_ongoing',
    49: 'fatigue_resolved',
    50: 'dizziness',
    51: 'dizziness_ongoing',
    52: 'dizziness_resolved',
    53: 'headache',
    54: 'headache_ongoing',
    55: 'headache_resolved',
    56: 'rash',
    57: 'rash_ongoing',
    58: 'rash_resolved',
    59: 'abdominal_pain',
    60: 'abdominal_pain_ongoing',
    61: 'abdominal_pain_resolved',
    62: 'weight_loss',
    63: 'weight_loss_ongoing',
    64: 'weight_loss_resolved',
    65: 'no_response',
    66: 'other_symptoms',
    67: 'other_symptoms_specified',
    68: 'prep_reason',
    69: 'other_reason',
    70: 'day_1_pill',
    71: 'day_2_pill',
    72: 'day_3_pill',
    73: 'day_4_pill',
    74: 'day_5_pill',
    75: 'day_6_pill',
    76: 'day_7_pill',
    77: 'pill_time',
    78: 'pill_time_other',
    79: 'pill_frequency',
    80: 'pill_reminder',
    81: 'pill_reminder_other',
    82: 'missed_pill_reason',
    83: 'missed_pill_other_reason',
    84: 'longest_no_pill',
    85: 'total_no_pill_days',
    86: 'ed_prep_reason',
    87: 'other_ed_prep_reason',
    88: 'sex_last_month',
    89: 'prep_before_sex',
    90: 'prep_after_sex',
    91: 'first_prep_after_sex',
    92: 'second_prep_after_sex',
    93: 'sex_last_week',
    94: 'prep_before_sex_week',
    95: 'first_prep_after_sex_week',
    96: 'second_prep_after_sex_week',
    97: 'prep_before_last_sex',
    98: 'prep_before_last_sex_other',
    99: 'prep_after_last_sex',
    100: 'prep_after_last_sex_other',
    101: 'pill_remember',
    102: 'pill_remember_other',
    103: 'pill_missed',
    104: 'pill_missed_experiences',
    105: 'pill_missed_experiences_other',
    106: 'pill_remember_difficulty',
    107: 'pill_sharing',
    108: 'pill_recipient',
    109: 'pill_recipient_other',
    110: 'prep_continue',
    111: 'prep_discontinue_reason',
    112: 'prep_discontinue_reason_other',
    113: 'visited_pride_bhutan',
    114: 'hiv_testing_reason',
    115: 'sti_testing_reason',
    116: 'other_reason_visited',
    117: 'orw_meeting_one',
    118: 'orw_meeting_three',
    119: 'received_condoms',
    120: 'received_lubricant',
    121: 'consumed_alcohol',
    122: 'alcohol_days',
    123: 'alcohol_before_during_sex',
    124: 'taken_drugs',
    125: 'drugs_before_during_sex'
  };
}

// Get prefill data for specific UID and visit type
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

// Create the row data array (same as your original)
function createRowData(e) {
  return [
    // 0 sec
    safeGetParameter(e, 'participant_uid', ''),
    safeGetParameter(e, 'date', ''),
    safeGetParameter(e, 'prep_site', ''),
    safeGetParameter(e, 'type_of_visit', ''),
    safeGetParameter(e, 'interviewer_name', ''),
    safeGetParameter(e, 'designation', ''),
    safeGetParameter(e, 'bhmc_registration', ''),
    safeGetParameter(e, 'interview_status', ''),
    
    // Section 1
    safeGetParameter(e, 'occupation_status', ''),
    safeGetParameter(e, 'occupation_other', ''),
    safeGetParameter(e, 'marital_status', ''),
    safeGetParameter(e, 'marital_other', ''),
    safeGetParameter(e, 'live_with_partner', ''),
    safeGetParameter(e, 'partner_gender', ''),
    
    // Section 2
    safeGetParameter(e, 'sti_risk', ''),
    safeGetParameter(e, 'hiv_risk', ''),
    safeGetParameter(e, 'hiv_risk_management', ''),
    safeGetParameter(e, 'other_hiv_risk', ''),
    safeGetParameter(e, 'partner_hiv_status', ''),
    
    // Section 3
    safeGetParameter(e, 'steady_anal_partners', ''),
    safeGetParameter(e, 'casual_anal_partners', ''),
    safeGetParameter(e, 'transactional_anal_partners', ''),
    safeGetParameter(e, 'anal_sex', ''),
    safeGetParameter(e, 'steady_vaginal_partners', ''),
    safeGetParameter(e, 'casual_vaginal_partners', ''),
    safeGetParameter(e, 'transactional_vaginal_partners', ''),
    safeGetParameter(e, 'vaginal_sex', ''),
    safeGetParameter(e, 'condom_used_last_time', ''),
    safeGetParameter(e, 'days_sex_regular_partner', ''),
    safeGetParameter(e, 'condom_use_regular_clients', ''),
    safeGetParameter(e, 'transactional_partners', ''),
    safeGetParameter(e, 'num_clients_last_week', ''),
    safeGetParameter(e, 'days_sex_clients', ''),
    safeGetParameter(e, 'condom_use_clients', ''),
    safeGetParameter(e, 'last_sex_clients_condom_use', ''),
    safeGetParameter(e, 'condomless_sex_reason', ''),
    safeGetParameter(e, 'condomless_other_reason', ''),
    safeGetParameter(e, 'prep_change_condom_use', ''),
    
    // Section 4
    safeGetParameter(e, 'dosing_regimen', ''),
    safeGetParameter(e, 'change_regimen', ''),
    safeGetParameter(e, 'reason_change', ''),
    safeGetParameter(e, 'nausea', ''),
    safeGetParameter(e, 'nausea_ongoing', ''),
    safeGetParameter(e, 'nausea_resolved', ''),
    safeGetParameter(e, 'vomiting', ''),
    safeGetParameter(e, 'vomiting_ongoing', ''),
    safeGetParameter(e, 'vomiting_resolved', ''),
    safeGetParameter(e, 'fatigue', ''),
    safeGetParameter(e, 'fatigue_ongoing', ''),
    safeGetParameter(e, 'fatigue_resolved', ''),
    safeGetParameter(e, 'dizziness', ''),
    safeGetParameter(e, 'dizziness_ongoing', ''),
    safeGetParameter(e, 'dizziness_resolved', ''),
    safeGetParameter(e, 'headache', ''),
    safeGetParameter(e, 'headache_ongoing', ''),
    safeGetParameter(e, 'headache_resolved', ''),
    safeGetParameter(e, 'rash', ''),
    safeGetParameter(e, 'rash_ongoing', ''),
    safeGetParameter(e, 'rash_resolved', ''),
    safeGetParameter(e, 'abdominal_pain', ''),
    safeGetParameter(e, 'abdominal_pain_ongoing', ''),
    safeGetParameter(e, 'abdominal_pain_resolved', ''),
    safeGetParameter(e, 'weight_loss', ''),
    safeGetParameter(e, 'weight_loss_ongoing', ''),
    safeGetParameter(e, 'weight_loss_resolved', ''),
    safeGetParameter(e, 'no_response', ''),
    safeGetParameter(e, 'other_symptoms', ''),
    safeGetParameter(e, 'other_symptoms_specified', ''),
    
    // Section 5
    safeGetParameter(e, 'prep_reason', ''),
    safeGetParameter(e, 'other_reason', ''),
    safeGetParameter(e, 'day_1_pill', ''),
    safeGetParameter(e, 'day_2_pill', ''),
    safeGetParameter(e, 'day_3_pill', ''),
    safeGetParameter(e, 'day_4_pill', ''),
    safeGetParameter(e, 'day_5_pill', ''),
    safeGetParameter(e, 'day_6_pill', ''),
    safeGetParameter(e, 'day_7_pill', ''),
    safeGetParameter(e, 'pill_time', ''),
    safeGetParameter(e, 'pill_time_other', ''),
    safeGetParameter(e, 'pill_frequency', ''),
    safeGetParameter(e, 'pill_reminder', ''),
    safeGetParameter(e, 'pill_reminder_other', ''),
    safeGetParameter(e, 'missed_pill_reason', ''),
    safeGetParameter(e, 'missed_pill_other_reason', ''),
    safeGetParameter(e, 'longest_no_pill', ''),
    safeGetParameter(e, 'total_no_pill_days', ''),
    
    // Section 6
    safeGetParameter(e, 'ed_prep_reason', ''),
    safeGetParameter(e, 'other_ed_prep_reason', ''),
    safeGetParameter(e, 'sex_last_month', ''),
    safeGetParameter(e, 'prep_before_sex', ''),
    safeGetParameter(e, 'prep_after_sex', ''),
    safeGetParameter(e, 'first_prep_after_sex', ''),
    safeGetParameter(e, 'second_prep_after_sex', ''),
    safeGetParameter(e, 'sex_last_week', ''),
    safeGetParameter(e, 'prep_before_sex_week', ''),
    safeGetParameter(e, 'first_prep_after_sex_week', ''),
    safeGetParameter(e, 'second_prep_after_sex_week', ''),
    safeGetParameter(e, 'prep_before_last_sex', ''),
    safeGetParameter(e, 'prep_before_last_sex_other', ''),
    safeGetParameter(e, 'prep_after_last_sex', ''),
    safeGetParameter(e, 'prep_after_last_sex_other', ''),
    
    // Section 7
    safeGetParameter(e, 'pill_remember', ''),
    safeGetParameter(e, 'pill_remember_other', ''),
    safeGetParameter(e, 'pill_missed', ''),
    safeGetParameter(e, 'pill_missed_experiences', ''),
    safeGetParameter(e, 'pill_missed_experiences_other', ''),
    
    // Section 8
    safeGetParameter(e, 'pill_remember_difficulty', ''),
    safeGetParameter(e, 'pill_sharing', ''),
    safeGetParameter(e, 'pill_recipient', ''),
    safeGetParameter(e, 'pill_recipient_other', ''),
    safeGetParameter(e, 'prep_continue', ''),
    safeGetParameter(e, 'prep_discontinue_reason', ''),
    safeGetParameter(e, 'prep_discontinue_reason_other', ''),
    
    // Section 9
    safeGetParameter(e, 'visited_pride_bhutan', ''),
    safeGetParameter(e, 'hiv_testing_reason', ''),
    safeGetParameter(e, 'sti_testing_reason', ''),
    safeGetParameter(e, 'other_reason_visited', ''),
    safeGetParameter(e, 'orw_meeting_one', ''),
    safeGetParameter(e, 'orw_meeting_three', ''),
    safeGetParameter(e, 'received_condoms', ''),
    safeGetParameter(e, 'received_lubricant', ''),
    
    // Section 10
    safeGetParameter(e, 'consumed_alcohol', ''),
    safeGetParameter(e, 'alcohol_days', ''),
    safeGetParameter(e, 'alcohol_before_during_sex', ''),
    safeGetParameter(e, 'taken_drugs', ''),
    safeGetParameter(e, 'drugs_before_during_sex', '')
  ];
}

// Add new record
function addNewRecord(e) {
  try {
    console.log('=== ADD NEW RECORD ===');
    
    const uid = safeGetParameter(e, 'participant_uid');
    const visitType = safeGetParameter(e, 'type_of_visit');
    
    console.log('Add parameters - UID:', uid, 'VisitType:', visitType);
    
    if (!uid || !visitType) {
      return { status: 'error', message: 'Missing UID or visit type' };
    }
    
    // Check if this specific UID + visit type combination already exists
    const existingData = fetchByUidAndVisitType(uid, visitType);
    if (existingData) {
      return { status: 'error', message: `${visitType} record already exists for UID: ${uid}. Use update instead.` };
    }

    const sheet = getSheet();
    const rowData = createRowData(e);

    console.log('New row data:', JSON.stringify(rowData));

    // Add new row
    sheet.appendRow(rowData);
    
    return { status: 'success', message: `FOLLOW-UP TOOL Submitted Successfully for ${visitType} - UID: ${uid}` };
  } catch (error) {
    console.error('Error in addNewRecord:', error);
    return { status: 'error', message: 'Error adding record: ' + error };
  }
}

// Update existing record
function updateRecord(e) {
  try {
    console.log('=== UPDATE RECORD ===');
    
    const uid = safeGetParameter(e, 'participant_uid');
    const visitType = safeGetParameter(e, 'type_of_visit');
    
    console.log('Update parameters - UID:', uid, 'VisitType:', visitType);
    
    if (!uid || !visitType) {
      return { status: 'error', message: 'Missing UID or visit type' };
    }
    
    const existingData = fetchByUidAndVisitType(uid, visitType);
    if (!existingData) {
      return { status: 'error', message: `${visitType} record for UID ${uid} not found` };
    }

    const sheet = getSheet();
    const rowNumber = existingData.rowNumber;
    const rowData = createRowData(e);

    console.log('Updated row data:', JSON.stringify(rowData));

    // Update the row
    sheet.getRange(rowNumber, 1, 1, rowData.length).setValues([rowData]);
    
    return { status: 'success', message: `Follow-up ${visitType} updated for UID: ${uid}` };
  } catch (error) {
    console.error('Error in updateRecord:', error);
    return { status: 'error', message: 'Error updating record: ' + error };
  }
}

// Delete record
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
    
    // Delete the entire row
    sheet.deleteRow(data.rowNumber);
    
    return { status: 'success', message: `${visitType} record deleted for UID: ${uid}` };
  } catch (error) {
    console.error('Error in deleteRecord:', error);
    return { status: 'error', message: 'Error deleting record: ' + error };
  }
}