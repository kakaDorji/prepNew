<template>
  <div class="modal-overlay" @click="$emit('cancel')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Review Unscheduled Visit Data</h3>
        <button class="close-btn" @click="$emit('cancel')">&times;</button>
      </div>
      
      <div class="modal-body">
        <!-- Success/Error Messages -->
        <div v-if="successMessage" class="success-message">
          <p>{{ successMessage }}</p>
        </div>
        <div v-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
        </div>
        
        <!-- Data Review -->
        <div v-if="!successMessage && !errorMessage" class="review-section">
          <h4>Basic Information</h4>
          <div class="review-grid">
            <div class="review-item">
              <strong>UID:</strong> {{ formData.participant_uid }}
            </div>
            <div class="review-item">
              <strong>PrEP Site:</strong> {{ formData.prep_site }}
            </div>
            <div class="review-item">
              <strong>Date:</strong> {{ formData.date }}
            </div>
          </div>

          <h4>Visit Reason</h4>
          <div class="review-item">
            <strong>Reason for Visit:</strong> 
            <span v-if="Array.isArray(formData.reason_visit)">
              {{ formData.reason_visit.join(', ') || 'Not specified' }}
            </span>
            <span v-else>{{ formData.reason_visit || 'Not specified' }}</span>
          </div>
          <div v-if="formData.other_reason_visit" class="review-item">
            <strong>Other Reason:</strong> {{ formData.other_reason_visit }}
          </div>

          <h4>Side Effects</h4>
          <div class="review-grid">
            <div v-if="formData.nausea === 'Yes'" class="review-item">
              <strong>Nausea:</strong> {{ formData.nausea }}
              <span v-if="formData.nausea_ongoing"> (Ongoing)</span>
              <span v-if="formData.nausea_resolved"> (Resolved)</span>
            </div>
            <div v-if="formData.vomiting === 'Yes'" class="review-item">
              <strong>Vomiting:</strong> {{ formData.vomiting }}
              <span v-if="formData.vomiting_ongoing"> (Ongoing)</span>
              <span v-if="formData.vomiting_resolved"> (Resolved)</span>
            </div>
            <div v-if="formData.abdominal_cramps === 'Yes'" class="review-item">
              <strong>Abdominal Cramps:</strong> {{ formData.abdominal_cramps }}
              <span v-if="formData.abdominal_cramps_ongoing"> (Ongoing)</span>
              <span v-if="formData.abdominal_cramps_resolved"> (Resolved)</span>
            </div>
            <div v-if="formData.fatigue === 'Yes'" class="review-item">
              <strong>Fatigue:</strong> {{ formData.fatigue }}
              <span v-if="formData.fatigue_ongoing"> (Ongoing)</span>
              <span v-if="formData.fatigue_resolved"> (Resolved)</span>
            </div>
            <div v-if="formData.dizziness === 'Yes'" class="review-item">
              <strong>Dizziness:</strong> {{ formData.dizziness }}
              <span v-if="formData.dizziness_ongoing"> (Ongoing)</span>
              <span v-if="formData.dizziness_resolved"> (Resolved)</span>
            </div>
            <div v-if="formData.headache === 'Yes'" class="review-item">
              <strong>Headache:</strong> {{ formData.headache }}
              <span v-if="formData.headache_ongoing"> (Ongoing)</span>
              <span v-if="formData.headache_resolved"> (Resolved)</span>
            </div>
            <div v-if="formData.others === 'Yes'" class="review-item">
              <strong>Other Side Effects:</strong> {{ formData.others }}
              <span v-if="formData.others_ongoing"> (Ongoing)</span>
              <span v-if="formData.others_resolved"> (Resolved)</span>
              <div v-if="formData.others_description" class="review-subitem">
                <strong>Description:</strong> {{ formData.others_description }}
              </div>
            </div>
          </div>

          <h4>PrEP Information</h4>
          <div class="review-item" v-if="formData.challenges_prep">
            <strong>Challenges Taking PrEP:</strong> {{ formData.challenges_prep }}
            <div v-if="formData.challenges_details && formData.challenges_prep === 'Yes'" class="review-subitem">
              <strong>Details:</strong> {{ formData.challenges_details }}
            </div>
          </div>
          <div class="review-item" v-if="formData.additional_doses_details">
            <strong>Additional Doses Info:</strong> {{ formData.additional_doses_details }}
          </div>
          <div class="review-item" v-if="formData.prep_continue">
            <strong>Stop or Continue PrEP:</strong> {{ formData.prep_continue }}
            <div v-if="formData.stopping_reasons && formData.prep_continue === 'Stop'" class="review-subitem">
              <strong>Stopping Reasons:</strong> {{ formData.stopping_reasons }}
            </div>
            <div v-if="formData.stopping_Preventionmethod && formData.prep_continue === 'Stop'" class="review-subitem">
              <strong>Preferred Prevention Method:</strong> {{ formData.stopping_Preventionmethod }}
            </div>
          </div>

          <div class="review-item" v-if="formData.other_notes">
            <strong>Other Notes:</strong> {{ formData.other_notes }}
          </div>

          <h4>Interviewer Information</h4>
          <div class="review-grid">
            <div class="review-item">
              <strong>Name:</strong> {{ formData.interviewer_name }}
            </div>
            <div class="review-item">
              <strong>Designation:</strong> {{ formData.designation }}
            </div>
            <div class="review-item">
              <strong>BMHC Number:</strong> {{ formData.bmhc_number }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button 
          class="cancel-btn" 
          @click="$emit('cancel')"
          :disabled="isSubmitting"
        >
          Cancel
        </button>
        <button 
          class="confirm-btn" 
          @click="$emit('confirm')"
          :disabled="isSubmitting"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
          {{ isSubmitting ? 'Submitting...' : 'Confirm & Submit' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  formData: {
    type: Object,
    required: true
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  successMessage: {
    type: String,
    default: ''
  },
  errorMessage: {
    type: String,
    default: ''
  }
});

defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  background-color: #f8f9fa;
  padding: 15px 20px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.review-section h4 {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 5px;
  margin-top: 20px;
  margin-bottom: 15px;
}

.review-section h4:first-child {
  margin-top: 0;
}

.review-grid {
  display: grid;
  gap: 10px;
  margin-bottom: 15px;
}

.review-item {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.review-item:last-child {
  border-bottom: none;
}

.review-item strong {
  color: #2c3e50;
  display: inline-block;
  min-width: 120px;
}

.review-subitem {
  margin-top: 5px;
  padding-left: 15px;
  font-size: 0.9rem;
  color: #666;
}

.modal-footer {
  background-color: #f8f9fa;
  padding: 15px 20px;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn, .confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #5a6268;
}

.confirm-btn {
  background-color: #28a745;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background-color: #218838;
}

.cancel-btn:disabled, .confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 15px;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  margin-bottom: 15px;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 15px;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 15px;
}

/* Responsive design */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .modal-header, .modal-footer {
    padding: 12px 15px;
  }
  
  .modal-body {
    padding: 15px;
  }
  
  .review-item strong {
    min-width: 100px;
    display: block;
    margin-bottom: 5px;
  }
}
</style>