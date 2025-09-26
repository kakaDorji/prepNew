<template>
  <!-- Suitabilityy Form -->
  <form @submit.prevent="showReviewModal">
    <!-- Changed to show modal -->
    <div class="container">
      <div class="form-container">
        <!-- All your existing form fields remain exactly the same -->
        <label for="date">Date:</label>
        <input type="date" v-model="formData.date" id="dateInput" name="date" required />

        <label for="participant_uid">Participant UID:</label>
        <input type="text" v-model="formData.participant_uid" id="participant_uid" name="participant_uid" required
          pattern="[A-Za-z0-9]{5,}" title="Minimum 5 Alphanumeric characters" :readonly="editMode" />
        <!-- Status Message for UID Validation -->
        <div v-if="statusMessage" id="status-message" :class="statusClass">
          {{ statusMessage }}
        </div>
        <span v-if="isCheckingUid" class="uid-spinner"><i class="fas fa-spinner fa-spin"></i> Checking...</span>

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

        <!-- Visit Type Selection with Available Visits -->
        <div v-if="formData.participant_uid && validateUid(formData.participant_uid)">

          <!-- Loading check -->
          <div v-if="isCheckingVisits" style="text-align: center; padding: 1rem; color: #3498db;">
            <span class="uid-spinner"><i class="fas fa-spinner fa-spin"></i> Checking visits...</span>
          </div>

          <!-- Visit Selection -->
          <div v-else>
            <label style="margin-top: 1rem">TYPE OF VISIT:</label>

            <!-- Show existing visits if any -->
            <div v-if="hasVisitsWithData" style="margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <p style="font-size: 0.9em; color: #3498db; margin: 0;">
                  <strong>UPDATE existing data:</strong> ({{ visitsWithData.length }} visit(s) found)
                </p>
                <button 
                  v-if="formData.type_of_visit && visitDataStatus[formData.type_of_visit] === 'Has Data'"
                  type="button" 
                  @click="confirmDeleteVisit(formData.type_of_visit)"
                  :disabled="isDeletingVisit === formData.type_of_visit" 
                  class="delete-visit-btn-small"
                  :title="`Delete ${formData.type_of_visit} record`"
                >
                  <span v-if="isDeletingVisit === formData.type_of_visit">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                  <span v-else>
                    <i class="fas fa-trash"></i>
                  </span>
                </button>
              </div>
              <div class="radio-group-vertical"
                style="border: 1px solid #3498db; padding: 10px; background: #f0f8ff; border-radius: 5px;">
                <label v-for="visit in visitsWithData" :key="'update-' + visit.value" 
                  style="margin: 0; display: flex; align-items: center; margin-bottom: 5px;">
                  <input type="radio" v-model="formData.type_of_visit" name="type_of_visit" :value="visit.value"
                    @click="loadVisitData(visit.value)" required style="margin-right: 8px;" />
                  {{ visit.label }}
                  <span style="color: #28a745; font-size: 0.85em; margin-left: 8px;">✓ Has Data</span>
                  <span v-if="isLoadingVisit === visit.value" style="margin-left: 10px;">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                </label>
              </div>
            </div>
            <!-- Create new visit - show visits that DON'T have data -->
            <div v-if="hasVisitsWithoutData">
              <p style="font-size: 0.9em; color: #856404; margin-bottom: 0.5rem;">
                <strong>CREATE new visit data:</strong>
              </p>
              <div class="radio-group-vertical"
                style="border: 1px solid #ffc107; padding: 10px; background: #fffbf0; border-radius: 5px;">
                <label v-for="visit in visitsWithoutData" :key="'create-' + visit.value">
                  <input type="radio" v-model="formData.type_of_visit" name="type_of_visit" :value="visit.value"
                    @click="createNewVisit(visit.value)" required />
                  {{ visit.label }}
                  <span style="color: #ffc107; font-size: 0.85em;">+ New</span>
                </label>
              </div>
            </div>

            <!-- Current mode display -->
            <div v-if="formData.type_of_visit"
              style="margin-top: 1rem; padding: 10px 15px; border-radius: 6px; font-size: 0.9em; text-align: center; font-weight: 500;"
              :style="isPrefilled ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;'">
              <i :class="isPrefilled ? 'fas fa-edit' : 'fas fa-plus'"></i>
              <strong>{{ formData.type_of_visit }}</strong>
              <span v-if="isPrefilled"> - Update Mode</span>
              <span v-else> - New Record</span>
            </div>

          </div>
        </div>

        <!-- Fallback simple dropdown for invalid UIDs -->
        <div v-else>
          <label for="type_of_visit">Type of Visit:</label>
          <select v-model="formData.type_of_visit" id="type_of_visit" name="type_of_visit" required>
            <option value="mst" disabled>Select one</option>
            <option value="Screening Visit MO">Screening Visit MO</option>
            <option value="End of M1">End of M1</option>
            <option value="End of M3">End of M3</option>
            <option value="End of M6">End of M6</option>
            <option value="End of M9">End of M9</option>
            <option value="End of M12">End of M12</option>
          </select>
        </div>

        <label>KP:</label>
        <div style="
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 10px;
            margin-bottom: 15px;
          ">
          <label style="display: inline-flex; align-items: center; margin-bottom: 0">
            <input type="radio" v-model="formData.kpo_group" value="FSW" name="kpo_group" />
            FSW
          </label>
          <label style="display: inline-flex; align-items: center; margin-bottom: 0">
            <input type="radio" v-model="formData.kpo_group" value="MSM" name="kpo_group" />
            MSM
          </label>
          <label style="display: inline-flex; align-items: center; margin-bottom: 0">
            <input type="radio" v-model="formData.kpo_group" value="TGQ" name="kpo_group" />
            TGQ
          </label>
        </div>

        <label for="prep_site">PrEP Site</label>
        <select v-model="formData.prep_site" id="prep_site" name="prep_site" required>
          <option v-for="site in prepSites" :key="site" :value="site">
            {{ site }}
          </option>
        </select>

        <!-- Demographic Assessment -->
        <h3 class="section-title">A. Demographic Assessment</h3>
        <label for="age">Age (15 years and older):</label>
        <input type="number" v-model.number="formData.age" id="age" name="age" min="15" @blur="checkAge" required />
        <div v-if="ageMessage" id="message" style="
            color: #a94442;
            margin-top: -10px;
            margin-bottom: 15px;
            font-size: 0.9em;
          ">
          {{ ageMessage }}
        </div>

        <label for="weight">Weight(Kg):</label>
        <input type="number" step="0.1" v-model.number="formData.weight" id="weight" name="weight" />

        <label for="resident">Resident of:</label>
        <select v-model="formData.resident" id="resident" name="resident" style="margin-top: 10px">
          <option value="" disabled>Select Dzongkhag</option>
          <option value="Thimphu">Thimphu</option>
          <option value="Paro">Paro</option>
          <option value="Sarpang">Sarpang</option>
          <option value="Chukha">Chukha</option>
          <option value="Bumthang">Bumthang</option>
          <option value="Dagana">Dagana</option>
          <option value="Gasa">Gasa</option>
          <option value="Haa">Haa</option>
          <option value="Lhuentse">Lhuentse</option>
          <option value="Mongar">Mongar</option>
          <option value="Pemagatshel">Pemagatshel</option>
          <option value="Punakha">Punakha</option>
          <option value="Samdrup Jongkhar">Samdrup Jongkhar</option>
          <option value="Samste">Samste</option>
          <option value="Trashigang">Trashigang</option>
          <option value="Trashiyangtse">Trashiyangtse</option>
          <option value="Trongsa">Trongsa</option>
          <option value="Tsirang">Tsirang</option>
          <option value="Wangdue Phodrang">Wangdue Phodrang</option>
          <option value="Zhemgang">Zhemgang</option>
        </select>

        <!-- Behavioral Risk Assessment -->
        <h3 class="section-title">B. Behavioral Risk Assessment</h3>
        <div class="checkbox-group" style="
            padding: 10px;
            border: 1px solid #eee;
            border-radius: 5px;
            background-color: #fdfdfd;
          ">
          <label><input type="checkbox" v-model="formData.behavioral_risk" value="Condomless_Sex_gt1" />
            In the past 6 months, did you have condomless sex with > 1
            client/partner?</label>
          <label><input type="checkbox" v-model="formData.behavioral_risk" value="STI_Symptoms_Diagnosis" />
            In the past 6 months, did you get diagnosed with/experience symptoms
            of STIs?</label>
          <label><input type="checkbox" v-model="formData.behavioral_risk" value="Unaware_Partner_HIV_Status" />
            Are you aware of your sexual/injecting partner’s HIV status?</label>
          <label><input type="checkbox" v-model="formData.behavioral_risk" value="Sex_Under_Influence" />
            Do you recurrently have sex under the influence of
            alcohol/recreational drugs?</label>
          <label><input type="checkbox" v-model="formData.behavioral_risk" value="PEP_Last_6_Months" />
            Have you taken post exposure prophylaxis (PEP) in the last 6
            months?</label>
          <label><input type="checkbox" v-model="formData.behavioral_risk" value="Anticipate_Condomless_Sex" />
            Do you anticipate condomless sex in the next 3 months?</label>
        </div>
        <p>
          <strong>(Please note the potential PrEP user must fulfill at least one
            behavioral risk criteria to be suitable for PrEP)</strong>
        </p>

        <!-- HIV Status Assessment -->
        <h3 class="section-title">C. HIV Status Assessment</h3>
        <div style="
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #eee;
            border-radius: 5px;
          ">
          <label style="font-weight: 600; margin-bottom: 10px">HIV Test (Rapid):</label>
          <div style="
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 10px 15px;
            ">
            <span style="margin-right: 5px">Date:</span>
            <input type="date" v-model="formData.rapid_test_date" name="rapid_test_date"
              style="width: auto; max-width: 160px; padding: 0.4rem 0.6rem" />
            <span style="margin-left: 15px; margin-right: 5px">Result:</span>
            <label style="
                display: inline-flex;
                align-items: center;
                font-weight: normal;
                margin-bottom: 0;
              "><input type="radio" v-model="formData.rapid_test_result" name="rapid_test_result" value="positive" />
              Positive</label>
            <label style="
                display: inline-flex;
                align-items: center;
                font-weight: normal;
                margin-bottom: 0;
              "><input type="radio" v-model="formData.rapid_test_result" name="rapid_test_result" value="negative" />
              Negative</label>
          </div>
        </div>
        <div style="
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid #eee;
            border-radius: 5px;
          ">
          <label style="font-weight: 600; margin-bottom: 10px">HIV 4th Generation HIV test:</label>
          <div style="
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 10px 15px;
            ">
            <span style="margin-right: 5px">Date:</span>
            <input type="date" v-model="formData.generation_test_date" name="generation_test_date"
              style="width: auto; max-width: 160px; padding: 0.4rem 0.6rem" />
            <span style="margin-left: 15px; margin-right: 5px">Result:</span>
            <label style="
                display: inline-flex;
                align-items: center;
                font-weight: normal;
                margin-bottom: 0;
              "><input type="radio" v-model="formData.generation_test_result" name="generation_test_result"
                value="positive" />
              Positive</label>
            <label style="
                display: inline-flex;
                align-items: center;
                font-weight: normal;
                margin-bottom: 0;
              "><input type="radio" v-model="formData.generation_test_result" name="generation_test_result"
                value="negative" />
              Negative</label>
          </div>
        </div>

        <div style="
            margin-bottom: 15px;
            display: flex;
            gap: 15px;
            align-items: center;
          ">
          <label style="margin-bottom: 0; font-weight: 600">Willing to start PrEP:</label>
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            ">
            <input type="radio" v-model="formData.start_prep" name="start_prep" value="Yes" required />
            Yes
          </label>
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            ">
            <input type="radio" v-model="formData.start_prep" name="start_prep" value="No" />
            No
          </label>
        </div>
        <div style="
            margin-bottom: 20px;
            display: flex;
            gap: 15px;
            align-items: center;
          ">
          <label style="margin-bottom: 0; font-weight: 600">Willing to return for at least one follow-up visit:</label>
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            "><input type="radio" v-model="formData.follow_up" name="follow_up" value="Yes" required />
            Yes</label>
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            "><input type="radio" v-model="formData.follow_up" name="follow_up" value="No" required />
            No</label>
        </div>

        <!-- Clinical/Medical Assessment -->
        <h3 class="section-title">D. Clinical/Medical Assessment</h3>
        <div class="checkbox-group" style="
            padding: 10px;
            border: 1px solid #eee;
            border-radius: 5px;
            background-color: #fdfdfd;
          ">
          <label><input type="checkbox" v-model="formData.medicalInfo" value="No_HIV_Exposure_Last_72h" />
            No HIV risk exposure in the last 72 hours</label>
          <label><input type="checkbox" v-model="formData.medicalInfo" value="No_Acute_HIV_Symptoms" />
            No signs/symptoms of acute HIV (AHI)</label>
          <label><input type="checkbox" v-model="formData.medicalInfo" value="No_Allergy_Contraindications_TDF_3TC" />
            No allergy or contraindications to Tenofovir + Lamivudine (TDF +
            3TC)</label>
          <label><input type="checkbox" v-model="formData.medicalInfo" value="Medically_Suitable" />
            Medically suitable to start PrEP</label>
        </div>

        <!-- PrEP Initiation -->
        <h3 class="section-title">E. PrEP Initiation</h3>
        <div style="
            margin-bottom: 15px;
            display: flex;
            gap: 15px;
            align-items: center;
          ">
          <label style="margin-bottom: 0; font-weight: 600">Suitable for PrEP:</label>
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            ">
            <input type="radio" v-model="formData.suitable_for_prep" name="suitable_for_prep" value="Yes" required />
            Yes
          </label>
          <label style="
              display: inline-flex;
              align-items: center;
              font-weight: normal;
              margin-bottom: 0;
            ">
            <input type="radio" v-model="formData.suitable_for_prep" name="suitable_for_prep" value="No" />
            No
          </label>
        </div>

        <div v-if="formData.type_of_visit === 'Screening Visit MO'" id="prep-initiation-section">
          <label for="prep_initiation_date">Date of initiation of PrEP:</label>
          <input type="date" v-model="formData.prep_initiation_date" id="prep_initiation_date"
            name="prep_initiation_date" />
        </div>

        <!-- Prescriber Signature -->
        <h3 class="section-title">Prescriber’s Details</h3>
        <label>Date:</label>
        <input type="date" v-model="formData.signature_date" name="signature_date" readonly />
        <label>Name:</label>
        <input type="text" v-model="formData.prescriber_name" name="prescriber_name" readonly />
        <label>Designation:</label>
        <input type="text" v-model="formData.prescriber_designation" name="prescriber_designation" readonly />
        <label>BMHC NO:</label>
        <input type="text" v-model="formData.bhc_no" name="bmhc_no" readonly />

        <!-- Submit Button -->
        <div class="button-group">
          <button type="submit" class="submit-btn" :disabled="submitDisabled || isSubmitting">
            {{ getSubmitButtonText() }}
          </button>
          <button v-if="props.editMode" type="button" class="cancel-btn" @click="cancelEdit">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </form>

  <!-- Use the Confirmation Modal -->
  <Form1_ConfirmationModal v-if="isReviewModalVisible" :formData="formData" :isSubmitting="isSubmitting"
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
    <!-- Keep original success/error message display if needed for other purposes -->
    <div v-if="successMessage && !finalSubmitMessage" class="success-message">
      <p>{{ successMessage }}</p>
    </div>
    <div v-if="errorMessage && !finalSubmitMessage" class="error-message">
      <p>{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, defineProps, defineEmits } from "vue";
import axios from "axios";
import { prepSites } from "../location/prepSite";
// Import the modal component
import Form1_ConfirmationModal from "./Form1_ConfirmationModal.vue"; // Adjust path if needed

// --- Props ---
const props = defineProps({
  editMode: {
    type: Boolean,
    default: false
  },
  initialData: {
    type: Object,
    default: () => ({})
  }
});

// --- Emits ---
const emit = defineEmits(['form-updated', 'cancel-edit']);
// Update this URL to your new Form1 Google Apps Script deployment
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwS1F6-Umjj4yQtSkYvh-wawbTi9rZEoHc-0tLWCo-gPA8OapIl3d1ZEZ_lRV6CJOgv0w/exec"
// // --- Configuration ---
// const GOOGLE_SCRIPT_URL =
//   "https://script.google.com/macros/s/AKfycbwIZ4yvln-49s0GgXemjmRGHGJ_kiV007OAAEwu44VTrllNA_ovtPTQBDsQCuHxDIsR7w/exec"; // Replace with your actual URL
const CSV_DATA_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfG6e5EIcHDaXopn9DxMZnTwVFGi5CiQxmKlEIPsd7uPtZiQIikYb46UdN78UhZlJfocCfl_s0hGGX/pub?gid=0&single=true&output=csv";
const UID_MIN_LENGTH = 5;
const SUBMIT_SUCCESS_DELAY = 2500; // Milliseconds to show success message in modal

// --- State Variables ---
const formData = ref({
  date: "",
  participant_uid: "",
  type_of_visit: "mst", // Default value
  kpo_group: "",
  prep_site: "CHD/JDWNRH/Thimphu", // Default value
  age: null,
  weight: null,
  resident: "",
  behavioral_risk: [],
  rapid_test_date: "",
  rapid_test_result: "",
  generation_test_date: "",
  generation_test_result: "",
  start_prep: "",
  follow_up: "",
  medicalInfo: [],
  suitable_for_prep: "",
  prep_initiation_date: "",
  signature_date: "",
  prescriber_name: "",
  prescriber_designation: "",
  bhc_no: "",
});

const statusMessage = ref(""); // For UID validation feedback
const statusClass = ref(""); // CSS class for UID feedback
const ageMessage = ref(""); // For age validation feedback
const isCheckingUid = ref(false); // Indicate if CSV lookup is in progress
const submitDisabled = ref(true); // Controls if "Review Data" button is enabled
const isSubmitting = ref(false); // Controls submission loading state (for modal buttons)

// Modal Specific State
const isReviewModalVisible = ref(false);
const modalSuccessMessage = ref("");
const modalErrorMessage = ref("");

// Final Message State (shown after modal closes)
const finalSubmitMessage = ref("");
const finalSubmitClass = ref("");

// General feedback messages (can be removed if only modal/final messages are used)
const successMessage = ref("");
const errorMessage = ref("");

// Prefill and delete state
const isPrefilled = ref(false);
const isDeletingRecord = ref(false);

// Available Visits state variables
const availableVisits = ref([]); // Store which visit types have data for current UID
const isCheckingVisits = ref(false); // Track when checking for available visits
const isLoadingVisit = ref(null); // Track which visit is being loaded
const isDeletingVisit = ref(null); // Track which visit is being deleted
const visitDataStatus = ref({}); // Track which visits have data

let csvData = []; // To store fetched CSV data

// --- Functions ---

// Initialize today's date
function initializeDate() {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  formData.value.date = today;
  formData.value.signature_date = today;
}

// Fetch CSV data
async function fetchCsvData() {
  isCheckingUid.value = true;
  statusMessage.value = "Loading validation data...";
  statusClass.value = "";
  submitDisabled.value = true; // Disable while loading

  try {
    // Using fetch as in original code
    const response = await fetch(CSV_DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    csvData = csvText.split("\n").map(
      (row) => row.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")) // Trim whitespace and quotes
    );
    console.log("CSV Data Loaded");
    statusMessage.value = "Validation data loaded. Please enter UID.";
    if (formData.value.participant_uid) {
      validateUidOnInput(formData.value.participant_uid);
    } else {
      submitDisabled.value = true;
    }
  } catch (error) {
    console.error("Error fetching CSV data:", error);
    statusMessage.value = "Error loading validation data. Cannot check UID.";
    statusClass.value = "error";
    csvData = [];
    submitDisabled.value = true;
  } finally {
    isCheckingUid.value = false;
    if (
      !formData.value.participant_uid &&
      statusMessage.value.includes("Loading")
    ) {
      statusMessage.value = "";
    }
  }
}

// Validate UID against fetched CSV data
function validateUid(uid) {
  if (!uid || !csvData || csvData.length <= 1) return false;
  const normalizedUid = uid.trim().toLowerCase();
  // Assuming UID is in the second column (index 1)
  return csvData
    .slice(1)
    .some((row) => row.length > 1 && row[1]?.toLowerCase() === normalizedUid);
}

// Function called on UID input change
function validateUidOnInput(newUid) {
  // Skip validation entirely if in edit mode
  if (props.editMode) {
    console.log('Skipping UID validation - in edit mode');
    return;
  }

  console.log('validateUidOnInput called with UID:', newUid);
  clearFinalMessage(); // Clear final message when UID changes
  modalErrorMessage.value = "";
  modalSuccessMessage.value = "";

  if (!newUid) {
    statusMessage.value = "";
    statusClass.value = "";
    submitDisabled.value = true;
    isPrefilled.value = false;
    return;
  }

  const pattern = new RegExp(`^[A-Za-z0-9]{${UID_MIN_LENGTH},}$`);
  if (!pattern.test(newUid)) {
    statusMessage.value = `Participant UID must be at least ${UID_MIN_LENGTH} alphanumeric characters.`;
    statusClass.value = "error";
    submitDisabled.value = true;
    isPrefilled.value = false;
    return;
  }

  // For Suitability Form: First check if UID exists in main registration (CSV)
  // Then try to load existing suitability data from Google Apps Script
  if (isCheckingUid.value) {
    statusMessage.value = "Checking UID...";
    statusClass.value = "";
    submitDisabled.value = true;
    isPrefilled.value = false;
  } else if (csvData.length <= 1 && !isCheckingUid.value) {
    statusMessage.value = "Validation data not available. Cannot check UID.";
    statusClass.value = "error";
    submitDisabled.value = true;
    isPrefilled.value = false;
  } else {
    // Check CSV first (main registration)
    if (validateUid(newUid)) {
      console.log('UID found in main registration, loading suitability data...');
      statusMessage.value = "UID found in registration! Loading suitability data...";
      statusClass.value = "success";
      submitDisabled.value = false;

      // Check available visits for this UID
      checkAvailableVisits(newUid);

      loadPrefillData(newUid); // Try to load existing suitability data
    } else {
      statusMessage.value = "UID not found in main registration. Please register participant first.";
      statusClass.value = "error";
      submitDisabled.value = true;
      isPrefilled.value = false;
    }
  }
}

// Watch for changes in the participant_uid field (only when not in edit mode)
watch(
  () => formData.value.participant_uid,
  (newUid) => {
    // Skip validation if in edit mode
    if (props.editMode) return;
    validateUidOnInput(newUid);
  }
);

// Age validation
function checkAge() {
  if (formData.value.age !== null && formData.value.age < 15) {
    ageMessage.value = "This age is not suitable for PrEP initiation.";
  } else {
    ageMessage.value = "";
  }
}

// Get submit button text based on state
function getSubmitButtonText() {
  if (props.editMode) return 'Update Record';
  if (isPrefilled.value) return 'Update Data';
  return 'Add New';
}

// Load prefill data from Google Apps Script
async function loadPrefillData(uid) {
  console.log(' loadPrefillData called with UID:', uid);
  console.log(' Using Google Apps Script URL:', GOOGLE_SCRIPT_URL);

  try {
    statusMessage.value = "Loading existing data...";
    statusClass.value = "";

    // Try direct request first
    let response;
    try {
      console.log('Attempting direct axios request...');
      response = await axios.get(GOOGLE_SCRIPT_URL, {
        params: { action: 'prefill', uid: uid },
        timeout: 10000
      });
      console.log(' Direct request successful:', response.data);
    } catch (error) {
      console.log(' Direct request failed, trying JSONP fallback:', error);
      // JSONP fallback for CORS issues
      response = await new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        console.log(' Setting up JSONP with callback:', callbackName);

        window[callbackName] = function (data) {
          console.log(' JSONP callback received data:', data);
          delete window[callbackName];
          document.body.removeChild(script);
          resolve({ data });
        };

        const script = document.createElement('script');
        const jsonpUrl = `${GOOGLE_SCRIPT_URL}?action=prefill&uid=${encodeURIComponent(uid)}&callback=${callbackName}`;
        console.log(' JSONP URL:', jsonpUrl);
        script.src = jsonpUrl;
        script.onerror = () => {
          console.log(' JSONP script error');
          delete window[callbackName];
          document.body.removeChild(script);
          reject(new Error('JSONP request failed'));
        };
        document.body.appendChild(script);

        setTimeout(() => {
          if (window[callbackName]) {
            console.log(' JSONP timeout');
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('JSONP request timeout'));
          }
        }, 15000);
      });
    }

    console.log(' Response status:', response.data.status);
    console.log(' Response data:', response.data);

    if (response.data.status === 'success') {
      const prefillData = response.data.data;
      console.log(' Prefill data received:', prefillData);
      console.log(' Current form data before prefill:', JSON.stringify(formData.value, null, 2));

      // Populate form fields with prefilled data
      let fieldsUpdated = 0;
      Object.keys(prefillData).forEach(key => {
        if (formData.value.hasOwnProperty(key)) {
          console.log(` Updating field ${key}: ${formData.value[key]} → ${prefillData[key]}`);
          formData.value[key] = prefillData[key];
          fieldsUpdated++;
        } else {
          console.log(` Field ${key} not found in formData`);
        }
      });

      console.log(` Updated ${fieldsUpdated} form fields`);
      console.log(' Form data after prefill:', JSON.stringify(formData.value, null, 2));

      isPrefilled.value = true;
      statusMessage.value = "Data loaded successfully!";
      statusClass.value = "success";
      submitDisabled.value = false;

    } else {
      console.log(' No existing data found, showing add message');
      // No existing suitability data found - that's OK, they can add new
      statusMessage.value = `Ready to add suitability assessment for ${uid}`;
      statusClass.value = "info";
      isPrefilled.value = false;
      submitDisabled.value = false;
    }

  } catch (error) {
    console.error(' Error loading prefill data:', error);
    statusMessage.value = `Ready to add suitability assessment for ${uid}`;
    statusClass.value = "info";
    isPrefilled.value = false;
    submitDisabled.value = false;
  }
}

// Confirm delete action
function confirmDelete() {
  if (confirm(`Are you sure you want to delete the suitability assessment record for UID: ${formData.value.participant_uid}?\n\nThis action cannot be undone.`)) {
    deleteRecord();
  }
}

// Delete record function
async function deleteRecord() {
  isDeletingRecord.value = true;

  try {
    const uid = formData.value.participant_uid;

    // Try direct request first
    let response;
    try {
      response = await axios.post(GOOGLE_SCRIPT_URL,
        new URLSearchParams({
          action: 'delete',
          uid: uid
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 15000
        }
      );
    } catch (error) {
      console.log('Direct delete request failed, trying JSONP fallback:', error);
      // JSONP fallback
      response = await new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        window[callbackName] = function (data) {
          delete window[callbackName];
          document.body.removeChild(script);
          resolve({ data });
        };

        const script = document.createElement('script');
        script.src = `${GOOGLE_SCRIPT_URL}?action=delete&uid=${encodeURIComponent(uid)}&callback=${callbackName}`;
        script.onerror = () => {
          delete window[callbackName];
          document.body.removeChild(script);
          reject(new Error('JSONP delete request failed'));
        };
        document.body.appendChild(script);

        setTimeout(() => {
          if (window[callbackName]) {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('JSONP delete request timeout'));
          }
        }, 20000);
      });
    }

    if (response.data.status === 'success') {
      setFinalMessage(response.data.message || 'Record deleted successfully!', 'success');
      clearForm();
      isPrefilled.value = false;
      statusMessage.value = '';
      statusClass.value = '';
      submitDisabled.value = true;
    } else {
      setFinalMessage(response.data.message || 'Failed to delete record', 'error');
    }

  } catch (error) {
    console.error('Delete error:', error);
    setFinalMessage('Error deleting record. Please try again.', 'error');
  } finally {
    isDeletingRecord.value = false;
  }
}

// --- Cancel Edit Function ---
const cancelEdit = () => {
  emit('cancel-edit');
};

// --- Update Record Function (for edit mode) ---
const updateRecord = async () => {
  isSubmitting.value = true;

  try {
    // Prepare data: Ensure arrays are converted to semicolon-separated strings
    const dataToSend = { ...formData.value };
    Object.keys(dataToSend).forEach((key) => {
      if (Array.isArray(dataToSend[key])) {
        dataToSend[key] = dataToSend[key].join("; "); // Example: using semicolon
      }
    });

    // Emit the updated data to the parent component
    emit('form-updated', dataToSend);

  } catch (error) {
    console.error('Update error:', error);
    modalErrorMessage.value = `Error updating record: ${error.message}`;
  } finally {
    isSubmitting.value = false;
  }
};

// --- Modal Control ---
const showReviewModal = () => {
  if (submitDisabled.value) {
    modalErrorMessage.value =
      "Please ensure the Participant UID is valid before reviewing.";
    // Display error message more prominently if needed
    return;
  }

  // If in edit mode, directly update without showing modal
  if (props.editMode) {
    updateRecord();
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

// --- Form Submission ---
const confirmAndSubmit = async () => {
  isSubmitting.value = true; // Set loading state for modal buttons
  modalSuccessMessage.value = "";
  modalErrorMessage.value = "";
  clearFinalMessage();

  try {
    // Prepare data: Ensure arrays are converted to semicolon-separated strings
    const dataToSend = { ...formData.value };
    Object.keys(dataToSend).forEach((key) => {
      if (Array.isArray(dataToSend[key])) {
        dataToSend[key] = dataToSend[key].join("; "); // Example: using semicolon
      }
    });

    // Add action parameter if updating
    if (isPrefilled.value) {
      dataToSend.action = 'update';
    }

    let response;
    try {
      const formDataSerialized = new URLSearchParams(dataToSend).toString();
      response = await axios.post(GOOGLE_SCRIPT_URL, formDataSerialized, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000
      });
    } catch (error) {
      console.log('Direct submission failed, trying JSONP fallback:', error);
      // JSONP fallback for CORS issues
      response = await new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        window[callbackName] = function (data) {
          delete window[callbackName];
          document.body.removeChild(script);
          resolve({ data });
        };

        // Create query string from dataToSend
        const queryParams = new URLSearchParams(dataToSend).toString();
        const script = document.createElement('script');
        script.src = `${GOOGLE_SCRIPT_URL}?${queryParams}&callback=${callbackName}`;
        script.onerror = () => {
          delete window[callbackName];
          document.body.removeChild(script);
          reject(new Error('JSONP submission failed'));
        };
        document.body.appendChild(script);

        setTimeout(() => {
          if (window[callbackName]) {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('JSONP submission timeout'));
          }
        }, 20000);
      });
    }

    console.log("Submission response:", response);

    // Adjust success check based on your actual script response
    if (
      response.status === 200 &&
      response.data &&
      response.data.status === "success"
    ) {
      modalSuccessMessage.value =
        response.data.message || "Form submitted successfully!";
      setTimeout(() => {
        isReviewModalVisible.value = false; // Close modal
        setFinalMessage(
          response.data.message || "Form submitted successfully!",
          "success"
        ); // Set final message
        clearForm(); // Reset the form fields
        // Reset UID validation state
        statusMessage.value = "";
        statusClass.value = "";
        submitDisabled.value = true;
        isPrefilled.value = false;
        modalSuccessMessage.value = ""; // Clear modal message
      }, SUBMIT_SUCCESS_DELAY);
    } else {
      modalErrorMessage.value =
        response.data?.message ||
        "Submission failed. Unexpected response from server.";
    }
  } catch (error) {
    console.error("Submission error:", error);
    let detailedError =
      "An error occurred while submitting the form. Please try again.";
    if (error.response) {
      detailedError += ` (Status: ${error.response.status})`;
      console.error("Error data:", error.response.data);
    } else if (error.request) {
      detailedError += " (No response from server).";
    } else {
      detailedError += ` (${error.message})`;
    }
    modalErrorMessage.value = detailedError; // Show error in modal
  } finally {
    isSubmitting.value = false; // Reset loading state
  }
};

// Clear form data
const clearForm = () => {
  const prescriberDetails = {
    prescriber_name: formData.value.prescriber_name,
    prescriber_designation: formData.value.prescriber_designation,
    bmhc_no: formData.value.bmhc_no,
  };

  // Reset all fields except prescriber details and date fields
  Object.keys(formData.value).forEach((key) => {
    if (key in prescriberDetails || key === "date" || key === "signature_date")
      return;

    if (Array.isArray(formData.value[key])) formData.value[key] = [];
    else if (typeof formData.value[key] === "number")
      formData.value[key] = null;
    else if (key === "type_of_visit") formData.value[key] = "mst";
    else if (key === "prep_site") formData.value[key] = "CHD/JDWNRH/Thimphu";
    else if (key === "resident") formData.value[key] = "";
    else formData.value[key] = "";
  });

  Object.assign(formData.value, prescriberDetails);
  initializeDate(); // Re-initialize dates

  ageMessage.value = ""; // Clear validation messages
  statusMessage.value = "";
  statusClass.value = "";
  submitDisabled.value = true; // Ensure submit is disabled after clear
  clearFinalMessage();
  // Clear general messages if they are being used
  successMessage.value = "";
  errorMessage.value = "";
};
// Get logged-in user details
const getLoggedInUser = () => {
  try {
    const user = localStorage.getItem("loggedInUser");
    return user ? JSON.parse(user) : null;
  } catch (e) {
    console.error("Error parsing loggedInUser", e);
    return null;
  }
};

// --- Data Population Function for Edit Mode ---
function populateFormData() {
  if (props.editMode && props.initialData) {
    console.log('Populating form data for edit mode:', props.initialData);

    // Convert string arrays back to arrays if needed
    Object.keys(props.initialData).forEach(key => {
      if (formData.value.hasOwnProperty(key)) {
        let value = props.initialData[key];

        // Handle arrays that might be stored as semicolon-separated strings
        if (Array.isArray(formData.value[key]) && typeof value === 'string' && value.includes(';')) {
          formData.value[key] = value.split(';').map(item => item.trim()).filter(item => item);
        } else if (Array.isArray(formData.value[key]) && typeof value === 'string' && value) {
          // Handle single values that should be arrays
          formData.value[key] = [value];
        } else if (Array.isArray(formData.value[key]) && !value) {
          formData.value[key] = [];
        } else {
          formData.value[key] = value || (typeof formData.value[key] === 'number' ? null : '');
        }
      }
    });

    // In edit mode, clear any validation messages and enable submit
    statusMessage.value = "";
    statusClass.value = "";
    submitDisabled.value = false;

    console.log('Form data populated successfully for edit mode');
  }
}

// --- Utility Functions for Final Message ---
function setFinalMessage(message, type) {
  finalSubmitMessage.value = message;
  finalSubmitClass.value = type === "success" ? "success-final" : "error-final";
}
function clearFinalMessage() {
  finalSubmitMessage.value = "";
  finalSubmitClass.value = "";
}

// === VISIT TYPE OPTIONS ===
const visitOptions = [
  { value: "Screening Visit MO", label: "SCREENING VISIT MO", icon: "🩺" },
  { value: "End of M1", label: "END OF M1", icon: "1️⃣" },
  { value: "End of M3", label: "END OF M3", icon: "3️⃣" },
  { value: "End of M6", label: "END OF M6", icon: "6️⃣" },
  { value: "End of M9", label: "END OF M9", icon: "9️⃣" },
  { value: "End of M12", label: "END OF M12", icon: "🔚" }
];

// === ADDITIONAL VALIDATION FUNCTION ===
const validateUidCheck = (uid) => {
  return validateUid(uid);
};

// === COMPUTED PROPERTIES FOR VISIT FILTERING ===
// Get visits that have data
const visitsWithData = computed(() => {
  return visitOptions.filter(visit => visitDataStatus.value[visit.value] === 'Has Data');
});

// Get visits that don't have data
const visitsWithoutData = computed(() => {
  return visitOptions.filter(visit => visitDataStatus.value[visit.value] !== 'Has Data');
});

// Check if there are any visits with data
const hasVisitsWithData = computed(() => {
  return visitsWithData.value.length > 0;
});

// Check if there are any visits without data
const hasVisitsWithoutData = computed(() => {
  return visitsWithoutData.value.length > 0;
});

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
      uid: uid,
      action: 'getAvailableVisits'
    }).toString();

    console.log(`Checking available visits for UID: ${uid}`);

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Available visits response:', result);

    if (result.status === "success") {
      availableVisits.value = result.availableVisits || [];
      console.log('Set availableVisits.value to:', availableVisits.value);

      // Update visit status - use visitStatus from API if available, otherwise use availableVisits
      if (result.visitStatus) {
        visitDataStatus.value = result.visitStatus;
      } else {
        visitOptions.forEach(visit => {
          if (result.availableVisits && result.availableVisits.includes(visit.value)) {
            visitDataStatus.value[visit.value] = 'Has Data';
          } else {
            visitDataStatus.value[visit.value] = 'No Data';
          }
        });
      }

      const dataCount = result.availableVisits ? result.availableVisits.length : 0;
      statusMessage.value = `Found ${dataCount} visit record(s) for ${uid}`;
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
      uid: formData.value.participant_uid,
      visit_type: visitType,
      action: 'prefill'
    }).toString();

    console.log(`Loading data for ${visitType} - UID: ${formData.value.participant_uid}`);

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`${visitType} response:`, result);

    // Set the current visit type
    formData.value.type_of_visit = visitType;

    if (result.status === "success" && result.data) {
      // Found existing data for this visit type - PREFILL
      Object.keys(result.data).forEach(key => {
        if (key in formData.value && key !== 'participant_uid') {
          // Don't overwrite UID, but fill everything else
          if (key.includes('date') && result.data[key]) {
            const dateValue = new Date(result.data[key]);
            if (!isNaN(dateValue.getTime())) {
              formData.value[key] = dateValue.toISOString().split('T')[0];
            } else {
              formData.value[key] = result.data[key];
            }
          } else {
            formData.value[key] = result.data[key];
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
      formData.value.type_of_visit = visitType; // Set the visit type

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
  const preserveFields = ['participant_uid', 'type_of_visit', 'prescriber_name', 'prescriber_designation', 'bhc_no', 'date', 'signature_date'];

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
  formData.value.type_of_visit = visitType;

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
      uid: formData.value.participant_uid,
      visit_type: visitType,
      action: 'delete'
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
      if (formData.value.type_of_visit === visitType) {
        clearFormExceptUID();
        formData.value.type_of_visit = "mst";
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

// --- Lifecycle Hook ---
onMounted(() => {
  if (!props.editMode) {
    initializeDate(); // Set the current date on form load only if not editing
    fetchCsvData(); // Fetch validation data only if not editing
  }

  // Populate prescriber details (unless editing)
  if (!props.editMode) {
    const loggedInUser = getLoggedInUser();

    if (loggedInUser) {
      formData.value.prescriber_name = loggedInUser.fullname || "";
      formData.value.prescriber_designation = loggedInUser.designation || "";
      formData.value.bhc_no = loggedInUser.bhc_no || "";
    } else {
      console.warn("Logged in user details not found in localStorage.");
      // Optionally clear fields if no user found
      formData.value.prescriber_name = "";
      formData.value.prescriber_designation = "";
      formData.value.bmhc_no = "";
    }
  }

  // Populate form data if in edit mode
  populateFormData();

  // Removed the direct event listener for UID input - using watch now.
});
</script>

<style>
/* Keep the original styles provided by the user */
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
  /* Added textarea for completeness */
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  /* Slightly softer border */
  border-radius: 5px;
  box-sizing: border-box;
  font-size: 0.95rem;
}

input:focus,
select:focus {
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
  /* Override width: 100% */
  margin-right: 8px;
  vertical-align: middle;
  /* Align better */
}

/* Ensure labels containing radios/checkboxes don't have extra bottom margin */
label>input[type="radio"],
label>input[type="checkbox"] {
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
}

.submit-btn:hover:not(:disabled) {
  background-color: #2980b9;
  /* Darker blue on hover */
}

.submit-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.7;
}

#status-message {
  margin-top: -10px;
  /* Position closer to input */
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

#status-message.info {
  background-color: #d9edf7;
  color: #31708f;
  border-color: #bce8f1;
}

.uid-spinner {
  margin-left: 10px;
  color: #3498db;
  font-size: 0.9em;
}

.submitting-indicator {
  /* Style for potential use */
  margin-top: 20px;
  text-align: center;
  font-size: 1.2rem;
  color: #3498db;
}

.success-message {
  /* Original general message style */
  color: green;
  text-align: center;
  font-weight: bold;
  margin-top: 15px;
}

.error-message {
  /* Original general message style */
  color: red;
  text-align: center;
  font-weight: bold;
  margin-top: 15px;
}

/* Final Submit Message (outside modal) */
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

/* Button Group Styles */
.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-btn {
  background-color: #6c757d;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;
}

.cancel-btn:hover {
  background-color: #5a6268;
}

/* Prefill Status Styles */
.prefill-status {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.update-mode-banner {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #28a745;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  font-weight: 500;
  font-size: 0.9rem;
}

.delete-btn {
  background-color: #dc3545;
  color: #fff;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.delete-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.delete-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Available Visits Styles */
.radio-group-vertical {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-group-vertical label {
  display: flex;
  align-items: center;
  margin-bottom: 0;
  font-weight: normal;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.radio-group-vertical label:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.delete-visit-btn {
  background-color: #dc3545;
  color: #fff;
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color 0.2s ease;
}

.delete-visit-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.delete-visit-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
