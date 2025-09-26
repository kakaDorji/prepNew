<template>
  <div class="form5-unscheduled-visit">
    <div class="container">
      <h1 class="form-title">Form 5: Unscheduled Visit</h1>
      
      <!-- Loading State -->
      <div v-if="loading" class="loading">
        <p>{{ loadingMessage }}</p>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="message" :class="messageClass" class="message">
        {{ message }}
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="unscheduled-visit-form">
        
        <!-- Basic Information -->
        <section class="form-section">
          <h2>Basic Information</h2>
          
          <div class="form-group">
            <label for="participant_uid">Participant UID <span class="required">*</span></label>
            <input 
              type="text" 
              id="participant_uid" 
              v-model="formData.participant_uid" 
              required
              @blur="checkExistingData"
              :disabled="loading"
            >
          </div>

          <div class="form-group">
            <label for="prep_site">PrEP Site</label>
            <input 
              type="text" 
              id="prep_site" 
              v-model="formData.prep_site"
              :disabled="loading"
            >
          </div>

          <div class="form-group">
            <label for="date">Date</label>
            <input 
              type="date" 
              id="date" 
              v-model="formData.date"
              :disabled="loading"
            >
          </div>

          <div class="form-group">
            <label for="reason_visit">Reason for this visit</label>
            <div class="checkbox-group">
              <label v-for="reason in visitReasons" :key="reason" class="checkbox-label">
                <input 
                  type="checkbox" 
                  :value="reason" 
                  v-model="formData.reason_visit"
                  :disabled="loading"
                >
                {{ reason }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="other_reason_visit">Other (describe)</label>
            <textarea 
              id="other_reason_visit" 
              v-model="formData.other_reason_visit"
              rows="3"
              :disabled="loading"
            ></textarea>
          </div>
        </section>

        <!-- Side Effects Section -->
        <section class="form-section">
          <h2>Side Effects</h2>
          
          <div class="side-effects-grid">
            <div v-for="effect in sideEffects" :key="effect.name" class="side-effect-item">
              <h4>{{ effect.label }}</h4>
              
              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="formData[effect.name]"
                    :disabled="loading"
                  >
                  Experienced
                </label>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="formData[effect.ongoing]"
                    :disabled="loading"
                  >
                  Ongoing
                </label>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="formData[effect.resolved]"
                    :disabled="loading"
                  >
                  Resolved
                </label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="others_description">Others (please describe below)</label>
            <textarea 
              id="others_description" 
              v-model="formData.others_description"
              rows="3"
              :disabled="loading"
            ></textarea>
          </div>
        </section>

        <!-- PrEP Related Questions -->
        <section class="form-section">
          <h2>PrEP Related Questions</h2>
          
          <div class="form-group">
            <label for="challenges_prep">Challenges taking PrEP</label>
            <textarea 
              id="challenges_prep" 
              v-model="formData.challenges_prep"
              rows="3"
              :disabled="loading"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="challenges_details">Comments on challenges faced</label>
            <textarea 
              id="challenges_details" 
              v-model="formData.challenges_details"
              rows="3"
              :disabled="loading"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="additional_doses_details">Additional doses above</label>
            <textarea 
              id="additional_doses_details" 
              v-model="formData.additional_doses_details"
              rows="3"
              :disabled="loading"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="prep_continue">Stop or continue PrEP?</label>
            <select v-model="formData.prep_continue" :disabled="loading">
              <option value="">Select...</option>
              <option value="Continue">Continue</option>
              <option value="Stop">Stop</option>
            </select>
          </div>

          <div class="form-group">
            <label for="stopping_reasons">Stopping reason</label>
            <textarea 
              id="stopping_reasons" 
              v-model="formData.stopping_reasons"
              rows="3"
              :disabled="loading"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="stopping_Preventionmethod">Stopping - indicate reasons preferred method</label>
            <textarea 
              id="stopping_Preventionmethod" 
              v-model="formData.stopping_Preventionmethod"
              rows="3"
              :disabled="loading"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="other_notes">Other notes</label>
            <textarea 
              id="other_notes" 
              v-model="formData.other_notes"
              rows="4"
              :disabled="loading"
            ></textarea>
          </div>
        </section>

        <!-- Interviewer Information -->
        <section class="form-section">
          <h2>Interviewer Information</h2>
          
          <div class="form-group">
            <label for="interviewer_date">Date</label>
            <input 
              type="date" 
              id="interviewer_date" 
              v-model="formData.interviewer_date"
              :disabled="loading"
            >
          </div>

          <div class="form-group">
            <label for="interviewer_name">Name</label>
            <input 
              type="text" 
              id="interviewer_name" 
              v-model="formData.interviewer_name"
              :disabled="loading"
            >
          </div>

          <div class="form-group">
            <label for="designation">Designation</label>
            <input 
              type="text" 
              id="designation" 
              v-model="formData.designation"
              :disabled="loading"
            >
          </div>

          <div class="form-group">
            <label for="bmhc_number">BMHC Number</label>
            <input 
              type="text" 
              id="bmhc_number" 
              v-model="formData.bmhc_number"
              :disabled="loading"
            >
          </div>
        </section>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="submit" :disabled="loading || !formData.participant_uid" class="btn btn-primary">
            {{ isEditMode ? 'Update Record' : 'Save Record' }}
          </button>
          
          <button 
            v-if="isEditMode" 
            type="button" 
            @click="deleteRecord" 
            :disabled="loading"
            class="btn btn-danger"
          >
            Delete Record
          </button>
          
          <button type="button" @click="resetForm" :disabled="loading" class="btn btn-secondary">
            Clear Form
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Form5UnscheduledVisit',
  data() {
    return {
      loading: false,
      loadingMessage: '',
      message: '',
      messageType: 'info',
      isEditMode: false,
      gasUrl: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE', // Replace with your actual GAS URL
      
      visitReasons: [
        'Side effects',
        'Questions about PrEP',
        'Missed doses',
        'Want to stop PrEP',
        'Other'
      ],

      sideEffects: [
        { name: 'nausea', ongoing: 'nausea_ongoing', resolved: 'nausea_resolved', label: 'Nausea' },
        { name: 'vomiting', ongoing: 'vomiting_ongoing', resolved: 'vomiting_resolved', label: 'Vomiting' },
        { name: 'abdominal_cramps', ongoing: 'abdominal_cramps_ongoing', resolved: 'abdominal_cramps_resolved', label: 'Abdominal Cramps' },
        { name: 'fatigue', ongoing: 'fatigue_ongoing', resolved: 'fatigue_resolved', label: 'Fatigue' },
        { name: 'dizziness', ongoing: 'dizziness_ongoing', resolved: 'dizziness_resolved', label: 'Dizziness' },
        { name: 'headache', ongoing: 'headache_ongoing', resolved: 'headache_resolved', label: 'Headache' },
        { name: 'others', ongoing: 'others_ongoing', resolved: 'others_resolved', label: 'Others' }
      ],

      formData: {
        participant_uid: '',
        prep_site: '',
        date: '',
        reason_visit: [],
        other_reason_visit: '',
        
        // Side effects
        nausea: false,
        nausea_ongoing: false,
        nausea_resolved: false,
        vomiting: false,
        vomiting_ongoing: false,
        vomiting_resolved: false,
        abdominal_cramps: false,
        abdominal_cramps_ongoing: false,
        abdominal_cramps_resolved: false,
        fatigue: false,
        fatigue_ongoing: false,
        fatigue_resolved: false,
        dizziness: false,
        dizziness_ongoing: false,
        dizziness_resolved: false,
        headache: false,
        headache_ongoing: false,
        headache_resolved: false,
        others: false,
        others_ongoing: false,
        others_resolved: false,
        others_description: '',
        
        // PrEP related
        challenges_prep: '',
        challenges_details: '',
        additional_doses_details: '',
        prep_continue: '',
        stopping_reasons: '',
        stopping_Preventionmethod: '',
        other_notes: '',
        
        // Interviewer info
        interviewer_date: '',
        interviewer_name: '',
        designation: '',
        bmhc_number: ''
      }
    }
  },
  computed: {
    messageClass() {
      return {
        'message-success': this.messageType === 'success',
        'message-error': this.messageType === 'error',
        'message-warning': this.messageType === 'warning',
        'message-info': this.messageType === 'info'
      }
    }
  },
  mounted() {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    this.formData.date = today;
    this.formData.interviewer_date = today;
  },
  methods: {
    async checkExistingData() {
      if (!this.formData.participant_uid.trim()) return;
      
      this.loading = true;
      this.loadingMessage = 'Checking existing data...';
      
      try {
        const response = await fetch(this.gasUrl + '?action=checkData&uid=' + encodeURIComponent(this.formData.participant_uid));
        const result = await response.json();
        
        if (result.status === 'success' && result.hasData) {
          const shouldPrefill = confirm('Existing unscheduled visit data found for this UID. Would you like to load it for editing?');
          
          if (shouldPrefill) {
            await this.prefillData();
          }
        }
      } catch (error) {
        console.error('Error checking existing data:', error);
        this.showMessage('Error checking existing data: ' + error.message, 'error');
      } finally {
        this.loading = false;
      }
    },

    async prefillData() {
      this.loading = true;
      this.loadingMessage = 'Loading existing data...';
      
      try {
        const response = await fetch(this.gasUrl + '?action=prefill&uid=' + encodeURIComponent(this.formData.participant_uid));
        const result = await response.json();
        
        if (result.status === 'success') {
          // Merge the prefill data with current form data
          Object.keys(result.data).forEach(key => {
            if (key in this.formData) {
              this.formData[key] = result.data[key];
            }
          });
          
          this.isEditMode = true;
          this.showMessage('Data loaded successfully for editing', 'success');
        } else {
          this.showMessage('Error loading data: ' + result.message, 'error');
        }
      } catch (error) {
        console.error('Error prefilling data:', error);
        this.showMessage('Error loading data: ' + error.message, 'error');
      } finally {
        this.loading = false;
      }
    },

    async handleSubmit() {
      this.loading = true;
      this.loadingMessage = this.isEditMode ? 'Updating record...' : 'Saving record...';
      
      try {
        const action = this.isEditMode ? 'update' : 'add';
        const payload = this.preparePayload();
        
        const response = await fetch(this.gasUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: action,
            ...payload
          })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
          this.showMessage(result.message, 'success');
          if (!this.isEditMode) {
            this.resetForm();
          }
        } else {
          this.showMessage(result.message, 'error');
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        this.showMessage('Error submitting form: ' + error.message, 'error');
      } finally {
        this.loading = false;
      }
    },

    async deleteRecord() {
      if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
        return;
      }
      
      this.loading = true;
      this.loadingMessage = 'Deleting record...';
      
      try {
        const response = await fetch(this.gasUrl + '?action=delete&uid=' + encodeURIComponent(this.formData.participant_uid));
        const result = await response.json();
        
        if (result.status === 'success') {
          this.showMessage(result.message, 'success');
          this.resetForm();
        } else {
          this.showMessage(result.message, 'error');
        }
      } catch (error) {
        console.error('Error deleting record:', error);
        this.showMessage('Error deleting record: ' + error.message, 'error');
      } finally {
        this.loading = false;
      }
    },

    preparePayload() {
      const payload = { ...this.formData };
      
      // Convert arrays to strings
      if (Array.isArray(payload.reason_visit)) {
        payload.reason_for_this_visit = payload.reason_visit.join('; ');
      }
      delete payload.reason_visit;
      
      // Convert boolean values to strings
      Object.keys(payload).forEach(key => {
        if (typeof payload[key] === 'boolean') {
          payload[key] = payload[key] ? 'Yes' : 'No';
        }
      });
      
      // Map frontend field names to backend field names
      const fieldMapping = {
        'participant_uid': 'uid',
        'other_reason_visit': 'other_describe',
        'others_description': 'others_please_describe_below',
        'challenges_prep': 'challenges_taking_prep',
        'challenges_details': 'comments_challenges_faced',
        'additional_doses_details': 'additional_doses_above',
        'prep_continue': 'stop_or_continue',
        'stopping_reasons': 'stopping_reason',
        'stopping_Preventionmethod': 'stopping_indicate_reasons_preferred_method',
        'bmhc_number': 'bhmc_number'
      };
      
      Object.keys(fieldMapping).forEach(frontendKey => {
        if (frontendKey in payload) {
          payload[fieldMapping[frontendKey]] = payload[frontendKey];
          delete payload[frontendKey];
        }
      });
      
      return payload;
    },

    resetForm() {
      const today = new Date().toISOString().split('T')[0];
      
      this.formData = {
        participant_uid: '',
        prep_site: '',
        date: today,
        reason_visit: [],
        other_reason_visit: '',
        
        // Side effects - all false
        nausea: false,
        nausea_ongoing: false,
        nausea_resolved: false,
        vomiting: false,
        vomiting_ongoing: false,
        vomiting_resolved: false,
        abdominal_cramps: false,
        abdominal_cramps_ongoing: false,
        abdominal_cramps_resolved: false,
        fatigue: false,
        fatigue_ongoing: false,
        fatigue_resolved: false,
        dizziness: false,
        dizziness_ongoing: false,
        dizziness_resolved: false,
        headache: false,
        headache_ongoing: false,
        headache_resolved: false,
        others: false,
        others_ongoing: false,
        others_resolved: false,
        others_description: '',
        
        // PrEP related - all empty
        challenges_prep: '',
        challenges_details: '',
        additional_doses_details: '',
        prep_continue: '',
        stopping_reasons: '',
        stopping_Preventionmethod: '',
        other_notes: '',
        
        // Interviewer info
        interviewer_date: today,
        interviewer_name: '',
        designation: '',
        bmhc_number: ''
      };
      
      this.isEditMode = false;
      this.message = '';
    },

    showMessage(msg, type = 'info') {
      this.message = msg;
      this.messageType = type;
      
      // Auto-hide success messages after 5 seconds
      if (type === 'success') {
        setTimeout(() => {
          this.message = '';
        }, 5000);
      }
    }
  }
}
</script>

<style scoped>
.form5-unscheduled-visit {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.form-title {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
  font-size: 2.2em;
  font-weight: bold;
}

.loading {
  text-align: center;
  padding: 20px;
  background: #e8f4f8;
  border-radius: 5px;
  margin: 20px 0;
}

.message {
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
  font-weight: 500;
}

.message-success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.message-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.message-warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.message-info {
  background: #cce7ff;
  border: 1px solid #b3d9ff;
  color: #004085;
}

.form-section {
  margin: 30px 0;
  padding: 25px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.form-section h2 {
  color: #34495e;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #3498db;
  font-size: 1.4em;
}

.form-group {
  margin: 20px 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.required {
  color: #e74c3c;
  font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  font-weight: normal !important;
  cursor: pointer;
  margin-bottom: 0 !important;
}

.checkbox-label input[type="checkbox"] {
  width: auto !important;
  margin-right: 10px;
  transform: scale(1.2);
}

.side-effects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.side-effect-item {
  background: white;
  padding: 15px;
  border-radius: 5px;
  border: 1px solid #e0e0e0;
}

.side-effect-item h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 1.1em;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
}

.btn {
  padding: 12px 25px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 120px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .form5-unscheduled-visit {
    padding: 10px;
  }
  
  .container {
    padding: 20px;
  }
  
  .form-title {
    font-size: 1.8em;
  }
  
  .side-effects-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>