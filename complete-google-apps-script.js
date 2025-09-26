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

function fetchById(id) {
  const data = fetchAllData();
  for (let i = 1; i < data.length; i++) { // start from 1 to skip header
    if (data[i][0] == id) {
      return data[i]; // return the entire row
    }
  }
  return null; // UID not found
}

function handleRequest(e) {
  var sheet = getSheet();
  var data = e.parameter || {}; // Capture the form data
  var callback = data.callback || '';
  delete data.callback; // Remove callback from data to save

  try {
    // === VISIT-SPECIFIC DATA REQUEST ===
    // If this is a request for specific visit type data
    if (data.action === 'getVisitData' && data.participant_uid && data.visit_type) {
      const uid = data.participant_uid;
      const visitType = data.visit_type;
      const allData = fetchAllData();
      let foundRow = -1;

      // Check if UID + Visit Type combination exists
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] == uid && allData[i][2] == visitType) {
          foundRow = i;
          break;
        }
      }

      if (foundRow !== -1) {
        // Found existing data for this UID + Visit Type
        const rowData = allData[foundRow];
        
        // Map the row data to form fields (same as before)
        const prefillData = {
          participant_uid: rowData[0] || '',
          date: rowData[1] || '',
          visit_type: rowData[2] || '',
          
          // ... (all the same field mappings as before)
          fever: rowData[3] || '',
          fever_specify: rowData[4] || '',
          fever_start_date: rowData[5] || '',
          fever_ongoing: rowData[6] === true ? 'Yes' : (rowData[6] === false ? 'No' : ''),
          fever_resolved: rowData[7] === true ? 'Yes' : (rowData[7] === false ? 'No' : ''),
          fever_present: rowData[8] === true ? 'Yes' : (rowData[8] === false ? 'No' : ''),
          
          tiredness: rowData[9] || '',
          tiredness_specify: rowData[10] || '',
          tiredness_start_date: rowData[11] || '',
          tiredness_ongoing: rowData[12] === true ? 'Yes' : (rowData[12] === false ? 'No' : ''),
          tiredness_resolved: rowData[13] === true ? 'Yes' : (rowData[13] === false ? 'No' : ''),
          tiredness_present: rowData[14] === true ? 'Yes' : (rowData[14] === false ? 'No' : ''),
          
          // ... (continue with all other fields same as original prefillData)
          lymph_node: rowData[15] || '',
          lymph_node_specify: rowData[16] || '',
          lymph_node_start_date: rowData[17] || '',
          lymph_node_ongoing: rowData[18] === true ? 'Yes' : (rowData[18] === false ? 'No' : ''),
          lymph_node_resolved: rowData[19] === true ? 'Yes' : (rowData[19] === false ? 'No' : ''),
          lymph_node_present: rowData[20] === true ? 'Yes' : (rowData[20] === false ? 'No' : ''),
          
          tonsilitis: rowData[21] || '',
          tonsilitis_specify: rowData[22] || '',
          tonsilitis_start_date: rowData[23] || '',
          tonsilitis_ongoing: rowData[24] === true ? 'Yes' : (rowData[24] === false ? 'No' : ''),
          tonsilitis_resolved: rowData[25] === true ? 'Yes' : (rowData[25] === false ? 'No' : ''),
          tonsilitis_present: rowData[26] === true ? 'Yes' : (rowData[26] === false ? 'No' : ''),
          
          sore_throat: rowData[27] || '',
          sore_throat_specify: rowData[28] || '',
          sore_throat_start_date: rowData[29] || '',
          sore_throat_ongoing: rowData[30] === true ? 'Yes' : (rowData[30] === false ? 'No' : ''),
          sore_throat_resolved: rowData[31] === true ? 'Yes' : (rowData[31] === false ? 'No' : ''),
          sore_throat_present: rowData[32] === true ? 'Yes' : (rowData[32] === false ? 'No' : ''),
          
          joint_aches: rowData[33] || '',
          joint_aches_specify: rowData[34] || '',
          joint_aches_start_date: rowData[35] || '',
          joint_aches_ongoing: rowData[36] === true ? 'Yes' : (rowData[36] === false ? 'No' : ''),
          joint_aches_resolved: rowData[37] === true ? 'Yes' : (rowData[37] === false ? 'No' : ''),
          joint_aches_present: rowData[38] === true ? 'Yes' : (rowData[38] === false ? 'No' : ''),
          
          diarrhoea: rowData[39] || '',
          diarrhoea_specify: rowData[40] || '',
          diarrhoea_start_date: rowData[41] || '',
          diarrhoea_ongoing: rowData[42] === true ? 'Yes' : (rowData[42] === false ? 'No' : ''),
          diarrhoea_resolved: rowData[43] === true ? 'Yes' : (rowData[43] === false ? 'No' : ''),
          diarrhoea_present: rowData[44] === true ? 'Yes' : (rowData[44] === false ? 'No' : ''),
          
          rash: rowData[45] || '',
          rash_specify: rowData[46] || '',
          rash_start_date: rowData[47] || '',
          rash_ongoing: rowData[48] === true ? 'Yes' : (rowData[48] === false ? 'No' : ''),
          rash_resolved: rowData[49] === true ? 'Yes' : (rowData[49] === false ? 'No' : ''),
          rash_present: rowData[50] === true ? 'Yes' : (rowData[50] === false ? 'No' : ''),
          
          other_symptoms: rowData[51] || '',
          other_symptoms_specify: rowData[52] || '',
          other_symptoms_start_date: rowData[53] || '',
          other_symptoms_ongoing: rowData[54] === true ? 'Yes' : (rowData[54] === false ? 'No' : ''),
          other_symptoms_resolved: rowData[55] === true ? 'Yes' : (rowData[55] === false ? 'No' : ''),
          other_symptoms_present: rowData[56] === true ? 'Yes' : (rowData[56] === false ? 'No' : ''),
          
          recent_hiv_exposure: rowData[57] || '',
          describe_exposure: rowData[58] || '',
          
          // Syndromic STI Management
          vaginal_discharge: rowData[59] || '',
          vaginal_discharge_start_date: rowData[60] || '',
          vaginal_discharge_specify: rowData[61] || '',
          vaginal_discharge_treatment: rowData[62] || '',
          
          lower_abdominal_pain: rowData[63] || '',
          lower_abdominal_pain_start_date: rowData[64] || '',
          lower_abdominal_pain_specify: rowData[65] || '',
          lower_abdominal_pain_treatment: rowData[66] || '',
          
          anorectal_discharge: rowData[67] || '',
          anorectal_discharge_start_date: rowData[68] || '',
          anorectal_discharge_specify: rowData[69] || '',
          anorectal_discharge_treatment: rowData[70] || '',
          
          genital_sore: rowData[71] || '',
          genital_sore_start_date: rowData[72] || '',
          genital_sore_specify: rowData[73] || '',
          genital_sore_treatment: rowData[74] || '',
          
          pain_with_urination: rowData[75] || '',
          pain_with_urination_start_date: rowData[76] || '',
          pain_with_urination_specify: rowData[77] || '',
          pain_with_urination_treatment: rowData[78] || '',
          
          swelling_in_groin: rowData[79] || '',
          swelling_in_groin_start_date: rowData[80] || '',
          swelling_in_groin_specify: rowData[81] || '',
          swelling_in_groin_treatment: rowData[82] || '',
          
          rash_data_resolved: rowData[83] || '',
          rash_data_resolved_start_date: rowData[84] || '',
          rash_data_resolved_specify: rowData[85] || '',
          rash_data_resolved_treatment: rowData[86] || '',
          
          oth_symptoms: rowData[87] || '',
          oth_symptoms_start_date: rowData[88] || '',
          oth_symptoms_specify: rowData[89] || '',
          oth_symptoms_treatment: rowData[90] || '',
          
          // Clinical Findings
          acute_hiv_specify: rowData[91] || '',
          other_specify: rowData[92] || '',
          sti_specify: rowData[93] || '',
          
          // Disease History and Medications
          disease_history: rowData[94] || '',
          disease_specify: rowData[95] || '',
          current_medications: rowData[96] || '',
          medication_specify: rowData[97] || '',
          medication_allergies: rowData[98] || '',
          allergy_specify: rowData[99] || '',
          
          // Test Results
          hiv_rapid_sample_date: rowData[100] || '',
          hiv_4th_sample_date: rowData[101] || '',
          hepatitis_b_sample_date: rowData[102] || '',
          hepatitis_C_sample_date: rowData[103] || '',
          syphilis_sample_date: rowData[104] || '',
          kidney_function_sample_date: rowData[105] || '',
          gonorrhoea_sample_date: rowData[106] || '',
          
          // Assessment and Dispensing
          assessment_notes: rowData[107] || '',
          prep_dispensed: rowData[108] || '',
          regimen_for_prep: rowData[109] || '',
          prep_bottles: rowData[110] || '',
          clinician_information_date: rowData[111] || '',
          clinician_name: rowData[112] || '',
          designation: rowData[113] || '',
          bhmc_registration: rowData[114] || ''
        };

        // Convert dates if they are Date objects
        Object.keys(prefillData).forEach(key => {
          if (key.includes('date') && prefillData[key] instanceof Date) {
            prefillData[key] = prefillData[key].toISOString().split('T')[0];
          }
        });

        Logger.log(`Found data for ${uid} - ${visitType}:`);
        Logger.log(prefillData);

        const response = {
          status: 'success',
          prefill: prefillData,
          rowData: rowData
        };

        return sendResponse(callback, response);
      } else {
        // No data found for this UID + Visit Type combination
        const response = {
          status: 'error',
          message: `No data found for ${uid} - ${visitType}`,
          prefill: {}
        };
        return sendResponse(callback, response);
      }
    }
    
    // === CHECK AVAILABLE VISITS ===
    // Check which visit types exist for a specific UID
    if (data.action === 'checkAvailableVisits' && data.participant_uid) {
      const uid = data.participant_uid;
      const allData = fetchAllData();
      const availableVisits = [];

      // Find all rows with this UID and collect unique visit types
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] == uid) {
          const visitType = allData[i][2]; // visit_type is in column 2
          if (visitType && !availableVisits.includes(visitType)) {
            availableVisits.push(visitType);
          }
        }
      }

      Logger.log(`Available visits for ${uid}:`, availableVisits);

      const response = {
        status: 'success',
        availableVisits: availableVisits,
        count: availableVisits.length
      };

      return sendResponse(callback, response);
    }
    
    // === DELETE VISIT RECORD ===
    // Delete a specific visit record for a UID + Visit Type combination
    if (data.action === 'deleteVisitRecord' && data.participant_uid && data.visit_type) {
      const uid = data.participant_uid;
      const visitType = data.visit_type;
      const allData = fetchAllData();
      let foundRow = -1;

      // Find the row to delete
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] == uid && allData[i][2] == visitType) {
          foundRow = i + 1; // +1 because sheet rows are 1-indexed
          break;
        }
      }

      if (foundRow !== -1) {
        try {
          // Delete the row
          sheet.deleteRow(foundRow);
          
          Logger.log(`Deleted ${visitType} record for ${uid} at row ${foundRow}`);
          
          const response = {
            status: 'success',
            message: `${visitType} record deleted successfully`
          };
          
          return sendResponse(callback, response);
        } catch (error) {
          Logger.log(`Error deleting row ${foundRow}: ${error.toString()}`);
          
          const response = {
            status: 'error',
            message: `Failed to delete record: ${error.toString()}`
          };
          
          return sendResponse(callback, response);
        }
      } else {
        // Record not found
        const response = {
          status: 'error',
          message: `No record found for ${uid} - ${visitType}`
        };
        
        return sendResponse(callback, response);
      }
    }
    
    // === ORIGINAL PREFILL REQUEST ===
    // If this is a GET request for prefill data
    if (data.action === 'getPrefillData' && data.participant_uid) {
      const uid = data.participant_uid;
      const allData = fetchAllData();
      let foundRow = -1;

      // Check if UID exists
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] == uid) {
          foundRow = i;
          break;
        }
      }

      if (foundRow !== -1) {
        // UID found, return existing data
        const rowData = allData[foundRow];
        
        // Map the row data to form fields (based on your original order)
        const prefillData = {
          participant_uid: rowData[0] || '',
          date: rowData[1] || '',
          visit_type: rowData[2] || '',
          
          // Acute HIV symptoms
          fever: rowData[3] || '',
          fever_specify: rowData[4] || '',
          fever_start_date: rowData[5] || '',
          fever_ongoing: rowData[6] === true ? 'Yes' : (rowData[6] === false ? 'No' : ''),
          fever_resolved: rowData[7] === true ? 'Yes' : (rowData[7] === false ? 'No' : ''),
          fever_present: rowData[8] === true ? 'Yes' : (rowData[8] === false ? 'No' : ''),
          
          tiredness: rowData[9] || '',
          tiredness_specify: rowData[10] || '',
          tiredness_start_date: rowData[11] || '',
          tiredness_ongoing: rowData[12] === true ? 'Yes' : (rowData[12] === false ? 'No' : ''),
          tiredness_resolved: rowData[13] === true ? 'Yes' : (rowData[13] === false ? 'No' : ''),
          tiredness_present: rowData[14] === true ? 'Yes' : (rowData[14] === false ? 'No' : ''),
          
          lymph_node: rowData[15] || '',
          lymph_node_specify: rowData[16] || '',
          lymph_node_start_date: rowData[17] || '',
          lymph_node_ongoing: rowData[18] === true ? 'Yes' : (rowData[18] === false ? 'No' : ''),
          lymph_node_resolved: rowData[19] === true ? 'Yes' : (rowData[19] === false ? 'No' : ''),
          lymph_node_present: rowData[20] === true ? 'Yes' : (rowData[20] === false ? 'No' : ''),
          
          tonsilitis: rowData[21] || '',
          tonsilitis_specify: rowData[22] || '',
          tonsilitis_start_date: rowData[23] || '',
          tonsilitis_ongoing: rowData[24] === true ? 'Yes' : (rowData[24] === false ? 'No' : ''),
          tonsilitis_resolved: rowData[25] === true ? 'Yes' : (rowData[25] === false ? 'No' : ''),
          tonsilitis_present: rowData[26] === true ? 'Yes' : (rowData[26] === false ? 'No' : ''),
          
          sore_throat: rowData[27] || '',
          sore_throat_specify: rowData[28] || '',
          sore_throat_start_date: rowData[29] || '',
          sore_throat_ongoing: rowData[30] === true ? 'Yes' : (rowData[30] === false ? 'No' : ''),
          sore_throat_resolved: rowData[31] === true ? 'Yes' : (rowData[31] === false ? 'No' : ''),
          sore_throat_present: rowData[32] === true ? 'Yes' : (rowData[32] === false ? 'No' : ''),
          
          joint_aches: rowData[33] || '',
          joint_aches_specify: rowData[34] || '',
          joint_aches_start_date: rowData[35] || '',
          joint_aches_ongoing: rowData[36] === true ? 'Yes' : (rowData[36] === false ? 'No' : ''),
          joint_aches_resolved: rowData[37] === true ? 'Yes' : (rowData[37] === false ? 'No' : ''),
          joint_aches_present: rowData[38] === true ? 'Yes' : (rowData[38] === false ? 'No' : ''),
          
          diarrhoea: rowData[39] || '',
          diarrhoea_specify: rowData[40] || '',
          diarrhoea_start_date: rowData[41] || '',
          diarrhoea_ongoing: rowData[42] === true ? 'Yes' : (rowData[42] === false ? 'No' : ''),
          diarrhoea_resolved: rowData[43] === true ? 'Yes' : (rowData[43] === false ? 'No' : ''),
          diarrhoea_present: rowData[44] === true ? 'Yes' : (rowData[44] === false ? 'No' : ''),
          
          rash: rowData[45] || '',
          rash_specify: rowData[46] || '',
          rash_start_date: rowData[47] || '',
          rash_ongoing: rowData[48] === true ? 'Yes' : (rowData[48] === false ? 'No' : ''),
          rash_resolved: rowData[49] === true ? 'Yes' : (rowData[49] === false ? 'No' : ''),
          rash_present: rowData[50] === true ? 'Yes' : (rowData[50] === false ? 'No' : ''),
          
          other_symptoms: rowData[51] || '',
          other_symptoms_specify: rowData[52] || '',
          other_symptoms_start_date: rowData[53] || '',
          other_symptoms_ongoing: rowData[54] === true ? 'Yes' : (rowData[54] === false ? 'No' : ''),
          other_symptoms_resolved: rowData[55] === true ? 'Yes' : (rowData[55] === false ? 'No' : ''),
          other_symptoms_present: rowData[56] === true ? 'Yes' : (rowData[56] === false ? 'No' : ''),
          
          recent_hiv_exposure: rowData[57] || '',
          describe_exposure: rowData[58] || '',
          
          // Syndromic STI Management
          vaginal_discharge: rowData[59] || '',
          vaginal_discharge_start_date: rowData[60] || '',
          vaginal_discharge_specify: rowData[61] || '',
          vaginal_discharge_treatment: rowData[62] || '',
          
          lower_abdominal_pain: rowData[63] || '',
          lower_abdominal_pain_start_date: rowData[64] || '',
          lower_abdominal_pain_specify: rowData[65] || '',
          lower_abdominal_pain_treatment: rowData[66] || '',
          
          anorectal_discharge: rowData[67] || '',
          anorectal_discharge_start_date: rowData[68] || '',
          anorectal_discharge_specify: rowData[69] || '',
          anorectal_discharge_treatment: rowData[70] || '',
          
          genital_sore: rowData[71] || '',
          genital_sore_start_date: rowData[72] || '',
          genital_sore_specify: rowData[73] || '',
          genital_sore_treatment: rowData[74] || '',
          
          pain_with_urination: rowData[75] || '',
          pain_with_urination_start_date: rowData[76] || '',
          pain_with_urination_specify: rowData[77] || '',
          pain_with_urination_treatment: rowData[78] || '',
          
          swelling_in_groin: rowData[79] || '',
          swelling_in_groin_start_date: rowData[80] || '',
          swelling_in_groin_specify: rowData[81] || '',
          swelling_in_groin_treatment: rowData[82] || '',
          
          rash_data_resolved: rowData[83] || '',
          rash_data_resolved_start_date: rowData[84] || '',
          rash_data_resolved_specify: rowData[85] || '',
          rash_data_resolved_treatment: rowData[86] || '',
          
          oth_symptoms: rowData[87] || '',
          oth_symptoms_start_date: rowData[88] || '',
          oth_symptoms_specify: rowData[89] || '',
          oth_symptoms_treatment: rowData[90] || '',
          
          // Clinical Findings
          acute_hiv_specify: rowData[91] || '',
          other_specify: rowData[92] || '',
          sti_specify: rowData[93] || '',
          
          // Disease History and Medications
          disease_history: rowData[94] || '',
          disease_specify: rowData[95] || '',
          current_medications: rowData[96] || '',
          medication_specify: rowData[97] || '',
          medication_allergies: rowData[98] || '',
          allergy_specify: rowData[99] || '',
          
          // Test Results
          hiv_rapid_sample_date: rowData[100] || '',
          hiv_4th_sample_date: rowData[101] || '',
          hepatitis_b_sample_date: rowData[102] || '',
          hepatitis_C_sample_date: rowData[103] || '',
          syphilis_sample_date: rowData[104] || '',
          kidney_function_sample_date: rowData[105] || '',
          gonorrhoea_sample_date: rowData[106] || '',
          
          // Assessment and Dispensing
          assessment_notes: rowData[107] || '',
          prep_dispensed: rowData[108] || '',
          regimen_for_prep: rowData[109] || '',
          prep_bottles: rowData[110] || '',
          clinician_information_date: rowData[111] || '',
          clinician_name: rowData[112] || '',
          designation: rowData[113] || '',
          bhmc_registration: rowData[114] || ''
        };

        // Convert dates if they are Date objects
        Object.keys(prefillData).forEach(key => {
          if (key.includes('date') && prefillData[key] instanceof Date) {
            prefillData[key] = prefillData[key].toISOString().split('T')[0];
          }
        });

        Logger.log("UID found! Prefill data being sent:");
        Logger.log(prefillData);

        const response = {
          status: 'success',
          prefill: prefillData,
          rowData: rowData
        };

        return sendResponse(callback, response);
      } else {
        // UID not found
        const response = {
          status: 'error',
          message: 'UID not found',
          prefill: {}
        };
        return sendResponse(callback, response);
      }
    }

    // === FORM SUBMISSION ===
    // If this is a regular form submission (has more than just UID)
    if (data.participant_uid && data.visit_type && Object.keys(data).length > 2) {
      const uid = data.participant_uid;
      const visitType = data.visit_type;
      const allData = fetchAllData();
      let foundRow = -1;

      // Check if UID + Visit Type combination exists for update
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] == uid && allData[i][2] == visitType) {
          foundRow = i + 1; // +1 because sheet rows are 1-indexed
          break;
        }
      }

      // Prepare the row data in the same order as your original structure
      const rowData = [
        data.participant_uid,
        data.date,
        data.visit_type,
        data.fever,
        data.fever_specify,
        data.fever_start_date,
        data.fever_ongoing === 'Yes' ? true : (data.fever_ongoing === 'No' ? false : ''),
        data.fever_resolved === 'Yes' ? true : (data.fever_resolved === 'No' ? false : ''),
        data.fever_present === 'Yes' ? true : (data.fever_present === 'No' ? false : ''),
        data.tiredness,
        data.tiredness_specify,
        data.tiredness_start_date,
        data.tiredness_ongoing === 'Yes' ? true : (data.tiredness_ongoing === 'No' ? false : ''),
        data.tiredness_resolved === 'Yes' ? true : (data.tiredness_resolved === 'No' ? false : ''),
        data.tiredness_present === 'Yes' ? true : (data.tiredness_present === 'No' ? false : ''),
        data.lymph_node,
        data.lymph_node_specify,
        data.lymph_node_start_date,
        data.lymph_node_ongoing === 'Yes' ? true : (data.lymph_node_ongoing === 'No' ? false : ''),
        data.lymph_node_resolved === 'Yes' ? true : (data.lymph_node_resolved === 'No' ? false : ''),
        data.lymph_node_present === 'Yes' ? true : (data.lymph_node_present === 'No' ? false : ''),
        data.tonsilitis,
        data.tonsilitis_specify,
        data.tonsilitis_start_date,
        data.tonsilitis_ongoing === 'Yes' ? true : (data.tonsilitis_ongoing === 'No' ? false : ''),
        data.tonsilitis_resolved === 'Yes' ? true : (data.tonsilitis_resolved === 'No' ? false : ''),
        data.tonsilitis_present === 'Yes' ? true : (data.tonsilitis_present === 'No' ? false : ''),
        data.sore_throat,
        data.sore_throat_specify,
        data.sore_throat_start_date,
        data.sore_throat_ongoing === 'Yes' ? true : (data.sore_throat_ongoing === 'No' ? false : ''),
        data.sore_throat_resolved === 'Yes' ? true : (data.sore_throat_resolved === 'No' ? false : ''),
        data.sore_throat_present === 'Yes' ? true : (data.sore_throat_present === 'No' ? false : ''),
        data.joint_aches,
        data.joint_aches_specify,
        data.joint_aches_start_date,
        data.joint_aches_ongoing === 'Yes' ? true : (data.joint_aches_ongoing === 'No' ? false : ''),
        data.joint_aches_resolved === 'Yes' ? true : (data.joint_aches_resolved === 'No' ? false : ''),
        data.joint_aches_present === 'Yes' ? true : (data.joint_aches_present === 'No' ? false : ''),
        data.diarrhoea,
        data.diarrhoea_specify,
        data.diarrhoea_start_date,
        data.diarrhoea_ongoing === 'Yes' ? true : (data.diarrhoea_ongoing === 'No' ? false : ''),
        data.diarrhoea_resolved === 'Yes' ? true : (data.diarrhoea_resolved === 'No' ? false : ''),
        data.diarrhoea_present === 'Yes' ? true : (data.diarrhoea_present === 'No' ? false : ''),
        data.rash,
        data.rash_specify,
        data.rash_start_date,
        data.rash_ongoing === 'Yes' ? true : (data.rash_ongoing === 'No' ? false : ''),
        data.rash_resolved === 'Yes' ? true : (data.rash_resolved === 'No' ? false : ''),
        data.rash_present === 'Yes' ? true : (data.rash_present === 'No' ? false : ''),
        data.other_symptoms,
        data.other_symptoms_specify,
        data.other_symptoms_start_date,
        data.other_symptoms_ongoing === 'Yes' ? true : (data.other_symptoms_ongoing === 'No' ? false : ''),
        data.other_symptoms_resolved === 'Yes' ? true : (data.other_symptoms_resolved === 'No' ? false : ''),
        data.other_symptoms_present === 'Yes' ? true : (data.other_symptoms_present === 'No' ? false : ''),
        data.recent_hiv_exposure,
        data.describe_exposure,
        data.vaginal_discharge, // Syndromic STI Management
        data.vaginal_discharge_start_date,
        data.vaginal_discharge_specify,
        data.vaginal_discharge_treatment,
        data.lower_abdominal_pain,
        data.lower_abdominal_pain_start_date,
        data.lower_abdominal_pain_specify,
        data.lower_abdominal_pain_treatment,
        data.anorectal_discharge,
        data.anorectal_discharge_start_date,
        data.anorectal_discharge_specify,
        data.anorectal_discharge_treatment,
        data.genital_sore,
        data.genital_sore_start_date,
        data.genital_sore_specify,
        data.genital_sore_treatment,
        data.pain_with_urination,
        data.pain_with_urination_start_date,
        data.pain_with_urination_specify,
        data.pain_with_urination_treatment,
        data.swelling_in_groin,
        data.swelling_in_groin_start_date,
        data.swelling_in_groin_specify,
        data.swelling_in_groin_treatment,
        data.rash_data_resolved,
        data.rash_data_resolved_start_date,
        data.rash_data_resolved_specify,
        data.rash_data_resolved_treatment,
        data.oth_symptoms,
        data.oth_symptoms_start_date,
        data.oth_symptoms_specify,
        data.oth_symptoms_treatment,
        data.acute_hiv_specify, // Clinical Findings
        data.other_specify,
        data.sti_specify,
        data.disease_history, // Disease History and Medications
        data.disease_specify,
        data.current_medications,
        data.medication_specify,
        data.medication_allergies,
        data.allergy_specify,
        data.hiv_rapid_sample_date, // Test sample dates
        data.hiv_4th_sample_date,
        data.hepatitis_b_sample_date,
        data.hepatitis_C_sample_date,
        data.syphilis_sample_date,
        data.kidney_function_sample_date,
        data.gonorrhoea_sample_date,
        data.assessment_notes, // Assessment and dispensing
        data.prep_dispensed,
        data.regimen_for_prep,
        data.prep_bottles,
        data.clinician_information_date,
        data.clinician_name,
        data.designation,
        data.bhmc_registration
      ];

      if (foundRow !== -1) {
        // Update existing row
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
        var response = {
          status: 'success',
          message: 'CLINICAL DATA FORM Updated Successfully'
        };
      } else {
        // Append new row
        sheet.appendRow(rowData);
        var response = {
          status: 'success',
          message: 'CLINICAL DATA FORM Submitted Successfully'
        };
      }

      return sendResponse(callback, response);
    }

    // If no valid action found
    var response = {
      status: 'error',
      message: 'Invalid request'
    };
    return sendResponse(callback, response);

  } catch (error) {
    // Handle any errors
    var errorResponse = {
      status: 'error',
      message: 'Error: ' + error.toString()
    };
    return sendResponse(callback, errorResponse);
  }
}

function sendResponse(callback, obj) {
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(obj) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    return ContentService.createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test functions
function testFetchByUid() {
  const testUid = "THI0009";
  const data = fetchById(testUid);

  if (data) {
    Logger.log("UID found! Row data:");
    Logger.log(data);
  } else {
    Logger.log("UID not found in Sheet1.");
  }
}

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