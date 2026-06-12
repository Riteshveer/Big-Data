<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { api, uploadFile } from "../composables/useApi";

interface ChapterImage {
  url: string;
  caption: string;
}

interface Chapter {
  id: string;
  order: number;
  year: string;
  title: string;
  story: string;
  mindsetShift: string | null;
  skills: string[];
  images: ChapterImage[];
  visible: boolean;
}

const chapters = ref<Chapter[]>([]);
const loading = ref(true);
const message = ref("");

// Edit panel state
const panelOpen = ref(false);
const editingChapter = ref<Chapter | null>(null);
const isNew = ref(false);

// Form fields
const formYear = ref("");
const formTitle = ref("");
const formStory = ref("");
const formMindset = ref("");
const formMindsetEnabled = ref(false);
const formSkills = ref<string[]>([]);
const formSkillInput = ref("");
const formImages = ref<ChapterImage[]>([]);
const formVisible = ref(true);
const uploadingImg = ref(false);

// Skill suggestions
const allSkills = ["Python", "PySpark", "Spark", "SQL", "Pandas", "Kafka", "Airflow", "Hadoop", "Hive", "Spark SQL", "Matplotlib", "Scikit-learn", "dbt", "Flink", "BigQuery", "Postgres", "Cloudflare D1", "System Design", "Docker", "Kubernetes", "TensorFlow", "NumPy", "Excel", "Seaborn", "Spark Streaming"];
const showSuggestions = ref(false);
const filteredSkills = computed(() => {
  if (!formSkillInput.value) return [];
  const q = formSkillInput.value.toLowerCase();
  return allSkills.filter(s => s.toLowerCase().includes(q) && !formSkills.value.includes(s)).slice(0, 5);
});

// Load chapters from settings
const load = async () => {
  loading.value = true;
  try {
    const settings = await api("/api/settings");
    if (settings.journey_chapters) {
      chapters.value = JSON.parse(settings.journey_chapters);
    }
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
  loading.value = false;
};

// Save all chapters to settings
const saveAll = async () => {
  try {
    await api("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ journey_chapters: JSON.stringify(chapters.value) }),
    });
    showMsg("Chapters saved!");
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

// Open panel for new chapter
const addChapter = () => {
  isNew.value = true;
  editingChapter.value = null;
  formYear.value = "";
  formTitle.value = "";
  formStory.value = "";
  formMindset.value = "";
  formMindsetEnabled.value = false;
  formSkills.value = [];
  formSkillInput.value = "";
  formImages.value = [];
  formVisible.value = true;
  panelOpen.value = true;
};

// Open panel for editing
const editChapter = (ch: Chapter) => {
  isNew.value = false;
  editingChapter.value = ch;
  formYear.value = ch.year;
  formTitle.value = ch.title;
  formStory.value = ch.story;
  formMindset.value = ch.mindsetShift || "";
  formMindsetEnabled.value = !!ch.mindsetShift;
  formSkills.value = [...ch.skills];
  formSkillInput.value = "";
  formImages.value = [...ch.images];
  formVisible.value = ch.visible;
  panelOpen.value = true;
};

// Save chapter from panel
const saveChapter = async () => {
  if (!formYear.value.trim() || !formTitle.value.trim()) { showMsg("Error: Year and title required"); return; }

  const chapter: Chapter = {
    id: editingChapter.value?.id || `ch_${Date.now()}`,
    order: editingChapter.value?.order || chapters.value.length,
    year: formYear.value.trim(),
    title: formTitle.value.trim(),
    story: formStory.value.trim(),
    mindsetShift: formMindsetEnabled.value && formMindset.value.trim() ? formMindset.value.trim() : null,
    skills: formSkills.value,
    images: formImages.value,
    visible: formVisible.value,
  };

  if (isNew.value) {
    chapters.value.push(chapter);
  } else {
    const idx = chapters.value.findIndex(c => c.id === chapter.id);
    if (idx !== -1) chapters.value[idx] = chapter;
  }

  await saveAll();
  panelOpen.value = false;
};

const deleteChapter = async (id: string) => {
  if (!confirm("Delete this chapter?")) return;
  chapters.value = chapters.value.filter(c => c.id !== id);
  await saveAll();
};

// Reorder
const moveChapter = async (idx: number, direction: number) => {
  const target = idx + direction;
  if (target < 0 || target >= chapters.value.length) return;
  const temp = chapters.value[idx]!;
  chapters.value[idx] = chapters.value[target]!;
  chapters.value[target] = temp;
  // Update orders
  chapters.value.forEach((c, i) => c.order = i);
  await saveAll();
};

// Skills
const addSkill = (skill?: string) => {
  const s = (skill || formSkillInput.value).trim();
  if (s && !formSkills.value.includes(s)) {
    formSkills.value.push(s);
  }
  formSkillInput.value = "";
  showSuggestions.value = false;
};

const removeSkill = (idx: number) => { formSkills.value.splice(idx, 1); };

const handleSkillKey = (e: KeyboardEvent) => {
  if (e.key === "Enter") { e.preventDefault(); addSkill(); }
};

// Images
const handleImageUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length || formImages.value.length >= 3) return;
  uploadingImg.value = true;
  try {
    const result = await uploadFile(input.files[0]!);
    formImages.value.push({ url: result.url, caption: "" });
  } catch (err: any) { showMsg(`Error: ${err.message}`); }
  uploadingImg.value = false;
  input.value = "";
};

const removeImage = (idx: number) => { formImages.value.splice(idx, 1); };

const toggleVisibility = async (ch: Chapter) => {
  ch.visible = !ch.visible;
  await saveAll();
};

const visibleCount = computed(() => chapters.value.filter(c => c.visible).length);

const showMsg = (msg: string) => { message.value = msg; setTimeout(() => (message.value = ""), 4000); };

onMounted(load);
</script>

<template>
  <div class="chp-manager">
    <div class="chp-header">
      <div>
        <span class="chp-count">{{ chapters.length }} chapters · {{ visibleCount }} visible</span>
      </div>
      <button class="chp-btn-add" @click="addChapter">+ Add New Chapter</button>
    </div>
    <p v-if="message" :class="['msg', message.startsWith('Error') && 'msg-error']">{{ message }}</p>

    <div v-if="loading" class="chp-loading">Loading...</div>

    <!-- Chapter List -->
    <div v-else class="chp-list">
      <div v-for="(ch, idx) in chapters" :key="ch.id" class="chp-row">
        <div class="chp-row-handle">
          <button class="btn-move" @click="moveChapter(idx, -1)" :disabled="idx === 0">↑</button>
          <button class="btn-move" @click="moveChapter(idx, 1)" :disabled="idx === chapters.length - 1">↓</button>
        </div>
        <span class="chp-row-year">{{ ch.year }}</span>
        <span class="chp-row-title">{{ ch.title }}</span>
        <label class="chp-toggle">
          <input type="checkbox" :checked="ch.visible" @change="toggleVisibility(ch)" />
          <span class="chp-toggle-slider"></span>
        </label>
        <button class="btn-edit" @click="editChapter(ch)">Edit</button>
        <button class="btn-del" @click="deleteChapter(ch.id)">✕</button>
      </div>
      <p v-if="!chapters.length" class="chp-empty">No chapters yet — add your first year to get started →</p>
    </div>

    <!-- Slide-in Panel -->
    <div v-if="panelOpen" class="chp-overlay" @click.self="panelOpen = false">
      <div class="chp-panel">
        <h3>{{ isNew ? 'Add Chapter' : 'Edit Chapter' }}</h3>

        <div class="chp-field">
          <label>Year</label>
          <input v-model="formYear" class="chp-input" placeholder="e.g., 2021 or 2023–2024" />
        </div>

        <div class="chp-field">
          <label>Title <span class="chp-charcount">{{ formTitle.length }} / 60</span></label>
          <input v-model="formTitle" class="chp-input" maxlength="60" placeholder="e.g., The First Spark" />
        </div>

        <div class="chp-field">
          <label>Story <span class="chp-charcount" :class="{ 'chp-charcount-warn': formStory.length > 500 }">{{ formStory.length }} / 600</span></label>
          <textarea v-model="formStory" class="chp-input chp-textarea" maxlength="600" rows="5" placeholder="Tell the story of this year honestly..."></textarea>
        </div>

        <div class="chp-field">
          <label class="chp-toggle-inline">
            <input type="checkbox" v-model="formMindsetEnabled" />
            <span>Include mindset shift</span>
          </label>
          <div v-if="formMindsetEnabled" class="chp-mindset-input">
            <span>💡</span>
            <input v-model="formMindset" class="chp-input" maxlength="120" placeholder="How your thinking changed..." />
            <span class="chp-charcount">{{ formMindset.length }} / 120</span>
          </div>
        </div>

        <div class="chp-field">
          <label>Skills</label>
          <div class="chp-skills-wrap">
            <span v-for="(skill, sIdx) in formSkills" :key="sIdx" class="chp-skill-badge">
              {{ skill }} <button @click="removeSkill(sIdx)">×</button>
            </span>
          </div>
          <div class="chp-skill-input-wrap">
            <input v-model="formSkillInput" class="chp-input" placeholder="Type skill + Enter" @keydown="handleSkillKey" @focus="showSuggestions = true" @blur="setTimeout(() => showSuggestions = false, 200)" />
            <div v-if="showSuggestions && filteredSkills.length" class="chp-suggestions">
              <div v-for="s in filteredSkills" :key="s" class="chp-suggestion" @mousedown.prevent="addSkill(s)">{{ s }}</div>
            </div>
          </div>
        </div>

        <div class="chp-field">
          <label>Images ({{ formImages.length }} / 3)</label>
          <div class="chp-images">
            <div v-for="(img, iIdx) in formImages" :key="iIdx" class="chp-img-slot">
              <img :src="img.url" class="chp-img-preview" />
              <input v-model="img.caption" class="chp-input chp-img-caption" placeholder="Caption" />
              <button class="btn-del-sm" @click="removeImage(iIdx)">×</button>
            </div>
          </div>
          <label v-if="formImages.length < 3" class="chp-upload-btn">
            {{ uploadingImg ? "Uploading..." : "+ Add Image" }}
            <input type="file" accept="image/*" @change="handleImageUpload" hidden />
          </label>
        </div>

        <div class="chp-field">
          <label class="chp-toggle-inline">
            <input type="checkbox" v-model="formVisible" />
            <span>Visible on Journey page</span>
          </label>
        </div>

        <div class="chp-panel-footer">
          <button class="chp-btn-save" @click="saveChapter">Save Chapter</button>
          <button class="chp-btn-cancel" @click="panelOpen = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chp-manager { color: #e0e0e0; }
.chp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.chp-count { font-size: 0.8rem; color: #6b7394; }
.chp-btn-add { background: #00ffff; color: #0a0a0f; border: none; border-radius: 8px; padding: 9px 18px; font-size: 0.85rem; font-weight: 700; cursor: pointer; }
.chp-btn-add:hover { background: #00e0e0; }
.chp-loading { color: #6b7394; }

.chp-list { display: flex; flex-direction: column; gap: 8px; }
.chp-row { display: flex; align-items: center; gap: 12px; background: #1a1d2e; border: 1px solid #2e3250; border-radius: 10px; padding: 12px 16px; }
.chp-row-handle { display: flex; flex-direction: column; gap: 2px; }
.btn-move { background: none; border: 1px solid #2e3250; color: #8892b0; width: 22px; height: 18px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; }
.btn-move:disabled { opacity: 0.3; }
.chp-row-year { font-family: "Bebas Neue", sans-serif; font-size: 1rem; color: #ff6b00; background: rgba(255,107,0,0.1); padding: 2px 10px; border-radius: 4px; min-width: 60px; text-align: center; }
.chp-row-title { flex: 1; font-size: 0.9rem; color: #fff; font-weight: 600; }
.btn-edit { background: none; border: 1px solid #1e3a5f; color: #60a5fa; padding: 5px 12px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; }
.btn-edit:hover { background: #1e2a4a; }
.btn-del { background: none; border: 1px solid #5c1a2a; color: #ff4d6d; padding: 5px 8px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; }
.chp-empty { color: #6b7394; font-style: italic; cursor: pointer; }

/* Toggle */
.chp-toggle { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
.chp-toggle input { opacity: 0; width: 0; height: 0; }
.chp-toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #2e3250; border-radius: 20px; transition: 0.3s; }
.chp-toggle-slider::before { content: ""; position: absolute; height: 14px; width: 14px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.3s; }
.chp-toggle input:checked + .chp-toggle-slider { background: #00ffff; }
.chp-toggle input:checked + .chp-toggle-slider::before { transform: translateX(16px); }

/* Overlay + Panel */
.chp-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.6); display: flex; justify-content: flex-end; }
.chp-panel { width: 480px; max-width: 90vw; height: 100%; background: #0d0d14; overflow-y: auto; padding: 28px 24px; animation: slideIn 0.25s ease; }
.chp-panel h3 { color: #fff; margin-bottom: 20px; }

@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

.chp-field { margin-bottom: 18px; }
.chp-field label { display: block; font-size: 0.75rem; color: #8892b0; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 5px; }
.chp-input { background: #1a1d2e; border: 1px solid #2e3250; border-radius: 6px; padding: 9px 12px; color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; width: 100%; }
.chp-input:focus { border-color: #00ffff; }
.chp-textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
.chp-charcount { font-size: 0.7rem; color: #6b7394; float: right; }
.chp-charcount-warn { color: #ff6b00; }

.chp-toggle-inline { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; color: #c9d1e8; }
.chp-toggle-inline input { accent-color: #00ffff; }

.chp-mindset-input { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.chp-mindset-input span:first-child { font-size: 1.1rem; }
.chp-mindset-input .chp-charcount { font-size: 0.65rem; white-space: nowrap; }

/* Skills */
.chp-skills-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.chp-skill-badge { font-size: 0.75rem; padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(0,255,255,0.3); color: #00ffff; background: rgba(0,255,255,0.05); display: flex; align-items: center; gap: 4px; }
.chp-skill-badge button { background: none; border: none; color: #00ffff; cursor: pointer; font-size: 0.9rem; }
.chp-skill-input-wrap { position: relative; }
.chp-suggestions { position: absolute; top: 100%; left: 0; right: 0; background: #1a1d2e; border: 1px solid #00ffff; border-radius: 6px; z-index: 10; margin-top: 4px; }
.chp-suggestion { padding: 8px 12px; font-size: 0.8rem; color: #c9d1e8; cursor: pointer; }
.chp-suggestion:hover { background: #2e3250; }

/* Images */
.chp-images { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.chp-img-slot { position: relative; width: 120px; background: #1a1d2e; border: 1px solid #2e3250; border-radius: 6px; padding: 6px; }
.chp-img-preview { width: 100%; height: 70px; object-fit: cover; border-radius: 4px; }
.chp-img-caption { margin-top: 4px; font-size: 0.7rem; padding: 4px 6px; }
.btn-del-sm { position: absolute; top: 2px; right: 2px; background: #ff4d6d; color: #fff; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; cursor: pointer; }
.chp-upload-btn { display: inline-block; background: #2e3250; color: #c9d1e8; padding: 8px 14px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; }
.chp-upload-btn:hover { background: #3a3f5c; }

/* Footer */
.chp-panel-footer { display: flex; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #2e3250; }
.chp-btn-save { background: #00ffff; color: #0a0a0f; border: none; border-radius: 8px; padding: 10px 20px; font-weight: 700; cursor: pointer; }
.chp-btn-save:hover { background: #00e0e0; }
.chp-btn-cancel { background: none; border: 1px solid #2e3250; color: #8892b0; padding: 10px 20px; border-radius: 8px; cursor: pointer; }

.msg { font-size: 0.85rem; color: #22c55e; margin-bottom: 12px; }
.msg-error { color: #ff4d6d; }
</style>
