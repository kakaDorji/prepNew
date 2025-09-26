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

// FIXED: Helper function to add CORS headers to responses
function addCorsHeaders(response) {
  return response
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Main request handler
function handleRequest(e) {
  // Handle OPTIONS request (preflight)
  if (e.parameter && e.parameter.method == 'OPTIONS') {
    return addCorsHeaders(
      ContentService.createTextOutput('')
        .setMimeType(ContentService.MimeType.TEXT)
    );
  }

  try {
    console.log('=== PREP FOLLOWUP HANDLER DEBUG ===');
    console.log('e.parameter:', JSON.stringify(e.parameter));
    
    const action = safeGetParameter(e, 'action', 'add');
    console.log('Action:', action);
    
    switch (action) {
      case 'getVisitDates':
        const uidForVisits = safeGetParameter(e, 'uid');
        console.log('GetVisitDates - UID:', uidForVisits);
        
        if (!uidForVisits) {
          return addCorsHeaders(
            ContentService.createTextOutput(JSON.stringify({
              status: 'error',
              message: 'UID is required for getVisitDates'
            })).setMimeType(ContentService.MimeType.JSON)
          );
        }
        
        try {
          const availableVisits = getAvailableVisitDates(uidForVisits);
          console.log('Available visits found:', availableVisits);
          
          return addCorsHeaders(
            ContentService.createTextOutput(JSON.stringify({
              status: 'success',
              availableVisits: availableVisits
            })).setMimeType(ContentService.MimeType.JSON)
          );
        } catch (error) {
          console.error('Error in getVisitDates:', error);
          return addCorsHeaders(
            ContentService.createTextOutput(JSON.stringify({
              status: 'error',
              message: 'Error getting visit dates: ' + error.toString()
            })).setMimeType(ContentService.MimeType.JSON)
          );
        }
      
      case 'prefill':
        const uid = safeGetParameter(e, 'uid');
        const visitDate = safeGetParameter(e, 'visitDate');
        console.log('Prefill - UID:', uid, 'VisitDate:', visitDate);
        return addCorsHeaders(
          ContentService.createTextOutput(JSON.stringify(getPrefillData(uid, visitDate)))
                 .setMimeType(ContentService.MimeType.JSON)
        );
      
      case 'update':
        console.log('Update request');
        return addCorsHeaders(
          ContentService.createTextOutput(JSON.stringify(updateRecord(e)))
                 .setMimeType(ContentService.MimeType.JSON)
        );
      
      case 'delete':
        const deleteUid = safeGetParameter(e, 'uid');
        const deleteVisitDate = safeGetParameter(e, 'visitDate');
        console.log('Delete - UID:', deleteUid, 'VisitDate:', deleteVisitDate);
        return addCorsHeaders(
          ContentService.createTextOutput(JSON.stringify(deleteRecord(deleteUid, deleteVisitDate)))
                 .setMimeType(ContentService.MimeType.JSON)
        );
      
      default: // 'add' or no action
        console.log('Add new record request');
        return addCorsHeaders(
          ContentService.createTextOutput(JSON.stringify(addNewRecord(e)))
                 .setMimeType(ContentService.MimeType.JSON)
        );
    }
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return addCorsHeaders(
      ContentService.createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: 'Server error: ' + error.toString(),
        stack: error.stack
      })).setMimeType(ContentService.MimeType.JSON)
    );
  }
}

// Get the sheet - CHANGE 'Sheet1' to your actual sheet name if different
function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
}

// Get all data from sheet
function fetchAllData() {
  return getSheet().getDataRange().getValues();
}

// Find record by UID and visit date
function fetchByUidAndVisitDate(uid, visitDate) {
  if (!uid || !visitDate) return null;
  
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) {
    // Column 0 = uid, Column 1 = date
    if (data[i][0]?.toString().toLowerCase() === uid.toLowerCase() && 
        data[i][1]?.toString() === visitDate) {
      return { rowData: data[i], rowNumber: i + 1 };
    }
  }
  return null;
}

// Find record by UID only (first match)
function fetchByUid(uid) {
  if (!uid) return null;
  
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) {
    // Column 0 = uid
    if (data[i][0]?.toString().toLowerCase() === uid.toLowerCase()) {
      return { rowData: data[i], rowNumber: i + 1 };
    }
  }
  return null;
}

// Check if data exists for UID
function checkIfDataExists(uid) {
  if (!uid) return false;
  const data = fetchByUid(uid);
  return data !== null;
}

// Get list of visit dates that have data for UID
function getAvailableVisitDates(uid) {
  console.log('getAvailableVisitDates called with UID:', uid);
  
  if (!uid) {
    console.log('No UID provided');
    return [];
  }
  
  try {
    const data = fetchAllData();
    const visitDates = [];
    
    console.log('Total rows in sheet:', data.length);
    
    for (let i = 1; i < data.length; i++) {
      const rowUid = data[i][0]?.toString().toLowerCase();
      const currentUid = uid.toLowerCase();
      
      if (rowUid === currentUid) {
        const visitDate = data[i][1]?.toString(); // date column (column 1)
        console.log('Found matching UID at row', i, 'with date:', visitDate);
        
        if (visitDate && !visitDates.includes(visitDate)) {
          visitDates.push(visitDate);
        }
      }
    }
    
    console.log('Final visit dates for', uid, ':', visitDates);
    return visitDates.sort().reverse(); // Sort newest first
  } catch (error) {
    console.error('Error in getAvailableVisitDates:', error);
    return [];
  }
}

// Column mapping based on your provided headers
function getColumnMapping() {
  return {
    0: 'uid',
    1: 'Date',
    2: 'PrEP_site',
    3: 'TYPE_OF_VISIT',
    4: 'INTERVIEWERS_NAME',
    5: 'DESIGNATION',
    6: 'BMHC_Number',
    7: 'STATUS_OF_THE_INTERVIEW',
    8: '1_1_Current_occupation_status',
    9: 'other',
    10: '1_2_What_is_your_current_marital_status',
    11: 'other_1_2',
    12: '1_3_Do_you_currently_live_with_your_sex_partner',
    13: '1_4_If_so_is_your_sex_partner_male_female_or_TG',
    14: '2_1_In_general_to_what_extent_do_you_consider_yourself_at_risk_of_getting_STI',
    15: '2_2_In_general_to_what_extent_do_you_consider_yourself_at_risk_of_getting_HIV',
    16: '2_3_Do_you_know_the_HIV_status_of_your_partners',
    17: 'Steady_partners_2_3',
    18: 'Casual_Partners_2_3',
    19: 'Transactional_partners_2_3',
    20: '3_1_Can_you_tell_the_number_of_various_partners_you_had_anal_sex_with_in_the_last_one_month',
    21: 'Steady_partners_3_1',
    22: 'Casual_Partners_3_1',
    23: 'Transactional_partners_3_1',
    24: '3_2_Can_you_tell_the_number_of_various_partners_you_had_vaginal_sex_with_in_the_last_one_month',
    25: '3_3_What_days_in_the_last_week_did_you_have_sex_with_your_regular_partners',
    26: '3_4_In_the_last_week_how_often_did_you_use_condom_with_your_regular_clients',
    27: '3_5_Tell_me_about_your_last_sex_Were_condoms_used_the_last_time_you_had_sex_with_regular_partners',
    28: '3_6_Tell_me_about_your_clients_Do_you_have_clients',
    29: '3_7_Approximately_how_many_clients_did_you_have_last_week',
    30: '3_8_What_days_in_the_last_week_did_you_have_sex_with_your_clients',
    31: '3_9_In_the_last_week_how_do_you_describe_your_condom_use_while_having_sex_with_your_clients',
    32: '3_10_Tell_me_about_your_last_sex_Were_condoms_used_the_last_time_you_had_sex_with_clients',
    33: '3_11_What_were_the_reasons_of_you_having_sex_without_condom',
    34: 'others_3_11',
    35: '3_12_Do_you_think_PrEP_has_changed_your_condom_use',
    36: '4_1_Which_dosing_regimen_was_prescribed_to_you_in_your_previous_visit',
    37: '4_2_Did_you_change_this_regimen_after_the_visit',
    38: '4_3_If_yes_why_did_you_change_the_dosing_Please_explain_the_reason_for_changing',
    39: 'Nausea',
    40: 'Ongoing_Nausea',
    41: 'Resolved_Nausea',
    42: 'Vomiting',
    43: 'Ongoing_Vomiting',
    44: 'Resolved_Vomiting',
    45: 'Fatigue',
    46: 'Ongoing_Fatigue',
    47: 'Resolved_Fatigue',
    48: 'Dizziness',
    49: 'Ongoing_Dizziness',
    50: 'Resolved_Dizziness',
    51: 'Headache',
    52: 'Ongoing_Headache',
    53: 'Resolved_Headache',
    54: 'Rash',
    55: 'Ongoing_Rash',
    56: 'Resolved_Rash',
    57: 'Abdominal_pain',
    58: 'Ongoing_Abdominal_pain',
    59: 'Resolved_Abdominal_pain',
    60: 'Weight_loss',
    61: 'Ongoing_Weight_loss',
    62: 'Resolved_Weight_loss',
    63: 'No_response',
    64: 'Other_symptoms',
    65: 'Others_Please_specify',
    66: '5_1_Which_reason_best_applies_to_why_you_are_on_daily_PrEP',
    67: '5_1_other',
    68: '5_a_1_which_days_you_missed_day1',
    69: '5_a_1_Day2',
    70: '5_a_1_Day3',
    71: '5_a_1_Day4',
    72: '5_a_1_Day5',
    73: '5_a_1_Day6',
    74: '5_a_1_Day7',
    75: '5_a_2_In_the_past_month_what_time_of_the_day_do_you_typically_take_your_pill',
    76: '5_a_2_other',
    77: '5_a_3_In_the_past_month_how_often_did_you_take_your_pill_at_about_the_same_time_each_day',
    78: '5_a_4_In_the_past_month_what_has_helped_you_remember_to_take_your_pill',
    79: 'Other_Specify_5_a_4',
    80: '5_a_5_Different_circumstances_may_prevent_participants_from_taking_their_pill_daily',
    81: '5_a_5_other',
    82: '5_a_6_In_the_past_month_what_is_the_longest_number_of_days_in_a_row_during_which_you_did_not_take_your_pill',
    83: '5_a_7_In_the_past_month_how_many_days_in_total_did_you_not_could_not_take_the_pill',
    84: '6_1_Approximately_how_many_times_did_you_have_sex_with_a_male_partners_in_the_last_month',
    85: '6_1_other',
    86: '6_a_1_Approximately_how_many_times_did_you_have_sex_with_a_male_partners_in_the_last_month',
    87: '6_a_2_Approximately_how_many_times_or_percentage_of_times_did_you_take_PrEP_tablets_before_having_sex_in_the_last_1_month',
    88: '6_a_3_Approximately_how_many_times_or_percentage_of_times_did_you_take_PrEP_tablets_after_having_sex_in_the_last_1_month',
    89: '6_a_4_Approximately_how_many_times_or_percentage_of_times_did_you_take_your_1st_PrEP_tablet_after_having_sex_in_the_last_1_month',
    90: '6_a_5_Approximately_how_many_times_or_percentage_of_times_did_you_take_your_2nd_PrEP_tablet_after_having_sex_in_the_last_1_month',
    91: '6_a_6_Last_week_how_many_times_did_you_have_sex',
    92: '6_a_7_How_many_times_did_you_take_PrEP_before_the_sex',
    93: '6_a_8_Approximately_how_many_times_or_percentage_of_times_did_you_take_your_1st_PrEP_tablet_after_having_sex_in_the_last_1_week',
    94: '6_a_9_Approximately_how_many_times_or_percentage_of_times_did_you_take_your_2nd_PrEP_tablet_after_having_sex_in_the_last_1_week',
    95: '6_a_10_Which_one_of_the_statements_describes_your_PrEP_intake_prior_to_the_last_sex',
    96: '6_a_10_others',
    97: '6_a_11_Which_one_of_the_statements_describes_your_PrEP_intake_after_the_last_sex',
    98: '6_a_11_others',
    99: '7_1_In_the_past_month_what_has_helped_you_remember_to_take_your_pills_as_prescribed',
    100: '7_1_other',
    101: '7_2_Different_circumstances_may_prevent_persons_from_taking_their_pills_as_prescribed',
    102: '7_3_Think_about_your_experiences_in_the_past_month_and_please_tell_me_all_of_the_reasons_that_kept_you_from_taking_your_pills',
    103: '7_2_other',
    104: '8_1_How_easy_or_difficult_do_you_think_it_was_to_remember_to_take_your_pills_as_needed',
    105: '8_2_In_the_past_month_how_many_of_your_pills_did_you_give_away_exchange_trade_or_sell',
    106: '8_3_Who_did_you_give_away_exchange_trade_or_sell_your_pills_to',
    107: '8_3_other',
    108: '9_1_Have_you_visited_the_Pride_Bhutan_office_in_the_last_3_months_for_reasons_other_than_PrEP',
    109: '9_2_If_yes_was_it_for_HIV_testing',
    110: '9_3_If_yes_was_it_for_STI_testing',
    111: '9_4_If_other_reason_Please_specify',
    112: '9_5_How_many_times_were_you_met_by_an_Outreach_worker_ORW_in_the_field_in_the_last_1_months',
    113: '9_7_Have_you_received_any_condoms_from_HISC',
    114: '9_Have_you_received_any_lubricants_from_HISC',
    115: '10_1_Have_you_consumed_alcohol_in_the_last_3_months',
    116: '10_2_How_many_days_did_you_consume_alcohol_in_the_past_one_week',
    117: '10_3_The_last_time_you_had_sex_with_any_of_your_sexual_partners_did_you_consume_alcoholic_drinks_before_or_during_sex',
    118: '10_4_Have_you_taken_recreational_drugs_in_the_last_12_months',
    119: '10_5_The_last_time_you_had_sex_with_any_of_your_sexual_partners_did_you_take_recreational_drugs_before_or_during_sex',
    120: '11_1_Taking_PrEP_makes_me_feel_much_more_protected_against_HIV',
    121: '11_2_When_taking_PrEP_I_did_not_bother_too_much_about_other_STIs_since_treatment_for_them_is_available',
    122: '11_3_PrEP_is_provided_as_a_package_of_preventive_services_including_counseling_condoms_HIV_tests_and_other_blood_tests_What_do_you_think_of_this',
    123: '11_4_What_did_you_like_in_participating_in_this_PrEP_implementation_Phase_1',
    124: '11_4_other',
    125: '11_5_What_were_the_major_challenges_you_faced_while_participating_in_PrEP_Phase_1',
    126: '11_5_others',
    127: '11_6_How_would_you_like_PrEP_medicines_delivered_to_you_post_Phase_1_By_outreach_worker',
    128: '11_6_others',
    129: '11_7_How_satisfied_are_you_with_PrEP',
    130: '12_1_What_are_the_reasons_for_discontinuing_PrEP',
    131: '12_other'
  };
}

// Get prefill data for specific UID and visit date
function getPrefillData(uid, visitDate) {
  try {
    console.log('getPrefillData called - UID:', uid, 'VisitDate:', visitDate);
    
    let data;
    
    if (!visitDate) {
      // No visitDate provided, get first record for this UID
      data = fetchByUid(uid);
      if (!data) {
        return { 
          status: 'error', 
          message: `No follow-up data found for UID: ${uid}` 
        };
      }
    } else {
      // Specific visitDate provided
      data = fetchByUidAndVisitDate(uid, visitDate);
      if (!data) {
        return { 
          status: 'error', 
          message: `No follow-up data found for UID: ${uid} on ${visitDate}` 
        };
      }
    }

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
      } else if (fieldName.toLowerCase().includes('date')) {
        // Handle date fields
        if (value instanceof Date) {
          prefillObject[fieldName] = value.toISOString().split('T')[0];
        } else if (value) {
          const parsedDate = new Date(value);
          prefillObject[fieldName] = !isNaN(parsedDate) ? parsedDate.toISOString().split('T')[0] : '';
        } else {
          prefillObject[fieldName] = '';
        }
      } else if (fieldName.includes('Ongoing') || fieldName.includes('Resolved')) {
        // Handle boolean fields (Yes/No to true/false)
        prefillObject[fieldName] = value === 'Yes' || value === true || value === 'TRUE';
      } else {
        // Handle regular text fields
        prefillObject[fieldName] = value.toString().trim();
      }
    });

    console.log('Prefill object created:', JSON.stringify(prefillObject));
    return { 
      status: 'success', 
      data: prefillObject 
    };
  } catch (error) {
    console.error('Error in getPrefillData:', error);
    return { 
      status: 'error', 
      message: 'Error fetching data: ' + error.message 
    };
  }
}

// Create the row data array matching your spreadsheet column order exactly
function createRowData(e) {
  const columnMapping = getColumnMapping();
  const rowData = [];
  
  // Create array in the exact order of columns
  for (let i = 0; i < Object.keys(columnMapping).length; i++) {
    const fieldName = columnMapping[i];
    const value = safeGetParameter(e, fieldName, '');
    rowData.push(value);
  }
  
  return rowData;
}

// Add new record
function addNewRecord(e) {
  try {
    console.log('=== ADD NEW FOLLOWUP RECORD ===');
    
    const uid = safeGetParameter(e, 'uid');
    const visitDate = safeGetParameter(e, 'Date');
    console.log('Adding record for UID:', uid, 'Visit Date:', visitDate);
    
    if (!uid) {
      return { 
        status: 'error', 
        message: 'Missing UID - cannot create record' 
      };
    }
    
    // Check if this specific UID + date combination exists
    if (visitDate) {
      const existingData = fetchByUidAndVisitDate(uid, visitDate);
      if (existingData) {
        return { 
          status: 'error', 
          message: `Follow-up record already exists for UID: ${uid} on ${visitDate}. Use update instead.` 
        };
      }
    }

    const sheet = getSheet();
    const rowData = createRowData(e);
    console.log('New row data length:', rowData.length);
    console.log('New row data sample:', JSON.stringify(rowData.slice(0, 10)));

    // Add new row
    sheet.appendRow(rowData);
    
    console.log('✅ Record added successfully');
    return { 
      status: 'success', 
      message: `✅ Follow-up record created successfully for UID: ${uid}` 
    };
  } catch (error) {
    console.error('❌ Error in addNewRecord:', error);
    return { 
      status: 'error', 
      message: '❌ Error creating record: ' + error.message 
    };
  }
}

// Update existing record
function updateRecord(e) {
  try {
    console.log('=== UPDATE FOLLOWUP RECORD ===');
    
    const uid = safeGetParameter(e, 'uid');
    const visitDate = safeGetParameter(e, 'Date');
    console.log('Updating record for UID:', uid, 'Visit Date:', visitDate);
    
    if (!uid) {
      return { 
        status: 'error', 
        message: 'Missing UID - cannot update record' 
      };
    }
    
    // Look for specific UID + date combination if date provided
    let existingData;
    if (visitDate) {
      existingData = fetchByUidAndVisitDate(uid, visitDate);
      if (!existingData) {
        return { 
          status: 'error', 
          message: `Follow-up record for UID ${uid} on ${visitDate} not found - cannot update` 
        };
      }
    } else {
      // Fallback to first record for UID if no date provided
      existingData = fetchByUid(uid);
      if (!existingData) {
        return { 
          status: 'error', 
          message: `Follow-up record for UID ${uid} not found - cannot update` 
        };
      }
    }

    const sheet = getSheet();
    const rowNumber = existingData.rowNumber;
    const rowData = createRowData(e);
    
    console.log('Updating row:', rowNumber);
    console.log('Updated row data length:', rowData.length);
    console.log('Updated row data sample:', JSON.stringify(rowData.slice(0, 10)));

    // Update the entire row
    sheet.getRange(rowNumber, 1, 1, rowData.length).setValues([rowData]);
    
    console.log('✅ Record updated successfully');
    return { 
      status: 'success', 
      message: `✅ Follow-up record updated successfully for UID: ${uid}` 
    };
  } catch (error) {
    console.error('❌ Error in updateRecord:', error);
    return { 
      status: 'error', 
      message: '❌ Error updating record: ' + error.message 
    };
  }
}

// Delete record
function deleteRecord(uid, visitDate) {
  try {
    console.log('=== DELETE FOLLOWUP RECORD ===');
    console.log('Deleting record for UID:', uid, 'Visit Date:', visitDate);
    
    if (!uid) {
      return { 
        status: 'error', 
        message: 'Missing UID - cannot delete record' 
      };
    }
    
    // Look for specific UID + date combination if date provided
    let data;
    if (visitDate) {
      data = fetchByUidAndVisitDate(uid, visitDate);
      if (!data) {
        return { 
          status: 'error', 
          message: `Follow-up record for UID ${uid} on ${visitDate} not found - cannot delete` 
        };
      }
    } else {
      // Fallback to first record for UID if no date provided
      data = fetchByUid(uid);
      if (!data) {
        return { 
          status: 'error', 
          message: `Follow-up record for UID ${uid} not found - cannot delete` 
        };
      }
    }

    const sheet = getSheet();
    console.log('Deleting row:', data.rowNumber);
    
    // Delete the entire row
    sheet.deleteRow(data.rowNumber);
    
    console.log('✅ Record deleted successfully');
    return { 
      status: 'success', 
      message: `✅ Follow-up record deleted successfully for UID: ${uid}` 
    };
  } catch (error) {
    console.error('❌ Error in deleteRecord:', error);
    return { 
      status: 'error', 
      message: '❌ Error deleting record: ' + error.message 
    };
  }
}

// Test function
function testScript() {
  console.log('=== TESTING FOLLOWUP SCRIPT ===');
  
  try {
    const sheet = getSheet();
    console.log('✅ Sheet access: OK');
    console.log('Sheet name:', sheet.getName());
    
    const data = fetchAllData();
    console.log('✅ Data fetch: OK');
    console.log('Total rows:', data.length);
    console.log('Total columns:', data[0]?.length || 0);
    
    if (data.length > 1) {
      console.log('First data row UID:', data[1][0]);
      const testUid = data[1][0];
      
      if (testUid) {
        const exists = checkIfDataExists(testUid);
        console.log('✅ Check exists: OK -', exists);
        
        const visitDates = getAvailableVisitDates(testUid);
        console.log('✅ Available visit dates:', visitDates);
        
        const prefillData = getPrefillData(testUid, visitDates[0]);
        console.log('✅ Prefill data: OK -', prefillData.status);
      }
    }
    
    console.log('✅ All tests passed!');
    return '✅ Script is working correctly!';
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return '❌ Script test failed: ' + error.message;
  }
}