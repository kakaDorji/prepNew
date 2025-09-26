# Form6 Update Summary - Google Apps Script Integration

## ✅ **Changes Made:**

### 1. **Updated Google Apps Script URL**
- **Line 1452**: Updated placeholder URL 
- **Action Needed**: Replace `YOUR_NEW_SCRIPT_URL_HERE` with your actual deployed script URL

### 2. **Enhanced Submission Function**
- **Lines 1742-1890**: Complete rewrite of `confirmAndSubmit()` function
- **Added**: Proper field mapping between Form6 and Google Apps Script column headers
- **Added**: Better error handling with axios instead of fetch
- **Added**: CORS support (no more `no-cors` mode)
- **Added**: Detailed logging for debugging

### 3. **Field Mapping Added**
Maps Form6 Vue fields to Google Apps Script expected field names:

#### **Basic Info:**
- `participant_uid` → `uid`
- `date` → `Date`  
- `prep_site` → `PrEP_site`
- `visit_type` → `TYPE_OF_VISIT`
- `interviewer_name` → `INTERVIEWERS_NAME`
- `designation` → `DESIGNATION`
- `bmhc_number` → `BMHC_Number`

#### **Demographics (Section 1):**
- `occupation_status` → `1_1_Current_occupation_status`
- `marital_status` → `1_2_What_is_your_current_marital_status`
- `live_with_partner` → `1_3_Do_you_currently_live_with_your_sex_partner`

#### **Sexual Behavior (Section 3):**
- Partner counts, condom use, client questions
- All properly mapped to long column header names

#### **Side Effects (Section 4):**
- `nausea`, `vomiting`, `fatigue`, `dizziness`, `headache`, `rash`, etc.
- Boolean `ongoing`/`resolved` fields converted to "Yes"/"No" strings

#### **Satisfaction & Discontinuation:**
- `satisfaction_level` → `11_7_How_satisfied_are_you_with_PrEP`
- `discontinuation_reasons` → `12_1_What_are_the_reasons_for_discontinuing_PrEP`

## 🔧 **What You Need to Do:**

### **Step 1: Deploy Google Apps Script**
1. Copy the code from `PrEP_Followup_GoogleScript_Complete.js`
2. Create new Google Apps Script project
3. Paste the code and save
4. Deploy as web app with public access
5. Copy the deployed web app URL

### **Step 2: Update Form6 URL**
Replace line 1452 in Form6.vue:
```javascript
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID_HERE/exec";
```

### **Step 3: Test the Integration**
1. Test form submission with valid UID
2. Check browser console for any field mapping issues
3. Verify data appears correctly in Google Sheets

## 📝 **Additional Field Mappings Needed**

The current mapping covers ~40 of the 132 possible fields. You may want to add more mappings for:

- **Section 5**: Daily PrEP questions (missed days, pill timing, etc.)
- **Section 6**: Event-driven PrEP questions  
- **Section 7**: Adherence questions
- **Section 8**: Experience and sharing
- **Section 9**: Program exposure
- **Section 10**: Alcohol and drug use

These can be added to the `mappedData` object in the `confirmAndSubmit()` function as needed.

## 🚨 **Important Notes**

1. **Field Names Must Match Exactly**: The Google Apps Script expects exact field names from the column headers
2. **Array Handling**: Arrays are converted to semicolon-separated strings
3. **Boolean Handling**: Booleans are converted to "Yes"/"No" strings
4. **Error Handling**: Now includes proper error responses from the server
5. **CORS**: Script includes proper CORS headers for cross-origin requests

## 🧪 **Testing Checklist**

- [ ] Google Apps Script deployed successfully
- [ ] Form6 URL updated with correct script URL
- [ ] Form submission works without CORS errors  
- [ ] Data appears in Google Sheets with correct field mapping
- [ ] Error messages display properly for invalid submissions
- [ ] Success messages display after successful submission