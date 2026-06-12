<script setup lang="ts">
import { ref, onMounted } from "vue";
import { api } from "../composables/useApi";

interface Contribution {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  type: string;
  date: string | null;
  sort_order: number;
}

const activeTab = ref<"settings" | "contributions">("settings");
const contributions = ref<Contribution[]>([]);
const loading = ref(true);
const message = ref("");

// Toggle settings
const showBlog = ref(false);
const showContributions = ref(false);

// New contribution form
const newTitle = ref("");
const newDesc = ref("");
const newUrl = ref("");
const newType = ref("open-source");
const newDate = ref("");

const loadSettings = async () => {
  try {
    const settings = await api("/api/settings");
    showBlog.value = settings.journey_show_blog === "true";
    showContributions.value = settings.journey_show_contributions === "true";
  } catch { /* */ }
};

const saveToggles = async () => {
  try {
    await api("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify({
        journey_show_blog: showBlog.value ? "true" : "false",
        journey_show_contributions: showContributions.value ? "true" : "false",
      }),
    });
    showMsg("Settings saved!");
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const loadContributions = async () => {
  try {
    contributions.value = await api("/api/contributions");
  } catch (e: any) { showMsg(e.message); }
};

const addContribution = async () => {
  if (!newTitle.value.trim()) { showMsg("Error: Title required"); return; }
  try {
    await api("/api/admin/contributions", {
      method: "POST",
      body: JSON.stringify({ title: newTitle.value.trim(), description: newDesc.value.trim() || null, url: newUrl.value.trim() || null, type: newType.value, date: newDate.value || null, sort_order: contributions.value.length }),
    });
    newTitle.value = ""; newDesc.value = ""; newUrl.value = ""; newDate.value = "";
    showMsg("Contribution added!");
    await loadContributions();
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const deleteContribution = async (id: number) => {
  if (!confirm("Delete this contribution?")) return;
  try {
    await api(`/api/admin/contributions/${id}`, { method: "DELETE" });
    await loadContributions();
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const showMsg = (msg: string) => { message.value = msg; setTimeout(() => (message.value = ""), 4000); };

onMounted(async () => {
  await loadSettings();
  await loadContributions();
  loading.value = false;
});
</script>

<template>
  <div class="journey-panel">
    <p v-if="message" :class="['msg', message.startsWith('Error') && 'msg-error']">{{ message }}</p>

    <div class="tabs">
      <button :class="['tab', activeTab === 'settings' && 'tab-active']" @click="activeTab = 'settings'">Visibility</button>
      <button :class="['tab', activeTab === 'contributions' && 'tab-active']" @click="activeTab = 'contributions'">Contributions</button>
    </div>

    <!-- Visibility Settings -->
    <div v-if="activeTab === 'settings'" class="section">
      <h3>Journey Page Visibility</h3>
      <p class="hint">Toggle which tabs are visible on the Journey page. When turned off, the tab won't show for visitors.</p>

      <div class="toggle-row">
        <label class="toggle">
          <input type="checkbox" v-model="showBlog" />
          <span class="toggle-slider"></span>
        </label>
        <span class="toggle-label">Show Blog tab</span>
      </div>

      <div class="toggle-row">
        <label class="toggle">
          <input type="checkbox" v-model="showContributions" />
          <span class="toggle-slider"></span>
        </label>
        <span class="toggle-label">Show Contributions tab</span>
      </div>

      <button class="btn-primary" @click="saveToggles">Save Settings</button>
    </div>

    <!-- Contributions Management -->
    <div v-if="activeTab === 'contributions'" class="section">
      <h3>Contributions</h3>

      <div class="items-list">
        <div v-for="item in contributions" :key="item.id" class="item-row">
          <div class="item-info">
            <p class="item-title">{{ item.title }}</p>
            <p class="item-meta" v-if="item.type || item.date">{{ item.type }} {{ item.date ? `• ${item.date}` : '' }}</p>
            <p class="item-desc" v-if="item.description">{{ item.description.slice(0, 80) }}</p>
          </div>
          <button class="btn-xs btn-danger-xs" @click="deleteContribution(item.id)">✕</button>
        </div>
        <p v-if="!contributions.length" class="empty">No contributions yet.</p>
      </div>

      <div class="add-form">
        <h4>Add Contribution</h4>
        <input v-model="newTitle" class="field-input" placeholder="Title (e.g. 'Apache Spark PR #1234')" />
        <input v-model="newDesc" class="field-input" placeholder="Description (optional)" />
        <input v-model="newUrl" class="field-input" placeholder="URL (optional)" />
        <div class="add-form-row">
          <select v-model="newType" class="field-input" style="max-width:200px">
            <option value="open-source">Open Source</option>
            <option value="talk">Talk / Presentation</option>
            <option value="article">Article</option>
            <option value="community">Community</option>
          </select>
          <input v-model="newDate" class="field-input" placeholder="Date (e.g. 2025-03)" style="max-width:160px" />
        </div>
        <button class="btn-primary btn-sm-primary" @click="addContribution">+ Add</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tabs { display: flex; gap: 0; margin-bottom: 24px; background: #0f1117; border-radius: 8px; padding: 4px; width: fit-content; }
.tab { padding: 8px 20px; border: none; background: transparent; border-radius: 6px; font-weight: 600; font-size: 0.85rem; color: #8892b0; cursor: pointer; }
.tab-active { background: #4fa3ff; color: #fff; }

.section { background: #1a1d2e; border: 1px solid #2e3250; border-radius: 12px; padding: 24px; }
.section h3 { color: #fff; margin-bottom: 12px; }
.section h4 { color: #c9d1e8; font-size: 0.85rem; margin-bottom: 10px; }
.hint { font-size: 0.8rem; color: #6b7394; margin-bottom: 20px; }

.toggle-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.toggle-label { color: #c9d1e8; font-size: 0.9rem; }
.toggle { position: relative; width: 44px; height: 24px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #2e3250; border-radius: 24px; transition: 0.3s; }
.toggle-slider::before { content: ""; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.3s; }
.toggle input:checked + .toggle-slider { background: #4fa3ff; }
.toggle input:checked + .toggle-slider::before { transform: translateX(20px); }

.items-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.item-row { display: flex; align-items: center; gap: 12px; background: #0f1117; border: 1px solid #2e3250; border-radius: 8px; padding: 12px 16px; }
.item-info { flex: 1; }
.item-title { font-size: 0.85rem; color: #fff; font-weight: 600; }
.item-meta { font-size: 0.7rem; color: #6b7394; margin-top: 2px; }
.item-desc { font-size: 0.75rem; color: #8892b0; margin-top: 4px; }

.add-form { border-top: 1px solid #2e3250; padding-top: 16px; display: flex; flex-direction: column; gap: 10px; }
.add-form-row { display: flex; gap: 10px; }

.field-input { background: #0f1117; border: 1px solid #2e3250; border-radius: 6px; padding: 9px 12px; color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; width: 100%; }
.field-input:focus { border-color: #4fa3ff; }

.btn-primary { background: #4fa3ff; color: #fff; border: none; border-radius: 8px; padding: 9px 20px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #3b8de6; }
.btn-sm-primary { align-self: flex-start; }
.btn-xs { padding: 4px 8px; font-size: 0.7rem; border-radius: 4px; border: 1px solid #2e3250; background: transparent; color: #8892b0; cursor: pointer; }
.btn-danger-xs { color: #ff4d6d; border-color: #5c1a2a; }

.msg { font-size: 0.85rem; color: #22c55e; margin-bottom: 16px; }
.msg-error { color: #ff4d6d; }
.empty { color: #6b7394; font-size: 0.8rem; font-style: italic; }
</style>
