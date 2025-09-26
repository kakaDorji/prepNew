# Testing Your Updated Google Apps Script

## Before Deploying - Test Functions

In the Apps Script editor, you can test these functions:

### 1. Test Prefill Function
```javascript
// Run: testPrefill()
// Expected: Should return data for UID "THI0009" or null if not found
```

### 2. Test Save Function  
```javascript
// Run: testSave()
// Expected: Should save/update test data for UID "THI0009"
```

### 3. Test Request Handler
```javascript
// Run: testRequest()
// Expected: Should simulate a prefill request and return JSON response
```

## After Deploying - Test Web App

1. **Direct URL test**: Visit your deployed web app URL
   - Should NOT show "Script function not found: doGet" error
   - Should show JSON response (even if error, it means doGet is working)

2. **Prefill test**: Test with parameters
   ```
   https://your-script-url/exec?participant_uid=THI0009&action=getPrefillData
   ```
   - Should return JSON with prefill data or "UID not found"

## Common Issues

- **"doGet not found"**: Script not deployed as web app
- **Permission denied**: Script not set to "Anyone" access  
- **CORS errors**: Script deployed but permissions wrong

## Success Indicators

✅ Direct URL shows JSON response (not "function not found")
✅ Parameterized URL returns expected data
✅ Form2.vue console shows prefill data loading
✅ No CORS errors in browser console