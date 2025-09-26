function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
    var data = e.parameter;

    // Add new row to sheet
    sheet.appendRow([
      data.participant_uid || '',
      data.date || '',
      data.prep_site || '',
      data.visit_type || '',
      data.interviewer_name || '',
      data.designation || '',
      data.bmhc_number || '',
      data.interview_status || '',
      data.occupation_status || '',
      data.occupation_other || '',
      data.marital_status || '',
      data.marital_other || '',
      data.live_with_partner || '',
      data.partner_gender || '',

      // Section 2 
      data.sti_risk || '', 
      data.hiv_risk || '',
      data.partner_hiv_status || '',

      // Section 3
      data.steady_anal_partners || '',
      data.casual_anal_partners || '',
      data.transactional_anal_partners || '',
      data.anal_sex || '',
      data.steady_vaginal_partners || '',
      data.casual_vaginal_partners || '',
      data.transactional_vaginal_partners || '',
      data.vaginal_sex || '',
      data.sex_days || '',
      data.regular_condom_use || '',
      data.last_sex_condom_use || '',
      data.have_clients || '',
      data.clients_last_week || '',
      data.sex_days_clients || '',
      data.clients_condom_use || '',
      data.last_sex_with_clients_condom_use || '',
      data.sex_without_condom_reason || '',
      data.sex_without_condom_reason_other || '',
      data.prep_change_condom_use || '',

      // Section 4
      data.dosing_regimen || '', 
      data.change_regimen || '', 
      data.reason_change || '', 
      data.nausea || '', 
      data.nausea_ongoing || '', 
      data.nausea_resolved || '', 
      data.vomiting || '', 
      data.vomiting_ongoing || '', 
      data.vomiting_resolved || '', 
      data.fatigue || '', 
      data.fatigue_ongoing || '', 
      data.fatigue_resolved || '', 
      data.dizziness || '', 
      data.dizziness_ongoing || '', 
      data.dizziness_resolved || '', 
      data.headache || '', 
      data.headache_ongoing || '', 
      data.headache_resolved || '', 
      data.rash || '', 
      data.rash_ongoing || '', 
      data.rash_resolved || '', 
      data.abdominal_pain || '', 
      data.abdominal_pain_ongoing || '', 
      data.abdominal_pain_resolved || '', 
      data.weight_loss || '', 
      data.weight_loss_ongoing || '', 
      data.weight_loss_resolved || '', 
      data.no_response || '', 
      data.other_symptoms || '', 
      data.other_symptoms_specified || '',
      
      // Section 5
      data.prep_reason || '', 
      data.other_reason || '', 
      data.day_1_pill || '', 
      data.day_2_pill || '', 
      data.day_3_pill || '', 
      data.day_4_pill || '', 
      data.day_5_pill || '', 
      data.day_6_pill || '', 
      data.day_7_pill || '', 
      data.pill_time || '', 
      data.pill_time_other || '', 
      data.pill_frequency || '', 
      data.pill_reminder || '', 
      data.pill_reminder_other || '',
      data.missed_pill_reasons || '', 
      data.missed_pill_other_reason || '', 
      data.longest_no_pill || '', 
      data.total_no_pill_days || '',
      
      // Section 6
      data.ed_prep_reason || '', 
      data.other_ed_prep_reason || '', 
      data.sex_last_month || '', 
      data.prep_before_sex || '',
      data.prep_after_sex || '', 
      data.first_prep_after_sex || '', 
      data.second_prep_after_sex || '', 
      data.sex_last_week || '', 
      data.prep_before_sex_week || '', 
      data.first_prep_after_sex_week || '',
      data.second_prep_after_sex_week || '', 
      data.prep_before_last_sex || '', 
      data.prep_before_last_sex_other || '',
      data.prep_after_last_sex || '', 
      data.prep_after_last_sex_other || '',

      // Section 7
      data.pill_remember || '',
      data.pill_remember_other || '',
      data.pill_missed || '',
      data.pill_missed_experiences || '',
      data.pill_missed_experiences_other || '',
       
      // Section 8
      data.pill_remember_difficulty || '',
      data.pill_sharing || '',
      data.pill_recipient || '',
      data.pill_recipient_other || '',
      
      // Section 9
      data.visited_pride_bhutan || '',           
      data.hiv_testing_reason || '',             
      data.sti_testing_reason || '',            
      data.other_reason_visited || '',                
      data.orw_meeting_one || '',                             
      data.received_condoms || '',              
      data.received_lubricant || '',

      // Section 10
      data.consumed_alcohol || '',               
      data.alcohol_days || '',                   
      data.alcohol_before_during_sex || '',      
      data.taken_drugs || '',                    
      data.drugs_before_during_sex || '',

      // Section 11
      data.protection_feeling || '',
      data.sti_concern || '',
      data.prep_package_opinion || '',
      data.participation_likes || '',
      data.participation_likes_other || '',
      data.participation_challenges || '',
      data.participation_challenges_other || '',
      data.delivery_preference || '',
      data.delivery_preference_other || '',
      data.satisfaction_level || '',

      // Section 12
      data.discontinuation_reasons || '',
      data.discontinuation_other || ''
    ]);

    // Return success response
    var response = {
      status: 'success',
      message: 'Exit form submitted successfully for UID: ' + (data.participant_uid || 'Unknown')
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Form6 Error:', error);
    
    var errorResponse = {
      status: 'error',
      message: 'Error submitting form: ' + error.toString()
    };

    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}