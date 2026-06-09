<script setup lang="ts">
import { ref, onMounted } from "vue";
import { api } from "../composables/useApi";

const settings = ref<Record<string, string>>({});
const loading = ref(true);
const saving = ref(false);
const message = ref("");

// Skills management
const skills = ref<string[]>([]);
const newSkill = ref("");

const fields = [
  { key: "hero_name_line1", label: "Hero Name Line 1" },
  { key: "hero_name_line2", label: "Hero Name Line 2" },
  { key: "hero_job_title", label: "Job Title" },
  { key: "about_intro", label: "About Intro", type: "textarea" },
  { key: "about_tagline", label: "About Tagline", type: "textarea" },
  { key: "location", label: "Location" },
  { key: "email", label: "Email" },
  { key: "github_url", label: "GitHub URL" },
  { key: "linkedin_url", label: "LinkedIn URL" },
];

const load = async () => {
  loading.value = true;
  try {
    settings.value = await api("/api/settings");
    // Parse skills from settings
    if (settings.value.skills) {
      try { skills.value = JSON.parse(settings.value.skills); } catch { skills.value = []; }
    } else {
      skills.value = [];
    }
  } catch (e: any) {
    message.value = e.message;
  }
  loading.value = false;
};

const save = async () => {
  saving.value = true;
  message.value = "";
  try {
    // Include skills in settings save
    settings.value.skills = JSON.stringify(skills.value);
    await api("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings.value),
    });
    message.value = "Settings saved!";
    setTimeout(() => (message.value = ""), 3000);
  } catch (e: any) {
    message.value = `Error: ${e.message}`;
  }
  saving.value = false;
};

const addSkill = () => {
  const s = newSkill.value.trim();
  if (!s) return;
  skills.value.push(s);
  newSkill.value = "";
};

const removeSkill = (idx: number) => {
  skills.value.splice(idx, 1);
};

const moveSkill = (idx: number, direction: number) => {
  const target = idx + direction;
  if (target < 0 || target >= skills.value.length) return;
  const temp = skills.value[idx]!;
  skills.value[idx] = skills.value[target]!;
  skills.value[target] = temp;
};

onMounted(load);
</script>

<template>
  <div class="settings">
    <div v-if="loading" class="loading">Loading settings...</div>
    <template v-else>
      <form @submit.prevent="save" class="settings-form">
        <div v-for="field in fields" :key="field.key" class="field">
          <label class="field-label">{{ field.label }}</label>
          <textarea
            v-if="field.type === 'textarea'"
            v-model="settings[field.key]"
            class="field-input field-textarea"
            rows="3"
          ></textarea>
          <input v-else v-model="settings[field.key]" class="field-input" />
        </div>

        <!-- Skills Section -->
        <div class="skills-section">
          <label class="field-label">Skills (About Me section)</label>
          <div class="skills-list">
            <div v-for="(skill, idx) in skills" :key="idx" class="skill-item">
              <span class="skill-name">{{ skill }}</span>
              <div class="skill-actions">
                <button type="button" class="btn-xs" @click="moveSkill(idx, -1)" :disabled="idx === 0">↑</button>
                <button type="button" class="btn-xs" @click="moveSkill(idx, 1)" :disabled="idx === skills.length - 1">↓</button>
                <button type="button" class="btn-xs btn-danger-xs" @click="removeSkill(idx)">✕</button>
              </div>
            </div>
            <p v-if="!skills.length" class="empty">No skills added. Add some below.</p>
          </div>
          <div class="skill-add">
            <input v-model="newSkill" class="field-input" placeholder="e.g. Apache Spark & PySpark" @keydown.enter.prevent="addSkill" />
            <button type="button" class="btn-add" @click="addSkill">+ Add</button>
          </div>
        </div>

        <div class="settings-actions">
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? "Saving..." : "Save Settings" }}
          </button>
          <p v-if="message" :class="['msg', message.startsWith('Error') && 'msg-error']">{{ message }}</p>
        </div>
      </form>
    </template>
  </div>
</template>

<style scoped>
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 600px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.8rem;
  color: #8892b0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-input {
  background: #1a1d2e;
  border: 1px solid #2e3250;
  border-radius: 8px;
  padding: 10px 14px;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.field-input:focus {
  border-color: #4fa3ff;
}

.field-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.settings-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.btn-primary {
  background: #4fa3ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover { background: #3b8de6; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.msg { font-size: 0.85rem; color: #22c55e; }
.msg-error { color: #ff4d6d; }

.loading { color: #8892b0; }

/* Skills */
.skills-section { display: flex; flex-direction: column; gap: 10px; border-top: 1px solid #2e3250; padding-top: 20px; }
.skills-list { display: flex; flex-direction: column; gap: 6px; }
.skill-item { display: flex; align-items: center; justify-content: space-between; background: #0f1117; border: 1px solid #2e3250; border-radius: 6px; padding: 8px 12px; }
.skill-name { font-size: 0.85rem; color: #fff; }
.skill-actions { display: flex; gap: 4px; }
.skill-add { display: flex; gap: 8px; }
.skill-add .field-input { flex: 1; }
.btn-add { background: #4fa3ff; color: #fff; border: none; border-radius: 6px; padding: 8px 14px; font-size: 0.8rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
.btn-add:hover { background: #3b8de6; }
.btn-xs { padding: 4px 8px; font-size: 0.7rem; border-radius: 4px; border: 1px solid #2e3250; background: transparent; color: #8892b0; cursor: pointer; }
.btn-xs:hover { background: #1e2235; color: #fff; }
.btn-xs:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-danger-xs { color: #ff4d6d; border-color: #5c1a2a; }
.empty { font-size: 0.8rem; color: #6b7394; font-style: italic; }
</style>
