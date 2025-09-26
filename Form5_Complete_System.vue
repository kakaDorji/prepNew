<template>
  <form @submit.prevent="showReviewModal">
    <div class="container">
      <div class="form-container">
        <p><strong>Note to interviewer:</strong> This tool is only for clients visiting the clinic beyond their scheduled visits.</p>

        <label for="participant_uid">Participant UID:</label>
        <input type="text" v-model="formData.participant_uid" id="participant_uid" name="participant_uid" required
          pattern="[A-Za-z0-9]{5,}" title="Minimum 5 Alphanumeric characters only" />
        
        <!-- Status Messages -->
        <div v-if="statusMessage" id="status-message" :class="statusClass">
          {{ statusMessage }}
        </div>
        <span v-if="isCheckingUid" class="uid-spinner"><i class="fas fa-spinner fa-spin"></i> Checking...</span>

        <!-- Google Script Configuration Warning -->
        <div v-if="!GOOGLE_SCRIPT_URL" class="config-warning">
          <h4><i class="fas fa-exclamation-triangle"></i> Configuration Required</h4>
          <p>Google Apps Script URL is not configured. Please:</p>
          <ol>
            <li>Deploy your Google Apps Script as a web app</li>
            <li>Copy the web app URL</li>
            <li>Set GOOGLE_SCRIPT_URL in the code (line ~23)</li>
          </ol>
        </div>

        <!-- Data Status Display -->
        <div v-if="hasExistingData" class="data-status">
          <h4><i class="fas fa-database"></i> Existing Record Found for {{ formData.participant_uid }}</h4>
          <div class="action-buttons">
            <button type="button" class="btn-primary" :class="{ 'active': isPrefilled }" @click="loadExistingData()">
              <i class="fas fa-eye"></i> View/Edit Record
            </button>
            <button type="button" class="btn-secondary" @click="startNewEntry()">
              <i class="fas fa-plus"></i> Clear & Start Over
            </button>
          </div>
        </div>

        <!-- Update Mode Banner -->
        <div v-if="isPrefilled" class="update-banner">
          <div class="update-mode">
            <i class="fas fa-edit"></i> UPDATE MODE - You are editing existing data
          </div>
          <button type="button" class="btn-danger" @click="confirmDelete" :disabled="isDeletingRecord">
            <i v-if="isDeletingRecord" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-trash"></i>
            {{ isDeletingRecord ? 'Deleting...' : 'Delete Record' }}
          </button>
        </div>

        <!-- Form Fields -->
        <label for="prep_site">PrEP site:</label>
        <select name="prep_site" id="prep_site" v-model="formData.prep_site" required>
          <option value="">Select PrEP site</option>
          <option v-for="site in prepSites" :key="site" :value="site">{{ site }}</option>
        </select>

        <label for="dateInput">DATE:</label>
        <input type="date" id="dateInput" name="date" v-model="formData.date" readonly />

        <label>1. What is the reason for this visit? (Tick one or more answers)</label>
        <div class="checkbox-group">
          <label><input type="checkbox" v-model="formData.reason_visit" value="Side effects from PrEP" /> Side effects from PrEP</label>
          <label><input type="checkbox" v-model="formData.reason_visit" value="Wish to discontinue PrEP" /> Wish to discontinue PrEP</label>
          <label><input type="checkbox" v-model="formData.reason_visit" value="STI symptoms/Screening" /> STI symptoms/Screening</label>
          <label><input type="checkbox" v-model="formData.reason_visit" value="Change of dose/regimen" /> Change of dose/regimen</label>
          <label><input type="checkbox" v-model="formData.reason_visit" value="Additional doses of PrEP" /> Additional doses of PrEP</label>
          <label><input type="checkbox" v-model="formData.reason_visit" value="New medical problem" /> New medical problem</label>
          <label><input type="checkbox" v-model="formData.reason_visit" value="Follow up for existing medical problem" /> Follow up for existing medical problem</label>
          <label><input type="checkbox" v-model="formData.reason_visit" value="Other" /> Other</label>
          
          <div v-if="formData.reason_visit.includes('Other')" style="margin-top: 10px;">
            <textarea v-model="formData.other_reason_visit" rows="3" placeholder="Describe other reasons..."></textarea>
          </div>
        </div>

        <!-- Side Effects Table -->
        <label style="margin-top: 1rem">2. Side effects experienced:</label>
        <div class="table-responsive">
          <table class="symptoms-table">
            <thead>
              <tr><th>Side effects</th><th>Yes/No</th><th>Ongoing</th><th>Resolved</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Nausea</td>
                <td>
                  <label><input type="radio" name="nausea" v-model="formData.nausea" value="Yes" /> Y</label>
                  <label><input type="radio" name="nausea" v-model="formData.nausea" value="No" /> N</label>
                </td>
                <td><input type="checkbox" v-model="formData.nausea_ongoing" :disabled="formData.nausea !== 'Yes'" /></td>
                <td><input type="checkbox" v-model="formData.nausea_resolved" :disabled="formData.nausea !== 'Yes'" /></td>
              </tr>
              <tr>
                <td>Vomiting</td>
                <td>
                  <label><input type="radio" name="vomiting" v-model="formData.vomiting" value="Yes" /> Y</label>
                  <label><input type="radio" name="vomiting" v-model="formData.vomiting" value="No" /> N</label>
                </td>
                <td><input type="checkbox" v-model="formData.vomiting_ongoing" :disabled="formData.vomiting !== 'Yes'" /></td>
                <td><input type="checkbox" v-model="formData.vomiting_resolved" :disabled="formData.vomiting !== 'Yes'" /></td>
              </tr>
              <tr>
                <td>Abdominal cramps</td>
                <td>
                  <label><input type="radio" name="cramps" v-model="formData.abdominal_cramps" value="Yes" /> Y</label>
                  <label><input type="radio" name="cramps" v-model="formData.abdominal_cramps" value="No" /> N</label>
                </td>
                <td><input type="checkbox" v-model="formData.abdominal_cramps_ongoing" :disabled="formData.abdominal_cramps !== 'Yes'" /></td>
                <td><input type="checkbox" v-model="formData.abdominal_cramps_resolved" :disabled="formData.abdominal_cramps !== 'Yes'" /></td>
              </tr>
              <tr>
                <td>Fatigue</td>
                <td>
                  <label><input type="radio" name="fatigue" v-model="formData.fatigue" value="Yes" /> Y</label>
                  <label><input type="radio" name="fatigue" v-model="formData.fatigue" value="No" /> N</label>
                </td>
                <td><input type="checkbox" v-model="formData.fatigue_ongoing" :disabled="formData.fatigue !== 'Yes'" /></td>
                <td><input type="checkbox" v-model="formData.fatigue_resolved" :disabled="formData.fatigue !== 'Yes'" /></td>
              </tr>
              <tr>
                <td>Dizziness</td>
                <td>
                  <label><input type="radio" name="dizziness" v-model="formData.dizziness" value="Yes" /> Y</label>
                  <label><input type="radio" name="dizziness" v-model="formData.dizziness" value="No" /> N</label>
                </td>
                <td><input type="checkbox" v-model="formData.dizziness_ongoing" :disabled="formData.dizziness !== 'Yes'" /></td>
                <td><input type="checkbox" v-model="formData.dizziness_resolved" :disabled="formData.dizziness !== 'Yes'" /></td>
              </tr>
              <tr>
                <td>Headache</td>
                <td>
                  <label><input type="radio" name="headache" v-model="formData.headache" value="Yes" /> Y</label>
                  <label><input type="radio" name="headache" v-model="formData.headache" value="No" /> N</label>
                </td>
                <td><input type="checkbox" v-model="formData.headache_ongoing" :disabled="formData.headache !== 'Yes'" /></td>
                <td><input type="checkbox" v-model="formData.headache_resolved" :disabled="formData.headache !== 'Yes'" /></td>
              </tr>
              <tr>
                <td>Others</td>
                <td>
                  <label><input type="radio" name="others" v-model="formData.others" value="Yes" /> Y</label>
                  <label><input type="radio" name="others" v-model="formData.others" value="No" /> N</label>
                </td>
                <td><input type="checkbox" v-model="formData.others_ongoing" :disabled="formData.others !== 'Yes'" /></td>
                <td><input type="checkbox" v-model="formData.others_resolved" :disabled="formData.others !== 'Yes'" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <textarea v-if="formData.others === 'Yes'" v-model="formData.others_description" rows="3" placeholder="Describe other side effects..."></textarea>

        <!-- Additional Questions -->
        <label>3. Challenges taking PrEP?</label>
        <div class="radio-group">
          <label><input type="radio" v-model="formData.challenges_prep" value="Yes" required /> Yes</label>
          <label><input type="radio" v-model="formData.challenges_prep" value="No" required /> No</label>
        </div>
        <textarea v-if="formData.challenges_prep === 'Yes'" v-model="formData.challenges_details" rows="3" placeholder="Describe challenges..."></textarea>

        <label>4. Additional doses information:</label>
        <textarea v-model="formData.additional_doses_details" rows="3" placeholder="Provide details..."></textarea>

        <label>5. Stop or continue PrEP?</label>
        <div class="radio-group">
          <label><input type="radio" v-model="formData.prep_continue" value="Stop" required /> Stop</label>
          <label><input type="radio" v-model="formData.prep_continue" value="Continue" required /> Continue</label>
        </div>

        <div v-if="formData.prep_continue === 'Stop'">
          <label>If stopping, reasons:</label>
          <textarea v-model="formData.stopping_reasons" rows="3"></textarea>
          <label>Preferred prevention method:</label>
          <textarea v-model="formData.stopping_Preventionmethod" rows="3"></textarea>
        </div>

        <label>6. Other notes:</label>
        <textarea v-model="formData.other_notes" rows="4" placeholder="Other notes, tests, referrals..."></textarea>

        <!-- Interviewer Details -->
        <h3>Interviewer Details</h3>
        <label>Name:</label>
        <input type="text" v-model="formData.interviewer_name" readonly />
        <label>Designation:</label>
        <input type="text" v-model="formData.designation" readonly />
        <label>BMHC Number:</label>
        <input type="text" v-model="formData.bmhc_number" readonly />
      </div>

      <!-- Submit Button -->
      <button type="submit" class="submit-btn" :disabled="submitDisabled || isSubmitting">
        <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
        {{ getSubmitButtonText() }}
      </button>
    </div>
  </form>

  <!-- Confirmation Modal -->
  <Form5_ConfirmationModal v-if="isReviewModalVisible" :formData="formData" :isSubmitting="isSubmitting"
    :successMessage="modalSuccessMessage" :errorMessage="modalErrorMessage" @confirm="confirmAndSubmit" @cancel="cancelReview" />

  <!-- Success/Error Messages -->
  <div v-if="finalSubmitMessage" :class="finalSubmitClass" class="final-message">
    <p>{{ finalSubmitMessage }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import Form5_ConfirmationModal from "./Form5_ConfirmationModal.vue";
import { prepSites } from "../location/prepSite";

// ⚠️ CONFIGURATION - SET YOUR GOOGLE SCRIPT URL HERE
const GOOGLE_SCRIPT_URL = ""; // TODO: Replace with your Google Apps Script web app URL
const DEBUG_MODE = true;
const CSV_DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfG6e5EIcHDaXopn9DxMZnTwVFGi5CiQxmKlEIPsd7uPtZiQIikYb46UdN78UhZlJfocCfl_s0hGGX/pub?gid=0&single=true&output=csv";
const UID_MIN_LENGTH = 5;
const SUBMIT_SUCCESS_DELAY = 2500;

// Form Data
const formData = ref({
  participant_uid: "",
  prep_site: "",
  date: "",
  reason_visit: [],
  other_reason_visit: "",
  nausea: "",
  nausea_ongoing: false,
  nausea_resolved: false,
  vomiting: "",
  vomiting_ongoing: false,
  vomiting_resolved: false,
  abdominal_cramps: "",
  abdominal_cramps_ongoing: false,
  abdominal_cramps_resolved: false,
  fatigue: "",
  fatigue_ongoing: false,
  fatigue_resolved: false,
  dizziness: "",
  dizziness_ongoing: false,
  dizziness_resolved: false,
  headache: "",
  headache_ongoing: false,
  headache_resolved: false,
  others: "",
  others_ongoing: false,
  others_resolved: false,
  others_description: "",
  challenges_prep: "",
  challenges_details: "",
  additional_doses_details: "",
  prep_continue: "",
  stopping_reasons: "",
  stopping_Preventionmethod: "",
  other_notes: "",
  interviewer_name: "",
  designation: "",
  bmhc_number: "",
});

// State Variables
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

// CRUD State
const hasExistingData = ref(false);
const isPrefilled = ref(false);
const isDeletingRecord = ref(false);

let csvData = [];

// Initialize date
const initializeDate = () => {
  formData.value.date = new Date().toISOString().split("T")[0];
};

// Fetch CSV for UID validation
const fetchCsvData = async () => {
  isCheckingUid.value = true;
  statusMessage.value = "Loading validation data...";
  statusClass.value = "";
  submitDisabled.value = true;
  
  try {
    const response = await fetch(CSV_DATA_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const csvText = await response.text();
    csvData = csvText.split("\n").map((row) =>
      row.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
    );
    
    if (DEBUG_MODE) console.log("CSV Data Loaded for UID validation");
    statusMessage.value = "Validation data loaded. Please enter UID.";
    
    if (formData.value.participant_uid) {
      validateUidOnInput(formData.value.participant_uid);
    } else {
      submitDisabled.value = true;
    }
  } catch (error) {
    console.error("Error fetching CSV data:", error);
    statusMessage.value = "Error loading validation data.";
    statusClass.value = "error";
    csvData = [];
    submitDisabled.value = true;
  } finally {
    isCheckingUid.value = false;
  }
};

// Validate UID against CSV
const validateUid = (uid) => {
  if (!uid || !csvData || csvData.length <= 1) return false;
  const normalizedUid = uid.trim().toLowerCase();
  return csvData.slice(1).some((row) => row.length > 1 && row[1]?.toLowerCase() === normalizedUid);
};

// Validate UID input
const validateUidOnInput = (newUid) => {
  clearFinalMessage();
  modalErrorMessage.value = "";
  modalSuccessMessage.value = "";
  
  if (!newUid) {
    statusMessage.value = "";
    statusClass.value = "";
    submitDisabled.value = true;
    hasExistingData.value = false;
    isPrefilled.value = false;
    return;
  }
  
  const pattern = new RegExp(`^[A-Za-z0-9]{${UID_MIN_LENGTH},}$`);
  if (!pattern.test(newUid)) {
    statusMessage.value = `UID must be at least ${UID_MIN_LENGTH} alphanumeric characters.`;
    statusClass.value = "error";
    submitDisabled.value = true;
    hasExistingData.value = false;
    isPrefilled.value = false;
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
      
      // Now check if data exists in the form sheet
      checkExistingData(newUid);
    } else {
      statusMessage.value = "Participant UID not found in system.";
      statusClass.value = "error";
      submitDisabled.value = true;
      hasExistingData.value = false;
      isPrefilled.value = false;
    }
  }
};

// Watch UID changes
watch(() => formData.value.participant_uid, (newUid) => {
  validateUidOnInput(newUid);
});

// Check if data exists in form sheet
const checkExistingData = async (uid) => {
  try {
    if (DEBUG_MODE) console.log('Checking existing data for UID:', uid);
    
    if (!GOOGLE_SCRIPT_URL) {
      if (DEBUG_MODE) console.error('Google Script URL not configured!');
      return;
    }
    
    const response = await axios.get(GOOGLE_SCRIPT_URL, {
      params: { action: 'checkData', uid: uid },
      timeout: 10000
    });

    if (DEBUG_MODE) console.log('checkExistingData response:', response.data);

    if (response.data.status === 'success') {
      hasExistingData.value = response.data.hasData;
      if (hasExistingData.value) {
        statusMessage.value = `✅ UID found! Existing form data available. You can view/edit or start over.`;
        statusClass.value = 'success';
      } else {
        statusMessage.value = `✅ UID found! Ready to create new unscheduled visit record.`;
        statusClass.value = 'success';
      }
    }
  } catch (error) {
    console.error('Error checking existing data:', error);
    // Don't show error if just Google Script URL not configured
    if (!GOOGLE_SCRIPT_URL) return;
    
    statusMessage.value = 'Error checking existing form data.';
    statusClass.value = 'error';
    hasExistingData.value = false;
  }
};

// Load existing data
const loadExistingData = async () => {
  try {
    if (!GOOGLE_SCRIPT_URL) {
      statusMessage.value = 'Google Script URL not configured';
      statusClass.value = 'error';
      return;
    }

    statusMessage.value = 'Loading existing data...';
    statusClass.value = 'info';

    const response = await axios.get(GOOGLE_SCRIPT_URL, {
      params: { action: 'prefill', uid: formData.value.participant_uid },
      timeout: 15000
    });

    if (DEBUG_MODE) console.log('Prefill response:', response.data);

    if (response.data.status === 'success') {
      const prefillData = response.data.data;

      // Populate form fields
      Object.keys(prefillData).forEach(frontendKey => {
        if (formData.value.hasOwnProperty(frontendKey)) {
          const value = prefillData[frontendKey];
          
          if (Array.isArray(formData.value[frontendKey])) {
            formData.value[frontendKey] = Array.isArray(value) ? value : (value ? [value] : []);
          } else if (typeof formData.value[frontendKey] === 'boolean') {
            formData.value[frontendKey] = value === true || value === 'true' || value === 'Yes';
          } else {
            formData.value[frontendKey] = value || '';
          }
        }
      });

      isPrefilled.value = true;
      statusMessage.value = '✅ Data loaded successfully! You are now in UPDATE mode.';
      statusClass.value = 'success';
      submitDisabled.value = false;

    } else {
      console.error('Prefill error:', response.data);
      statusMessage.value = response.data.message || 'Error loading data';
      statusClass.value = 'error';
    }
  } catch (error) {
    console.error('Error loading data:', error);
    statusMessage.value = 'Error loading data from server.';
    statusClass.value = 'error';
  }
};

// Start new entry
const startNewEntry = () => {
  const basicInfo = {
    participant_uid: formData.value.participant_uid,
    interviewer_name: formData.value.interviewer_name,
    designation: formData.value.designation,
    bmhc_number: formData.value.bmhc_number,
    date: formData.value.date
  };

  clearForm();
  Object.assign(formData.value, basicInfo);

  isPrefilled.value = false;
  statusMessage.value = '✅ Ready to create new unscheduled visit record.';
  statusClass.value = 'success';
  submitDisabled.value = false;
};

// Delete record
const confirmDelete = () => {
  if (confirm(`Are you sure you want to delete the unscheduled visit record for UID: ${formData.value.participant_uid}?\n\nThis action cannot be undone.`)) {
    deleteRecord();
  }
};

const deleteRecord = async () => {
  isDeletingRecord.value = true;

  try {
    const response = await axios.post(GOOGLE_SCRIPT_URL,
      new URLSearchParams({ action: 'delete', uid: formData.value.participant_uid }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      }
    );

    if (response.data.status === 'success') {
      statusMessage.value = '✅ ' + (response.data.message || 'Record deleted successfully!');
      statusClass.value = 'success';

      await checkExistingData(formData.value.participant_uid);
      clearForm();
      isPrefilled.value = false;
      hasExistingData.value = false;
    } else {
      statusMessage.value = '❌ ' + (response.data.message || 'Failed to delete record');
      statusClass.value = 'error';
    }
  } catch (error) {
    console.error('Delete error:', error);
    statusMessage.value = '❌ Error deleting record. Please try again.';
    statusClass.value = 'error';
  } finally {
    isDeletingRecord.value = false;
  }
};

// Submit button text
const getSubmitButtonText = () => {
  if (isSubmitting.value) return 'Submitting...';
  if (isPrefilled.value) return 'Update Record';
  return 'Create Record';
};

// Modal controls
const showReviewModal = () => {
  if (submitDisabled.value) {
    modalErrorMessage.value = "Please enter a valid UID.";
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

// Submit form
const confirmAndSubmit = async () => {
  isSubmitting.value = true;
  modalSuccessMessage.value = "";
  modalErrorMessage.value = "";
  clearFinalMessage();

  try {
    const dataToSend = { ...formData.value };
    if (isPrefilled.value) dataToSend.action = 'update';

    // Map frontend data to backend format
    const backendData = {
      uid: dataToSend.participant_uid,
      prep_site: dataToSend.prep_site,
      date: dataToSend.date,
      reason_for_this_visit: Array.isArray(dataToSend.reason_visit) ? dataToSend.reason_visit.join('; ') : dataToSend.reason_visit,
      other_describe: dataToSend.other_reason_visit,
      nausea: dataToSend.nausea,
      nausea_ongoing: dataToSend.nausea_ongoing ? 'Yes' : 'No',
      nausea_resolved: dataToSend.nausea_resolved ? 'Yes' : 'No',
      vomiting: dataToSend.vomiting,
      vomiting_ongoing: dataToSend.vomiting_ongoing ? 'Yes' : 'No',
      vomiting_resolved: dataToSend.vomiting_resolved ? 'Yes' : 'No',
      abdominal_cramps: dataToSend.abdominal_cramps,
      abdominal_cramps_ongoing: dataToSend.abdominal_cramps_ongoing ? 'Yes' : 'No',
      abdominal_cramps_resolved: dataToSend.abdominal_cramps_resolved ? 'Yes' : 'No',
      fatigue: dataToSend.fatigue,
      fatigue_ongoing: dataToSend.fatigue_ongoing ? 'Yes' : 'No',
      fatigue_resolved: dataToSend.fatigue_resolved ? 'Yes' : 'No',
      dizziness: dataToSend.dizziness,
      dizziness_ongoing: dataToSend.dizziness_ongoing ? 'Yes' : 'No',
      dizziness_resolved: dataToSend.dizziness_resolved ? 'Yes' : 'No',
      headache: dataToSend.headache,
      headache_ongoing: dataToSend.headache_ongoing ? 'Yes' : 'No',
      headache_resolved: dataToSend.headache_resolved ? 'Yes' : 'No',
      others: dataToSend.others,
      others_ongoing: dataToSend.others_ongoing ? 'Yes' : 'No',
      others_resolved: dataToSend.others_resolved ? 'Yes' : 'No',
      others_please_describe_below: dataToSend.others_description,
      challenges_taking_prep: dataToSend.challenges_prep,
      comments_challenges_faced: dataToSend.challenges_details,
      additional_doses_above: dataToSend.additional_doses_details,
      stop_or_continue: dataToSend.prep_continue,
      stopping_reason: dataToSend.stopping_reasons,
      stopping_indicate_reasons_preferred_method: dataToSend.stopping_Preventionmethod,
      other_notes: dataToSend.other_notes,
      interviewer_date: dataToSend.date,
      interviewer_name: dataToSend.interviewer_name,
      designation: dataToSend.designation,
      bhmc_number: dataToSend.bmhc_number
    };

    if (dataToSend.action) backendData.action = dataToSend.action;

    const formDataSerialized = new URLSearchParams(backendData).toString();
    if (DEBUG_MODE) console.log("Submitting data:", backendData);

    const response = await axios.post(GOOGLE_SCRIPT_URL, formDataSerialized, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000
    });

    if (DEBUG_MODE) console.log("Submit response:", response);

    if (response.data.status === 'success') {
      modalSuccessMessage.value = response.data.message;
      setTimeout(async () => {
        isReviewModalVisible.value = false;
        setFinalMessage(response.data.message, "success");

        if (formData.value.participant_uid) {
          await checkExistingData(formData.value.participant_uid);
        }

        clearForm();
        statusMessage.value = "";
        statusClass.value = "";
        submitDisabled.value = true;
        modalSuccessMessage.value = "";
        isPrefilled.value = false;
        hasExistingData.value = false;
      }, SUBMIT_SUCCESS_DELAY);
    } else {
      modalErrorMessage.value = response.data.message || 'Submission failed';
    }
  } catch (error) {
    console.error("Submit Error:", error);
    let detailedError = "Error submitting form.";
    if (error.response) detailedError += ` (Status: ${error.response.status})`;
    else if (error.request) detailedError += " (No response)";
    else detailedError += ` (${error.message})`;
    modalErrorMessage.value = detailedError;
  } finally {
    isSubmitting.value = false;
  }
};

// Utility functions
const clearForm = () => {
  const keepFields = {
    interviewer_name: formData.value.interviewer_name,
    designation: formData.value.designation,
    bmhc_number: formData.value.bmhc_number,
  };
  
  Object.keys(formData.value).forEach((key) => {
    if (key in keepFields || key === "date") return;
    if (Array.isArray(formData.value[key])) formData.value[key] = [];
    else if (typeof formData.value[key] === "boolean") formData.value[key] = false;
    else formData.value[key] = "";
  });
  
  Object.assign(formData.value, keepFields);
  initializeDate();
};

const setFinalMessage = (message, type) => {
  finalSubmitMessage.value = message;
  finalSubmitClass.value = type === "success" ? "success-final" : "error-final";
};

const clearFinalMessage = () => {
  finalSubmitMessage.value = "";
  finalSubmitClass.value = "";
};

// Initialize
onMounted(() => {
  initializeDate();
  fetchCsvData();

  const storedUser = localStorage.getItem("loggedInUser");
  const loggedInUser = storedUser ? JSON.parse(storedUser) : null;

  if (loggedInUser) {
    formData.value.interviewer_name = loggedInUser.fullname || "";
    formData.value.designation = loggedInUser.designation || "";
    formData.value.bmhc_number = loggedInUser.bhc_no || "";
  }
});
</script>

<style>
.container { max-width: 900px; margin: 0 auto; padding: 20px; }
.form-container { padding: 2rem; background: #fff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 2rem; }

.config-warning {
  margin: 20px 0;
  padding: 15px;
  border: 2px solid #dc3545;
  border-radius: 8px;
  background-color: #f8d7da;
  color: #721c24;
}

.config-warning h4 {
  margin: 0 0 10px 0;
  color: #721c24;
}

.data-status {
  margin: 20px 0;
  padding: 15px;
  border: 2px solid #28a745;
  border-radius: 8px;
  background-color: #d4edda;
}

.data-status h4 {
  margin: 0 0 15px 0;
  color: #155724;
  font-size: 1.1rem;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary, .btn-danger {
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-primary {
  background: #007bff;
  color: white;
}
.btn-primary:hover, .btn-primary.active {
  background: #0056b3;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}
.btn-secondary:hover {
  background: #545b62;
  transform: translateY(-1px);
}

.btn-danger {
  background: #dc3545;
  color: white;
}
.btn-danger:hover:not(:disabled) {
  background: #c82333;
}
.btn-danger:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.update-banner {
  margin: 15px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  flex-wrap: wrap;
}

.update-mode {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #28a745;
  color: white;
  padding: 8px 15px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
}

label { display: block; margin-bottom: 5px; font-weight: bold; }
input, select, textarea { 
  width: 100%; 
  padding: 0.5rem; 
  margin-bottom: 15px; 
  border: 1px solid #ccc; 
  border-radius: 5px; 
  box-sizing: border-box; 
}

input:focus, select:focus, textarea:focus {
  border-color: #3498db;
  outline: none;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

input[readonly] { background-color: #f8f9fa; cursor: not-allowed; }

.checkbox-group, .radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.checkbox-group label, .radio-group label {
  display: flex;
  align-items: center;
  font-weight: normal;
  margin-bottom: 0;
}

.checkbox-group input, .radio-group input {
  width: auto;
  margin-right: 8px;
  margin-bottom: 0;
}

.symptoms-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.symptoms-table th, .symptoms-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.symptoms-table th { background-color: #f8f9fa; font-weight: bold; }

.symptoms-table label {
  display: inline-flex;
  align-items: center;
  margin-right: 10px;
  margin-bottom: 0;
  font-weight: normal;
}

.submit-btn {
  background-color: #3498db;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  width: 100%;
  margin-top: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) { background-color: #2980b9; }
.submit-btn:disabled { background-color: #95a5a6; cursor: not-allowed; }

#status-message {
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

#status-message.success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
#status-message.error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
#status-message.info { background-color: #d9edf7; color: #31708f; border: 1px solid #bce8f1; }

.uid-spinner { color: #007bff; font-size: 0.9rem; margin-left: 10px; }

.final-message { margin-top: 20px; padding: 15px; border-radius: 5px; text-align: center; }
.success-final { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.error-final { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

@media (max-width: 768px) {
  .container { padding: 10px; }
  .form-container { padding: 1rem; }
  .action-buttons { flex-direction: column; }
  .btn-primary, .btn-secondary, .btn-danger { width: 100%; justify-content: center; }
  .update-banner { flex-direction: column; align-items: stretch; }
}
</style>