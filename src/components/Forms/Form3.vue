<template>
  <!-- Clinical Data Form -->
  <form @submit.prevent="showReviewModal">
    <div class="container">
      <!-- Container 1: Basic Info & Acute HIV -->
      <div class="form-container">
        <!-- Participant UID and Date -->
        <label for="participant_uid">Participant UID:</label>
        <input type="text" v-model="formData.participant_uid" id="participant_uid" name="participant_uid" required
          pattern="[A-Za-z0-9]{5,}" title="Minimum 5 Alphanumeric characters only" />
        <div v-if="statusMessage" id="status-message" :class="statusClass">
          {{ statusMessage }}
        </div>
        <span v-if="isCheckingUid" class="uid-spinner"><i class="fas fa-spinner fa-spin"></i> Checking...</span>

        <label for="dateInput">Date:</label>
        <input type="date" id="dateInput" v-model="formData.date" name="date" readonly />

        <!-- Visit Type Selection -->
        <div v-if="formData.participant_uid && validateUid(formData.participant_uid)">

          <!-- Loading check -->
          <div v-if="isCheckingVisits" style="text-align: center; padding: 1rem; color: #3498db;">
            <span class="uid-spinner"><i class="fas fa-spinner fa-spin"></i> Checking visits...</span>
          </div>

          <!-- Visit Selection -->
          <div v-else>
            <label style="margin-top: 1rem">TYPE OF VISIT:</label>

            <!-- Debug Info -->
            <div style="background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 4px; font-size: 0.8em;">
              <strong>Debug Info:</strong><br>
              UID: {{ formData.participant_uid }}<br>
              Is Valid: {{ validateUid(formData.participant_uid) }}<br>
              Available Visits: {{ availableVisits.length > 0 ? availableVisits.join(', ') : 'None found' }}<br>
              Current Selection: {{ formData.visit_type || 'None' }}<br>
              Is Prefilled: {{ isPrefilled }}
            </div>

            <!-- Show existing visits if any -->
            <div v-if="availableVisits.length > 0" style="margin-bottom: 1rem;">
              <p style="font-size: 0.9em; color: #3498db; margin-bottom: 0.5rem;">
                <strong>UPDATE existing data:</strong> ({{ availableVisits.length }} visit(s) found)
              </p>
              <!-- Debug info -->
              <p style="font-size: 0.8em; color: #666; margin-bottom: 0.5rem;">n
                Available visits: {{ availableVisits.join(', ') }}
              </p>
              <div class="radio-group-vertical"
                style="border: 1px solid #3498db; padding: 10px; background: #f0f8ff; border-radius: 5px;">
                <div v-for="visit in visitOptions.filter(v => availableVisits.includes(v.value))"
                  :key="'update-' + visit.value"
                  style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                  <label style="margin: 0; flex: 1; display: flex; align-items: center;">
                    <input type="radio" v-model="formData.visit_type" name="visit_type" :value="visit.value"
                      @click="loadVisitData(visit.value)" required />
                    {{ visit.label }}
                    <span style="color: #28a745; font-size: 0.85em; margin-left: 8px;">✓ Has Data</span>
                    <span v-if="isLoadingVisit === visit.value" style="margin-left: 10px;">
                      <i class="fas fa-spinner fa-spin"></i>
                    </span>
                  </label>
                  <button type="button" @click="confirmDeleteVisit(visit.value)"
                    :disabled="isDeletingVisit === visit.value" class="delete-visit-btn"
                    :title="`Delete ${visit.label} record`">
                    <span v-if="isDeletingVisit === visit.value">
                      Deleting...
                    </span>
                    <span v-else>
                      Delete
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Create new visit -->
            <div>
              <p style="font-size: 0.9em; color: #856404; margin-bottom: 0.5rem;">
                <strong>CREATE new visit data:</strong>
              </p>
              <div class="radio-group-vertical"
                style="border: 1px solid #ffc107; padding: 10px; background: #fffbf0; border-radius: 5px;">
                <label v-for="visit in visitOptions" :key="'create-' + visit.value">
                  <input type="radio" v-model="formData.visit_type" name="visit_type" :value="visit.value"
                    @click="createNewVisit(visit.value)" required />
                  {{ visit.label }}
                  <span style="color: #ffc107; font-size: 0.85em;">
                    {{ availableVisits.includes(visit.value) ? '+ Create Another' : '+ New' }}
                  </span>
                </label>
              </div>
            </div>

            <!-- Current mode display -->
            <div v-if="formData.visit_type"
              style="margin-top: 1rem; padding: 8px 12px; border-radius: 4px; font-size: 0.9em; text-align: center;"
              :style="isPrefilled ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;'">
              <strong>Selected:</strong> {{ formData.visit_type }}
              <span v-if="isPrefilled">(UPDATE MODE)</span>
              <span v-else>(CREATE MODE)</span>
            </div>

          </div>
        </div>

        <!-- Acute HIV Infection Section -->
        <h4 class="section-title">1. Acute HIV Infection</h4>
        <p>
          In the past 14 days, have you experienced any of the following? If
          yes, then indicate start date and whether it is ongoing or resolved.
        </p>

        <!-- Symptoms Table -->
        <div class="table-responsive">
          <table border="1" cellspacing="0" cellpadding="5" class="symptoms-table">
            <thead>
              <tr>
                <th>Symptoms</th>
                <th>Yes</th>
                <th>No</th>
                <th>If YES, Specify</th>
                <th>Start Date</th>
                <th>Ongoing</th>
                <th>Resolved</th>
                <th>Present on Exam</th>
              </tr>
            </thead>
            <tbody>
              <!-- Fever Row -->
              <tr>
                <td>Fever</td>
                <td>
                  <input type="radio" name="fever_status" v-model="formData.fever" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="fever_status" v-model="formData.fever" value="No" />
                </td>
                <td>
                  <input type="text" v-model="formData.fever_specify" :disabled="formData.fever !== 'Yes'" />
                </td>
                <td>
                  <input type="date" v-model="formData.fever_start_date" :disabled="formData.fever !== 'Yes'" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.fever_ongoing" :disabled="formData.fever !== 'Yes' || formData.fever_resolved
                    " @change="handleCheckboxChange('fever', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.fever_resolved" :disabled="formData.fever !== 'Yes' || formData.fever_ongoing
                    " @change="handleCheckboxChange('fever', 'resolved')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.fever_present" :disabled="formData.fever !== 'Yes'" />
                </td>
              </tr>
              <!-- Tiredness Row -->
              <tr>
                <td>Tiredness</td>
                <td>
                  <input type="radio" name="tiredness_status" v-model="formData.tiredness" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="tiredness_status" v-model="formData.tiredness" value="No" />
                </td>
                <td>
                  <input type="text" v-model="formData.tiredness_specify" :disabled="formData.tiredness !== 'Yes'" />
                </td>
                <td>
                  <input type="date" v-model="formData.tiredness_start_date" :disabled="formData.tiredness !== 'Yes'" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.tiredness_ongoing" :disabled="formData.tiredness !== 'Yes' ||
                    formData.tiredness_resolved
                    " @change="handleCheckboxChange('tiredness', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.tiredness_resolved" :disabled="formData.tiredness !== 'Yes' || formData.tiredness_ongoing
                    " @change="handleCheckboxChange('tiredness', 'resolved')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.tiredness_present"
                    :disabled="formData.tiredness !== 'Yes'" />
                </td>
              </tr>
              <!-- Lymph Node Enlargement Row -->
              <tr>
                <td>Lymph Node Enlargement</td>
                <td>
                  <input type="radio" name="lymph_status" v-model="formData.lymph_node" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="lymph_status" v-model="formData.lymph_node" value="No" />
                </td>
                <td>
                  <input type="text" v-model="formData.lymph_node_specify" :disabled="formData.lymph_node !== 'Yes'" />
                </td>
                <td>
                  <input type="date" v-model="formData.lymph_node_start_date"
                    :disabled="formData.lymph_node !== 'Yes'" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.lymph_node_ongoing" :disabled="formData.lymph_node !== 'Yes' ||
                    formData.lymph_node_resolved
                    " @change="handleCheckboxChange('lymph_node', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.lymph_node_resolved" :disabled="formData.lymph_node !== 'Yes' ||
                    formData.lymph_node_ongoing
                    " @change="handleCheckboxChange('lymph_node', 'resolved')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.lymph_node_present"
                    :disabled="formData.lymph_node !== 'Yes'" />
                </td>
              </tr>
              <!-- Tonsilitis Row -->
              <tr>
                <td>Tonsilitis</td>
                <td>
                  <input type="radio" name="tonsilitis_status" v-model="formData.tonsilitis" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="tonsilitis_status" v-model="formData.tonsilitis" value="No" />
                </td>
                <td>
                  <input type="text" v-model="formData.tonsilitis_specify" :disabled="formData.tonsilitis !== 'Yes'" />
                </td>
                <td>
                  <input type="date" v-model="formData.tonsilitis_start_date"
                    :disabled="formData.tonsilitis !== 'Yes'" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.tonsilitis_ongoing" :disabled="formData.tonsilitis !== 'Yes' ||
                    formData.tonsilitis_resolved
                    " @change="handleCheckboxChange('tonsilitis', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.tonsilitis_resolved" :disabled="formData.tonsilitis !== 'Yes' ||
                    formData.tonsilitis_ongoing
                    " @change="handleCheckboxChange('tonsilitis', 'resolved')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.tonsilitis_present"
                    :disabled="formData.tonsilitis !== 'Yes'" />
                </td>
              </tr>
              <!-- Sore Throat Row -->
              <tr>
                <td>Sore Throat</td>
                <td>
                  <input type="radio" name="sore_throat_status" v-model="formData.sore_throat" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="sore_throat_status" v-model="formData.sore_throat" value="No" />
                </td>
                <td>
                  <input type="text" v-model="formData.sore_throat_specify"
                    :disabled="formData.sore_throat !== 'Yes'" />
                </td>
                <td>
                  <input type="date" v-model="formData.sore_throat_start_date"
                    :disabled="formData.sore_throat !== 'Yes'" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.sore_throat_ongoing" :disabled="formData.sore_throat !== 'Yes' ||
                    formData.sore_throat_resolved
                    " @change="handleCheckboxChange('sore_throat', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.sore_throat_resolved" :disabled="formData.sore_throat !== 'Yes' ||
                    formData.sore_throat_ongoing
                    " @change="handleCheckboxChange('sore_throat', 'resolved')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.sore_throat_present"
                    :disabled="formData.sore_throat !== 'Yes'" />
                </td>
              </tr>
              <!-- Joint/Muscle Aches Row -->
              <tr>
                <td>Joint and Muscle Aches</td>
                <td>
                  <input type="radio" name="joint_aches_status" v-model="formData.joint_aches" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="joint_aches_status" v-model="formData.joint_aches" value="No" />
                </td>
                <td>
                  <input type="text" v-model="formData.joint_aches_specify"
                    :disabled="formData.joint_aches !== 'Yes'" />
                </td>
                <td>
                  <input type="date" v-model="formData.joint_aches_start_date"
                    :disabled="formData.joint_aches !== 'Yes'" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.joint_aches_ongoing" :disabled="formData.joint_aches !== 'Yes' ||
                    formData.joint_aches_resolved
                    " @change="handleCheckboxChange('joint_aches', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.joint_aches_resolved" :disabled="formData.joint_aches !== 'Yes' ||
                    formData.joint_aches_ongoing
                    " @change="handleCheckboxChange('joint_aches', 'resolved')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.joint_aches_present"
                    :disabled="formData.joint_aches !== 'Yes'" />
                </td>
              </tr>
              <!-- Diarrhoea Row -->
              <tr>
                <td>Diarrhoea</td>
                <td>
                  <input type="radio" name="diarrhoea_status" v-model="formData.diarrhoea" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="diarrhoea_status" v-model="formData.diarrhoea" value="No" />
                </td>
                <td>
                  <input type="text" v-model="formData.diarrhoea_specify" :disabled="formData.diarrhoea !== 'Yes'" />
                </td>
                <td>
                  <input type="date" v-model="formData.diarrhoea_start_date" :disabled="formData.diarrhoea !== 'Yes'" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.diarrhoea_ongoing" :disabled="formData.diarrhoea !== 'Yes' ||
                    formData.diarrhoea_resolved
                    " @change="handleCheckboxChange('diarrhoea', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.diarrhoea_resolved" :disabled="formData.diarrhoea !== 'Yes' || formData.diarrhoea_ongoing
                    " @change="handleCheckboxChange('diarrhoea', 'resolved')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.diarrhoea_present"
                    :disabled="formData.diarrhoea !== 'Yes'" />
                </td>
              </tr>
              <!-- Rash Row -->
              <tr>
                <td>Rash</td>
                <td>
                  <input type="radio" name="rash_status" v-model="formData.rash" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="rash_status" v-model="formData.rash" value="No" />
                </td>
                <td>
                  <input type="text" v-model="formData.rash_specify" :disabled="formData.rash !== 'Yes'" />
                </td>
                <td>
                  <input type="date" v-model="formData.rash_start_date" :disabled="formData.rash !== 'Yes'" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.rash_ongoing" :disabled="formData.rash !== 'Yes' || formData.rash_resolved
                    " @change="handleCheckboxChange('rash', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.rash_resolved"
                    :disabled="formData.rash !== 'Yes' || formData.rash_ongoing"
                    @change="handleCheckboxChange('rash', 'resolved')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.rash_present" :disabled="formData.rash !== 'Yes'" />
                </td>
              </tr>
              <!-- Other Symptoms Row -->
              <tr>
                <td>Others (specify)</td>
                <td>
                  <input type="radio" name="other_symptoms_status" v-model="formData.other_symptoms" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="other_symptoms_status" v-model="formData.other_symptoms" value="No" />
                </td>
                <td>
                  <input type="text" v-model="formData.other_symptoms_specify"
                    :disabled="formData.other_symptoms !== 'Yes'" />
                </td>
                <td>
                  <input type="date" v-model="formData.other_symptoms_start_date"
                    :disabled="formData.other_symptoms !== 'Yes'" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.other_symptoms_ongoing" :disabled="formData.other_symptoms !== 'Yes' ||
                    formData.other_symptoms_resolved
                    " @change="handleCheckboxChange('other_symptoms', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.other_symptoms_resolved" :disabled="formData.other_symptoms !== 'Yes' ||
                    formData.other_symptoms_ongoing
                    " @change="handleCheckboxChange('other_symptoms', 'resolved')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.other_symptoms_present"
                    :disabled="formData.other_symptoms !== 'Yes'" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <label style="margin-top: 1rem">If yes to any of the items above, is there a report of a possible
          recent HIV exposure (e.g. condomless sex/injecting drug use) in the
          past 14 days?</label>
        <div style="display: flex; gap: 20px; margin-bottom: 1rem">
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            "><input type="radio" v-model="formData.recent_hiv_exposure" name="recent_hiv_exposure" value="Yes" />
            YES</label>
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            "><input type="radio" v-model="formData.recent_hiv_exposure" name="recent_hiv_exposure" value="No" />
            NO</label>
        </div>

        <div v-if="formData.recent_hiv_exposure === 'Yes'">
          <label for="describe_exposure">If yes, describe:</label>
          <textarea v-model="formData.describe_exposure" id="describe_exposure" name="describe_exposure" rows="4"
            cols="50"></textarea>
        </div>
      </div>

      <!-- Container 2: Syndromic STI Management -->
      <div class="form-container">
        <h3 class="section-title">2. Syndromic STI Management</h3>
        <div class="table-responsive">
          <table border="1" cellspacing="0" cellpadding="5" class="symptoms-table">
            <thead>
              <tr>
                <th>Symptoms</th>
                <th>Yes</th>
                <th>No</th>
                <th>Start Date</th>
                <th>If YES, Specify</th>
                <th>Referred/Treatment Provided</th>
              </tr>
            </thead>
            <tbody>
              <!-- Vaginal/urethral Discharge -->
              <tr>
                <td>Vaginal/urethral Discharge</td>
                <td>
                  <input type="radio" name="vag_discharge_status" v-model="formData.vaginal_discharge" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="vag_discharge_status" v-model="formData.vaginal_discharge" value="No" />
                </td>
                <td>
                  <input type="date" v-model="formData.vaginal_discharge_start_date"
                    :disabled="formData.vaginal_discharge !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.vaginal_discharge_specify"
                    :disabled="formData.vaginal_discharge !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.vaginal_discharge_treatment"
                    :disabled="formData.vaginal_discharge !== 'Yes'" />
                </td>
              </tr>
              <!-- Lower Abdominal Pain -->
              <tr>
                <td>Lower Abdominal Pain</td>
                <td>
                  <input type="radio" name="abdo_pain_status" v-model="formData.lower_abdominal_pain" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="abdo_pain_status" v-model="formData.lower_abdominal_pain" value="No" />
                </td>
                <td>
                  <input type="date" v-model="formData.lower_abdominal_pain_start_date"
                    :disabled="formData.lower_abdominal_pain !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.lower_abdominal_pain_specify"
                    :disabled="formData.lower_abdominal_pain !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.lower_abdominal_pain_treatment"
                    :disabled="formData.lower_abdominal_pain !== 'Yes'" />
                </td>
              </tr>
              <!-- Anorectal Discharge -->
              <tr>
                <td>Anorectal discharge</td>
                <td>
                  <input type="radio" name="anorectal_discharge_status" v-model="formData.anorectal_discharge"
                    value="Yes" />
                </td>
                <td>
                  <input type="radio" name="anorectal_discharge_status" v-model="formData.anorectal_discharge"
                    value="No" />
                </td>
                <td>
                  <input type="date" v-model="formData.anorectal_discharge_start_date"
                    :disabled="formData.anorectal_discharge !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.anorectal_discharge_specify"
                    :disabled="formData.anorectal_discharge !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.anorectal_discharge_treatment"
                    :disabled="formData.anorectal_discharge !== 'Yes'" />
                </td>
              </tr>
              <!-- Genital/anal sore/blister/warts -->
              <tr>
                <td>Genital/anal sore/blister/warts</td>
                <td>
                  <input type="radio" name="genital_sore_status" v-model="formData.genital_sore" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="genital_sore_status" v-model="formData.genital_sore" value="No" />
                </td>
                <td>
                  <input type="date" v-model="formData.genital_sore_start_date"
                    :disabled="formData.genital_sore !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.genital_sore_specify"
                    :disabled="formData.genital_sore !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.genital_sore_treatment"
                    :disabled="formData.genital_sore !== 'Yes'" />
                </td>
              </tr>
              <!-- Pain/burning with urination -->
              <tr>
                <td>Pain/burning with urination</td>
                <td>
                  <input type="radio" name="urination_pain_status" v-model="formData.pain_with_urination" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="urination_pain_status" v-model="formData.pain_with_urination" value="No" />
                </td>
                <td>
                  <input type="date" v-model="formData.pain_with_urination_start_date"
                    :disabled="formData.pain_with_urination !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.pain_with_urination_specify"
                    :disabled="formData.pain_with_urination !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.pain_with_urination_treatment"
                    :disabled="formData.pain_with_urination !== 'Yes'" />
                </td>
              </tr>
              <!-- Swelling in the groin -->
              <tr>
                <td>Swelling in the groin</td>
                <td>
                  <input type="radio" name="groin_swelling_status" v-model="formData.swelling_in_groin" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="groin_swelling_status" v-model="formData.swelling_in_groin" value="No" />
                </td>
                <td>
                  <input type="date" v-model="formData.swelling_in_groin_start_date"
                    :disabled="formData.swelling_in_groin !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.swelling_in_groin_specify"
                    :disabled="formData.swelling_in_groin !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.swelling_in_groin_treatment"
                    :disabled="formData.swelling_in_groin !== 'Yes'" />
                </td>
              </tr>
              <!-- Rash -->
              <tr>
                <td>Rash</td>
                <td>
                  <input type="radio" name="rash_data_status" v-model="formData.rash_data_resolved" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="rash_data_status" v-model="formData.rash_data_resolved" value="No" />
                </td>
                <td>
                  <input type="date" v-model="formData.rash_data_resolved_start_date"
                    :disabled="formData.rash_data_resolved !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.rash_data_resolved_specify"
                    :disabled="formData.rash_data_resolved !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.rash_data_resolved_treatment"
                    :disabled="formData.rash_data_resolved !== 'Yes'" />
                </td>
              </tr>
              <!-- Other Symptoms -->
              <tr>
                <td>Other (Specify)</td>
                <td>
                  <input type="radio" name="oth_symptoms_status" v-model="formData.oth_symptoms" value="Yes" />
                </td>
                <td>
                  <input type="radio" name="oth_symptoms_status" v-model="formData.oth_symptoms" value="No" />
                </td>
                <td>
                  <input type="date" v-model="formData.oth_symptoms_start_date"
                    :disabled="formData.oth_symptoms !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.oth_symptoms_specify"
                    :disabled="formData.oth_symptoms !== 'Yes'" />
                </td>
                <td>
                  <input type="text" v-model="formData.oth_symptoms_treatment"
                    :disabled="formData.oth_symptoms !== 'Yes'" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Container 3: Clinical Findings -->
      <div class="form-container">
        <h3 class="section-title">3. Clinical Findings</h3>
        <div class="table-responsive">
          <table border="1" cellspacing="0" cellpadding="5" class="findings-table">
            <thead>
              <tr>
                <th>Assessment</th>
                <th>If yes, specify</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Acute HIV</td>
                <td>
                  <input type="text" v-model="formData.acute_hiv_specify" placeholder="Specify if yes" />
                </td>
              </tr>
              <tr>
                <td>STI</td>
                <td>
                  <input type="text" v-model="formData.sti_specify" placeholder="Specify if yes" />
                </td>
              </tr>
              <tr>
                <td>Others (specify)</td>
                <td>
                  <input type="text" v-model="formData.other_specify" placeholder="Specify if yes" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Container 4: Disease History & Meds -->
      <div class="form-container">
        <h3 class="section-title">4. Disease History and Medications</h3>

        <label>Do you currently have, or had in the past, any kidney disease,
          diabetes, hypertension, or thyroid problem?</label>
        <div style="display: flex; gap: 20px; margin-bottom: 1rem">
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            "><input type="radio" v-model="formData.disease_history" name="disease_history" value="Yes" />
            YES</label>
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            "><input type="radio" v-model="formData.disease_history" name="disease_history" value="No" />
            NO</label>
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            "><input type="radio" v-model="formData.disease_history" name="disease_history"
              value="Not sure/Don’t know" />
            Not sure/Don’t know</label>
        </div>

        <div v-if="formData.disease_history === 'Yes'">
          <label for="disease_specify">If yes, please specify the illness, dates, diagnosis, and
            treatments:<br />(Please note dates of illness/disease, date of
            diagnosis and conditions as well as any courses of treatment)</label>
          <textarea v-model="formData.disease_specify" id="disease_specify" rows="4"
            placeholder="Specify details..."></textarea>
        </div>

        <label>Are you currently on any medications, including traditional or
          alternative medications?</label>
        <div style="display: flex; gap: 20px; margin-bottom: 1rem">
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            "><input type="radio" v-model="formData.current_medications" name="current_medications" value="Yes" />
            YES</label>
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            "><input type="radio" v-model="formData.current_medications" name="current_medications" value="No" />
            NO</label>
        </div>

        <div v-if="formData.current_medications === 'Yes'">
          <label for="medication_specify">If yes, please list the medications (Do not include medications
            prescribed at this visit):</label>
          <textarea v-model="formData.medication_specify" id="medication_specify" rows="3"
            placeholder="List current medications"></textarea>
        </div>

        <label>Are you allergic to any medications?</label>
        <div style="display: flex; gap: 20px; margin-bottom: 1rem">
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            "><input type="radio" v-model="formData.medication_allergies" name="medication_allergies" value="Yes" />
            YES</label>
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            "><input type="radio" v-model="formData.medication_allergies" name="medication_allergies" value="No" />
            NO</label>
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            "><input type="radio" v-model="formData.medication_allergies" name="medication_allergies"
              value="Not sure/Don’t know" />
            Not sure/Don’t know</label>
        </div>

        <div v-if="formData.medication_allergies === 'Yes'">
          <label for="allergy_specify">If yes, please indicate the name(s) of the medication(s) you're
            allergic to:</label>
          <textarea v-model="formData.allergy_specify" id="allergy_specify" rows="3"
            placeholder="Specify medication allergies"></textarea>
        </div>
      </div>

      <!-- Container 5: Test Results -->
      <div class="form-container">
        <h3 class="section-title">5. Test Results</h3>
        <div class="table-responsive">
          <table border="1" cellspacing="0" cellpadding="5" class="tests-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Date of Sample Drawn<br />(DD/MM/YYYY)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>HIV Rapid test (3rd generation RDT)</td>
                <td>
                  <input type="date" v-model="formData.hiv_rapid_sample_date" />
                </td>
              </tr>
              <tr>
                <td>HIV 4th generation test</td>
                <td>
                  <input type="date" v-model="formData.hiv_4th_sample_date" />
                </td>
              </tr>
              <tr>
                <td>Hepatitis B* (HBsAg)</td>
                <td>
                  <input type="date" v-model="formData.hepatitis_b_sample_date" />
                </td>
              </tr>
              <tr>
                <td>Hepatitis C (Anti-HCV)</td>
                <td>
                  <input type="date" v-model="formData.hepatitis_C_sample_date" />
                </td>
              </tr>
              <tr>
                <td>Syphilis</td>
                <td>
                  <input type="date" v-model="formData.syphilis_sample_date" />
                </td>
              </tr>
              <tr>
                <td>Kidney function (serum Creatinine)**</td>
                <td>
                  <input type="date" v-model="formData.kidney_function_sample_date" />
                </td>
              </tr>
              <tr>
                <td>Test for N. Gonorrhoea</td>
                <td>
                  <input type="date" v-model="formData.gonorrhoea_sample_date" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style="font-size: 0.9em; color: #555; margin-top: 0.5rem">
          *For those who received HBV, HBsAg is not required.<br />
          **To calculate creatinine clearance (Cockcroft-Gault); recommended
          range: 0.6 - 1.2 mg/dl.
        </p>
      </div>

      <!-- Container 6: Assessment & Dispensing -->
      <div class="form-container">
        <h3 class="section-title">6. Assessment Notes and Dispensing</h3>
        <label for="assessment_notes"><strong>Assessment Notes:</strong> (Note overall assessment,
          suitability, side effects, medications prescribed, referrals)</label>
        <textarea v-model="formData.assessment_notes" id="assessment_notes" name="assessment_notes" rows="6"
          placeholder="Enter assessment details..."></textarea>

        <label>PrEP dispensed:</label>
        <div style="display: flex; gap: 20px; margin-bottom: 1rem">
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            ">
            <input type="radio" v-model="formData.prep_dispensed" name="prep_dispensed" value="Yes" required />
            YES
          </label>
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            ">
            <input type="radio" v-model="formData.prep_dispensed" name="prep_dispensed" value="No" required />
            NO
          </label>
        </div>

        <div v-if="formData.prep_dispensed === 'Yes'">
          <label for="prep_bottles">If YES, mention the number of bottles:</label>
          <input type="number" v-model.number="formData.prep_bottles" id="prep_bottles" name="prep_bottles" min="1"
            placeholder="Enter number" />
        </div>

        <!-- THIS IS THE NEWLY ADDED BLOCK -->
        <div v-if="formData.prep_dispensed === 'Yes'">
          <label for="regimen_for_prep">Regimen for PrEP:</label>
          <input type="text" v-model="formData.regimen_for_prep" id="regimen_for_prep" name="regimen_for_prep"
            placeholder="e.g., Daily PrEP" required />
        </div>
        <!-- END OF NEWLY ADDED BLOCK -->

        <label for="clinician_information_date">Date:</label>
        <input type="date" v-model="formData.clinician_information_date" id="clinician_information_date"
          name="clinician_information_date" required />

        <label for="clinician_name">Clinician Name:</label>
        <input type="text" v-model="formData.clinician_name" id="clinician_name" name="clinician_name" readonly />

        <label for="clinician_designation">Designation:</label>
        <input type="text" v-model="formData.designation" id="clinician_designation" name="designation" readonly />

        <label for="bhmc_registration">BHMC Registration:</label>
        <input type="text" v-model="formData.bhmc_registration" id="bhmc_registration" name="bhmc_registration"
          readonly />
      </div>


      <!-- Submit/Update Button outside the last container -->
      <div class="button-container">
        <button type="submit" class="submit-btn" :disabled="submitDisabled || isSubmitting">
          {{ getSubmitButtonText() }}
        </button>

        <!-- Show status if form was prefilled -->
        <div v-if="isPrefilled" class="prefill-status">
          <i class="fas fa-info-circle"></i> Form loaded with existing data for {{ formData.participant_uid }}
        </div>
      </div>
    </div>
    <!-- End .container -->
  </form>

  <!-- Confirmation Modal -->
  <Form3_ConfirmationModal v-if="isReviewModalVisible" :formData="formData" :isSubmitting="isSubmitting"
    :successMessage="modalSuccessMessage" :errorMessage="modalErrorMessage" @confirm="confirmAndSubmit"
    @cancel="cancelReview" />

  <!-- Final Messages outside modal -->
  <div v-if="!isReviewModalVisible && finalSubmitMessage" :class="finalSubmitClass" class="final-message">
    <p>{{ finalSubmitMessage }}</p>
  </div>
  <div v-if="!isReviewModalVisible && !finalSubmitMessage" style="text-align: center; margin-top: 20px">
    <h4 class="section-title" style="margin-bottom: 1rem; font-size: 1.2rem">
      Thank you for your time.
    </h4>
    <!-- Original general message display (optional) -->
    <div v-if="successMessage && !finalSubmitMessage" class="success-message mt-2">
      <p>{{ successMessage }}</p>
    </div>
    <div v-if="errorMessage && !finalSubmitMessage" class="error-message">
      <p>{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import Form3_ConfirmationModal from "./Form3_ConfirmationModal.vue";

// // --- Configuration ---
// const GOOGLE_SCRIPT_URL =
//   "https://script.google.com/macros/s/AKfycbyTRBjdyQBUxWvo6HDNNSbhVLAXjkHMK8_gG1uLMce3jfONVrUQ5frhY1RqUmvRfJngIg/exec";
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyrCclmQ__KN8hAq-Dm93ef18qGCKDzKBgHRMYgluO9Q6DGJm-vHUi6G3uD_BnR2K-TxA/exec';
const CSV_DATA_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfG6e5EIcHDaXopn9DxMZnTwVFGi5CiQxmKlEIPsd7uPtZiQIikYb46UdN78UhZlJfocCfl_s0hGGX/pub?gid=0&single=true&output=csv";
const UID_MIN_LENGTH = 5;
const SUBMIT_SUCCESS_DELAY = 2500;

// --- State Variables ---
const formData = ref({
  participant_uid: "",
  date: "",
  // Acute HIV Symptoms
  fever: "",
  fever_start_date: "",
  fever_ongoing: false,
  fever_resolved: false,
  fever_present: false,
  tiredness: "",
  tiredness_specify: "",
  tiredness_start_date: "",
  tiredness_ongoing: false,
  tiredness_resolved: false,
  tiredness_present: false,
  lymph_node: "",
  lymph_node_specify: "",
  lymph_node_start_date: "",
  lymph_node_ongoing: false,
  lymph_node_resolved: false,
  lymph_node_present: false,
  tonsilitis: "",
  tonsilitis_specify: "",
  tonsilitis_start_date: "",
  tonsilitis_ongoing: false,
  tonsilitis_resolved: false,
  tonsilitis_present: false,
  sore_throat: "",
  sore_throat_specify: "",
  sore_throat_start_date: "",
  sore_throat_ongoing: false,
  sore_throat_resolved: false,
  sore_throat_present: false,
  joint_aches: "",
  joint_aches_specify: "",
  joint_aches_start_date: "",
  joint_aches_ongoing: false,
  joint_aches_resolved: false,
  joint_aches_present: false,
  diarrhoea: "",
  diarrhoea_specify: "",
  diarrhoea_start_date: "",
  diarrhoea_ongoing: false,
  diarrhoea_resolved: false,
  diarrhoea_present: false,
  rash: "",
  rash_specify: "",
  rash_start_date: "",
  rash_ongoing: false,
  rash_resolved: false,
  rash_present: false,
  other_symptoms: "",
  other_symptoms_specify: "",
  other_symptoms_start_date: "",
  other_symptoms_ongoing: false,
  other_symptoms_resolved: false,
  other_symptoms_present: false,
  recent_hiv_exposure: "",
  describe_exposure: "",
  // Syndromic STI
  vaginal_discharge: "",
  vaginal_discharge_start_date: "",
  vaginal_discharge_specify: "",
  vaginal_discharge_treatment: "",
  lower_abdominal_pain: "",
  lower_abdominal_pain_start_date: "",
  lower_abdominal_pain_specify: "",
  lower_abdominal_pain_treatment: "",
  anorectal_discharge: "",
  anorectal_discharge_start_date: "",
  anorectal_discharge_specify: "",
  anorectal_discharge_treatment: "",
  genital_sore: "",
  genital_sore_start_date: "",
  genital_sore_specify: "",
  genital_sore_treatment: "",
  pain_with_urination: "",
  pain_with_urination_start_date: "",
  pain_with_urination_specify: "",
  pain_with_urination_treatment: "",
  swelling_in_groin: "",
  swelling_in_groin_start_date: "",
  swelling_in_groin_specify: "",
  swelling_in_groin_treatment: "",
  rash_data_resolved: "",
  rash_data_resolved_start_date: "",
  rash_data_resolved_specify: "",
  rash_data_resolved_treatment: "",
  oth_symptoms: "",
  oth_symptoms_start_date: "",
  oth_symptoms_specify: "",
  oth_symptoms_treatment: "",
  // Clinical Findings
  acute_hiv_specify: "",
  sti_specify: "",
  other_specify: "",
  // Disease History & Meds
  disease_history: "",
  disease_specify: "",
  current_medications: "",
  medication_specify: "",
  medication_allergies: "",
  allergy_specify: "",
  // Test Results
  hiv_rapid_sample_date: "",
  hiv_4th_sample_date: "",
  hepatitis_b_sample_date: "",
  hepatitis_C_sample_date: "",
  syphilis_sample_date: "",
  kidney_function_sample_date: "",
  gonorrhoea_sample_date: "",
  // Assessment & Dispensing
  assessment_notes: "",
  prep_dispensed: "",
  // THIS IS THE NEWLY ADDED FIELD
  regimen_for_prep: "",
  prep_bottles: null,
  clinician_information_date: "",
  clinician_name: "",
  designation: "",
  bhmc_registration: "",
});

const statusMessage = ref("");
const statusClass = ref("");
const submitDisabled = ref(true);
const isCheckingUid = ref(false);
const isSubmitting = ref(false);
const isReviewModalVisible = ref(false);
const modalSuccessMessage = ref("");
const modalErrorMessage = ref("");
const finalSubmitMessage = ref("");
const finalSubmitClass = ref("");
const successMessage = ref("");
const errorMessage = ref("");
const isPrefilled = ref(false); // Track if form was prefilled with existing data
const previousVisitType = ref(""); // Store the previous visit type from prefilled data
const isLoadingVisit = ref(null); // Track which visit is being loaded
const visitDataStatus = ref({}); // Track which visits have data: { 'End of M1': 'Has Data', 'End of M3': 'No Data' }
const availableVisits = ref([]); // Store which visit types have data for current UID
const isCheckingVisits = ref(false); // Track when checking for available visits
const isDeletingVisit = ref(null); // Track which visit is being deleted
let csvData = [];

// --- Functions ---
const initializeDate = () => {
  formData.value.date = new Date().toISOString().split("T")[0];
};
const fetchCsvData = async () => {
  isCheckingUid.value = true;
  statusMessage.value = "Loading validation data...";
  statusClass.value = "";
  submitDisabled.value = true;
  try {
    const response = await fetch(CSV_DATA_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const csvText = await response.text();
    csvData = csvText
      .split("\n")
      .map((row) =>
        row.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
      );
    statusMessage.value = "Validation data loaded. Please enter UID.";
    if (formData.value.participant_uid)
      validateUidOnInput(formData.value.participant_uid);
    else submitDisabled.value = true;
  } catch (error) {
    statusMessage.value = "Error loading validation data. Cannot check UID.";
    statusClass.value = "error";
    csvData = [];
    submitDisabled.value = true;
  } finally {
    isCheckingUid.value = false;
    if (
      !formData.value.participant_uid &&
      statusMessage.value.includes("Loading")
    )
      statusMessage.value = "";
  }
};
const validateUid = (uid) => {
  if (!uid || !csvData || csvData.length <= 1) return false;
  const normalizedUid = uid.trim().toLowerCase();
  return csvData
    .slice(1)
    .some((row) => row.length > 1 && row[1]?.toLowerCase() === normalizedUid);
};
const validateUidOnInput = (newUid) => {
  clearFinalMessage();
  modalErrorMessage.value = "";
  modalSuccessMessage.value = "";
  if (!newUid) {
    statusMessage.value = "";
    statusClass.value = "";
    submitDisabled.value = true;
    return;
  }
  const pattern = new RegExp(`^[A-Za-z0-9]{${UID_MIN_LENGTH},}$`);
  if (!pattern.test(newUid)) {
    statusMessage.value = `UID must be at least ${UID_MIN_LENGTH} alphanumeric chars.`;
    statusClass.value = "error";
    submitDisabled.value = true;
  } else if (isCheckingUid.value) {
    statusMessage.value = "Checking UID...";
    statusClass.value = "";
    submitDisabled.value = true;
  } else if (csvData.length <= 1 && !isCheckingUid.value) {
    statusMessage.value = "Validation data not available.";
    statusClass.value = "error";
    submitDisabled.value = true;
  } else {
    if (validateUid(newUid)) {
      statusMessage.value = "Participant UID found!";
      statusClass.value = "success";
      submitDisabled.value = false;

      // Check available visits for this UID
      checkAvailableVisits(newUid);
    } else {
      statusMessage.value = "Participant UID not found.";
      statusClass.value = "error";
      submitDisabled.value = true;
      availableVisits.value = []; // Clear available visits
    }
  }
};
watch(() => formData.value.participant_uid, validateUidOnInput);

// Modal Control
const showReviewModal = () => {
  if (submitDisabled.value) {
    modalErrorMessage.value = "Invalid UID.";
    return;
  }
  modalSuccessMessage.value = "";
  modalErrorMessage.value = "";
  clearFinalMessage();
  isReviewModalVisible.value = true;
};
const cancelReview = () => {
  isReviewModalVisible.value = false;
};

// Submission
// const confirmAndSubmit = async () => {
//   isSubmitting.value = true;
//   modalSuccessMessage.value = "";
//   modalErrorMessage.value = "";
//   clearFinalMessage();

//   const url = GOOGLE_SCRIPT_URL;
//   try {
//     const dataToSend = { ...formData.value };
//     Object.keys(dataToSend).forEach((key) => {
//       if (typeof dataToSend[key] === "boolean")
//         dataToSend[key] = dataToSend[key] ? "Yes" : "No";
//     });
//     if (dataToSend.prep_dispensed === "No") dataToSend.prep_bottles = "";

//     const formDataSerialized = new URLSearchParams(dataToSend).toString();

//     const response = await axios.post(url, formDataSerialized, {
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     });

//     if (
//       response.status === 200 &&
//       response.data &&
//       response.data.status === "success"
//     ) {
//       modalSuccessMessage.value =
//         response.data.message || "Form submitted successfully!";
//       setTimeout(() => {
//         isReviewModalVisible.value = false;
//         setFinalMessage(
//           response.data.message || "Form submitted successfully!",
//           "success"
//         );
//         clearForm();
//         statusMessage.value = "";
//         statusClass.value = "";
//         submitDisabled.value = true;
//         modalSuccessMessage.value = "";
//       }, SUBMIT_SUCCESS_DELAY);
//     } else {
//       modalErrorMessage.value = response.data.message || "Submission failed.";
//     }
//   } catch (error) {
//     let detailedError = "Error submitting the form.";
//     if (error.response) detailedError += ` (Status: ${error.response.status})`;
//     else if (error.request) detailedError += " (No response)";
//     else detailedError += ` (${error.message})`;
//     modalErrorMessage.value = detailedError;
//   } finally {
//     isSubmitting.value = false;
//   }
// };


// Submission
const confirmAndSubmit = async () => {
  isSubmitting.value = true;
  modalSuccessMessage.value = "";
  modalErrorMessage.value = "";
  clearFinalMessage();

  const url = GOOGLE_SCRIPT_URL;

  // Use a standard FormData object, which is the most reliable way.
  const dataToSend = new FormData();

  // Go through each key in your Vue form's data
  for (const key in formData.value) {
    let value = formData.value[key];

    // Convert boolean true/false to "Yes" or "No" strings
    if (typeof value === 'boolean') {
      value = value ? 'Yes' : 'No';
    }

    // Make sure null values are sent as empty strings
    if (value === null) {
      value = '';
    }

    // Append each piece of data to the FormData object
    dataToSend.append(key, value);
  }

  // Special case: if prep is not dispensed, ensure bottles is empty
  if (formData.value.prep_dispensed === 'No') {
    dataToSend.set('prep_bottles', '');
  }

  try {
    // We will use the 'fetch' API directly as it often handles redirects more gracefully.
    const response = await fetch(url, {
      method: 'POST',
      body: dataToSend,
    });

    // Manually parse the JSON response from the script
    const result = await response.json();

    if (response.ok && result.status === 'success') {
      modalSuccessMessage.value = result.message || "Form submitted successfully!";
      setTimeout(() => {
        isReviewModalVisible.value = false;
        setFinalMessage(result.message || "Form submitted successfully!", "success");
        clearForm();
        statusMessage.value = "";
        statusClass.value = "";
        submitDisabled.value = true;
        modalSuccessMessage.value = "";
      }, SUBMIT_SUCCESS_DELAY);
    } else {
      // Use the error message from the script if it exists
      modalErrorMessage.value = result.message || "Submission failed. The script returned an error.";
    }
  } catch (error) {
    console.error("Submission Error:", error);
    modalErrorMessage.value = "A network error occurred. Could not connect to the server.";
  } finally {
    isSubmitting.value = false;
  }
};

// Ongoing/Resolved Checkbox Handler
const handleCheckboxChange = (symptom, type) => {
  const ongoingKey = `${symptom}_ongoing`;
  const resolvedKey = `${symptom}_resolved`;
  if (type === "ongoing" && formData.value[ongoingKey])
    formData.value[resolvedKey] = false;
  else if (type === "resolved" && formData.value[resolvedKey])
    formData.value[ongoingKey] = false;
};

// Clear Form
const clearForm = () => {
  const clinicianDetails = {
    clinician_name: formData.value.clinician_name,
    designation: formData.value.designation,
    bhmc_registration: formData.value.bhmc_registration,
  };

  Object.keys(formData.value).forEach((key) => {
    if (key in clinicianDetails || key === "date") return;
    if (Array.isArray(formData.value[key])) formData.value[key] = [];
    else if (typeof formData.value[key] === "boolean")
      formData.value[key] = false;
    else if (typeof formData.value[key] === "number")
      formData.value[key] = null;
    else formData.value[key] = "";
  });

  Object.assign(formData.value, clinicianDetails);
  initializeDate();
  statusMessage.value = "";
  statusClass.value = "";
  submitDisabled.value = true;
  clearFinalMessage();
  successMessage.value = "";
  errorMessage.value = "";
  isPrefilled.value = false; // Reset prefill status
  previousVisitType.value = ""; // Reset previous visit type
};

// Logged In User
const getLoggedInUser = () => {
  try {
    const user = localStorage.getItem("loggedInUser");
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

// Final Message Utils
function setFinalMessage(message, type) {
  finalSubmitMessage.value = message;
  finalSubmitClass.value = type === "success" ? "success-final" : "error-final";
}
function clearFinalMessage() {
  finalSubmitMessage.value = "";
  finalSubmitClass.value = "";
}

// Dynamic button text based on form state
const getSubmitButtonText = () => {
  if (isSubmitting.value) {
    return isPrefilled.value ? "Updating..." : "Submitting...";
  }
  return isPrefilled.value ? "Update Data" : "Review Data";
};

// === VISIT TYPE OPTIONS ===
const visitOptions = [
  { value: "Screening Visit MO", label: "SCREENING VISIT MO", icon: "🩺" },
  { value: "End of M1", label: "END OF M1", icon: "1️⃣" },
  { value: "End of M3", label: "END OF M3", icon: "3️⃣" },
  { value: "End of M6", label: "END OF M6", icon: "6️⃣" },
  { value: "End of M9", label: "END OF M9", icon: "9️⃣" },
  { value: "Exit Visit M12", label: "EXIT VISIT M12", icon: "🏁" }
];

// === LOAD VISIT DATA FUNCTION ===
// Load data for a specific visit type
const loadVisitData = async (visitType) => {
  if (!formData.value.participant_uid || !validateUid(formData.value.participant_uid)) {
    alert('Please enter a valid UID first');
    return;
  }

  isLoadingVisit.value = visitType;

  try {
    // Send request to get data for specific UID + Visit Type combination
    const params = new URLSearchParams({
      participant_uid: formData.value.participant_uid,
      visit_type: visitType,
      action: 'getVisitData'
    }).toString();

    console.log(`Loading data for ${visitType} - UID: ${formData.value.participant_uid}`);

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`${visitType} response:`, result);

    // Set the current visit type
    formData.value.visit_type = visitType;

    if (result.status === "success" && result.prefill) {
      // Found existing data for this visit type - PREFILL
      Object.keys(result.prefill).forEach(key => {
        if (key in formData.value && key !== 'participant_uid') {
          // Don't overwrite UID, but fill everything else
          if (key.includes('date') && result.prefill[key]) {
            const dateValue = new Date(result.prefill[key]);
            if (!isNaN(dateValue.getTime())) {
              formData.value[key] = dateValue.toISOString().split('T')[0];
            } else {
              formData.value[key] = result.prefill[key];
            }
          } else {
            formData.value[key] = result.prefill[key];
          }
        }
      });

      visitDataStatus.value[visitType] = 'Has Data';
      statusMessage.value = `Loaded existing ${visitType} data for ${formData.value.participant_uid}`;
      statusClass.value = "success";
      isPrefilled.value = true;

    } else {
      // No existing data for this visit type - CLEAR FORM FOR NEW ENTRY
      clearFormExceptUID();
      formData.value.visit_type = visitType; // Set the visit type

      visitDataStatus.value[visitType] = 'No Data';
      statusMessage.value = `Creating new ${visitType} record for ${formData.value.participant_uid}`;
      statusClass.value = "";
      isPrefilled.value = false;
    }

  } catch (err) {
    console.error(`Error loading ${visitType} data:`, err);
    statusMessage.value = `Error loading ${visitType} data: ` + err.message;
    statusClass.value = "error";
  } finally {
    isLoadingVisit.value = null;
  }
};

// Clear form except UID and visit type
const clearFormExceptUID = () => {
  const preserveFields = ['participant_uid', 'visit_type', 'clinician_name', 'designation', 'bhmc_registration', 'date'];

  Object.keys(formData.value).forEach((key) => {
    if (!preserveFields.includes(key)) {
      if (Array.isArray(formData.value[key])) formData.value[key] = [];
      else if (typeof formData.value[key] === "boolean") formData.value[key] = false;
      else if (typeof formData.value[key] === "number") formData.value[key] = null;
      else formData.value[key] = "";
    }
  });
};

// === CREATE NEW VISIT FUNCTION ===
// Create a new visit record (clear form and set visit type)
const createNewVisit = async (visitType) => {
  if (!formData.value.participant_uid || !validateUid(formData.value.participant_uid)) {
    alert('Please enter a valid UID first');
    return;
  }

  // Clear form except UID and system fields
  clearFormExceptUID();

  // Set the visit type for new record
  formData.value.visit_type = visitType;

  // Set states
  isPrefilled.value = false;
  isLoadingVisit.value = null;

  statusMessage.value = `Creating new ${visitType} record for ${formData.value.participant_uid}`;
  statusClass.value = "";

  console.log(`Creating new visit: ${visitType} for UID: ${formData.value.participant_uid}`);
};

// === DELETE VISIT FUNCTIONS ===
// Confirm before deleting a visit record
const confirmDeleteVisit = (visitType) => {
  const confirmMessage = `Are you sure you want to DELETE the ${visitType} record for ${formData.value.participant_uid}?\n\n⚠️ This action CANNOT be undone!\n\nThe record will be permanently removed from the database.`;

  if (confirm(confirmMessage)) {
    deleteVisitRecord(visitType);
  }
};

// Delete a specific visit record
const deleteVisitRecord = async (visitType) => {
  if (!formData.value.participant_uid || !validateUid(formData.value.participant_uid)) {
    alert('Invalid UID');
    return;
  }

  isDeletingVisit.value = visitType;

  try {
    // Send delete request to Google Apps Script
    const params = new URLSearchParams({
      participant_uid: formData.value.participant_uid,
      visit_type: visitType,
      action: 'deleteVisitRecord'
    }).toString();

    console.log(`Deleting ${visitType} record for UID: ${formData.value.participant_uid}`);

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?${params}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Delete response:', result);

    if (result.status === "success") {
      // Remove from available visits
      availableVisits.value = availableVisits.value.filter(v => v !== visitType);

      // If currently selected visit was deleted, clear form
      if (formData.value.visit_type === visitType) {
        clearFormExceptUID();
        formData.value.visit_type = "";
        isPrefilled.value = false;
      }

      statusMessage.value = `${visitType} record deleted successfully for ${formData.value.participant_uid}`;
      statusClass.value = "success";

      // Show success message briefly
      setTimeout(() => {
        if (statusMessage.value.includes('deleted successfully')) {
          statusMessage.value = availableVisits.value.length > 0
            ? `${availableVisits.value.length} visit record(s) remaining for ${formData.value.participant_uid}`
            : `No visit records remaining for ${formData.value.participant_uid}`;
        }
      }, 3000);

    } else {
      statusMessage.value = `Failed to delete ${visitType}: ` + (result.message || 'Unknown error');
      statusClass.value = "error";
    }

  } catch (err) {
    console.error(`Error deleting ${visitType} record:`, err);
    statusMessage.value = `Error deleting ${visitType}: ` + err.message;
    statusClass.value = "error";
  } finally {
    isDeletingVisit.value = null;
  }
};

// === CHECK AVAILABLE VISITS FOR UID ===
const checkAvailableVisits = async (uid) => {
  if (!uid || uid.length < UID_MIN_LENGTH) {
    availableVisits.value = [];
    return;
  }

  isCheckingVisits.value = true;
  try {
    // Send request to get all available visit types for this UID
    const params = new URLSearchParams({
      participant_uid: uid,
      action: 'checkAvailableVisits'
    }).toString();

    console.log(`Checking available visits for UID: ${uid}`);

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Available visits response:', result);
    console.log('Response status:', result.status);
    console.log('Available visits from server:', result.availableVisits);

    if (result.status === "success" && result.availableVisits) {
      availableVisits.value = result.availableVisits;
      console.log('Set availableVisits.value to:', availableVisits.value);

      // Update visit status for each visit type
      visitOptions.forEach(visit => {
        if (result.availableVisits.includes(visit.value)) {
          visitDataStatus.value[visit.value] = 'Has Data';
        } else {
          visitDataStatus.value[visit.value] = 'No Data';
        }
      });

      statusMessage.value = `Found ${result.availableVisits.length} visit record(s) for ${uid}`;
      statusClass.value = "success";

    } else {
      availableVisits.value = [];
      statusMessage.value = `No visit records found for ${uid}`;
      statusClass.value = "";
    }

  } catch (err) {
    console.error('Error checking available visits:', err);
    availableVisits.value = [];
    statusMessage.value = "Error checking available visits: " + err.message;
    statusClass.value = "error";
  } finally {
    isCheckingVisits.value = false;
  }
};

// onMounted

onMounted(() => {
  initializeDate();
  fetchCsvData();
  const loggedInUser = getLoggedInUser();
  if (loggedInUser) {
    formData.value.clinician_name = loggedInUser.fullname || "";
    formData.value.designation = loggedInUser.designation || "";
    formData.value.bhmc_registration = loggedInUser.bhc_no || "";
  } else {
    formData.value.clinician_name = "";
    formData.value.designation = "";
    formData.value.bhmc_registration = "";
  }
});

// --- Prefill Function ---
// Fetch existing data from Google Sheet if UID exists
const fetchPrefillData = async (uid) => {
  if (!uid || uid.length < UID_MIN_LENGTH) return;

  isCheckingUid.value = true;
  try {
    // Send UID to your Google Apps Script with explicit action parameter
    const params = new URLSearchParams({
      participant_uid: uid,
      action: 'getPrefillData'
    }).toString();

    console.log('Fetching prefill data for UID:', uid);
    console.log('Request URL:', `${GOOGLE_SCRIPT_URL}?${params}`);

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Prefill response received:', result);

    // If the script returns existing data, prefill form
    if (result.status === "success" && result.prefill) {
      // Clear existing form data first (except system fields)
      const preserveFields = ['clinician_name', 'designation', 'bhmc_registration', 'date'];

      // Prefill form carefully, field by field
      Object.keys(result.prefill).forEach(key => {
        if (key in formData.value) {
          // Convert date strings to proper format if needed
          if (key.includes('date') && result.prefill[key]) {
            const dateValue = new Date(result.prefill[key]);
            if (!isNaN(dateValue.getTime())) {
              formData.value[key] = dateValue.toISOString().split('T')[0];
            } else {
              formData.value[key] = result.prefill[key];
            }
          } else {
            formData.value[key] = result.prefill[key];
          }
        } else {
          console.warn(`Key '${key}' not found in form data structure`);
        }
      });

      console.log('Form data after prefill:', formData.value);

      // Store previous visit type for progression logic
      previousVisitType.value = result.prefill.visit_type || "";

      // Clear the current visit_type so user must select next visit
      formData.value.visit_type = "";

      statusMessage.value = "UID found! Form prefilled with existing data!";
      statusClass.value = "success";
      submitDisabled.value = false; // Allow submission
      isPrefilled.value = true; // Mark as prefilled

    } else if (result.status === "success" && result.rowData) {
      // If we got raw row data but no formatted prefill object
      console.log('Raw row data received:', result.rowData);
      statusMessage.value = "UID found! Raw data: " + result.rowData.slice(0, 5).join(', ') + '...';
      statusClass.value = "success";
      submitDisabled.value = false;

    } else {
      console.log('No existing data found for UID:', uid);
      statusMessage.value = validateUid(uid) ? "UID valid but no existing data found." : "UID not found.";
      statusClass.value = validateUid(uid) ? "success" : "error";
      submitDisabled.value = !validateUid(uid);
    }

  } catch (err) {
    console.error('Prefill fetch error:', err);
    statusMessage.value = "Error fetching prefill data: " + err.message;
    statusClass.value = "error";
    submitDisabled.value = true;
  } finally {
    isCheckingUid.value = false;
  }
};

// --- Watch UID input ---
// Every time user types UID, validate it and prefill if exists
watch(() => formData.value.participant_uid, async (newUid) => {
  validateUidOnInput(newUid); // Existing CSV validation
  if (validateUid(newUid)) {
    await fetchPrefillData(newUid); // Prefill form if UID exists
  }
});

</script>

<style>
/* Your styles are unchanged */
.form-container {
  padding: 2rem;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input,
select,
textarea {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
  font-size: 0.95rem;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #3498db;
  outline: none;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

input[readonly] {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

input[type="radio"],
input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
  vertical-align: middle;
}

label>input[type="radio"],
label>input[type="checkbox"] {
  margin-bottom: 0;
}

.radio-group-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.radio-group-vertical label {
  font-weight: normal;
  display: inline-flex;
  align-items: center;
  margin-bottom: 0;
}

.section-title {
  font-size: 1.5rem;
  color: #3498db;
  margin-top: 25px;
  margin-bottom: 15px;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
}

.section-title:first-of-type {
  margin-top: 0;
}

.submit-btn {
  background-color: #3498db;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;
  margin-top: 1rem;
  display: block;
  width: auto;
  margin-left: auto;
  margin-right: auto;
}

.submit-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.submit-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.7;
}

#status-message {
  margin-top: -10px;
  margin-bottom: 15px;
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 0.9em;
  border-width: 1px;
  border-style: solid;
}

#status-message.success {
  background-color: #dff0d8;
  color: #3c763d;
  border-color: #d6e9c6;
}

#status-message.error {
  background-color: #f2dede;
  color: #a94442;
  border-color: #ebccd1;
}

.uid-spinner {
  margin-left: 10px;
  color: #3498db;
  font-size: 0.9em;
}

.table-responsive {
  overflow-x: auto;
  margin-bottom: 1rem;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

th,
td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
  vertical-align: middle;
}

th {
  background-color: #f2f2f2;
  font-weight: bold;
  text-align: center;
}

td input[type="radio"],
td input[type="checkbox"] {
  display: block;
  margin: 0 auto;
}

td input[type="text"],
td input[type="date"] {
  width: 95%;
  padding: 0.3rem 0.4rem;
  margin-bottom: 0;
  font-size: 0.9rem;
}

.success-message {
  color: green;
  text-align: center;
  font-weight: bold;
  margin-top: 15px;
}

.error-message {
  color: red;
  text-align: center;
  font-weight: bold;
  margin-top: 15px;
}

.submitting-indicator {
  margin-top: 20px;
  text-align: center;
  font-size: 1.2rem;
  color: #3498db;
}

.final-message {
  max-width: 700px;
  margin: 20px auto;
  padding: 15px 20px;
  border-radius: 5px;
  text-align: center;
  font-weight: 500;
}

.final-message.success-final {
  background-color: #d1e7dd;
  color: #0f5132;
  border: 1px solid #badbcc;
}

.final-message.error-final {
  background-color: #f8d7da;
  color: #842029;
  border: 1px solid #f5c2c7;
}

.button-container {
  text-align: center;
  margin-top: 1rem;
}

.prefill-status {
  margin-top: 0.5rem;
  padding: 8px 12px;
  background-color: #e3f2fd;
  color: #1565c0;
  border-radius: 4px;
  font-size: 0.9rem;
  display: inline-block;
  border: 1px solid #bbdefb;
}

.prefill-status i {
  margin-right: 5px;
  color: #2196f3;
}

.next-visit-indicator {
  color: #4caf50;
  font-weight: bold;
  font-size: 0.85em;
  margin-left: 8px;
}

.previous-visit-indicator {
  color: #ff9800;
  font-weight: bold;
  font-size: 0.85em;
  margin-left: 8px;
}

.visit-warning {
  background-color: #fff3cd;
  color: #856404;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ffeaa7;
  margin-top: 8px;
  font-size: 0.9em;
}

.visit-selection-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  margin: 1rem 0;
}

.visit-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.visit-type-btn {
  background: #ffffff;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  text-align: center;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.visit-type-btn:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
  transform: translateY(-1px);
}

.visit-type-btn.selected {
  border-color: #3498db;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.visit-type-btn.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

.visit-type-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.visit-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.visit-label {
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.visit-status {
  font-size: 0.8rem;
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  color: #3498db;
}

.selected-visit-display {
  margin-top: 1rem;
}

.visit-info-card {
  background: #e8f4fd;
  border: 1px solid #bee5eb;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}

.status-badge.update {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-badge.create {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.checking-visits {
  text-align: center;
  padding: 1rem;
  color: #3498db;
  font-size: 1rem;
}

.checking-visits i {
  margin-right: 8px;
}

.no-visits-found {
  text-align: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  margin: 1rem 0;
}

.visit-status.has-data {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.delete-visit-btn {
  background-color: #e74c3c;
  color: #fff;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.2s ease;
  margin-left: 8px;
  min-width: 60px;
}

.delete-visit-btn:hover:not(:disabled) {
  background-color: #c0392b;
}

.delete-visit-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.7;
}
</style>