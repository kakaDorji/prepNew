# Form5 Unscheduled Visit - Testing Guide

## Prerequisites
1. ✅ Deploy `Form5_UID_Only_Script.js` as Google Apps Script Web App
2. ✅ Update line 343 in `Form5_UID_Only_Complete.vue` with your script URL
3. ✅ Ensure your spreadsheet has the correct headers (see below)

## Expected Spreadsheet Headers (Column Order)
```
uid | prep_site | date | reason_for_this_visit | Other_describe | Nausea | Nausea_Ongoing | Nausea_Resolved | Vomiting | Vomiting_Ongoing | Vomiting_Resolved | Abdominalcramps | Abdominalcramps_Ongoing | Abdominalcramps_ Resolved | Fatigue | Fatigue_Ongoing | Fatigue_Resolved | Dizziness | Dizziness_Ongoing | Resolved | Headache | Headache_Ongoing | Headache_Resolved | Others | Others_Ongoing | Others_Resolved | Others_please_describe_below | challenges_taking_PrEP | comments_challenges_faced | Additional_doses_above | stop_or_continue | stopping_reason | stopping_indicatte_reasons_ preferred_method | Other_notes | Date | Name | Designation | BMHC Number
```

## Testing Workflow

### Test Case 1: Valid UID with NO existing data
1. Enter a valid UID (e.g., "ABC123") that exists in CSV
2. **Expected Result:**
   - ✅ "Participant UID found!" message
   - ✅ "Ready to add unscheduled visit for ABC123"
   - ✅ No "View/Edit Record" button
   - ✅ Submit button shows "Review Data"

### Test Case 2: Valid UID with EXISTING data
1. Enter a valid UID that has data in spreadsheet
2. **Expected Result:**
   - ✅ "Participant UID found!" message
   - ✅ "Existing record found for [UID]. View/edit or start over."
   - ✅ Shows "View/Edit Record" button
   - ✅ Shows "Clear & Start Over" button

### Test Case 3: Prefill existing data
1. From Test Case 2, click "View/Edit Record"
2. **Expected Result:**
   - ✅ Form prefills with existing data
   - ✅ Shows "UPDATE MODE" banner
   - ✅ Shows "Delete Record" button
   - ✅ Submit button changes to "Update Data"

### Test Case 4: Update existing record
1. From Test Case 3, modify some data and submit
2. **Expected Result:**
   - ✅ Shows confirmation modal
   - ✅ Successfully updates the record
   - ✅ Shows success message

### Test Case 5: Delete existing record
1. From Test Case 3, click "Delete Record"
2. **Expected Result:**
   - ✅ Shows confirmation dialog
   - ✅ Successfully deletes the record
   - ✅ Form clears and returns to new entry mode

## Debugging Tips

### Check Browser Console (F12)
- Look for debug logs showing:
  - "CSV Data Loaded for Form 5"
  - "Checking existing data for UID: [uid]"
  - "checkExistingData response: [response]"
  - "Prefill response: [response]"

### Common Issues
1. **Google Script URL not set**: Check line 343 in Vue file
2. **CORS errors**: Ensure Google Script is deployed with "Anyone" access
3. **Column mismatch**: Verify spreadsheet headers match exactly
4. **UID not in CSV**: Check CSV data source URL

## Success Indicators
- ✅ UID validation works (checks CSV)
- ✅ Data checking works (checks spreadsheet)
- ✅ Prefill works (loads existing data)
- ✅ Update works (modifies existing data)  
- ✅ Delete works (removes existing data)
- ✅ New entry works (adds new data)

## Error Messages to Watch For
- "Google Script URL not configured"
- "Network error - cannot reach server"
- "Server error: [status code]"
- "Error checking existing data"
- "Error loading data"