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

        <label for="uid">Participant UID:</label>
        <input type="text" v-model="formData.uid" id="uid" required pattern="[A-Za-z0-9]{5,}"
          title="Minimum 5 Alphanumeric characters only" />
        <div v-if="statusMessage" id="status-message" :class="statusClass">{{ statusMessage }}</div>
        <span v-if="isCheckingUid" class="uid-spinner"><i class="fas fa-spinner fa-spin"></i> Checking...</span>

        <!-- Visit Type Selection for Existing Data -->
        <div v-if="availableVisitTypes.length > 0" class="visit-type-selection">
          <h4>Available Visits for {{ formData.uid }}:</h4>
          <div class="visit-buttons">
            <button v-for="visitType in availableVisitTypes" :key="visitType" type="button" class="visit-btn"
              :class="{ 'selected': selectedVisitType === visitType }" @click="loadVisitData(visitType)">
              {{ visitType }}
            </button>
            <button v-for="newVisit in getAvailableNewVisits()" :key="newVisit" type="button"
              class="visit-btn new-visit" @click="startNewVisit(newVisit)">
              + Add {{ newVisit }}
            </button>
          </div>
        </div>

        <!-- Prefill Status and Delete Button -->
        <div v-if="isPrefilled" class="prefill-status">
          <div class="update-mode-banner">
            <i class="fas fa-edit"></i> UPDATE MODE - {{ selectedVisitType }}
          </div>
          <button type="button" class="delete-btn" @click="confirmDelete" :disabled="isDeletingRecord">
            <i v-if="isDeletingRecord" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-trash"></i>
            {{ isDeletingRecord ? 'Deleting...' : `Delete ${selectedVisitType} Record` }}
          </button>
        </div>

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
                <th>Regiment</th>
                <th>Recipient Signature</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <!-- Single row for current selected medication -->
              <tr v-if="formData.medication">
                <td>{{ formatVisitType(formData.medication) }}</td>
                <td><input type="date" v-model="formData.visit_date" required></td>
                <td><input type="text" v-model="formData.bottles" placeholder="e.g., 1 (AB123)" required></td>
                <td><input type="date" v-model="formData.next_due_date" required></td>
                <td><input type="text" v-model="formData.dispenser_signature" readonly></td>
                <td>
                  <select v-model="formData.regimen" required>
                    <option value="">Select</option>
                    <option value="Daily PrEP">Daily PrEP</option>
                    <option value="ED-PrEP">ED-PrEP</option>
                  </select>
                </td>
                <td><input type="text" v-model="formData.recipient_signature" readonly></td>
                <td><input type="text" v-model="formData.remarks"></td>
              </tr>

              <tr v-if="!formData.medication">
                <td colspan="8" style="text-align: center; font-style: italic; color: grey;">Select a Medication Month
                  above to enter details</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <button type="submit" class="submit-btn" :disabled="submitDisabled || isSubmitting || !formData.medication">
        {{ getSubmitButtonText() }}
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

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwzVoucfZMnPLD7SKarMkoxqtKrSukGhXFGaT6NEWCCVhie07sW5huZ2dVeJR6AaIcH/exec';
const CSV_DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfG6e5EIcHDaXopn9DxMZnTwVFGi5CiQxmKlEIPsd7uPtZiQIikYb46UdN78UhZlJfocCfl_s0hGGX/pub?output=csv";
const UID_MIN_LENGTH = 5;

// Form Data - Simplified for multi-row approach (one row per visit)
const formData = ref({
  person_dispensing: 'Pre-load: The logged-in user',
  orw_followup: '',
  client_receiving: '',
  uid: '',
  medication: '',
  visit_date: '',
  regimen: '',
  bottles: '',
  next_due_date: '',
  dispenser_signature: '',
  recipient_signature: '',
  remarks: ''
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

// Advanced state for prefill and multi-visit support
const availableVisitTypes = ref([]);
const selectedVisitType = ref('');
const isPrefilled = ref(false);
const isDeletingRecord = ref(false);
const allVisitTypes = ['M1', 'M3', 'M6', 'M9', 'M12'];

let csvData = [];

// Simplified signature logic for multi-row approach
const updateSignatures = () => {
  if (!formData.value.uid) return;
  const uid = formData.value.uid;
  const dispenser = formData.value.person_dispensing;

  formData.value.recipient_signature = uid;
  formData.value.dispenser_signature = dispenser;
  formData.value.client_receiving = uid;

  // Set default date if not already set
  if (!formData.value.visit_date) {
    formData.value.visit_date = new Date().toISOString().split('T')[0];
  }
};

// Format visit type for display
const formatVisitType = (visitType) => {
  const mapping = {
    'M1': 'Month 1',
    'M3': 'Month 3',
    'M6': 'Month 6',
    'M9': 'Month 9',
    'M12': 'Month 12'
  };
  return mapping[visitType] || visitType;
};

// --- CORRECTED: Watchers now observe the new 'uid' property ---
watch(() => formData.value.uid, (newUid) => {
  updateSignatures();
  validateUidOnInput(newUid);
});
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
    if (formData.value.uid) {
      validateUidOnInput(formData.value.uid);
    }
  } catch (error) {
    statusMessage.value = 'Error loading validation data.';
    statusClass.value = 'error';
  } finally {
    isCheckingUid.value = false;
  }
};

const validateUid = (uid) => {
  if (!uid || csvData.length <= 1) return false;
  const normalizedUid = uid.trim().toLowerCase();
  return csvData.slice(1).some(row => row.length > 1 && row[1]?.toLowerCase() === normalizedUid);
};

const validateUidOnInput = (newUid) => {
  if (!newUid) {
    statusMessage.value = '';
    submitDisabled.value = true;
    availableVisitTypes.value = [];
    selectedVisitType.value = '';
    isPrefilled.value = false;
    return;
  }

  const pattern = new RegExp(`^[A-Za-z0-9]{${UID_MIN_LENGTH},}$`);
  if (!pattern.test(newUid)) {
    statusMessage.value = `UID must be at least ${UID_MIN_LENGTH} alphanumeric characters.`;
    statusClass.value = 'error';
    submitDisabled.value = true;
    availableVisitTypes.value = [];
    return;
  }

  if (validateUid(newUid)) {
    statusMessage.value = 'UID found! Loading available visits...';
    statusClass.value = 'success';
    submitDisabled.value = false;
    loadAvailableVisits(newUid);
  } else {
    statusMessage.value = `Add data for ${newUid}`;
    statusClass.value = 'info';
    submitDisabled.value = false;
    availableVisitTypes.value = [];
    isPrefilled.value = false;
  }
};

// Get submit button text based on state
const getSubmitButtonText = () => {
  if (isSubmitting.value) return 'Submitting...';
  if (isPrefilled.value && selectedVisitType.value) return `Update ${selectedVisitType.value} Data`;
  if (formData.value.medication) return `Add ${formData.value.medication} Data`;
  return 'Review Data';
};

// Get available new visit types (not yet created)
const getAvailableNewVisits = () => {
  return allVisitTypes.filter(visit => !availableVisitTypes.value.includes(visit));
};

// Load available visit types for UID
const loadAvailableVisits = async (uid) => {
  try {
    const response = await axios.get(GOOGLE_SCRIPT_URL, {
      params: { action: 'getVisitTypes', uid: uid },
      timeout: 10000
    });

    if (response.data.status === 'success') {
      availableVisitTypes.value = response.data.availableVisits || [];
      if (availableVisitTypes.value.length > 0) {
        statusMessage.value = `Found ${availableVisitTypes.value.length} existing visits. Select one to edit or add new.`;
      } else {
        statusMessage.value = `Add first visit for ${uid}`;
      }
    }
  } catch (error) {
    console.error('Error loading visits:', error);
    availableVisitTypes.value = [];
  }
};

// Load data for specific visit type
const loadVisitData = async (visitType) => {
  try {
    statusMessage.value = 'Loading visit data...';
    selectedVisitType.value = visitType;

    const response = await axios.get(GOOGLE_SCRIPT_URL, {
      params: { action: 'prefill', uid: formData.value.uid, visitType: visitType },
      timeout: 10000
    });

    if (response.data.status === 'success') {
      const prefillData = response.data.data;

      // Populate form fields
      Object.keys(prefillData).forEach(key => {
        if (formData.value.hasOwnProperty(key)) {
          formData.value[key] = prefillData[key];
        }
      });

      isPrefilled.value = true;
      statusMessage.value = `${visitType} data loaded successfully!`;
      statusClass.value = 'success';

      // Auto-select the medication radio button
      formData.value.medication = visitType;
      updateSignatures();

    } else {
      statusMessage.value = response.data.message || `Error loading ${visitType} data`;
      statusClass.value = 'error';
    }
  } catch (error) {
    console.error('Error loading visit data:', error);
    statusMessage.value = `Error loading ${visitType} data`;
    statusClass.value = 'error';
  }
};

// Start new visit (clear form and select visit type)
const startNewVisit = (visitType) => {
  // Clear form but keep basic info
  const basicInfo = {
    person_dispensing: formData.value.person_dispensing,
    orw_followup: formData.value.orw_followup,
    uid: formData.value.uid
  };

  // Reset all form data
  Object.keys(formData.value).forEach(key => {
    if (key in basicInfo) {
      formData.value[key] = basicInfo[key];
    } else if (Array.isArray(formData.value[key])) {
      formData.value[key] = [];
    } else if (typeof formData.value[key] === 'number') {
      formData.value[key] = null;
    } else {
      formData.value[key] = '';
    }
  });

  // Set the new visit type
  formData.value.medication = visitType;
  selectedVisitType.value = visitType;
  isPrefilled.value = false;

  statusMessage.value = `Adding new ${visitType} data`;
  statusClass.value = 'info';

  updateSignatures();
};

// Confirm delete action
const confirmDelete = () => {
  if (confirm(`Are you sure you want to delete the ${selectedVisitType.value} record for UID: ${formData.value.uid}?\n\nThis action cannot be undone.`)) {
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
        uid: formData.value.uid,
        visitType: selectedVisitType.value
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      }
    );

    if (response.data.status === 'success') {
      statusMessage.value = response.data.message || 'Record deleted successfully!';
      statusClass.value = 'success';

      // Refresh available visits
      await loadAvailableVisits(formData.value.uid);

      // Clear current form
      startNewVisit(allVisitTypes[0]); // Reset to first visit type
      isPrefilled.value = false;
      selectedVisitType.value = '';
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

const showReviewModal = () => { isReviewModalVisible.value = true; };
const cancelReview = () => { isReviewModalVisible.value = false; };

const confirmAndSubmit = async () => {
  isSubmitting.value = true;
  modalErrorMessage.value = '';
  modalSuccessMessage.value = '';

  try {
    const dataToSend = { ...formData.value };

    // Add action parameter if updating
    if (isPrefilled.value && selectedVisitType.value) {
      dataToSend.action = 'update';
    }

    const formDataSerialized = new URLSearchParams(dataToSend).toString();
    const response = await axios.post(GOOGLE_SCRIPT_URL, formDataSerialized, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    });

    if (response.data.status === 'success') {
      modalSuccessMessage.value = response.data.message;

      // After successful submission, refresh the available visits
      setTimeout(async () => {
        isReviewModalVisible.value = false;
        await loadAvailableVisits(formData.value.uid);

        // Clear form but keep UID
        const uid = formData.value.uid;
        Object.keys(formData.value).forEach(key => {
          if (key === 'uid' || key === 'person_dispensing') return;
          if (Array.isArray(formData.value[key])) formData.value[key] = [];
          else if (typeof formData.value[key] === 'number') formData.value[key] = null;
          else formData.value[key] = '';
        });
        formData.value.uid = uid;

        isPrefilled.value = false;
        selectedVisitType.value = '';
        modalSuccessMessage.value = '';
      }, 2500);

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

<!-- ============================ YOUR ORIGINAL CSS STYLES (UNCHANGED) ============================ -->
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

#status-message.info {
  background-color: #d9edf7;
  color: #31708f;
  border-color: #bce8f1;
}

/* Visit Type Selection Styles */
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

/* Prefill Status Styles */
.prefill-status {
  margin: 15px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  flex-wrap: wrap;
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
}

.delete-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.delete-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
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