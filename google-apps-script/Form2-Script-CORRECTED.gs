// ==========================
// GOOGLE APPS SCRIPT FOR FORM 2
// CORRECTED VERSION with proper CORS headers
// ==========================

// Handle GET requests (for prefill data)
function doGet(e) {
  return handleRequest(e);
}

// Handle POST requests (for form submissions)
function doPost(e) {
  return handleRequest(e);
}

// ==========================
// COMMON SHEET FUNCTIONS
// ==========================

// Get the active sheet (Sheet1)
function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
}

// Fetch all data from sheet including header row
function fetchAllData() {
  const sheet = getSheet();
  return sheet.getDataRange().getValues();
}

// Get the header row
function getHeaders() {
  const sheet = getSheet();
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

// Find the row index for a given UID
function findRowByUid(uid) {
  const allData = fetchAllData();
  for (let i = 1; i < allData.length; i++) { // skip header
    if (allData[i][0] == uid) return i + 1; // +1 because sheet rows are 1-indexed
  }
  return -1;
}

// ==========================
// HEADER MAPPING FOR FORM2
// ==========================

// Map Google Sheet headers to Vue form field names
function getHeaderMapping() {
  return {
    "Participant UID": "participant_uid",
    "PrEP Site": "prep_site",
    "Date": "date",
    "Interviewer's Name": "interviewer_name",
    "Designation": "designation",
    "Status of the Interview": "interview_status",
    "Year of Birth": "birth_year",
    "Age": "age",
    "1.2 Do you live in Bhutan permanently?": "permanent_bhutan",
    "1.3 Current occupation status?": "occupation",
    "Other occupation status": "occupation_specify",
    "1.4 Education status?": "education",
    "1.5 What is your current marital status?": "marital_status",
    "1.5 Other current marital status": "marital_specify",
    "1.6 Do you currently live with your sex partner?": "living_with_partner",
    "1.7 If so, is your sex partner male, female, or TG?": "partner_gender",
    "1.8 How do you classify your sexual orientation?": "sexual_orientation",
    "1.8 Other sexual orientation": "orientation_specify",
    "2.1 In general, to what extent do you consider yourself at risk of getting HIV?": "hiv_risk",
    "2.2 In general, to what extent do you consider yourself at risk of getting STI?": "sti_risk",
    "2.3 In general, how do you manage your risk of getting HIV?": "hiv_management",
    "Other management risk of getting HIV": "other_hiv_management_specify",
    "2.4 Do you know the HIV status of your partner (male, female, TGW)? Will you share with us?": "partner_hiv_status",
    "3.1 Do you have Steady partners?": "steady_partners",
    "3.2 Do you have Casual partners?": "casual_partners",
    "3.3 Do you have Transactional partners?": "transactional_partners",
    "3.4 Steady partners": "steady_anal_partners",
    "3.4 Casual Partners": "casual_anal_partners",
    "3.4 Transactional partners": "transactional_anal_partners",
    "3.4 other": "anal_sex",
    "3.5 Steady partners": "steady_vaginal_partners",
    "3.5 Casual Partners": "casual_vaginal_partners",
    "3.5 Transactional partners": "transactional_vaginal_partners",
    "3.5 other": "vaginal_sex",
    "4.1 Have you ever had penetrative vaginal or anal sex?": "ever_had_sex",
    "4.2 Did you have vaginal or anal sex in the last 6 months?": "sex_last_six_months",
    "4.3 How often did you use a condom during the last vaginal or anal sex?": "condom_frequency",
    "5.1 In the last one week, how often did you use a condom with your steady partner/s?": "steady_condom_use",
    "5.2 In the last one week, how often did you use a condom with your Casual partner/s?": "casual_condom_use",
    "5.3 In the last one week, how often did you use a condom with your Transactional partner/s?": "transactional_condom_use",
    "5.4 In the last sex act with your steady partner, did you use a condom?": "steady_last_condom",
    "5.5 In the last sex act with your Casual partner, did you use a condom?": "casual_last_condom",
    "5.6 In the last sex act with your Transactional partner, did you use a condom?": "transactional_last_condom",
    "5.7 What were your reasons for having condomless sex? (You may select multiple answers)": "condomless_reasons",
    "5.7 others": "other_condomless_reasons",
    "5.8 Have you ever used gel or water-based lubricant during anal sex?": "lubricant_used",
    "5.9 How often did you use gel or water-based lubricants for anal sex during the last 3 months?": "lubricant_frequency",
    "5.10 Why do you not always use gel or water-based lubricants for anal sex? (Multiple answers may be possible)": "lubricant_use_reasons",
    "5.10 others": "other_lubricant_reasons",
    "6.1 In the past 12 months, have you met outreach workers from HISC/Pride Bhutan?": "outreach_workers",
    "6.1.a They spoke to me about HIV prevention": "hiv_prevention",
    "6.1.b They took me for HIV testing": "hiv_testing",
    "6.1.c They spoke to me about STI": "sti_discussion",
    "6.1.d They gave me condoms/lubricants": "condoms_lubricants",
    "6.1.e They spoke to me about PrEP": "prep_discussion",
    "6.1.f They asked me about my general wellbeing.": "general_wellbeing",
    "6.1.g I spoke to them about my stigma related issues": "stigma_issues",
    "6.1.h I shared other issues with them (please specify)": "other_issues",
    "6.2 Have you ever visited Pride Bhutan Office in the last 12 months?": "visited_pride_office",
    "6.2.a What were the reasons for visiting the Pride Bhutan Office?": "pride_visit_reason",
    "6.2.b For HIV test": "pride_hiv_test",
    "6.2.c For STI test": "pride_sti_test",
    "6.2.d For collecting condoms/lubricants": "pride_condoms_lubricants",
    "6.2.e Other reasons (Specify)": "pride_other_reasons",
    "6.3 Have you ever visited HISC Thimphu in the last 12 months?": "visited_hisc_thimphu",
    "6.3.b What were the reason for your visit to HISC Thimphu?": "hisc_visit_reason",
    "6.3.c For HIV test": "hisc_hiv_test",
    "6.3.d For STI test": "hisc_sti_test",
    "6.3.e For collecting condoms/lubricants": "hisc_condoms_lubricants",
    "6.3.f For general check up": "hisc_general_checkup",
    "6.3.g Other reasons (Please specify": "hisc_other_reasons",
    "6.4 Have you ever been tested for HIV?": "tested_hiv",
    "6.5 When was the last time you were tested for HIV?": "last_tested_hiv",
    "6.6 Do you know your HIV status? Will you be willing to share with us?": "know_hiv_status",
    "6.7 In the past 6 months, have you ever experienced any of these symptoms of STI? (Tick multiple responses)": "sti_symptoms",
    "6.8 The last time you had any of these symptoms what did you do?": "action_taken",
    "6.8 other": "other_action_taken",
    "7.1 Have you consumed alcohol in the last 12 months?": "alcohol_consumed",
    "7.2 How many days did you consume alcohol in the past one week?": "days_consumed_alcohol",
    "7.3 The last time you had sex with any of your sexual partners did you consume alcoholic drinks before or during sex?": "alcohol_before_sex",
    "7.4 Have you taken recreational drugs in the last 12 months?": "recreational_drugs",
    "7.5 The last time you had sex with any of your sexual partners did you take recreational drugs before or during sex?": "drugs_before_sex",
    "8.1 Have you ever been denied health or medical services because you belong to KP groups (FSW, MSM, MSW, and TG person)?": "denied_services",
    "8.2 Have you ever been exposed to violence or abuse from the police because you belong to a KP group?": "violence_police",
    "8.3 In the last 12 months, were you forced to have sexual intercourse even if you did not want to?": "forced_intercourse",
    "8.4 Whom did you inform the last time you were forced to have sex against your will? (Multiple responses possible)": "informed_person",
    "8.4 other": "other_informed"
  };
}

// ==========================
// PREFILL FUNCTION
// ==========================

// Get prefill data for a UID with header mapping
function getPrefillData(uid) {
  try {
    const allData = fetchAllData();
    const headers = getHeaders();
    const headerMapping = getHeaderMapping();

    const rowIndex = allData.findIndex((row, i) => i > 0 && row[0] == uid);
    if (rowIndex === -1) return null; // UID not found

    const rowData = allData[rowIndex];
    const prefill = {};

    // Map headers to values using the mapping
    headers.forEach((header, i) => {
      let value = rowData[i];

      // Convert Date objects to YYYY-MM-DD
      if (value instanceof Date) value = value.toISOString().split("T")[0];

      // Convert boolean to "Yes"/"No" for frontend
      if (typeof value === "boolean") value = value ? "Yes" : "No";

      // Handle empty values
      if (value === null || value === undefined) value = "";

      // Use mapped field name if available, otherwise use original header
      const fieldName = headerMapping[header] || header;
      prefill[fieldName] = value;
    });

    console.log('Mapped prefill data:', prefill);
    return prefill;
  } catch (error) {
    console.error("Error in getPrefillData:", error);
    return null;
  }
}

// ==========================
// CREATE OR UPDATE FUNCTION
// ==========================

// Save a new row or update existing row dynamically with header mapping
function saveOrUpdateData(data) {
  try {
    const sheet = getSheet();
    const headers = getHeaders();
    const headerMapping = getHeaderMapping();
    const uid = data.participant_uid;

    if (!uid) {
      return { status: "error", message: "participant_uid is required" };
    }

    // Create reverse mapping (Vue field names -> Sheet headers)
    const reverseMapping = {};
    Object.keys(headerMapping).forEach(sheetHeader => {
      const vueField = headerMapping[sheetHeader];
      reverseMapping[vueField] = sheetHeader;
    });

    // Find existing row
    let rowIndex = findRowByUid(uid);

    // Prepare row data dynamically based on headers
    const rowData = headers.map(header => {
      // Try to find the value using the reverse mapping
      let value = "";
      
      // Check if this header has a mapped Vue field
      const mappedField = headerMapping[header];
      if (mappedField && data[mappedField] !== undefined) {
        value = data[mappedField];
      } else if (data[header] !== undefined) {
        // Fallback to original header name
        value = data[header];
      }

      // Convert "Yes"/"No" to boolean for storage
      if (value === "Yes") value = true;
      if (value === "No") value = false;

      return value;
    });

    console.log('Saving data with header mapping:', { uid, rowData: rowData.slice(0, 5) }); // Log first 5 values

    if (rowIndex !== -1) {
      // Update existing row
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      return { status: "success", message: "Data updated successfully" };
    } else {
      // Append new row
      sheet.appendRow(rowData);
      return { status: "success", message: "Data submitted successfully" };
    }
  } catch (error) {
    console.error("Error in saveOrUpdateData:", error);
    return { status: "error", message: "Failed to save data: " + error.toString() };
  }
}

// ==========================
// DELETE FUNCTION
// ==========================

// Delete a row by UID
function deleteByUid(uid) {
  try {
    const rowIndex = findRowByUid(uid);
    if (rowIndex === -1) return { status: "error", message: "UID not found" };

    getSheet().deleteRow(rowIndex);
    return { status: "success", message: "Record deleted successfully" };
  } catch (error) {
    console.error("Error in deleteByUid:", error);
    return { status: "error", message: "Failed to delete record: " + error.toString() };
  }
}

// ==========================
// REQUEST HANDLER
// ==========================

// Main function to handle all requests
function handleRequest(e) {
  let data;
  
  // Handle both GET (e.parameter) and POST (e.postData) requests
  if (e.postData && e.postData.contents) {
    try {
      // For POST requests with JSON data
      data = JSON.parse(e.postData.contents);
    } catch (error) {
      // For POST requests with form data
      data = e.parameter || {};
    }
  } else {
    // For GET requests
    data = e.parameter || {};
  }

  try {
    console.log("Request received:", data);

    // === PREFILL REQUEST ===
    if (data.action === "getPrefillData" && data.participant_uid) {
      const prefill = getPrefillData(data.participant_uid);
      const response = prefill ? 
        { status: "success", prefill } : 
        { status: "error", message: "UID not found", prefill: {} };
      
      console.log("Prefill response:", response);
      return createCorsResponse(data.callback, response);
    }

    // === DELETE REQUEST ===
    if (data.action === "deleteRecord" && data.participant_uid) {
      const result = deleteByUid(data.participant_uid);
      console.log("Delete response:", result);
      return createCorsResponse(data.callback, result);
    }

    // === CREATE OR UPDATE REQUEST ===
    if (data.participant_uid) {
      const result = saveOrUpdateData(data);
      console.log("Save response:", result);
      return createCorsResponse(data.callback, result);
    }

    // Invalid request
    const errorResponse = { status: "error", message: "Invalid request - missing participant_uid or action" };
    console.log("Error response:", errorResponse);
    return createCorsResponse(data.callback, errorResponse);

  } catch (err) {
    console.error("Request handler error:", err);
    const errorResponse = { status: "error", message: "Server error: " + err.toString() };
    return createCorsResponse(data.callback, errorResponse);
  }
}

// ==========================
// CORS RESPONSE HELPER
// ==========================

// Create response with CORS headers (FIXED VERSION)
function createCorsResponse(callback, obj) {
  const json = JSON.stringify(obj);
  
  if (callback) {
    // JSONP response
    return ContentService.createTextOutput(`${callback}(${json})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // JSON response with CORS headers (using individual setHeader calls)
    return ContentService.createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type')
      .setHeader('Access-Control-Max-Age', '3600');
  }
}

// ==========================
// TEST FUNCTIONS (Optional)
// ==========================

function testPrefill() {
  const result = getPrefillData("THI0009");
  console.log("Test prefill result:", result);
  return result;
}

function testSave() {
  const testData = { 
    participant_uid: "THI0009", 
    date: "2025-09-22", 
    age: 30,
    interviewer_name: "Test Interviewer"
  };
  const result = saveOrUpdateData(testData);
  console.log("Test save result:", result);
  return result;
}

function testDelete() {
  const result = deleteByUid("TEST123");
  console.log("Test delete result:", result);
  return result;
}

function testRequest() {
  // Simulate a GET request for prefill
  const mockEvent = {
    parameter: {
      participant_uid: "THI0009",
      action: "getPrefillData"
    }
  };
  
  const result = handleRequest(mockEvent);
  console.log("Test request result:", result.getContent());
  return result;
}