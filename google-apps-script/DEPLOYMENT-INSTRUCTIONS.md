# Google Apps Script Deployment Instructions

## Problem
The CORS error and "doGet function not found" indicates that the Google Apps Script needs to be updated and properly redeployed.

## Solution Steps

### 1. Update Your Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Open your existing project for Form2 
3. **Replace all existing code** with the content from `Form2-Script-Fixed.gs`
4. The new script includes:
   - Proper `doGet()` and `doPost()` functions
   - CORS headers to allow localhost requests
   - Better error handling
   - JSONP support as fallback

### 2. Deploy the Script

1. Click **Deploy** → **New deployment**
2. Choose type: **Web app**
3. Set the following configuration:
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone (important for CORS to work)
4. Click **Deploy**
5. **Copy the new web app URL** - it should look like:
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```

### 3. Update Form2.vue URL

Replace the `GOOGLE_SCRIPT_URL` in your Vue component with the new deployment URL.

### 4. Test the Functions

You can test the script functions directly in the Apps Script editor:
- Run `testPrefill()` to test data retrieval
- Run `testSave()` to test data saving
- Run `testRequest()` to simulate a full request

### 5. Check Permissions

Make sure your Google Apps Script has permission to:
- Access your Google Sheets
- Run as a web app
- Accept requests from any domain

## Testing

After deployment, test by:
1. Enter a valid UID in Form2
2. Check browser console for any errors
3. Verify that prefill data loads correctly

## Troubleshooting

If still getting CORS errors:
- The Vue component now includes JSONP fallback
- Check that the script is deployed as "Anyone" can access
- Verify the URL is correct and ends with `/exec`
- Try accessing the script URL directly in browser to test

## Common Issues

1. **"doGet not found"**: Script not properly deployed as web app
2. **CORS errors**: Script not deployed with "Anyone" access
3. **Permissions error**: Script doesn't have sheet access permissions
4. **Wrong URL**: Make sure using the web app URL, not the script editor URL