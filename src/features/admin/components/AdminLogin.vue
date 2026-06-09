<script setup lang="ts">
import { ref } from "vue";
import { login } from "../composables/useApi";

const emit = defineEmits<{ (e: "loggedIn"): void }>();

const username = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const showPassword = ref(false);

const handleSubmit = async () => {
  error.value = "";
  loading.value = true;

  const success = await login(username.value, password.value);

  if (success) {
    emit("loggedIn");
  } else {
    error.value = "Invalid credentials";
  }

  loading.value = false;
};
</script>

<template>
  <div class="login">
    <div class="login-card">
      <h1 class="login-title">Admin Panel</h1>
      <p class="login-subtitle">Portfolio CMS</p>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="login-field">
          <label>Username</label>
          <input v-model="username" type="text" autocomplete="username" required />
        </div>
        <div class="login-field">
          <label>Password</label>
          <div class="login-password-wrapper">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required />
            <button type="button" class="login-toggle-pw" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>
        <p v-if="error" class="login-error">{{ error }}</p>
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? "Signing in..." : "Sign In" }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f1117;
  padding: 20px;
}

.login-card {
  background: #1a1d2e;
  border: 1px solid #2e3250;
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 400px;
}

.login-title {
  font-size: 1.5rem;
  color: #fff;
  margin-bottom: 4px;
}

.login-subtitle {
  color: #8892b0;
  font-size: 0.875rem;
  margin-bottom: 32px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.login-field label {
  font-size: 0.8rem;
  color: #8892b0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.login-field input {
  background: #0f1117;
  border: 1px solid #2e3250;
  border-radius: 8px;
  padding: 12px 16px;
  color: #fff;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.login-field input:focus {
  border-color: #4fa3ff;
}

.login-password-wrapper {
  position: relative;
  display: flex;
}

.login-password-wrapper input {
  flex: 1;
  padding-right: 44px;
}

.login-toggle-pw {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 4px;
  line-height: 1;
}

.login-error {
  color: #ff4d6d;
  font-size: 0.85rem;
}

.login-btn {
  background: #4fa3ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.login-btn:hover {
  background: #3b8de6;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
