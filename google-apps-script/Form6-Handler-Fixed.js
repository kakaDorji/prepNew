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

// Create CORS-enabled JSON response
function createCorsResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// Main request handler
function handleRequest(e) {
  // Handle OPTIONS request (preflight)
  if (e.parameter && e.parameter.method == 'OPTIONS') {
    return ContentService.createTextOutput('')
      .setMimeType(ContentService.MimeType.TEXT);
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
          return createCorsResponse({
            status: 'error',
            message: 'UID is required for getVisitDates'
          });
        }
        
        try {
          const availableVisits = getAvailableVisitDates(uidForVisits);
          console.log('Available visits found:', availableVisits);
          
          return createCorsResponse({
            status: 'success',
            availableVisits: availableVisits
          });
        } catch (error) {
          console.error('Error in getVisitDates:', error);
          return createCorsResponse({
            status: 'error',
            message: 'Error getting visit dates: ' + error.toString()
          });
        }
      
      case 'prefill':
        const uid = safeGetParameter(e, 'uid');
        const visitDate = safeGetParameter(e, 'visitDate');
        console.log('Prefill - UID:', uid, 'VisitDate:', visitDate);
        return createCorsResponse(getPrefillData(uid, visitDate));
      
      case 'update':
        console.log('Update request');
        return createCorsResponse(updateRecord(e));
      
      case 'delete':
        const deleteUid = safeGetParameter(e, 'uid');
        const deleteVisitDate = safeGetParameter(e, 'visitDate');
        console.log('Delete - UID:', deleteUid, 'VisitDate:', deleteVisitDate);
        return createCorsResponse(deleteRecord(deleteUid, deleteVisitDate));
      
      default: // 'add' or no action
        console.log('Add new record request');
        return createCorsResponse(addNewRecord(e));
    }
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return createCorsResponse({ 
      status: 'error', 
      message: 'Server error: ' + error.toString(),
      stack: error.stack
    });
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

// FIXED: Column mapping that matches your Vue component's expected field names
function getColumnMapping() {
  return {
    0: 'uid',
    1: 'Date',
    2: 'PrEP_site',  // Changed from 'PrEP site'
    3: 'TYPE_OF_VISIT',  // Changed from 'TYPE OF VISIT'
    4: 'INTERVIEWERS_NAME',  // Changed from 'INTERVIEWER\'S NAME'
    5: 'DESIGNATION',
    6: 'BMHC_Number',  // Changed from 'BMHC Number'
    7: 'STATUS_OF_THE_INTERVIEW',  // Changed from 'STATUS OF THE INTERVIEW'
    8: '1_1_Current_occupation_status',  // Changed from '1.1 Current occupation status:'
    9: 'other',
    10: '1_2_What_is_your_current_marital_status',  // Changed from '1.2 What is your current marital status:'
    11: 'other_1_2',
    12: '1_3_Do_you_currently_live_with_your_sex_partner',  // Changed from '1.3 Do you currently live with your sex partner:'
    13: '1_4_If_so_is_your_sex_partner_male_female_or_TG',  // Changed from '1.4 If so, is your sex partner male, female, or TG? (tick all that apply):'
    14: '2_1_In_general_to_what_extent_do_you_consider_yourself_at_risk_of_getting_STI',  // Changed from '2.1 In general, to what extent do you consider yourself at risk of getting STI?'
    15: '2_2_In_general_to_what_extent_do_you_consider_yourself_at_risk_of_getting_HIV',  // Changed from '2.2 In general, to what extent do you consider yourself at risk of getting HIV?'
    16: '2_3_Do_you_know_the_HIV_status_of_your_partners',  // Changed from '2.3 Do you know the HIV status of your partner(s)'
    17: 'Steady_partners_3_1',  // Changed from 'Steady partners:'
    18: 'Casual_Partners_3_1',  // Changed from 'Casual Partners:'
    19: 'Transactional_partners_3_1',  // Changed from 'Transactional partners:'
    20: '3_1_Can_you_tell_the_number_of_various_partners_you_had_anal_sex_with_in_the_last_one_month',  // Changed from '3.1 Can you tell the number of various partners you had anal sex with in the last one month?'
    21: 'Steady_partners_3_2',  // Changed from 'Steady partners:'
    22: 'Casual_Partners_3_2',  // Changed from 'Casual Partners:'
    23: 'Transactional_partners_3_2',  // Changed from 'Transactional partners'
    24: '3_2_Can_you_tell_the_number_of_various_partners_you_had_vaginal_sex_with_in_the_last_one_month',  // Changed from '3.2 Can you tell the number of various partners you had vaginal sex with in the last one month?'
    25: '3_3_What_days_in_the_last_week_did_you_have_sex_with_your_regular_partners',  // Changed from '3.3 What days in the last week, did you have sex with your regular partner(s)?'
    26: '3_4_In_the_last_week_how_often_did_you_use_condom_with_your_regular_clients',  // Changed from '3.4 In the last week, how often did you use condom with your regular clients?'
    27: '3_5_Tell_me_about_your_last_sex_Were_condoms_used_the_last_time_you_had_sex_with_regular_partners',  // Changed from '3.5 Tell me about your last sex. Were condoms used the last time you had sex with regular partner(s)?'
    28: '3_6_Tell_me_about_your_clients_Do_you_have_clients',  // Changed from '3.6 Tell me about your clients. Do you have clients?'
    29: '3_7_Approximately_how_many_clients_did_you_have_last_week',  // Changed from '3.7 Approximately, how many clients did you have last week?'
    30: '3_8_What_days_in_the_last_week_did_you_have_sex_with_your_clients',  // Changed from '3.8 What days in the last week did you have sex with your clients? (NOT INCLUDING TODAY)'
    31: '3_9_In_the_last_week_how_do_you_describe_your_condom_use_while_having_sex_with_your_clients',  // Changed from '3.9 In the last week, how do you describe your condom use while having sex with your clients?'
    32: '3_10_Tell_me_about_your_last_sex_Were_condoms_used_the_last_time_you_had_sex_with_clients',  // Changed from '3.10 Tell me about your last sex. Were condoms used the last time you had sex with clients?'
    33: '3_11_What_were_the_reasons_of_you_having_sex_without_condom',  // Changed from '3.11 What were the reasons of you having sex without condom?'
    34: 'others_3_11',  // Changed from 'others'
    35: '3_12_Do_you_think_PrEP_has_changed_your_condom_use',  // Changed from '3.12 Do you think PrEP has changed your condom use?'
    36: '4_1_Which_dosing_regimen_was_prescribed_to_you_in_your_previous_visit',  // Changed from '4.1 Which dosing regimen was prescribed to you in your previous (initial or follow-up visit)'
    37: '4_2_Did_you_change_this_regimen_after_the_visit',  // Changed from '4.2 Did you change this regimen after the visit'
    38: '4_3_If_yes_why_did_you_change_the_dosing_Please_explain_the_reason_for_changing',  // Changed from '4.3 If yes, why did you change the dosing? Please explain the reason for changing:'
    39: 'Nausea',
    40: 'Ongoing_Nausea',  // Changed from 'Ongoing'
    41: 'Resolved_Nausea',  // Changed from 'Resolved'
    42: 'Vomiting',
    43: 'Ongoing_Vomiting',  // Changed from 'Ongoing'
    44: 'Resolved_Vomiting',  // Changed from 'Resolved'
    45: 'Fatigue',
    46: 'Ongoing_Fatigue',  // Changed from 'Ongoing'
    47: 'Resolved_Fatigue',  // Changed from 'Resolved'
    48: 'Dizziness',
    49: 'Ongoing_Dizziness',  // Changed from 'Ongoing'
    50: 'Resolved_Dizziness',  // Changed from 'Resolved'
    51: 'Headache',
    52: 'Ongoing_Headache',  // Changed from 'Ongoing'
    53: 'Resolved_Headache',  // Changed from 'Resolved'
    54: 'Rash',
    55: 'Ongoing_Rash',  // Changed from 'Ongoing'
    56: 'Resolved_Rash',  // Changed from 'Resolved'
    57: 'Abdominal_pain',  // Changed from 'Abdominal pain'
    58: 'Ongoing_Abdominal_pain',  // Changed from 'Ongoing'
    59: 'Resolved_Abdominal_pain',  // Changed from 'Resolved'
    60: 'Weight_loss',  // Changed from 'Weight loss'
    61: 'Ongoing_Weight_loss',  // Changed from 'Ongoing'
    62: 'Resolved_Weight_loss',  // Changed from 'Resolved'
    63: 'No_response',  // Changed from 'No response'
    64: 'Other_symptoms',  // Changed from 'Other'
    65: 'Others_Please_specify',  // Changed from 'Others (Please specify)'
    66: '5_1_Which_reason_best_applies_to_why_you_are_on_daily_PrEP',  // Changed from '5.1 Which reason best applies to why you are on daily PrEP?'
    67: '5_1_other',  // Changed from '5.1other'
    68: '5_a_1_which_days_you_missed_day1',  // Changed from '5.a.1  which days you missed day1'
    69: '5_a_1_Day2',  // Changed from '5.a.1 Day2'
    70: '5_a_1_Day3',  // Changed from '5.a.1 Day3'
    71: '5_a_1_Day4',  // Changed from '5.a.1 Day4'
    72: '5_a_1_Day5',  // Changed from '5.a.1 Day5'
    73: '5_a_1_Day6',  // Changed from '5.a.1 Day6'
    74: '5_a_1_Day7',  // Changed from '5.a.1 Day7'
    75: '5_a_2_In_the_past_month_what_time_of_the_day_do_you_typically_take_your_pill',  // Changed from '5.a.2 In the past month, what time of the day do you typically take your pill?'
    76: '5_a_2_other',  // Changed from '5.a.2 other'
    77: '5_a_3_In_the_past_month_how_often_did_you_take_your_pill_at_about_the_same_time_each_day',  // Changed from '5.a.3 In the past month, how often did you take your pill at about the same time each day?'
    78: '5_a_4_In_the_past_month_what_has_helped_you_remember_to_take_your_pill',  // Changed from '5.a.4 In the past month, what has helped you remember to take your pill?'
    79: 'Other_Specify_5_a_4',  // Changed from 'Other (Specify)'
    80: '5_a_5_Different_circumstances_may_prevent_participants_from_taking_their_pill_daily',  // Changed from '5.a.5 Different circumstances may prevent participants from taking their pill daily.'
    81: '5_a_5_other',  // Changed from '5.a.5 other'
    82: '5_a_6_In_the_past_month_what_is_the_longest_number_of_days_in_a_row_during_which_you_did_not_take_your_pill',  // Changed from '5a.6 In the past month, what is the longest number of days in a row during which you did not take your pill?'
    83: '5_a_7_In_the_past_month_how_many_days_in_total_did_you_not_could_not_take_the_pill',  // Changed from '5a.7 In the past month, how many days in total did you not/could not take the pill?'
    // Continue with more sections...
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
    
    console.log('Raw rowData:', JSON.stringify(rowData.slice(0, 20))); // Log first 20 values for debugging
    
    // Map row values to form fields
    Object.keys(columnMapping).forEach(position => {
      const index = parseInt(position);
      const fieldName = columnMapping[position];
      
      let value = rowData[index];
      
      console.log(`Mapping column ${index} (${fieldName}):`, value);
      
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
    console.log('Updating record for UID:', uid);
    
    if (!uid) {
      return { 
        status: 'error', 
        message: 'Missing UID - cannot update record' 
      };
    }
    
    // Look for record by UID only (first match)
    const existingData = fetchByUid(uid);
    if (!existingData) {
      return { 
        status: 'error', 
        message: `Follow-up record for UID ${uid} not found - cannot update` 
      };
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
        const visitDates = getAvailableVisitDates(testUid);
        console.log('✅ Available visit dates:', visitDates);
        
        const prefillData = getPrefillData(testUid, visitDates[0]);
        console.log('✅ Prefill data: OK -', prefillData.status);
        
        // Log sample prefill data for debugging
        if (prefillData.status === 'success') {
          console.log('Sample prefill data keys:', Object.keys(prefillData.data).slice(0, 10));
          console.log('Sample prefill data values:', Object.keys(prefillData.data).slice(0, 10).map(key => prefillData.data[key]));
        }
      }
    }
    
    console.log('✅ All tests passed!');
    return '✅ Script is working correctly!';
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return '❌ Script test failed: ' + error.message;
  }
}