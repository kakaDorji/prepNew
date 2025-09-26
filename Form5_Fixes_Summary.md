# Form5 Google Apps Script Fixes

## Issues Identified and Fixed

### 1. **CORS Headers Missing** ✅ FIXED
**Problem**: The frontend was getting AxiosError because the Google Apps Script wasn't including proper CORS headers.

**Solution**: Added `addCorsHeaders()` helper function that adds the following headers to all responses:
```javascript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
'Access-Control-Allow-Headers': 'Content-Type'
```

### 2. **Parameter Name Mismatch** ✅ FIXED  
**Problem**: In the `createRowData()` function, line 421 was using `'bhmc_number'` but the frontend form sends `'bmhc_number'`.

**Solution**: Changed `safeGetParameter(e, 'bhmc_number', '')` to `safeGetParameter(e, 'bmhc_number', '')`

### 3. **Incorrect Duplicate Check Logic** ✅ FIXED
**Problem**: The `addNewRecord()` function was preventing multiple unscheduled visits for the same UID, but unscheduled visits should allow multiple records per UID with different dates.

**Solution**: 
- Changed the duplicate check to look for specific UID + date combinations instead of just UID
- Now allows multiple visits per UID as long as the date is different
- Updated similar logic in `updateRecord()` and `deleteRecord()` functions

### 4. **Missing Error Context** ⚠️ FRONTEND ISSUE
**Problem**: The frontend logs show "Form field 'interviewer_date' not found in formData" which suggests the Vue.js form component has missing fields.

**Solution**: This needs to be fixed in the frontend Form5.vue file by ensuring all expected fields exist in the formData object.

## Key Changes Made

### New Helper Function
```javascript
function addCorsHeaders(response) {
  return response.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
}
```

### Updated Logic for Multiple Visits
```javascript
// OLD: Only checked UID
const existingData = fetchByUid(uid);

// NEW: Check UID + date combination
if (visitDate) {
  const existingData = fetchByUidAndVisitDate(uid, visitDate);
  if (existingData) {
    return { status: 'error', message: `Record already exists for UID: ${uid} on ${visitDate}` };
  }
}
```

### All Responses Now Include CORS Headers
Every JSON response now uses:
```javascript
return addCorsHeaders(
  ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON)
);
```

## Steps to Deploy

1. **Copy the fixed script**: Use the content from `Form5_GoogleScript_Fixed.js`
2. **Open Google Apps Script**: Go to your existing Google Apps Script project
3. **Replace the code**: Paste the fixed code, replacing all existing content
4. **Update sheet name**: Change `'Sheet1'` on line 131 to match your actual sheet name
5. **Save and deploy**: Save the script and redeploy as a web app
6. **Test**: The CORS and parameter issues should now be resolved

## Testing the Fix

After deployment, test these scenarios:
1. **getVisitDates**: Should return available visit dates for a UID
2. **prefill**: Should populate form with existing data
3. **add**: Should create new unscheduled visit records
4. **update**: Should update existing records by UID + date
5. **delete**: Should delete specific records by UID + date

The AxiosError should be resolved, and the frontend should be able to communicate with the Google Apps Script successfully.