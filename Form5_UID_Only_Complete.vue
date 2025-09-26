<template>
  <!-- Unschedule Form -->
  <form @submit.prevent="showReviewModal">
    <div class="container">
      <!-- Container 1: Basic Info & Reason -->
      <div class="form-container">
        <p>
          <strong>Note to interviewer:</strong> This tool is only for clients
          visiting the clinic beyond their scheduled visits. This is an
          open-ended questionnaire. Please use it as a guide/probe to find out
          the reason for the visit.
        </p>

        <label for="participant_uid">Participant UID:</label>
        <input type="text" v-model="formData.participant_uid" id="participant_uid" name="participant_uid" required
          pattern="[A-Za-z0-9]{5,}" title="Minimum 5 Alphanumeric characters only" />
        <div v-if="statusMessage" id="status-message" :class="statusClass">
          {{ statusMessage }}
        </div>
        <span v-if="isCheckingUid" class="uid-spinner"><i class="fas fa-spinner fa-spin"></i> Checking...</span>

        <!-- Configuration Warning -->
        <div v-if="!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === '' || GOOGLE_SCRIPT_URL.includes('PASTE_YOUR')" class="visit-type-selection" style="border-color: #dc3545; background-color: #f8d7da;">
          <h4 style="color: #721c24;"><i class="fas fa-exclamation-triangle"></i> Configuration Required</h4>
          <p style="color: #721c24; margin: 10px 0;">Google Apps Script URL is not configured. Please:</p>
          <ol style="color: #721c24; margin-left: 20px;">
            <li>Deploy your Google Apps Script as a web app</li>
            <li>Copy the web app URL</li>
            <li>Replace the placeholder URL in line 343 with your actual URL</li>
          </ol>
          <p style="color: #721c24; margin: 10px 0; font-weight: bold;">Until configured, data operations (view/edit/delete) will not work.</p>
        </div>

        <!-- Data Status Display -->
        <div v-if="hasExistingData && !isPrefilled" class="visit-type-selection">
          <h4>Existing Record for {{ formData.participant_uid }}</h4>
          <div class="visit-buttons">
            <button type="button" class="visit-btn" :class="{ 'selected': isPrefilled }" @click="loadExistingData()">
              <i class="fas fa-eye"></i> View/Edit Record
            </button>
            <button type="button" class="visit-btn new-visit" @click="startNewVisit()">
              <i class="fas fa-plus"></i> Clear & Start Over
            </button>
          </div>
        </div>

        <!-- Auto-loaded Data Status -->
        <div v-if="isPrefilled" class="visit-type-selection">
          <h4><i class="fas fa-check-circle" style="color: #28a745;"></i> Data Loaded for {{ formData.participant_uid }}</h4>
          <div class="visit-buttons">
            <button type="button" class="visit-btn new-visit" @click="startNewVisit()">
              <i class="fas fa-plus"></i> Clear & Start Over
            </button>
          </div>
        </div>

        <!-- Prefill Status and Delete Button -->
        <div v-if="isPrefilled" class="prefill-status">
          <div class="update-mode-banner">
            <i class="fas fa-edit"></i> UPDATE MODE
          </div>
          <button type="button" class="delete-btn" @click="confirmDelete" :disabled="isDeletingRecord">
            <i v-if="isDeletingRecord" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-trash"></i>
            {{ isDeletingRecord ? 'Deleting...' : 'Delete Record' }}
          </button>
        </div>

        <label for="prep_site">PrEP site:</label>
        <select name="prep_site" id="prep_site" v-model="formData.prep_site" required>
          <option v-for="site in prepSites">
            {{ site }}
          </option>
        </select>

        <label for="dateInput">DATE:</label>
        <input type="date" id="dateInput" name="date" v-model="formData.date" readonly />

        <label>1. What is the reason for this visit? (Tick one or more answers)</label>
        <div class="checkbox-group-vertical">
          <label><input type="checkbox" v-model="formData.reason_visit" value="Side effects from PrEP" />
            Side effects from PrEP</label>
          <label><input type="checkbox" v-model="formData.reason_visit" value="Wish to discontinue PrEP" />
            Wish to discontinue PrEP</label>
          <label><input type="checkbox" v-model="formData.reason_visit" value="STI symptoms/Screening" />
            STI symptoms/Screening</label>
          <label><input type="checkbox" v-model="formData.reason_visit" value="Change of dose/regimen" />
            Change of dose/regimen</label>
          <label><input type="checkbox" v-model="formData.reason_visit" value="Additional doses of PrEP" />
            Additional doses of PrEP</label>
          <label><input type="checkbox" v-model="formData.reason_visit" value="New medical problem" />
            New medical problem</label>
          <label><input type="checkbox" v-model="formData.reason_visit"
              value="Follow up for existing medical problem" />
            Follow up for existing medical problem</label>
          <label><input type="checkbox" v-model="formData.reason_visit" value="Other" />
            Other</label>
          <!-- Textarea for "Other" reason -->
          <div v-if="Array.isArray(formData.reason_visit) && formData.reason_visit.includes('Other')" style="margin-top: 0px">
            <textarea v-model="formData.other_reason_visit" rows="3" placeholder="Describe other reasons..."></textarea>
          </div>
        </div>

        <label style="margin-top: 1rem">2. If answered "Side effects from PrEP above": Please describe the
          side effects you have experienced. Probe for common side effects e.g.,
          nausea, vomiting, abdominal cramps, fatigue, dizziness,
          headache.</label>
        <div class="table-responsive">
          <table border="1" cellspacing="0" cellpadding="5" class="symptoms-table">
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Side effects</th>
                <th style="width: 150px">Yes/No</th>
                <th>Ongoing</th>
                <th>Resolved</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Nausea</td>
                <td>
                  <div class="yes-no-radio">
                    <label><input type="radio" name="nausea" v-model="formData.nausea" value="Yes" />
                      Y</label><label><input type="radio" name="nausea" v-model="formData.nausea" value="No" />
                      N</label>
                  </div>
                </td>
                <td>
                  <input type="checkbox" v-model="formData.nausea_ongoing" :disabled="formData.nausea !== 'Yes' || formData.nausea_resolved"
                    @change="handleSideEffectCheck('nausea', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.nausea_resolved" :disabled="formData.nausea !== 'Yes' || formData.nausea_ongoing"
                    @change="handleSideEffectCheck('nausea', 'resolved')" />
                </td>
              </tr>
              <tr>
                <td>2</td>
                <td>Vomiting</td>
                <td>
                  <div class="yes-no-radio">
                    <label><input type="radio" name="vomiting" v-model="formData.vomiting" value="Yes" />
                      Y</label><label><input type="radio" name="vomiting" v-model="formData.vomiting" value="No" />
                      N</label>
                  </div>
                </td>
                <td>
                  <input type="checkbox" v-model="formData.vomiting_ongoing" :disabled="formData.vomiting !== 'Yes' || formData.vomiting_resolved"
                    @change="handleSideEffectCheck('vomiting', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.vomiting_resolved" :disabled="formData.vomiting !== 'Yes' || formData.vomiting_ongoing"
                    @change="handleSideEffectCheck('vomiting', 'resolved')" />
                </td>
              </tr>
              <tr>
                <td>3</td>
                <td>Abdominal cramps</td>
                <td>
                  <div class="yes-no-radio">
                    <label><input type="radio" name="cramps" v-model="formData.abdominal_cramps" value="Yes" />
                      Y</label><label><input type="radio" name="cramps" v-model="formData.abdominal_cramps"
                        value="No" />
                      N</label>
                  </div>
                </td>
                <td>
                  <input type="checkbox" v-model="formData.abdominal_cramps_ongoing" :disabled="formData.abdominal_cramps !== 'Yes' ||
                    formData.abdominal_cramps_resolved"
                    @change="handleSideEffectCheck('abdominal_cramps', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.abdominal_cramps_resolved" :disabled="formData.abdominal_cramps !== 'Yes' ||
                    formData.abdominal_cramps_ongoing"
                    @change="handleSideEffectCheck('abdominal_cramps', 'resolved')" />
                </td>
              </tr>
              <tr>
                <td>4</td>
                <td>Fatigue</td>
                <td>
                  <div class="yes-no-radio">
                    <label><input type="radio" name="fatigue" v-model="formData.fatigue" value="Yes" />
                      Y</label><label><input type="radio" name="fatigue" v-model="formData.fatigue" value="No" />
                      N</label>
                  </div>
                </td>
                <td>
                  <input type="checkbox" v-model="formData.fatigue_ongoing" :disabled="formData.fatigue !== 'Yes' || formData.fatigue_resolved"
                    @change="handleSideEffectCheck('fatigue', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.fatigue_resolved" :disabled="formData.fatigue !== 'Yes' || formData.fatigue_ongoing"
                    @change="handleSideEffectCheck('fatigue', 'resolved')" />
                </td>
              </tr>
              <tr>
                <td>5</td>
                <td>Dizziness</td>
                <td>
                  <div class="yes-no-radio">
                    <label><input type="radio" name="dizziness" v-model="formData.dizziness" value="Yes" />
                      Y</label><label><input type="radio" name="dizziness" v-model="formData.dizziness" value="No" />
                      N</label>
                  </div>
                </td>
                <td>
                  <input type="checkbox" v-model="formData.dizziness_ongoing" :disabled="formData.dizziness !== 'Yes' ||
                    formData.dizziness_resolved"
                    @change="handleSideEffectCheck('dizziness', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.dizziness_resolved" :disabled="formData.dizziness !== 'Yes' || formData.dizziness_ongoing"
                    @change="handleSideEffectCheck('dizziness', 'resolved')" />
                </td>
              </tr>
              <tr>
                <td>6</td>
                <td>Headache</td>
                <td>
                  <div class="yes-no-radio">
                    <label><input type="radio" name="headache" v-model="formData.headache" value="Yes" />
                      Y</label><label><input type="radio" name="headache" v-model="formData.headache" value="No" />
                      N</label>
                  </div>
                </td>
                <td>
                  <input type="checkbox" v-model="formData.headache_ongoing" :disabled="formData.headache !== 'Yes' || formData.headache_resolved"
                    @change="handleSideEffectCheck('headache', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.headache_resolved" :disabled="formData.headache !== 'Yes' || formData.headache_ongoing"
                    @change="handleSideEffectCheck('headache', 'resolved')" />
                </td>
              </tr>
              <tr>
                <td>7</td>
                <td>Others (please describe below)</td>
                <td>
                  <div class="yes-no-radio">
                    <label><input type="radio" name="others" v-model="formData.others" value="Yes" />
                      Y</label><label><input type="radio" name="others" v-model="formData.others" value="No" />
                      N</label>
                  </div>
                </td>
                <td>
                  <input type="checkbox" v-model="formData.others_ongoing" :disabled="formData.others !== 'Yes' || formData.others_resolved"
                    @change="handleSideEffectCheck('others', 'ongoing')" />
                </td>
                <td>
                  <input type="checkbox" v-model="formData.others_resolved" :disabled="formData.others !== 'Yes' || formData.others_ongoing"
                    @change="handleSideEffectCheck('others', 'resolved')" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <textarea v-if="formData.others === 'Yes'" v-model="formData.others_description" rows="3"
          placeholder="Please describe other side effects..."></textarea>

        <label style="margin-top: 1rem">3. Have you had any challenges taking your PrEP as per prescribed
          doses?</label>
        <div style="display: flex; gap: 20px; margin-bottom: 1rem">
          <label style="display: inline-flex; align-items: center; font-weight: normal; margin-bottom: 0;"><input type="radio" v-model="formData.challenges_prep" name="challenges_prep" value="Yes" required />
            Yes</label>
          <label style="display: inline-flex; align-items: center; font-weight: normal; margin-bottom: 0;"><input type="radio" v-model="formData.challenges_prep" name="challenges_prep" value="No" required
              @click="formData.challenges_details = ''" />
            No</label>
        </div>
        <textarea v-if="formData.challenges_prep === 'Yes'" v-model="formData.challenges_details" rows="3"
          placeholder="If yes, describe the challenges..."></textarea>

        <label>4. If answered "Additional doses of PrEP above": Please provide more
          information (e.g., Loss/theft, travel?)</label>
        <textarea v-model="formData.additional_doses_details" rows="3" placeholder="Provide details..."></textarea>

        <label>5. Do you wish to stop taking PrEP or continue?</label>
        <div style="display: flex; gap: 20px; margin-bottom: 1rem">
          <label style="display: inline-flex; align-items: center; font-weight: normal; margin-bottom: 0;"><input type="radio" v-model="formData.prep_continue" name="prep_continue" value="Stop" required />
            Stop</label>
          <label style="display: inline-flex; align-items: center; font-weight: normal; margin-bottom: 0;"><input type="radio" v-model="formData.prep_continue" name="prep_continue" value="Continue" required />
            Continue</label>
        </div>

        <div v-if="formData.prep_continue === 'Stop'">
          <label>• If stopping, provide reasons:</label>
          <textarea v-model="formData.stopping_reasons" rows="3" placeholder="Provide reasons"></textarea>
          <label>• Preferred Prevention method after stopping:</label>
          <textarea v-model="formData.stopping_Preventionmethod" rows="3" placeholder="Specify method"></textarea>
        </div>

        <label>6. Other notes, tests performed, referrals made, etc.</label>
        <textarea v-model="formData.other_notes" rows="4" placeholder="Write any other relevant notes..."></textarea>

        <!-- Signature Section (Readonly) -->
        <h3 class="section-title" style="margin-top: 2rem">
          Interviewer Details
        </h3>
        <label for="interviewer_name">Name:</label>
        <input type="text" v-model="formData.interviewer_name" id="interviewer_name" name="interviewer_name" readonly />

        <label for="designation">Designation:</label>
        <input type="text" v-model="formData.designation" id="designation" name="designation" readonly />

        <label for="bmhc_number">BMHC Number:</label>
        <input type="text" v-model="formData.bmhc_number" id="bmhc_number" name="bmhc_number" readonly />
      </div>

      <!-- Submit Button -->
      <button type="submit" class="submit-btn" :disabled="submitDisabled || isSubmitting">
        {{ getSubmitButtonText() }}
      </button>
    </div>
  </form>

  <!-- Confirmation Modal -->
  <Form5_ConfirmationModal v-if="isReviewModalVisible" :formData="formData" :isSubmitting="isSubmitting"
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
    <div v-if="successMessage && !finalSubmitMessage" class="success-message">
      <p>{{ successMessage }}</p>
    </div>
    <div v-if="errorMessage && !finalSubmitMessage" class="error-message">
      <p>{{ errorMessage }}</p>
    </div>
    <!-- Original loading indicator -->
    <div v-if="isSubmitting && !isReviewModalVisible" class="submitting-indicator">
      Submitting...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";
// Import the NEW modal component
import Form5_ConfirmationModal from "./Form5_ConfirmationModal.vue"; // Adjust path if needed
import { prepSites } from "../location/prepSite";

// --- Configuration ---
// TODO: Deploy UnscheduledVisit_Complete_CRUD.gs as web app and replace with your URL
const GOOGLE_SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE"; // Use UnscheduledVisit_Complete_CRUD.gs
// Set to true to show debugging information
const DEBUG_MODE = true;
const CSV_DATA_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfG6e5EIcHDaXopn9DxMZnTwVFGi5CiQxmKlEIPsd7uPtZiQIikYb46UdN78UhZlJfocCfl_s0hGGX/pub?gid=0&single=true&output=csv"; // UID validation source
const UID_MIN_LENGTH = 5;
const SUBMIT_SUCCESS_DELAY = 2500;

// --- State Variables ---
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
const errorMessage = ref(""); // General messages

// CRUD State Variables
const hasExistingData = ref(false);
const isPrefilled = ref(false);
const isDeletingRecord = ref(false);

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
    if (DEBUG_MODE) console.log("CSV Data Loaded for Form 5");
    statusMessage.value = "Validation data loaded. Please enter UID.";
    if (formData.value.participant_uid)
      validateUidOnInput(formData.value.participant_uid);
    else submitDisabled.value = true;
  } catch (error) {
    console.error("Error fetching CSV data for Form 5:", error);
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
    } else {
      statusMessage.value = "Participant UID not found.";
      statusClass.value = "error";
      submitDisabled.value = true;
    }
  }
};

watch(() => formData.value.participant_uid, async (newUid) => {
  validateUidOnInput(newUid);
  if (newUid && csvData.length > 1 && validateUid(newUid)) {
    await checkExistingData(newUid);
  } else {
    hasExistingData.value = false;
    isPrefilled.value = false;
  }
});

// CRUD Functions
// Get submit button text based on state
const getSubmitButtonText = () => {
  if (isSubmitting.value) return 'Submitting...';
  if (isPrefilled.value) return 'Update Data';
  return 'Review Data';
};

// Check if data exists for UID
const checkExistingData = async (uid) => {
  try {
    if (DEBUG_MODE) console.log('=== CHECKING EXISTING DATA ===');
    if (DEBUG_MODE) console.log('UID:', uid);
    if (DEBUG_MODE) console.log('GOOGLE_SCRIPT_URL:', GOOGLE_SCRIPT_URL);
    
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === '' || GOOGLE_SCRIPT_URL.includes('PASTE_YOUR')) {
      console.error('❌ Google Script URL not configured!');
      statusMessage.value = '❌ Google Script URL not configured. Please deploy your script and update line 354!';
      statusClass.value = 'error';
      hasExistingData.value = false;
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
        statusMessage.value = `Existing record found for ${uid}. Auto-loading data...`;
        statusClass.value = 'success';
        // Automatically load existing data
        await loadExistingData();
      } else {
        statusMessage.value = `Ready to add unscheduled visit for ${uid}`;
        statusClass.value = 'success';
      }
    } else {
      console.error('checkExistingData error response:', response.data);
      statusMessage.value = response.data.message || 'Error checking existing data';
      statusClass.value = 'error';
      hasExistingData.value = false;
    }
  } catch (error) {
    console.error('Error checking existing data:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      statusMessage.value = `Server error: ${error.response.status}`;
    } else if (error.request) {
      console.error('Network error:', error.request);
      statusMessage.value = 'Network error - cannot reach server';
    } else {
      console.error('Error message:', error.message);
      statusMessage.value = 'Error checking data: ' + error.message;
    }
    statusClass.value = 'error';
    hasExistingData.value = false;
  }
};

// Load existing data for UID
const loadExistingData = async () => {
  try {
    if (DEBUG_MODE) console.log('=== LOADING EXISTING DATA ===');
    if (DEBUG_MODE) console.log('UID:', formData.value.participant_uid);
    if (DEBUG_MODE) console.log('GOOGLE_SCRIPT_URL:', GOOGLE_SCRIPT_URL);
    
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === '' || GOOGLE_SCRIPT_URL.includes('PASTE_YOUR')) {
      console.error('❌ Google Script URL not configured for prefill!');
      statusMessage.value = '❌ Cannot prefill - Google Script URL not set!';
      statusClass.value = 'error';
      return;
    }

    statusMessage.value = '🔄 Loading existing data...';
    statusClass.value = 'info';

    if (DEBUG_MODE) console.log('Making prefill request...');

    const response = await axios.get(GOOGLE_SCRIPT_URL, {
      params: { action: 'prefill', uid: formData.value.participant_uid },
      timeout: 15000
    });

    if (DEBUG_MODE) console.log('Prefill response:', response.data);

    if (response.data.status === 'success') {
      const prefillData = response.data.data;

      if (DEBUG_MODE) {
        console.log('✅ Prefill successful!');
        console.log('📦 Prefill data received:', prefillData);
        console.log('🔢 Number of fields:', Object.keys(prefillData).length);
      }

      // Map backend column names to frontend field names
      const columnToFieldMap = {
        'uid': 'participant_uid',
        'prep_site': 'prep_site',
        'date': 'date',
        'reason_for_this_visit': 'reason_visit',
        'Other_describe': 'other_reason_visit',
        'Nausea': 'nausea',
        'Nausea_Ongoing': 'nausea_ongoing',
        'Nausea_Resolved': 'nausea_resolved',
        'Vomiting': 'vomiting',
        'Vomiting_Ongoing': 'vomiting_ongoing',
        'Vomiting_Resolved': 'vomiting_resolved',
        'Abdominalcramps': 'abdominal_cramps',
        'Abdominalcramps_Ongoing': 'abdominal_cramps_ongoing',
        'Abdominalcramps_Resolved': 'abdominal_cramps_resolved',
        'Fatigue': 'fatigue',
        'Fatigue_Ongoing': 'fatigue_ongoing',
        'Fatigue_Resolved': 'fatigue_resolved',
        'Dizziness': 'dizziness',
        'Dizziness_Ongoing': 'dizziness_ongoing',
        'Dizziness_Resolved': 'dizziness_resolved',
        'Headache': 'headache',
        'Headache_Ongoing': 'headache_ongoing',
        'Headache_Resolved': 'headache_resolved',
        'Others': 'others',
        'Others_Ongoing': 'others_ongoing',
        'Others_Resolved': 'others_resolved',
        'Others_please_describe_below': 'others_description',
        'challenges_taking_PrEP': 'challenges_prep',
        'comments_challenges_faced': 'challenges_details',
        'Additional_doses_above': 'additional_doses_details',
        'stop_or_continue': 'prep_continue',
        'stopping_reason': 'stopping_reasons',
        'stopping_indicate_reasons_preferred_method': 'stopping_Preventionmethod',
        'Other_notes': 'other_notes',
        'Date': 'interviewer_date',
        'Name': 'interviewer_name',
        'Designation': 'designation',
        'BMHC Number': 'bmhc_number'
      };

      Object.keys(prefillData).forEach(columnName => {
        const fieldName = columnToFieldMap[columnName];
        if (fieldName && formData.value.hasOwnProperty(fieldName)) {
          const value = prefillData[columnName];
          
          if (DEBUG_MODE) console.log(`Mapping ${columnName} to ${fieldName}:`, value, typeof value);
          
          // Handle different data types
          if (Array.isArray(formData.value[fieldName])) {
            // Handle arrays (reason_visit comes as array from backend)
            formData.value[fieldName] = Array.isArray(value) ? value : (value ? [value] : []);
          }
          else if (typeof formData.value[fieldName] === 'boolean') {
            // Handle booleans (backend sends true/false)
            formData.value[fieldName] = value === true || value === 'true' || value === 'Yes';
          }
          else {
            // Handle regular values (strings, dates, etc.)
            formData.value[fieldName] = value || '';
          }
        } else {
          if (DEBUG_MODE) console.log(`Column ${columnName} not mapped to any field`);
        }
      });

      isPrefilled.value = true;
      statusMessage.value = 'Data auto-loaded! Ready to update or delete.';
      statusClass.value = 'success';
      submitDisabled.value = false;

    } else {
      console.error('Prefill error:', response.data);
      statusMessage.value = response.data.message || 'Error loading data';
      statusClass.value = 'error';
    }
  } catch (error) {
    console.error('Error loading data:', error);
    if (error.response) {
      statusMessage.value = `Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
    } else if (error.request) {
      statusMessage.value = 'Network error - cannot reach server. Check your Google Script URL.';
    } else {
      statusMessage.value = 'Error loading data: ' + error.message;
    }
    statusClass.value = 'error';
  }
};

// Start new entry (clear form and prepare for new entry)
const startNewVisit = () => {
  // Clear form but keep basic info
  const basicInfo = {
    participant_uid: formData.value.participant_uid,
    prep_site: formData.value.prep_site,
    interviewer_name: formData.value.interviewer_name,
    designation: formData.value.designation,
    bmhc_number: formData.value.bmhc_number,
    date: formData.value.date
  };

  // Reset form
  clearForm();

  // Restore basic info
  Object.assign(formData.value, basicInfo);

  isPrefilled.value = false;

  statusMessage.value = 'Ready to add new unscheduled visit';
  statusClass.value = 'info';
  submitDisabled.value = false;
};

// Confirm delete action
const confirmDelete = () => {
  if (confirm(`Are you sure you want to delete the unscheduled visit record for UID: ${formData.value.participant_uid}?\n\nThis action cannot be undone.`)) {
    deleteRecord();
  }
};

// Delete record function
const deleteRecord = async () => {
  isDeletingRecord.value = true;

  try {
    const response = await axios.post(GOOGLE_SCRIPT_URL,
      new URLSearchParams({
        action: 'delete',
        uid: formData.value.participant_uid
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      }
    );

    if (response.data.status === 'success') {
      statusMessage.value = response.data.message || 'Record deleted successfully!';
      statusClass.value = 'success';

      // Refresh data status
      await checkExistingData(formData.value.participant_uid);

      // Clear current form
      clearForm();
      isPrefilled.value = false;
      hasExistingData.value = false;
    } else {
      statusMessage.value = response.data.message || 'Failed to delete record';
      statusClass.value = 'error';
    }

  } catch (error) {
    console.error('Delete error:', error);
    statusMessage.value = 'Error deleting record. Please try again.';
    statusClass.value = 'error';
  } finally {
    isDeletingRecord.value = false;
  }
};

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
const confirmAndSubmit = async () => {
  isSubmitting.value = true;
  modalSuccessMessage.value = "";
  modalErrorMessage.value = "";
  clearFinalMessage();
  const url = GOOGLE_SCRIPT_URL; // Use the UnscheduledVisit Script URL

  try {
    const dataToSend = { ...formData.value };

    // Add action parameter if updating
    if (isPrefilled.value) {
      dataToSend.action = 'update';
    }

    // Map frontend field names to backend column names (matching Google Script exactly)
    const backendData = {
      uid: dataToSend.participant_uid,
      prep_site: dataToSend.prep_site,
      date: dataToSend.date,
      reason_for_this_visit: Array.isArray(dataToSend.reason_visit) ? dataToSend.reason_visit.join('; ') : dataToSend.reason_visit,
      Other_describe: dataToSend.other_reason_visit,
      Nausea: dataToSend.nausea,
      Nausea_Ongoing: dataToSend.nausea_ongoing ? 'Yes' : 'No',
      Nausea_Resolved: dataToSend.nausea_resolved ? 'Yes' : 'No',
      Vomiting: dataToSend.vomiting,
      Vomiting_Ongoing: dataToSend.vomiting_ongoing ? 'Yes' : 'No',
      Vomiting_Resolved: dataToSend.vomiting_resolved ? 'Yes' : 'No',
      Abdominalcramps: dataToSend.abdominal_cramps,
      Abdominalcramps_Ongoing: dataToSend.abdominal_cramps_ongoing ? 'Yes' : 'No',
      Abdominalcramps_Resolved: dataToSend.abdominal_cramps_resolved ? 'Yes' : 'No',
      Fatigue: dataToSend.fatigue,
      Fatigue_Ongoing: dataToSend.fatigue_ongoing ? 'Yes' : 'No',
      Fatigue_Resolved: dataToSend.fatigue_resolved ? 'Yes' : 'No',
      Dizziness: dataToSend.dizziness,
      Dizziness_Ongoing: dataToSend.dizziness_ongoing ? 'Yes' : 'No',
      Dizziness_Resolved: dataToSend.dizziness_resolved ? 'Yes' : 'No',
      Headache: dataToSend.headache,
      Headache_Ongoing: dataToSend.headache_ongoing ? 'Yes' : 'No',
      Headache_Resolved: dataToSend.headache_resolved ? 'Yes' : 'No',
      Others: dataToSend.others,
      Others_Ongoing: dataToSend.others_ongoing ? 'Yes' : 'No',
      Others_Resolved: dataToSend.others_resolved ? 'Yes' : 'No',
      Others_please_describe_below: dataToSend.others_description,
      challenges_taking_PrEP: dataToSend.challenges_prep,
      comments_challenges_faced: dataToSend.challenges_details,
      Additional_doses_above: dataToSend.additional_doses_details,
      stop_or_continue: dataToSend.prep_continue,
      stopping_reason: dataToSend.stopping_reasons,
      stopping_indicate_reasons_preferred_method: dataToSend.stopping_Preventionmethod,
      Other_notes: dataToSend.other_notes,
      Date: dataToSend.date, // Interviewer date
      Name: dataToSend.interviewer_name,
      Designation: dataToSend.designation,
      'BMHC Number': dataToSend.bmhc_number
    };

    // Add action if updating
    if (dataToSend.action) {
      backendData.action = dataToSend.action;
    }

    const formDataSerialized = new URLSearchParams(backendData).toString();
    if (DEBUG_MODE) {
      console.log("Submitting Unscheduled Visit data:", backendData); 
      console.log("Serialized data:", formDataSerialized);
    }

    // Use Axios as in the original script
    const response = await axios.post(url, formDataSerialized, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000
    });
    if (DEBUG_MODE) console.log("Unscheduled Visit Response:", response);

    if (response.data.status === 'success') {
      modalSuccessMessage.value = response.data.message;
      setTimeout(async () => {
        isReviewModalVisible.value = false;
        setFinalMessage(response.data.message, "success");

        // After successful submission, refresh the data status if we have a UID
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
    console.error("Unscheduled Visit Submit Error:", error);
    let detailedError = "Error submitting Unscheduled Visit.";
    if (error.response) detailedError += ` (Status: ${error.response.status})`;
    else if (error.request) detailedError += " (No response)";
    else detailedError += ` (${error.message})`;
    modalErrorMessage.value = detailedError;
  } finally {
    isSubmitting.value = false;
  }
};

// Side Effect Checkbox Handler
const handleSideEffectCheck = (effect, type) => {
  const ongoingKey = `${effect}_ongoing`;
  const resolvedKey = `${effect}_resolved`;
  if (type === "ongoing" && formData.value[ongoingKey])
    formData.value[resolvedKey] = false;
  else if (type === "resolved" && formData.value[resolvedKey])
    formData.value[ongoingKey] = false;
};

// Clear Form
const clearForm = () => {
  const interviewerDetails = {
    interviewer_name: formData.value.interviewer_name,
    designation: formData.value.designation,
    bmhc_number: formData.value.bmhc_number,
  };
  Object.keys(formData.value).forEach((key) => {
    if (key in interviewerDetails || key === "date") return; // Keep interviewer details and date
    if (Array.isArray(formData.value[key])) formData.value[key] = [];
    else if (typeof formData.value[key] === "boolean")
      formData.value[key] = false;
    else if (typeof formData.value[key] === "number")
      formData.value[key] = null;
    else if (key === "prep_site")
      formData.value[key] = ""; // Reset prep site
    else formData.value[key] = "";
  });
  Object.assign(formData.value, interviewerDetails);
  initializeDate(); // Restore details, re-init date
  statusMessage.value = "";
  statusClass.value = "";
  submitDisabled.value = true;
  clearFinalMessage();
  successMessage.value = "";
  errorMessage.value = "";
};

// Logged In User
const getLoggedInUser = () => {
  try {
    const user = localStorage.getItem("loggedInUser");
    return user ? JSON.parse(user) : null;
  } catch (e) {
    console.error("Error parsing loggedInUser", e);
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

// onMounted
onMounted(() => {
  initializeDate();
  fetchCsvData();

  // Get the user data from localStorage
  const storedUser = localStorage.getItem("loggedInUser");
  const loggedInUser = storedUser ? JSON.parse(storedUser) : null;

  // Populate interviewer details if user is logged in
  if (loggedInUser) {
    formData.value.interviewer_name = loggedInUser.fullname || "";
    formData.value.designation = loggedInUser.designation || "";
    formData.value.bmhc_number = loggedInUser.bhc_no || "";
  } else {
    console.warn("Form 5: Logged in user details not found.");
    formData.value.interviewer_name = "";
    formData.value.designation = "";
    formData.value.bmhc_number = "";
  }
});
</script>

<style>
/* Visit Type Selection Styles - Matching Form4 */
.visit-type-selection {
  margin: 20px 0;
  padding: 15px;
  border: 2px solid #e3f2fd;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.visit-type-selection h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1rem;
}

.visit-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.visit-btn {
  padding: 10px 15px;
  border: 2px solid #007bff;
  background-color: white;
  color: #007bff;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.visit-btn:hover {
  background-color: #007bff;
  color: white;
  transform: translateY(-1px);
}

.visit-btn.selected {
  background-color: #007bff;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
}

.visit-btn.new-visit {
  border-color: #28a745;
  color: #28a745;
  border-style: dashed;
}

.visit-btn.new-visit:hover {
  background-color: #28a745;
  color: white;
  border-style: solid;
}

/* Prefill Status Styles - Fixed alignment */
.prefill-status {
  margin: 15px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  flex-wrap: wrap;
  width: 100%;
  min-height: 40px;
  box-sizing: border-box;
}

.update-mode-banner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #28a745;
  color: white;
  padding: 8px 15px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.delete-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.delete-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Keep the original styles provided */
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

.checkbox-group-vertical,
.radio-group-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-group-vertical label,
.radio-group-vertical label {
  display: flex;
  align-items: center;
  font-weight: normal;
  margin-bottom: 0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.section-title {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 20px;
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
  transition: background-color 0.3s;
  width: 100%;
  margin-top: 20px;
}

.submit-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.submit-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

/* Status messages */
#status-message {
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

#status-message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

#status-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

#status-message.info {
  background-color: #d9edf7;
  color: #31708f;
  border-color: #bce8f1;
}

.uid-spinner {
  color: #007bff;
  font-size: 0.9rem;
  margin-left: 10px;
}

/* Final messages */
.final-message {
  margin-top: 20px;
  padding: 15px;
  border-radius: 5px;
  text-align: center;
}

.success-final {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error-final {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Table styles for symptoms */
.table-responsive {
  overflow-x: auto;
  margin: 1rem 0;
}

.symptoms-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.symptoms-table th,
.symptoms-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.symptoms-table th {
  background-color: #f8f9fa;
  font-weight: bold;
}

.yes-no-radio {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.yes-no-radio label {
  display: flex;
  align-items: center;
  font-weight: normal;
  margin-bottom: 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }

  .form-container {
    padding: 1rem;
  }

  .visit-buttons {
    flex-direction: column;
  }

  .visit-btn {
    width: 100%;
    text-align: center;
    justify-content: center;
  }

  .prefill-status {
    flex-direction: column;
    align-items: stretch;
  }

  .delete-btn {
    width: 100%;
    justify-content: center;
    margin-top: 10px;
  }
}
</style>