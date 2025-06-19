<template>
  <div class="flex flex-col h-full bg-gray-100">
    <div class="flex-grow flex items-center justify-center py-6 sm:py-12">
      <div class="relative w-full max-w-xl mx-auto px-4">
        <div
          class="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl">
        </div>
        <div class="relative bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div class="max-w-md mx-auto">
            <div>
              <h1 class="text-2xl font-semibold text-center mb-6">Add New User</h1>
            </div>
            <form @submit.prevent="submitForm" class="space-y-6">
              <!-- Username -->
              <div>
                <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
                <div class="mt-1">
                  <input v-model="form.username" type="text" id="username" name="username" required
                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>

              <!-- Password -->
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                <div class="mt-1 relative">
                  <input v-model="form.password" :type="showPassword ? 'text' : 'password'" id="password"
                    name="password" required
                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  <button type="button" @click="togglePassword"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                    <svg class="h-5 w-5 text-gray-400" :class="{ 'hidden': showPassword, 'block': !showPassword }"
                      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fill-rule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clip-rule="evenodd" />
                    </svg>
                    <svg class="h-5 w-5 text-gray-400" :class="{ 'block': showPassword, 'hidden': !showPassword }"
                      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clip-rule="evenodd" />
                      <path
                        d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label for="full_name" class="block text-sm font-medium text-gray-700">Full name</label>
                <div class="mt-1">
                  <input v-model="form.full_name" type="text" id="full_name" name="full_name" required
                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>
              <!-- Designation -->
              <div>
                <label for="designation" class="block text-sm font-medium text-gray-700">Designation</label>
                <select v-model="form.designation" id="designation" name="designation" required
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                  <option value="">Select designation</option>
                  <option v-for="designation in designations" :key="designation" :value="designation">{{ designation }}
                  </option>
                </select>
              </div>

              <!-- Prep Location -->
              <div>
                <label for="prep_location" class="block text-sm font-medium text-gray-700">Prep Location</label>
                <select v-model="form.prep_location" id="prep_location" name="prep_location" required
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                  <option value="">Select location</option>
                  <option v-for="location in prepLocations" :key="location" :value="location">{{ location }}</option>
                </select>
              </div>

              <!-- Role -->
              <div>
                <label for="role" class="block text-sm font-medium text-gray-700">Role</label>
                <select v-model="form.role" id="role" name="role" required
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                  <option value="">Select role</option>
                  <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
                </select>
              </div>

              <!-- BHC No -->
              <!-- BMHC No -->
              <div>
                <label for="bhc_no" class="block text-sm font-medium text-gray-700">BMHC No</label>
                <input v-model="form.bhc_no" type="text" id="bhc_no" name="bhc_no" :disabled="form.role === 'L4'"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <!-- Submit Button -->
              <button type="submit"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                :disabled="isSubmitting">
                {{ isSubmitting ? 'Submitting...' : ' Add User' }}
              </button>
              <!-- Submit Button -->

            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- Success and Error Messages -->
  <div v-if="successMessage" class="success-message">
    <p>{{ successMessage }}</p>
  </div>
  <div v-if="errorMessage" class="error-message">
    <p>{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const form = ref({
  username: '',
  password: '',
  full_name: '',
  designation: '',
  prep_location: '',
  role: '',
  bhc_no: ''
})

const showPassword = ref(false)
const isSubmitting = ref(false);
const designations = [
  'System admin',
  'Health Assistant',
  'Clinical Worker',
  'Medical Officer',
  'OUT REACH WORKERS',
  'CPA',
  'Happiness Center',
]

const prepLocations = [
  'Thimphu',
  'CHD/JDWNRH/Thimphu',
  'Paro Hospital/Paro',
  'HISC/Thimphu',
  'Phuentsholing HISC',
  'Gelephu HISC',
  'Kunegarabten HISC',
   'Looesa HISC',
   'Mongar Regional Hospital',
   'Samtse HISC',
   'Samdrup Jongkhar HISC',
   'Trashigang Regional Hospital'
]

const roles = [
  'admin',
  'L1',
  'L2',
  'L3',
  'L4'
]

const togglePassword = () => {
  showPassword.value = !showPassword.value
}
const successMessage = ref('');
const errorMessage = ref('');
const submitForm = async () => {
  const url = 'https://script.google.com/macros/s/AKfycbw7oyfknbkwgsafRGFt6f2tdPe6Uoj2Ufl_qbA4NM-TbkoVDjtd6MkVxdlylxOfUzuYKA/exec'
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // Create URL-encoded form data
    const formData = new URLSearchParams()
    Object.keys(form.value).forEach(key => {
      formData.append(key, form.value[key])
    })

    const response = await axios({
      method: 'POST',
      url: url,
      data: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    })

    // Check if response is JSON
    let result
    try {
      result = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
    } catch (e) {
      result = { success: true, message: response.data }
    }

    if (result.success) {
      successMessage.value = result.message || 'User added successfully!'
      clearForm()
    } else {
      throw new Error(result.error || 'Failed to add user')
    }

  } catch (error) {
    console.error('Submission error:', error)
    errorMessage.value = error.message || 'An error occurred while submitting the form. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
const clearForm = () => {
  form.value = {
    username: '',
    password: '',
    designation: '',
    prep_location: '',
    role: '',
    bhc_no: ''
  };
};

</script>
<style>
.success-message {
  color: green;
  text-align: center;
  font-weight: bold;
  font-size: larger;
}

.error-message {
  color: red;
  text-align: center;
  font-weight: bold;
  font-size: larger;
}

.submitting-indicator {
  margin-top: 20px;
  text-align: center;
  font-size: 1.2rem;
  color: #3498db;
}

.success-message {
  color: green;
  text-align: center;
  font-weight: bold;
}
</style>
