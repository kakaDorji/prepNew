// ==========================
// GOOGLE APPS SCRIPT FOR FORM 2
// Fixed version with CORS support
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
// PREFILL FUNCTION
// ==========================

// Get prefill data for a UID
function getPrefillData(uid) {
  try {
    const allData = fetchAllData();
    const headers = getHeaders();

    const rowIndex = allData.findIndex((row, i) => i > 0 && row[0] == uid);
    if (rowIndex === -1) return null; // UID not found

    const rowData = allData[rowIndex];
    const prefill = {};

    // Map headers to values
    headers.forEach((header, i) => {
      let value = rowData[i];

      // Convert Date objects to YYYY-MM-DD
      if (value instanceof Date) value = value.toISOString().split("T")[0];

      // Convert boolean to "Yes"/"No" for frontend
      if (typeof value === "boolean") value = value ? "Yes" : "No";

      // Handle empty values
      if (value === null || value === undefined) value = "";

      prefill[header] = value;
    });

    return prefill;
  } catch (error) {
    console.error("Error in getPrefillData:", error);
    return null;
  }
}

// ==========================
// CREATE OR UPDATE FUNCTION
// ==========================

// Save a new row or update existing row dynamically
function saveOrUpdateData(data) {
  try {
    const sheet = getSheet();
    const headers = getHeaders();
    const uid = data.participant_uid;

    if (!uid) {
      return { status: "error", message: "participant_uid is required" };
    }

    // Find existing row
    let rowIndex = findRowByUid(uid);

    // Prepare row data dynamically based on headers
    const rowData = headers.map(header => {
      let value = data[header] !== undefined ? data[header] : "";

      // Convert "Yes"/"No" to boolean for storage
      if (value === "Yes") value = true;
      if (value === "No") value = false;

      return value;
    });

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

// Create response with CORS headers
function createCorsResponse(callback, obj) {
  const json = JSON.stringify(obj);
  
  if (callback) {
    // JSONP response
    return ContentService.createTextOutput(`${callback}(${json})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // JSON response with CORS headers
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