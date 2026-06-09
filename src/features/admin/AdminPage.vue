<script setup lang="ts">
import { computed } from "vue";
import { isAuthenticated } from "./composables/useApi";
import AdminLogin from "./components/AdminLogin.vue";
import AdminDashboard from "./components/AdminDashboard.vue";

const showDashboard = computed(() => isAuthenticated.value);
</script>

<template>
  <AdminDashboard v-if="showDashboard" />
  <AdminLogin v-else @loggedIn="isAuthenticated = true" />
</template>
