<template>
  <!-- DRUG DISTRIBUTION Form -->
  <form @submit.prevent="showReviewModal">
    <div class="container">
      <!-- Container 1: Basic Info & Setup -->
      <div class="form-container">
        <label for="person-dispensing">Name of the person dispensing PrEP:</label>
        <input type="text" v-model="formData.person_dispensing" id="person-dispensing" readonly>

        <label for="orw-follow-up">Name of the Outreach Worker following up with Client:</label>
        <input type="text" v-model="formData.orw_followup" id="orw-follow-up" required>

        <label for="client-receiving">Name of the client receiving PrEP:</label>
        <input type="text" v-model="formData.client_receiving" id="client-receiving" readonly>

        <!-- CHANGED v-model to 'uid' -->
        <label for="uid">Participant UID:</label>
        <input type="text" v-model="formData.participant_uid" id="uid" required pattern="[A-Za-z0-9]{5,}"
          title="Minimum 5 Alphanumeric characters only" />
        <div v-if="statusMessage" id="status-message" :class="statusClass">{{ statusMessage }}</div>
        <span v-if="isCheckingUid" class="uid-spinner"><i class="fas fa-spinner fa-spin"></i> Checking...</span>

        <label>Medic taking for:</label>
        <div class="radio-group-vertical" style="border: none; padding: 0; background: none;">
          <label><input type="radio" v-model="formData.medication" value="M1" required @change="updateSignatures" />
            Month 1</label>
          <label><input type="radio" v-model="formData.medication" value="M3" required @change="updateSignatures" />
            Month 3</label>
          <label><input type="radio" v-model="formData.medication" value="M6" required @change="updateSignatures" />
            Month 6</label>
          <label><input type="radio" v-model="formData.medication" value="M9" required @change="updateSignatures" />
            Month 9</label>
          <label><input type="radio" v-model="formData.medication" value="M12" required @change="updateSignatures" />
            Month 12</label>
        </div>
      </div>

      <!-- Container 2: Dispensing Table -->
      <div class="form-container">
        <h3 class="section-title">Drug Dispensing Log</h3>
        <div class="table-responsive">
          <table border="1">
            <thead>
              <tr>
                <th>Schedule</th>
                <th>Date</th>
                <th># bottle/s dispensed (lot/batch#)</th>
                <th>Next Due Date</th>
                <th>Dispenser Signature</th>
                <th> Regiment</th>
                <th>Recipient Signature</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <!-- UPDATED ALL v-modelS below -->
              <!-- Month 1 -->
              <tr v-if="formData.medication === 'M1'">
                <td>Month 1</td>
                <td><input type="date" v-model="formData.date_month1" required></td>
                <td><input type="text" v-model="formData.bottles_month1" placeholder="e.g., 1 (AB123)" required></td>
                <td><input type="date" v-model="formData.due_date_month1" required></td>
                <td><input type="text" v-model="formData.dispensing_sign_month1" readonly></td>
                <td>
                  <select v-model="formData.regimen_month1" required>
                    <option value="">Select</option>
                    <option value="Daily PrEP">Daily PrEP</option>
                    <option value="ED-PrEP">ED-PrEP</option>
                  </select>
                </td>
                <td><input type="text" v-model="formData.recipient_sign_month1" readonly></td>
                <td><input type="text" v-model="formData.remarks_month1"></td>
              </tr>

              <!-- CORRECTED: Month 3 -->
              <tr v-if="formData.medication === 'M3'">
                <td>Month 3</td>
                <td><input type="date" v-model="formData.date_month3" required></td>
                <td><input type="text" v-model="formData.bottles_month3" placeholder="e.g., 1 (CD456)" required></td>
                <td><input type="date" v-model="formData.due_date_month3" required></td>
                <td><input type="text" v-model="formData.dispensing_sign_month3" readonly></td>
                <td>
                  <select v-model="formData.regimen_month3" required>
                    <option value="">Select</option>
                    <option value="Daily PrEP">Daily PrEP</option>
                    <option value="ED-PrEP">ED-PrEP</option>
                  </select>
                </td>
                <td><input type="text" v-model="formData.recipient_sign_month3" readonly></td>
                <td><input type="text" v-model="formData.remarks_month3"></td>
              </tr>


              <!-- CORRECTED: Month 6 -->
              <tr v-if="formData.medication === 'M6'">
                <td>Month 6</td>
                <td><input type="date" v-model="formData.date_month6" required></td>
                <td><input type="text" v-model="formData.bottles_month6" placeholder="e.g., 1 (EF789)" required></td>
                <td><input type="date" v-model="formData.due_date_month6" required></td>
                <td><input type="text" v-model="formData.dispensing_sign_month6" readonly></td>
                <td>
                  <select v-model="formData.regimen_month6" required>
                    <option value="">Select</option>
                    <option value="Daily PrEP">Daily PrEP</option>
                    <option value="ED-PrEP">ED-PrEP</option>
                  </select>
                </td>
                <td><input type="text" v-model="formData.recipient_sign_month6" readonly></td>
                <td><input type="text" v-model="formData.remarks_month6"></td>
              </tr>


              <!-- CORRECTED: Month 9 -->
              <tr v-if="formData.medication === 'M9'">
                <td>Month 9</td>
                <td><input type="date" v-model="formData.date_month9" required></td>
                <td><input type="text" v-model="formData.bottles_month9" placeholder="e.g., 1 (GH012)" required></td>
                <td><input type="date" v-model="formData.due_date_month9" required></td>
                <td><input type="text" v-model="formData.dispensing_sign_month9" readonly></td>
                <td>
                  <select v-model="formData.regimen_month9" required>
                    <option value="">Select</option>
                    <option value="Daily PrEP">Daily PrEP</option>
                    <option value="ED-PrEP">ED-PrEP</option>
                  </select>
                </td>
                <td><input type="text" v-model="formData.recipient_sign_month9" readonly></td>
                <td><input type="text" v-model="formData.remarks_month9"></td>
              </tr>


              <!-- CORRECTED: Month 12 -->
              <tr v-if="formData.medication === 'M12'">
                <td>Month 12</td>
                <td><input type="date" v-model="formData.date_month12" required></td>
                <td><input type="text" v-model="formData.bottles_month12" placeholder="e.g., 1 (IJ345)" required></td>
                <td><input type="date" v-model="formData.due_date_month12" required></td>
                <td><input type="text" v-model="formData.dispensing_sign_month12" readonly></td>
                <td>
                  <select v-model="formData.regimen_month12" required>
                    <option value="">Select</option>
                    <option value="Daily PrEP">Daily PrEP</option>
                    <option value="ED-PrEP">ED-PrEP</option>
                  </select>
                </td>
                <td><input type="text" v-model="formData.recipient_sign_month12" readonly></td>
                <td><input type="text" v-model="formData.remarks_month12"></td>
              </tr>

              <tr v-if="!formData.medication">
                <td colspan="7" style="text-align: center; font-style: italic; color: grey;">Select a Medication Month
                  above to enter details</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <button type="submit" class="submit-btn" :disabled="submitDisabled || isSubmitting || !formData.medication">
        {{ isSubmitting ? 'Submitting...' : 'Review Data' }}
      </button>
    </div>
  </form>

  <Form9_ConfirmationModal v-if="isReviewModalVisible" :formData="formData" :isSubmitting="isSubmitting"
    :successMessage="modalSuccessMessage" :errorMessage="modalErrorMessage" @confirm="confirmAndSubmit"
    @cancel="cancelReview" />
</template>


<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import Form9_ConfirmationModal from './Form9_ConfirmationModal.vue';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw7q0hOBNlScij1QbZonYKU2w_8eKnb2-PJIZYxMiC7LelIcoRH_pSuorC79Cbgmm8E/exec';
const CSV_DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfG6e5EIcHDaXopn9DxMZnTwVFGi5CiQxmKlEIPsd7uPtZiQIikYb46UdN78UhZlJfocCfl_s0hGGX/pub?output=csv";
const UID_MIN_LENGTH = 5;

// --- UPDATED formData TO MATCH YOUR GOOGLE SHEET ---
const formData = ref({
  person_dispensing: '',
  orw_followup: '',
  client_receiving: '',
  participant_uid: '', // <-- RENAMED from participant_uid
  medication: '',


  // Month 1 Fields
  date_month1: '',
  bottles_month1: '',
  due_date_month1: '',
  dispensing_sign_month1: '',
  recipient_sign_month1: '',
  remarks_month1: '',

  // Month 3 Fields

  date_month3: '',
  bottles_month3: '',
  due_date_month3: '',
  dispensing_sign_month3: '',
  recipient_sign_month3: '',
  remarks_month3: '',

  // Month 6 Fields
  date_month6: '',
  bottles_month6: '',
  due_date_month6: '',
  dispensing_sign_month6: '',
  recipient_sign_month6: '',
  remarks_month6: '',

  // Month 9 Fields

  date_month9: '',
  bottles_month9: '',
  due_date_month9: '',
  dispensing_sign_month9: '',
  recipient_sign_month9: '',
  remarks_month9: '',
  // Month 12 Fields

  date_month12: '',
  bottles_month12: '',
  due_date_month12: '',
  dispensing_sign_month12: '',
  recipient_sign_month12: '',
  remarks_month12: '',
});

// Feedback & Control State
const statusMessage = ref('');
const statusClass = ref('');
const submitDisabled = ref(true);
const isCheckingUid = ref(false);
const isSubmitting = ref(false);
const isReviewModalVisible = ref(false);
const modalSuccessMessage = ref('');
const modalErrorMessage = ref('');
let csvData = [];

// --- UPDATED SIGNATURE LOGIC ---
const updateSignatures = () => {
  if (!formData.value.medication) return;

  // 'M1' -> '1', 'M3' -> '3'
  const monthNumber = formData.value.medication.substring(1);

  // Use the CORRECT UID property
  const uid = formData.value.participant_uid;
  const dispenser = formData.value.person_dispensing;

  // Construct the CORRECT keys like 'recipient_sign_month1'
  formData.value[`recipient_sign_month${monthNumber}`] = uid;
  formData.value[`dispensing_sign_month${monthNumber}`] = dispenser;
  formData.value.client_receiving = uid;

  // Also update the date with the CORRECT key
  // This only runs if the date is empty, allowing you to change it later.
  if (!formData.value[`date_month${monthNumber}`]) {
    formData.value[`date_month${monthNumber}`] = new Date().toISOString().split('T')[0];
  }
};

watch(() => formData.value.participant_uid, updateSignatures);
watch(() => formData.value.person_dispensing, updateSignatures);
watch(() => formData.value.medication, updateSignatures);

const fetchCsvData = async () => {
  isCheckingUid.value = true;
  statusMessage.value = 'Loading validation data...';
  try {
    const response = await fetch(CSV_DATA_URL);
    const csvText = await response.text();
    csvData = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
    statusMessage.value = 'Validation data loaded.';
  } catch (error) {
    statusMessage.value = 'Error loading validation data.';
    statusClass.value = 'error';
  } finally {
    isCheckingUid.value = false;
    validateUidOnInput(formData.value.uid);
  }
};

const validateUid = (uid) => {
  if (!uid || csvData.length <= 1) return false;
  const normalizedUid = uid.trim().toLowerCase();
  return csvData.slice(1).some(row => row.length > 1 && row[1]?.toLowerCase() === normalizedUid);
};

// UPDATED to use 'uid'
const validateUidOnInput = (newUid) => {
  if (!newUid) {
    statusMessage.value = '';
    submitDisabled.value = true;
    return;
  }
  const pattern = new RegExp(`^[A-Za-z0-9]{${UID_MIN_LENGTH},}$`);
  if (!pattern.test(newUid)) {
    statusMessage.value = `UID must be at least ${UID_MIN_LENGTH} alphanumeric characters.`;
    statusClass.value = 'error';
    submitDisabled.value = true;
  } else if (validateUid(newUid)) {
    statusMessage.value = 'UID found!';
    statusClass.value = 'success';
    submitDisabled.value = false;
  } else {
    statusMessage.value = 'UID not found in registration list.';
    statusClass.value = 'error';
    submitDisabled.value = true;
  }
};

watch(() => formData.value.participant_uid, validateUidOnInput);

const showReviewModal = () => { isReviewModalVisible.value = true; };
const cancelReview = () => { isReviewModalVisible.value = false; };

const confirmAndSubmit = async () => {
  isSubmitting.value = true;
  modalErrorMessage.value = '';
  modalSuccessMessage.value = '';
  try {
    const formDataSerialized = new URLSearchParams(formData.value).toString();
    const response = await axios.post(GOOGLE_SCRIPT_URL, formDataSerialized);
    if (response.data.status === 'success') {
      modalSuccessMessage.value = response.data.message;
      // You can add your clearForm logic here inside a setTimeout
    } else {
      modalErrorMessage.value = response.data.message;
    }
  } catch (error) {
    modalErrorMessage.value = 'Submission failed: ' + (error.response?.data?.message || error.message);
  } finally {
    isSubmitting.value = false;
  }
};

const getLoggedInUser = () => {
  try {
    const user = localStorage.getItem('loggedInUser');
    return user ? JSON.parse(user) : null;
  } catch (e) { return null; }
};

onMounted(() => {
  fetchCsvData();
  const loggedInUser = getLoggedInUser();
  if (loggedInUser) {
    formData.value.person_dispensing = loggedInUser.fullname || '';
  }
});

</script>

<style>
/* Your existing styles are fine */
</style>
<style>
/* Keep all original styles */
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

.yes-no-radio {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.yes-no-radio label {
  margin-bottom: 0;
  font-weight: normal;
}

td input[type="text"],
td input[type="date"] {
  width: 95%;
  padding: 0.3rem 0.4rem;
  margin-bottom: 0;
  font-size: 0.9rem;
}

ul {
  padding-left: 20px;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.9em;
  color: #444;
}

ul li {
  margin-bottom: 5px;
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
</style>