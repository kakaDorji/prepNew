// // server.js
// import { serve } from "bun";
// import { google } from "googleapis";
// import { GoogleAuth } from "google-auth-library";

// const PORT = process.env.PORT || 5000;
// const SPREADSHEET_ID = "1BSIaDa_825BVznRFlw2SygzDOBcqlrNRyeaJjqvNi-w";
// const RANGE = "Sheet1";
// const COLUMNS = ["username", "password", "fullname", "designation", "prep_location", "role", "bhc_no"];
// const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// // Service Account Setup
// const KEYFILEPATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// if (!KEYFILEPATH) {
//   console.error("FATAL ERROR: GOOGLE_APPLICATION_CREDENTIALS environment variable not set.");
//   console.error("Please set it to the path of your downloaded service account JSON key file.");
//   process.exit(1);
// }

// // Create Auth Client
// let auth;
// try {
//   auth = new GoogleAuth({ keyFile: KEYFILEPATH, scopes: SCOPES });
//   console.log(`Successfully loaded credentials from: ${KEYFILEPATH}`);
// } catch (error) {
//   console.error(`FATAL ERROR: Failed to load credentials from ${KEYFILEPATH}`, error);
//   process.exit(1);
// }

// // Google Sheets API setup
// const sheets = google.sheets({ version: "v4", auth });

// /**
//  * Fetches rows from the Google Sheet and formats them as objects.
//  */
// async function fetchUsers() {
//   try {
//     const response = await sheets.spreadsheets.values.get({
//       spreadsheetId: SPREADSHEET_ID,
//       range: RANGE,
//     });

//     const rows = response.data.values;
//     if (!rows || rows.length < 2) {
//       return [];
//     }

//     // Map data rows to objects using the known column structure
//     return rows.slice(1).map((row, index) => {
//       const userObject = {};
//       // Map each column based on the COLUMNS array
//       COLUMNS.forEach((column, i) => {
//         userObject[column] = row[i] !== undefined ? String(row[i]) : "";
//       });
//       // Add row index for update/delete operations
//       userObject.rowindex = index + 2;
//       return userObject;
//     });
//   } catch (error) {
//     console.error("Error fetching data from Google Sheets:", error.message);
//     if (error.response?.data?.error) {
//       console.error("Google API Error:", error.response.data.error);
//     }
//     return { error: "Failed to fetch users", details: error.message };
//   }
// }

// /**
//  * Updates a specific row in the Google Sheet.
//  */
// async function updateUser(rowIndex, userData) {
//   if (!Number.isInteger(rowIndex) || rowIndex < 2) {
//     return { error: "Invalid rowIndex for update. Must be an integer >= 2." };
//   }
  
//   if (!Array.isArray(userData) || userData.length !== COLUMNS.length) {
//     return { error: `Invalid data format. Expected an array with ${COLUMNS.length} elements.` };
//   }

//   // Ensure all values are strings
//   const formattedData = userData.map(value => String(value || ""));
  
//   // Update exactly columns A through G
//   const updateRange = `${RANGE}!A${rowIndex}:G${rowIndex}`;
  
//   try {
//     const response = await sheets.spreadsheets.values.update({
//       spreadsheetId: SPREADSHEET_ID,
//       range: updateRange,
//       valueInputOption: "USER_ENTERED",
//       requestBody: {
//         values: [formattedData]
//       },
//     });
    
//     return { 
//       message: "User updated successfully!",
//       updatedRange: response.data.updatedRange,
//       updatedCells: response.data.updatedCells
//     };
//   } catch (error) {
//     console.error(`Error updating row ${rowIndex}:`, error.message);
//     return { error: "Failed to update user", details: error.message };
//   }
// }

// /**
//  * Clears the content of a specific row in the Google Sheet.
//  */
// async function deleteUser(rowIndex) {
//   if (!Number.isInteger(rowIndex) || rowIndex < 2) {
//     return { error: "Invalid rowIndex for delete. Must be an integer >= 2." };
//   }

//   const clearRange = `${RANGE}!A${rowIndex}:G${rowIndex}`;
  
//   try {
//     const response = await sheets.spreadsheets.values.clear({
//       spreadsheetId: SPREADSHEET_ID,
//       range: clearRange,
//       requestBody: {},
//     });
//     return { message: `User data cleared successfully!` };
//   } catch (error) {
//     console.error(`Error clearing row ${rowIndex}:`, error.message);
//     return { error: "Failed to clear user data", details: error.message };
//   }
// }

// // CORS headers for all responses
// const corsHeaders = {
//   "Content-Type": "application/json",
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type, Authorization",
// };

// // Start server
// console.log(`Starting server on port ${PORT}...`);

// serve({
//   port: PORT,
//   async fetch(req) {
//     const url = new URL(req.url);
//     const method = req.method;
    
//     // Handle CORS preflight
//     if (method === "OPTIONS") {
//       return new Response(null, { status: 204, headers: corsHeaders });
//     }

//     // Log request
//     console.log(`${method} ${url.pathname}`);
    
//     try {
//       let responsePayload = {};
//       let status = 200;

//       // API Routes
//       if (url.pathname === "/api/users" && method === "GET") {
//         responsePayload = await fetchUsers();
//         if (responsePayload.error) status = 500;
//       } 
//       else if (url.pathname === "/api/updateUser" && method === "POST") {
//         try {
//           const body = await req.json();
//           const { rowindex } = body;
          
//           if (!rowindex || typeof rowindex !== 'number' || rowindex < 2) {
//             status = 400;
//             responsePayload = { error: "Valid rowindex required (number >= 2)" };
//           } else {
//             // Extract data in column order (A-G)
//             const userData = COLUMNS.map(column => body[column] || "");
//             responsePayload = await updateUser(rowindex, userData);
//             if (responsePayload.error) status = 500;
//           }
//         } catch (parseError) {
//           status = 400;
//           responsePayload = { error: "Invalid JSON request body" };
//         }
//       } 
//       else if (url.pathname === "/api/deleteUser" && method === "POST") {
//         try {
//           const body = await req.json();
//           const { rowindex } = body;
          
//           if (!rowindex || typeof rowindex !== 'number' || rowindex < 2) {
//             status = 400;
//             responsePayload = { error: "Valid rowindex required (number >= 2)" };
//           } else {
//             responsePayload = await deleteUser(rowindex);
//             if (responsePayload.error) status = 500;
//           }
//         } catch (parseError) {
//           status = 400;
//           responsePayload = { error: "Invalid JSON request body" };
//         }
//       } 
//       else {
//         status = 404;
//         responsePayload = { error: "Not Found" };
//       }

//       return new Response(JSON.stringify(responsePayload), { 
//         status, 
//         headers: corsHeaders 
//       });
//     } catch (error) {
//       console.error("Server Error:", error);
//       return new Response(
//         JSON.stringify({ error: "Internal Server Error", details: error.message }), 
//         { status: 500, headers: corsHeaders }
//       );
//     }
//   },
//   error(error) {
//     console.error("Bun Server Error:", error);
//     return new Response(
//       JSON.stringify({ error: "Internal Server Error" }), 
//       { status: 500, headers: corsHeaders }
//     );
//   },
// });

// console.log(`Server running at http://localhost:${PORT}`);

// //to ron env  $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\sonam\Desktop\PrEP\PreNewChanges\PrepBhutan\src\service\bun-sheets-integration-8cdd33730eee.json"
// //bun run server.js      




//changes
// server.js

// +++ ADD THIS LINE AT THE VERY TOP +++
// This loads variables from your .env file into process.env
import "dotenv/config";

import { serve } from "bun";
import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";

const PORT = process.env.PORT || 5000;
const SPREADSHEET_ID = "1BSIaDa_825BVznRFlw2SygzDOBcqlrNRyeaJjqvNi-w";
const RANGE = "Sheet1";
const COLUMNS = ["username", "password", "fullname", "designation", "prep_location", "role", "bhc_no"];
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// --- THIS OLD SECTION IS REMOVED ---
// const KEYFILEPATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
// ... all the code that checks for KEYFILEPATH ...

// +++ THIS NEW SECTION IS ADDED +++
// Create credentials object directly from .env variables
const credentials = {
  client_email: process.env.GCP_CLIENT_EMAIL,
  project_id: process.env.GCP_PROJECT_ID,
  // This part is crucial: it restores the newlines in the private key
  private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// Check if credentials loaded from .env
if (!credentials.client_email || !credentials.private_key) {
  console.error("FATAL ERROR: GCP credentials not found in .env file.");
  console.error("Please ensure GCP_CLIENT_EMAIL and GCP_PRIVATE_KEY are set.");
  process.exit(1);
}

// Create Auth Client using the credentials object
let auth;
try {
  // Pass the 'credentials' object directly, NOT a file path
  auth = new GoogleAuth({ credentials, scopes: SCOPES });
  console.log(`Successfully loaded credentials for: ${credentials.client_email}`);
} catch (error) {
  console.error(`FATAL ERROR: Failed to load credentials from .env`, error);
  process.exit(1);
}

// Google Sheets API setup
const sheets = google.sheets({ version: "v4", auth });

/**
 * Fetches rows from the Google Sheet and formats them as objects.
 */
async function fetchUsers() {
  // ... (The rest of your code stays exactly the same)
  // ... (No changes needed for fetchUsers, updateUser, deleteUser, etc.)
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return [];
    }

    return rows.slice(1).map((row, index) => {
      const userObject = {};
      COLUMNS.forEach((column, i) => {
        userObject[column] = row[i] !== undefined ? String(row[i]) : "";
      });
      userObject.rowindex = index + 2;
      return userObject;
    });
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error.message);
    if (error.response?.data?.error) {
      console.error("Google API Error:", error.response.data.error);
    }
    return { error: "Failed to fetch users", details: error.message };
  }
}

async function updateUser(rowIndex, userData) {
  if (!Number.isInteger(rowIndex) || rowIndex < 2) {
    return { error: "Invalid rowIndex for update. Must be an integer >= 2." };
  }
  
  if (!Array.isArray(userData) || userData.length !== COLUMNS.length) {
    return { error: `Invalid data format. Expected an array with ${COLUMNS.length} elements.` };
  }

  const formattedData = userData.map(value => String(value || ""));
  const updateRange = `${RANGE}!A${rowIndex}:G${rowIndex}`;
  
  try {
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [formattedData]
      },
    });
    
    return { 
      message: "User updated successfully!",
      updatedRange: response.data.updatedRange,
      updatedCells: response.data.updatedCells
    };
  } catch (error) {
    console.error(`Error updating row ${rowIndex}:`, error.message);
    return { error: "Failed to update user", details: error.message };
  }
}

async function deleteUser(rowIndex) {
  if (!Number.isInteger(rowIndex) || rowIndex < 2) {
    return { error: "Invalid rowIndex for delete. Must be an integer >= 2." };
  }

  const clearRange = `${RANGE}!A${rowIndex}:G${rowIndex}`;
  
  try {
    const response = await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: clearRange,
      requestBody: {},
    });
    return { message: `User data cleared successfully!` };
  } catch (error) {
    console.error(`Error clearing row ${rowIndex}:`, error.message);
    return { error: "Failed to clear user data", details: error.message };
  }
}

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

console.log(`Starting server on port ${PORT}...`);

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    console.log(`${method} ${url.pathname}`);
    
    try {
      let responsePayload = {};
      let status = 200;

      if (url.pathname === "/api/users" && method === "GET") {
        responsePayload = await fetchUsers();
        if (responsePayload.error) status = 500;
      } 
      else if (url.pathname === "/api/updateUser" && method === "POST") {
        try {
          const body = await req.json();
          const { rowindex } = body;
          
          if (!rowindex || typeof rowindex !== 'number' || rowindex < 2) {
            status = 400;
            responsePayload = { error: "Valid rowindex required (number >= 2)" };
          } else {
            const userData = COLUMNS.map(column => body[column] || "");
            responsePayload = await updateUser(rowindex, userData);
            if (responsePayload.error) status = 500;
          }
        } catch (parseError) {
          status = 400;
          responsePayload = { error: "Invalid JSON request body" };
        }
      } 
      else if (url.pathname === "/api/deleteUser" && method === "POST") {
        try {
          const body = await req.json();
          const { rowindex } = body;
          
          if (!rowindex || typeof rowindex !== 'number' || rowindex < 2) {
            status = 400;
            responsePayload = { error: "Valid rowindex required (number >= 2)" };
          } else {
            responsePayload = await deleteUser(rowindex);
            if (responsePayload.error) status = 500;
          }
        } catch (parseError) {
          status = 400;
          responsePayload = { error: "Invalid JSON request body" };
        }
      } 
      else {
        status = 404;
        responsePayload = { error: "Not Found" };
      }

      return new Response(JSON.stringify(responsePayload), { 
        status, 
        headers: corsHeaders 
      });
    } catch (error) {
      console.error("Server Error:", error);
      return new Response(
        JSON.stringify({ error: "Internal Server Error", details: error.message }), 
        { status: 500, headers: corsHeaders }
      );
    }
  },
  error(error) {
    console.error("Bun Server Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }), 
      { status: 500, headers: corsHeaders }
    );
  },
});

console.log(`Server running at http://localhost:${PORT}`);



















