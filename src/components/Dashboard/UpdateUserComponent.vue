<template>
  <div class="flex flex-col justify-center min-h-screen bg-gradient-to-r from-indigo-950 via- to-indigo-700">
    <div class="relative py-3 max-w-6xl w-full mx-auto px-4">
      <div
        class="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl">
      </div>
      <div class="relative px-6 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
        <h1 class="text-3xl font-bold mb-8 text-center text-gray-800">
          Search and Edit Users
        </h1>

        <!-- Search Input -->
        <div class="mb-6 relative">
          <input type="text" v-model="searchTerm" placeholder="Search by username..."
            class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            @input="currentPage = 1" />
        </div>

        <!-- Results Table -->
        <div class="overflow-x-auto">
          <table v-if="paginatedUsers.length > 0" class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th v-for="header in [
                  'Username',
                  'Full Name',
                  'Designation',
                  'Prep Location',
                  'Role',
                  'BHC No',
                  'Action',
                ]" :key="header"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in paginatedUsers" :key="user.username"
                class="hover:bg-gray-50 transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ user.username }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ user.fullname }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input v-if="user.isEditing" type="text" v-model="user.designation"
                    class="w-full px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                  <span v-else>{{ user.designation }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input v-if="user.isEditing" type="text" v-model="user.prep_location"
                    class="w-full px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                  <span v-else>{{ user.prep_location }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input v-if="user.isEditing" type="text" v-model="user.role"
                    class="w-full px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                  <span v-else>{{ user.role }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input v-if="user.isEditing" type="text" v-model="user.bhc_no"
                    class="w-full px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                  <span v-else>{{ user.bhc_no }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button v-if="!user.isEditing" @click="toggleEdit(user)"
                    class="text-cyan-600 hover:text-cyan-900 mr-2 transition-colors duration-200">
                    Edit
                  </button>
                  <template v-else>
                    <button @click="saveChanges(user)"
                      class="text-green-600 hover:text-green-900 mr-2 transition-colors duration-200">
                      Save
                    </button>
                    <button @click="cancelEdit(user)"
                      class="text-red-600 hover:text-red-900 transition-colors duration-200">
                      Cancel
                    </button>
                  </template>
                  <button @click="requestDelete(user)" class="text-red-600 hover:text-red-900 ml-2">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="text-center text-gray-500 mt-4">
            No matching users found.
          </p>
        </div>

        <!-- Pagination -->
        <div v-if="filteredUsers.length > usersPerPage" class="mt-6 flex justify-center">
          <button @click="prevPage" :disabled="currentPage === 1"
            class="px-4 py-2 mx-1 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50">
            Previous
          </button>
          <span class="px-4 py-2 mx-1">Page {{ currentPage }} of {{ totalPages }}</span>
          <button @click="nextPage" :disabled="currentPage === totalPages"
            class="px-4 py-2 mx-1 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50">
            Next
          </button>
        </div>

        <!-- Messages inside table container -->
        <div v-if="successMessage || errorMessage" class="mb-4 max-w-full">
          <div v-if="successMessage"
            class="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded shadow-md text-center mb-2">
            {{ successMessage }}
          </div>
          <div v-if="errorMessage"
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-md text-center">
            {{ errorMessage }}
          </div>
        </div>

        <!-- Confirm delete message -->
        <!-- <div v-if="userToDelete"
          class="mb-6 max-w-full bg-gray-100 border border-gray-300 text-gray-800 px-6 py-4 rounded shadow-md text-center">
          <p class="mb-4">
            Are you sure you want to delete user:
            <strong>{{ userToDelete.username }}</strong>? This cannot be undone.
          </p>
          <button @click="confirmDelete"
            class="bg-red-600 text-white px-4 py-2 rounded mr-4 hover:bg-red-700 transition">
            Yes, Delete
          </button>
          <button @click="cancelDelete"
            class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition">
            Cancel
          </button>
        </div> -->

        <!-- <div v-if="userToDelete"
          class="mb-6 max-w-full bg-gray-100 border border-gray-300 text-gray-800 px-6 py-4 rounded shadow-md text-center">
          <div class="flex justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p class="mb-4">
            Are you sure you want to permanently delete user:
            <strong>{{ userToDelete.username }}</strong>? This action cannot be undone.
          </p>

          <div class="flex justify-center space-x-4">
            <button @click="confirmDelete" :disabled="isDeleting"
              class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:bg-red-400 flex items-center">
              <span v-if="isDeleting" class="inline-block animate-spin mr-2">↻</span>
              {{ isDeleting ? 'Deleting...' : 'Yes, Delete' }}
            </button>
            <button @click="cancelDelete" :disabled="isDeleting"
              class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition disabled:bg-gray-200">
              Cancel
            </button>
          </div>
        </div> -->

        <!-- Minimalist & Professional Confirmation Box -->
        <div v-if="userToDelete" class="mx-auto max-w-lg rounded-lg bg-white p-4 shadow-lg sm:p-6">
          <div class="sm:flex sm:items-start">
            <!-- Icon Container -->
            <div
              class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <!-- Text Content -->
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                Confirm Deletion
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-600">
                  Are you sure you want to permanently delete user
                  <strong class="font-semibold text-gray-800">{{ userToDelete.username }}</strong>?
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div class="mt-5 flex justify-end space-x-3">
            <button @click="cancelDelete" :disabled="isDeleting" type="button"
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50">
              Cancel
            </button>
            <button @click="confirmDelete" :disabled="isDeleting" type="button"
              class="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-400 disabled:cursor-not-allowed">
              <!-- Better SVG Spinner -->
              <svg v-if="isDeleting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              {{ isDeleting ? 'Deleting...' : 'Yes, Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const users = ref([]);
const originalUsers = ref({});
const searchTerm = ref("");
const currentPage = ref(1);
const usersPerPage = ref(10);
const isLoading = ref(true);

// Message refs
const successMessage = ref("");
const errorMessage = ref("");

// For custom delete confirmation
const userToDelete = ref(null);

async function fetchUsers() {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const response = await axios.post("/api", {
      action: "getUsers",
    });
    const data = response.data;

    if (data.success && data.users && Array.isArray(data.users)) {
      users.value = data.users.map((user) => ({ ...user, isEditing: false }));
    } else {
      throw new Error(
        data.message || "Failed to fetch users or unexpected data format."
      );
    }
  } catch (error) {
    errorMessage.value = error.message;
    setTimeout(() => {
      errorMessage.value = "";
    }, 5000);
    users.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchUsers);

const toggleEdit = (user) => {
  if (!user.isEditing) {
    originalUsers.value[user.rowindex] = { ...user };
  }
  user.isEditing = !user.isEditing;
};

const cancelEdit = (user) => {
  if (originalUsers.value[user.rowindex]) {
    Object.assign(user, originalUsers.value[user.rowindex]);
    user.isEditing = false;
    delete originalUsers.value[user.rowindex];
  }
};

const saveChanges = async (user) => {
  successMessage.value = "";
  errorMessage.value = "";
  try {
    const response = await axios.post('/api', {
      action: "updateUser",
      username: user.username,
      fullname: user.fullname,
      designation: user.designation,
      prep_location: user.prep_location,
      role: user.role,
      bhc_no: user.bhc_no,
      rowindex: user.rowindex,
    });

    if (response.data.success) {
      user.isEditing = false;
      delete originalUsers.value[user.rowindex];
      successMessage.value = "User updated successfully!";
      setTimeout(() => {
        successMessage.value = "";
      }, 3000);
    } else {
      throw new Error(response.data.message || "Unknown error from server.");
    }
  } catch (error) {
    console.error("Error updating user:", error);
    errorMessage.value = `Failed to save changes: ${error.message}`;
    setTimeout(() => {
      errorMessage.value = "";
    }, 5000);
    cancelEdit(user);
  }
};

// New: On Delete button click, request confirmation
const requestDelete = (user) => {
  userToDelete.value = user;
};

const confirmDelete = async () => {
  if (!userToDelete.value) return;

  successMessage.value = "";
  errorMessage.value = "";
  try {
    const response = await axios.post('/api', {
      action: "deleteUser",
      rowindex: userToDelete.value.rowindex,
    });

    if (response.data.success) {
      users.value = users.value.filter(
        (u) => u.rowindex !== userToDelete.value.rowindex
      );
      successMessage.value = "User deleted successfully!";
      setTimeout(() => {
        successMessage.value = "";
      }, 3000);
    } else {
      throw new Error(response.data.message || "Unknown error from server.");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    errorMessage.value = `Failed to delete user: ${error.message}`;
    setTimeout(() => {
      errorMessage.value = "";
    }, 5000);
  } finally {
    userToDelete.value = null; // Reset after action
  }
};

const cancelDelete = () => {
  userToDelete.value = null;
};

const filteredUsers = computed(() =>
  users.value.filter(
    (user) =>
      (user.username &&
        user.username.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
      (user.fullname &&
        user.fullname.toLowerCase().includes(searchTerm.value.toLowerCase()))
  )
);

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * usersPerPage.value;
  return filteredUsers.value.slice(start, start + usersPerPage.value);
});

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / usersPerPage.value) || 1;
});

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
</script>
