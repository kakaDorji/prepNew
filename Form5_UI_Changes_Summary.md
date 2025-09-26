# Form5 UI Changes - Hide "Add New" When Data Exists

## Changes Made

### ✅ **Removed "Add New" Button When Data Exists**
- **Location**: Lines 31-33 in Form5.vue template
- **Change**: Commented out the "Add New" button that appeared when existing data was found
- **Reason**: User requested to only show update mode when data exists, no option to add new

### ✅ **Updated UI Text and Messages**
- **Visit Section Header**: Changed from "Available Visits:" to "Existing Data Found:" (line 25)
- **Status Messages**: 
  - When data exists: "Existing unscheduled visit data found. Click to update."
  - When no data: "Ready to add unscheduled visit for {uid}"

### ✅ **Updated Submit Button Text**
- **Function**: `getSubmitButtonText()` (lines 548-550)
- **When data exists**: Shows "Update Existing Data"
- **When no data exists**: Shows "Add New Visit Data"

### ✅ **Fixed Parameter Name Mismatch**
- **Location**: Line 838 in confirmAndSubmit function
- **Fixed**: `bhmc_number` → `bmhc_number` to match frontend form field names

## User Flow Now

### **When UID has existing data:**
1. User enters UID
2. System shows "Existing Data Found:" section
3. Shows only "Edit Existing Data" button (no Add New option)
4. User clicks "Edit Existing Data" to load and update
5. Submit button shows "Update Existing Data"

### **When UID has no existing data:**
1. User enters UID  
2. System shows "Ready to add unscheduled visit for {uid}"
3. No visit selection buttons shown
4. Form is ready for new data entry
5. Submit button shows "Add New Visit Data"

## Key Benefits

1. **Simplified UI**: Eliminates confusion about when to add vs update
2. **Clear Intent**: Button text clearly indicates the action being performed
3. **Consistent Behavior**: Matches user's mental model of "update existing" vs "add new"
4. **No Data Duplication**: Prevents accidental creation of duplicate entries

## Technical Details

- The `availableVisitDates` array still works but only shows existing data for update
- The `isPrefilled` state determines whether in update or add mode
- All CRUD operations (add/update/delete) remain fully functional
- Form validation and data mapping unchanged