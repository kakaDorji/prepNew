# PrEP System Testing Guide

## 🧪 Testing Steps

### **Test 1: User Role Access**
1. **Log in as Jamun** (username: Jamun, password: jamuna123)
2. **Go to Dashboard → Forms**
3. **Check if you can see**:
   - ✅ DRUG DISTRIBUTION form (this was the main issue!)
   - ✅ All other forms (9 total)
   - ✅ Search & Edit Records

**Expected Result**: If Jamun's role is L3, she should see ALL forms including Drug Distribution.

### **Test 2: Data Re-editing Function**
1. **Go to**: Forms → "SEARCH & EDIT RECORDS"
2. **Search for any existing UID** (e.g., enter a participant UID)
3. **Click "Edit" on a found record**
4. **Change some data** and click Save
5. **Check if**: 
   - ✅ Shows "Record updated successfully!"
   - ✅ Changes are saved in the database
   - ✅ No errors appear

**Expected Result**: Data should actually update, not just show fake success.

### **Test 3: Dashboard Loading (Slow Server Fix)**
1. **Go to Dashboard** (main dashboard page)
2. **Wait for data to load**
3. **Check if**:
   - ✅ Dashboard loads within 30 seconds (instead of timing out)
   - ✅ Charts and graphs appear
   - ✅ No timeout errors

**Expected Result**: Dashboard should load even with slow server, not timeout.

### **Test 4: Drug Distribution Form Access**
1. **Go to**: Dashboard → Forms
2. **Click on "DRUG DISTRIBUTION" form**
3. **Check if**:
   - ✅ Form opens properly
   - ✅ All fields are visible
   - ✅ Can enter data
   - ✅ Can submit form

**Expected Result**: L3 users should have full access to Drug Distribution form.

### **Test 5: Compare L3 vs L4 Access**
**Test with L4 user (Outreach Worker)**:
1. Log in as any L4 user
2. Go to Forms
3. Should see: Baseline Behaviour Tool, ORW Field Format
4. Should NOT see: Drug Distribution form

**Test with L3 user (Health Worker)**:
1. Log in as Jamun (after role change)
2. Go to Forms  
3. Should see: ALL forms including Drug Distribution

## 🚨 Troubleshooting

### **If Jamun still can't see Drug Distribution form**:
- Check her role is exactly `L3` (not `l3` or `L 3`)
- Log out and log back in
- Clear browser cache

### **If data editing doesn't work**:
- Check browser console for errors (F12 → Console)
- Verify API connection to Google Apps Script
- Test with a simple field change first

### **If dashboard is still slow**:
- Check internet connection
- Try refreshing the page
- Check if Google Sheets is responding

## ✅ Success Criteria

All tests pass when:
1. **Jamun can access Drug Distribution form**
2. **Data editing actually saves changes**
3. **Dashboard loads without timeout**
4. **L4 users still have limited access (security check)**

## 📞 Support

If any test fails:
1. Note the exact error message
2. Check browser console (F12)
3. Verify user roles in database
4. Test network connection