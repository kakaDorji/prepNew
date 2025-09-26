function doGet(e) {
  // Called when a GET request is made to your web app
  return handleRequest(e);
}

function doPost(e) {
  // Called when a POST request is made to your web app
  return handleRequest(e);
}

// === Sheet Helpers ===
function getSheet() {
  // Get the specific Google Sheet named "Sheet1"
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
}

// === Column Header Mapping ===
// Map Google Sheet headers to Vue.js form field names
function getHeaderMapping() {
  return {
    // Basic fields
    'participant_uid': 'participant_uid',
    'date': 'date', 
    'visit_type': 'visit_type',
    
    // Acute HIV symptoms
    'fever': 'fever',
    'fever_specify': 'fever_specify',
    'fever_start_date': 'fever_start_date',
    'fever_ongoing': 'fever_ongoing',
    'fever_resolved': 'fever_resolved',
    'fever_present': 'fever_present',
    
    'tiredness': 'tiredness',
    'tiredness_specify': 'tiredness_specify', 
    'tiredness_start_date': 'tiredness_start_date',
    'tiredness_ongoing': 'tiredness_ongoing',
    'tiredness_resolved': 'tiredness_resolved',
    'tiredness_present': 'tiredness_present',
    
    'lymph_node': 'lymph_node',
    'lymph_node_specify': 'lymph_node_specify',
    'lymph_node_start_date': 'lymph_node_start_date', 
    'lymph_node_ongoing': 'lymph_node_ongoing',
    'lymph_node_resolved': 'lymph_node_resolved',
    'lymph_node_present': 'lymph_node_present',
    
    'tonsilitis': 'tonsilitis',
    'tonsilitis_specify': 'tonsilitis_specify',
    'tonsilitis_start_date': 'tonsilitis_start_date',
    'tonsilitis_ongoing': 'tonsilitis_ongoing', 
    'tonsilitis_resolved': 'tonsilitis_resolved',
    'tonsilitis_present': 'tonsilitis_present',
    
    'sore_throat': 'sore_throat',
    'sore_throat_specify': 'sore_throat_specify',
    'sore_throat_start_date': 'sore_throat_start_date',
    'sore_throat_ongoing': 'sore_throat_ongoing',
    'sore_throat_resolved': 'sore_throat_resolved', 
    'sore_throat_present': 'sore_throat_present',
    
    'joint_aches': 'joint_aches',
    'joint_aches_specify': 'joint_aches_specify',
    'joint_aches_start_date': 'joint_aches_start_date',
    'joint_aches_ongoing': 'joint_aches_ongoing',
    'joint_aches_resolved': 'joint_aches_resolved',
    'joint_aches_present': 'joint_aches_present',
    
    'diarrhoea': 'diarrhoea',
    'diarrhoea_specify': 'diarrhoea_specify',
    'diarrhoea_start_date': 'diarrhoea_start_date',
    'diarrhoea_ongoing': 'diarrhoea_ongoing',
    'diarrhoea_resolved': 'diarrhoea_resolved',
    'diarrhoea_present': 'diarrhoea_present',
    
    'rash': 'rash',
    'rash_specify': 'rash_specify',
    'rash_start_date': 'rash_start_date',
    'rash_ongoing': 'rash_ongoing',
    'rash_resolved': 'rash_resolved',
    'rash_present': 'rash_present',
    
    'other_symptoms': 'other_symptoms',
    'other_symptoms_specify': 'other_symptoms_specify',
    'other_symptoms_start_date': 'other_symptoms_start_date',
    'other_symptoms_ongoing': 'other_symptoms_ongoing',
    'other_symptoms_resolved': 'other_symptoms_resolved',
    'other_symptoms_present': 'other_symptoms_present',
    
    'recent_hiv_exposure': 'recent_hiv_exposure',
    'describe_exposure': 'describe_exposure',
    
    // STI Management - Map sheet headers to form fields
    'vaginal_discharge': 'vaginal_discharge',
    'vaginal_discharge_start_date': 'vaginal_discharge_start_date',
    'vaginal_discharge_specify': 'vaginal_discharge_specify',
    'vaginal_discharge_treatment': 'vaginal_discharge_treatment',
    
    'Lower Abdominal Pain': 'lower_abdominal_pain',
    'lower_abdominal_pain_start_date': 'lower_abdominal_pain_start_date',
    'lower_abdominal_pain_specify': 'lower_abdominal_pain_specify', 
    'lower_abdominal_pain_treatment': 'lower_abdominal_pain_treatment',
    
    'Anorectal discharge': 'anorectal_discharge',
    'anorectal_discharge_start_date': 'anorectal_discharge_start_date',
    'anorectal_discharge_specify': 'anorectal_discharge_specify',
    'anorectal_discharge_treatment': 'anorectal_discharge_treatment',
    
    'Genital/anal sore/blister/warts': 'genital_sore',
    'genital_sore_start_date': 'genital_sore_start_date',
    'genital_sore_specify': 'genital_sore_specify', 
    'genital_sore_treatment': 'genital_sore_treatment',
    
    'Pain/burning with urination': 'pain_with_urination',
    'pain_with_urination_start_date': 'pain_with_urination_start_date',
    'pain_with_urination_specify': 'pain_with_urination_specify',
    'pain_with_urination_treatment': 'pain_with_urination_treatment',
    
    'Swelling in the groin': 'swelling_in_groin',
    'swelling_in_groin_start_date': 'swelling_in_groin_start_date',
    'swelling_in_groin_specify': 'swelling_in_groin_specify',
    'swelling_in_groin_treatment': 'swelling_in_groin_treatment',
    
    'rash_data_resolved': 'rash_data_resolved',
    'rash_data_resolved_start_date': 'rash_data_resolved_start_date',
    'rash_data_resolved_specify': 'rash_data_resolved_specify',
    'rash_data_resolved_treatment': 'rash_data_resolved_treatment',
    
    'Other (Specify)': 'oth_symptoms',
    'oth_symptoms_start_date': 'oth_symptoms_start_date',
    'oth_symptoms_specify': 'oth_symptoms_specify',
    'oth_symptoms_treatment': 'oth_symptoms_treatment',
    
    // Clinical Findings
    '3.Acute HIV': 'acute_hiv_specify',
    'STI': 'sti_specify',
    'other_specify': 'other_specify',
    
    // Disease History
    '4. Do you currently have, or had in the past, any kidney disease, diabetes, hypertension, or thyroid problem?': 'disease_history',
    'If yes, please specify': 'disease_specify',
    'Are you currently on any medications, including traditional or alternative medications?': 'current_medications',
    'medication_specify': 'medication_specify',
    'Are you allergic to any medications?': 'medication_allergies',
    'allergy_specify': 'allergy_specify',
    
    // Test Results - Map sheet headers to form field names
    '3rd_Hiv_test_date': 'hiv_rapid_sample_date',
    '4th_Hiv_test_date': 'hiv_4th_sample_date', 
    'hepatitis_test_date': 'hepatitis_b_sample_date',
    'hepatitis_C_test_date': 'hepatitis_C_sample_date',
    'syphilis_test_date': 'syphilis_sample_date',
    'kidney_test_date': 'kidney_function_sample_date',
    'gonorrhoea_test_date': 'gonorrhoea_sample_date',
    
    // Assessment & Dispensing
    'Assessment Notes:': 'assessment_notes',
    'PrEP dispensed': 'prep_dispensed',
    'prep regimen': 'regimen_for_prep',
    'Number of dispensed bottles': 'prep_bottles',
    'clinician_information_date': 'clinician_information_date',
    'Clinician Name': 'clinician_name',
    'Designation': 'designation',
    'BHMC Registration': 'bhmc_registration'
  };
}

function fetchAllData() {
  // Fetch all rows and columns from the sheet
  const sheet = getSheet();
  return sheet.getDataRange().getValues(); // returns 2D array
}

function fetchById(id) {
  // Find a row by UID in the first column
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) { // start from 1 to skip header
    if (data[i][0] == id) {
      return data[i]; // return the entire row
    }
  }
  return null; // UID not found
}

// === Main Request Handler ===
function handleRequest(e) {
  const sheet = getSheet();
  const data = e.parameter || {}; // form data sent from frontend
  const callback = data.callback || ''; // optional for JSONP
  delete data.callback; // remove callback from data

  try {
    const allData = fetchAllData();
    const headers = allData[0]; // first row contains column names
    let foundRow = -1;

    // 🔎 Check if UID exists in the first column
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] == data.participant_uid) {
        foundRow = i + 1; // actual row number in Google Sheets
        break;
      }
    }

    // === Prefill Request (GET request or action=getPrefillData) ===
    if (data.action === 'getPrefillData' || e.parameters.action === 'getPrefillData') {
      if (foundRow !== -1) {
        const existingData = {};
        const headerMapping = getHeaderMapping();
        
        headers.forEach((sheetHeader, idx) => {
          const cellValue = allData[foundRow - 1][idx];
          
          // Find the corresponding Vue.js field name
          const vueFieldName = headerMapping[sheetHeader] || sheetHeader;
          
          // Convert the cell value properly
          let convertedValue;
          if (cellValue instanceof Date) {
            convertedValue = cellValue.toISOString().split('T')[0]; // Convert date to YYYY-MM-DD
          } else if (cellValue === true || cellValue === false) {
            convertedValue = cellValue ? 'Yes' : 'No'; // Convert boolean to Yes/No
          } else {
            convertedValue = cellValue || ''; // Use empty string for null/undefined
          }
          
          // Use the Vue.js field name as the key
          existingData[vueFieldName] = convertedValue;
        });
        
        Logger.log("UID found! Row data:");
        Logger.log(allData[foundRow - 1]);
        Logger.log("Sheet headers:");
        Logger.log(headers);
        Logger.log("Mapped prefill data being sent:");
        Logger.log(existingData);
        
        return sendResponse(callback, { 
          status: 'success', 
          prefill: existingData,
          rowData: allData[foundRow - 1], // Also send raw row data for debugging
          headers: headers // Send headers for debugging
        });
      } else {
        return sendResponse(callback, { 
          status: 'error', 
          message: 'UID not found',
          prefill: {} 
        });
      }
    }

    // === Form Submission (POST request with data) ===
    if (Object.keys(data).length > 1 && data.participant_uid) { // More than just UID means it's a submission
      // Build row values in the same order as headers
      const rowValues = headers.map(h => {
        const value = data[h] || "";
        // Convert Yes/No back to boolean if needed
        if (value === 'Yes') return true;
        if (value === 'No') return false;
        return value;
      });

      if (foundRow !== -1) {
        // ✅ Update existing row
        sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
        return sendResponse(callback, { status: 'success', message: 'Record updated successfully' });
      } else {
        // ✅ Append new row
        sheet.appendRow(rowValues);
        return sendResponse(callback, { status: 'success', message: 'Record created successfully' });
      }
    }

    // === Just checking UID existence ===
    if (foundRow !== -1) {
      return sendResponse(callback, { 
        status: 'success', 
        message: 'UID found',
        rowData: allData[foundRow - 1]
      });
    } else {
      return sendResponse(callback, { 
        status: 'error', 
        message: 'UID not found' 
      });
    }

  } catch (err) {
    Logger.log("Error in handleRequest: " + err.toString());
    // Catch any error and return JSON with error message
    return sendResponse(callback, { status: 'error', message: err.toString() });
  }
}

// === Response Helper ===
function sendResponse(callback, obj) {
  // Returns JSON or JSONP if a callback is provided
  if (callback) {
    // JSONP format
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(obj) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // Standard JSON format
    return ContentService.createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function testFetchByUid() {
  const testUid = "THI0009"; // replace with the UID you want to test
  const data = fetchById(testUid);

  if (data) {
    Logger.log("UID found! Row data:");
    Logger.log(data);
  } else {
    Logger.log("UID not found in Sheet1.");
  }
}

// Test function for prefill
function testPrefillData() {
  const testParams = {
    parameter: {
      participant_uid: "THI0009",
      action: "getPrefillData"
    }
  };
  
  const result = handleRequest(testParams);
  Logger.log("Prefill test result:");
  Logger.log(result.getContent());
}