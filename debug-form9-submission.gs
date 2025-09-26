// Add this function to your Google Apps Script to debug what data is being sent

function debugSubmission(e) {
  var data = e.parameter;
  console.log('=== FORM9 SUBMISSION DEBUG ===');
  console.log('All received parameters:');
  
  Object.keys(data).forEach(key => {
    console.log(`${key}: "${data[key]}"`);
  });
  
  console.log('=== SPECIFIC MONTH FIELDS ===');
  console.log('M1 fields:');
  console.log(`  m1_date: "${data.m1_date || 'MISSING'}"`);
  console.log(`  regimen_m1: "${data.regimen_m1 || 'MISSING'}"`);
  console.log(`  m1_bottles: "${data.m1_bottles || 'MISSING'}"`);
  console.log(`  m1_next_due_date: "${data.m1_next_due_date || 'MISSING'}"`);
  
  console.log('M3 fields:');
  console.log(`  m3_date: "${data.m3_date || 'MISSING'}"`);
  console.log(`  regimen_m3: "${data.regimen_m3 || 'MISSING'}"`);
  console.log(`  m3_bottles: "${data.m3_bottles || 'MISSING'}"`);
  
  console.log('M9 fields:');
  console.log(`  m9_date: "${data.m9_date || 'MISSING'}"`);
  console.log(`  regimen_m9: "${data.regimen_m9 || 'MISSING'}"`);
  console.log(`  m9_bottles: "${data.m9_bottles || 'MISSING'}"`);
  
  console.log('M12 fields:');
  console.log(`  m12_date: "${data.m12_date || 'MISSING'}"`);
  console.log(`  regimen_m12: "${data.regimen_m12 || 'MISSING'}"`);
  console.log(`  m12_bottles: "${data.m12_bottles || 'MISSING'}"`);
  
  console.log('=== END DEBUG ===');
  
  return data;
}

// Update your handleRequest to use this:
function handleRequest(e) {
  var data = e.parameter;
  var callback = data.callback || '';
  
  // Debug what we're receiving
  debugSubmission(e);
  
  // ... rest of your existing handleRequest code
}