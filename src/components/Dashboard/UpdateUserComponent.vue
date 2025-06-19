<template>
  <div class="px-10 bg-gray-100 py-6 flex flex-col justify-center">
    <!-- Search, table, and pagination part remains the same -->
    <div class="relative py-3 max-w-6xl w-full mx-auto px-4">
      <div class="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
      <div class="relative px-6 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
        <h1 class="text-3xl font-bold mb-8 text-center text-gray-800">Search and Edit Users</h1>

        <!-- Search Input -->
        <div class="mb-6 relative">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Search by username..."
            class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        <!-- Results Table -->
        <div class="overflow-x-auto">
          <table v-if="paginatedUsers.length > 0" class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th v-for="header in ['Username','Full Name', 'Designation', 'Prep Location', 'Role', 'BHC No', 'Action']" :key="header" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in paginatedUsers" :key="user.username" class="hover:bg-gray-50 transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ user.username }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ user.fullname }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input v-if="user.isEditing" type="text" v-model="user.designation" class="w-full px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                  <span v-else>{{ user.designation }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input v-if="user.isEditing" type="text" v-model="user.prep_location" class="w-full px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                  <span v-else>{{ user.prep_location }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input v-if="user.isEditing" type="text" v-model="user.role" class="w-full px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                  <span v-else>{{ user.role }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input v-if="user.isEditing" type="text" v-model="user.bhc_no" class="w-full px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                  <span v-else>{{ user.bhc_no }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button v-if="!user.isEditing" @click="toggleEdit(user)" class="text-cyan-600 hover:text-cyan-900 mr-2 transition-colors duration-200">Edit</button>
                  <template v-else>
                    <button @click="saveChanges(user)" class="text-green-600 hover:text-green-900 mr-2 transition-colors duration-200">Save</button>
                    <button @click="toggleEdit(user)" class="text-red-600 hover:text-red-900 transition-colors duration-200">Cancel</button>
                  </template>
                  <button @click="deleteUser(user)" class="text-red-600 hover:text-red-900 ml-2">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="text-center text-gray-500 mt-4">No matching users found.</p>
        </div>
        <!-- Pagination and Status Message logic -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

// User data and search term
const users = ref([]);
const searchTerm = ref('');
const currentPage = ref(1);
const usersPerPage = ref(5);

// Fetch users from the backend
const fetchUsers = async () => {
  try {
    const response = await axios.get("http://localhost:5000/api/users");
    users.value = response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};

onMounted(fetchUsers);

// Toggle edit mode for a user
const toggleEdit = (user) => {
  user.isEditing = !user.isEditing;
};

// Save changes made to a user
const saveChanges = async (user) => {
  try {
    await axios.post("http://localhost:5000/api/updateUser", {
      username: user.username,
      password: user.password, // Add this line
      fullname: user.fullname,
      designation: user.designation,
      prep_location: user.prep_location,
      role: user.role,
      bhc_no: user.bhc_no,
      rowindex: user.rowindex
    });
    toggleEdit(user); // Exit edit mode
  } catch (error) {
    console.error("Error updating user:", error);
  }
};

// Delete a user
const deleteUser = async (user) => {
  try {
    await axios.post("http://localhost:5000/api/deleteUser", { rowindex: user.rowindex });
    users.value = users.value.filter(u => u.username !== user.username); // Remove user from table
  } catch (error) {
    console.error("Error deleting user:", error);
  }
};

// Filter users based on search term
const filteredUsers = computed(() => {
  return users.value.filter(user =>
    user.username.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

// Paginate users
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * usersPerPage.value;
  return filteredUsers.value.slice(start, start + usersPerPage.value);
});
</script>

<style scoped>
/* Add styles as needed */
</style>
