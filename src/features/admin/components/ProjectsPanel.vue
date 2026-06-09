<script setup lang="ts">
import { ref, onMounted } from "vue";
import { api, uploadFile, assetUrl } from "../composables/useApi";
import DiagramPanel from "./DiagramPanel.vue";

interface SectionDescription {
  id: number;
  image_id: number;
  title: string | null;
  text: string;
  sort_order: number;
}

interface SectionCodeCell {
  id: number;
  image_id: number;
  title: string | null;
  code: string;
  language: string;
  output: string | null;
  sort_order: number;
}

interface ProjectSection {
  id: number;
  url: string;
  alt: string | null;
  caption: string | null;
  sort_order: number;
  descriptions: SectionDescription[];
  codeCells: SectionCodeCell[];
}

interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  theme: string;
  tags: string[];
  live_url: string | null;
  source_url: string | null;
  poster_url: string | null;
  sort_order: number;
  is_published: number;
}

type ViewMode = "list" | "create" | "edit" | "sections" | "diagram";

const projects = ref<Project[]>([]);
const loading = ref(true);
const viewMode = ref<ViewMode>("list");
const editing = ref<Project | null>(null);
const message = ref("");

// Sections state
const currentProjectId = ref<string | null>(null);
const sections = ref<ProjectSection[]>([]);
const expandedSection = ref<number | null>(null);

// Forms
const emptyProject = { slug: "", title: "", description: "", theme: "light", tags: [] as string[], live_url: null as string | null, source_url: null as string | null, poster_url: null as string | null, sort_order: 0, is_published: 1 };
const newProject = ref({ ...emptyProject });
const tagsInput = ref("");
const uploadingPoster = ref(false);
const uploadingImage = ref(false);

// New description form per section
const newDescTitle = ref("");
const newDescText = ref("");

// Editing description inline
const editingDescId = ref<number | null>(null);
const editDescTitle = ref("");
const editDescText = ref("");

// Code cell form
const newCodeTitle = ref("");
const newCodeContent = ref("");
const newCodeLanguage = ref("python");
const newCodeOutput = ref("");

// Editing code cell
const editingCodeId = ref<number | null>(null);
const editCodeTitle = ref("");
const editCodeContent = ref("");
const editCodeOutput = ref("");

const load = async () => {
  loading.value = true;
  try { projects.value = await api("/api/admin/projects/all"); }
  catch (e: any) { message.value = e.message; }
  loading.value = false;
};

// --- Navigation ---
const goToList = () => { viewMode.value = "list"; editing.value = null; currentProjectId.value = null; expandedSection.value = null; };

const startCreate = () => { viewMode.value = "create"; newProject.value = { ...emptyProject }; tagsInput.value = ""; };

const startEdit = (project: Project) => { editing.value = { ...project }; viewMode.value = "edit"; tagsInput.value = project.tags.join(", "); };

const startSections = async (projectId: string) => {
  currentProjectId.value = projectId;
  viewMode.value = "sections";
  expandedSection.value = null;
  await loadSections(projectId);
};

const startDiagram = (projectId: string) => {
  currentProjectId.value = projectId;
  viewMode.value = "diagram";
};

// --- Project CRUD ---
const saveNew = async () => {
  try {
    const tags = tagsInput.value.split(",").map(t => t.trim()).filter(Boolean);
    await api("/api/admin/projects", { method: "POST", body: JSON.stringify({ ...newProject.value, tags }) });
    showMsg("Project created!");
    goToList(); await load();
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const saveEdit = async () => {
  if (!editing.value) return;
  try {
    const tags = tagsInput.value.split(",").map(t => t.trim()).filter(Boolean);
    await api(`/api/admin/projects/${editing.value.id}`, { method: "PUT", body: JSON.stringify({ ...editing.value, tags }) });
    showMsg("Project updated!");
    goToList(); await load();
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const deleteProject = async (id: string) => {
  if (!confirm("Delete this project and all its sections?")) return;
  try { await api(`/api/admin/projects/${id}`, { method: "DELETE" }); showMsg("Project deleted"); await load(); }
  catch (e: any) { showMsg(`Error: ${e.message}`); }
};

// --- Poster uploads ---
const handlePosterUpload = async (e: Event, target: "edit" | "create") => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  uploadingPoster.value = true;
  try {
    const result = await uploadFile(input.files[0]!);
    if (target === "edit" && editing.value) editing.value.poster_url = result.url;
    else newProject.value.poster_url = result.url;
    showMsg("Poster uploaded!");
  } catch (err: any) { showMsg(`Error: ${err.message}`); }
  uploadingPoster.value = false;
  input.value = "";
};

// --- Sections ---
const loadSections = async (projectId: string) => {
  try {
    const data = await api(`/api/projects/${projectId}`);
    sections.value = (data.images || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  } catch (e: any) { showMsg(e.message); }
};

const addSection = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length || !currentProjectId.value) return;
  uploadingImage.value = true;
  try {
    const result = await uploadFile(input.files[0]!);
    const nextOrder = sections.value.length > 0 ? Math.max(...sections.value.map(s => s.sort_order)) + 1 : 0;
    await api(`/api/admin/projects/${currentProjectId.value}/images`, {
      method: "POST",
      body: JSON.stringify({ url: result.url, alt: `Section ${nextOrder + 1}`, sort_order: nextOrder }),
    });
    showMsg("Section added! Click on it to add descriptions.");
    await loadSections(currentProjectId.value);
    const newSec = sections.value[sections.value.length - 1];
    if (newSec) expandedSection.value = newSec.id;
    // Clear description form for the new section
    newDescTitle.value = "";
    newDescText.value = "";
    editingDescId.value = null;
  } catch (err: any) { showMsg(`Error: ${err.message}`); }
  uploadingImage.value = false;
  input.value = "";
};

const replaceSectionImage = async (e: Event, sectionId: number) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length || !currentProjectId.value) return;
  try {
    const result = await uploadFile(input.files[0]!);
    await api(`/api/admin/projects/${currentProjectId.value}/images/${sectionId}`, {
      method: "PUT", body: JSON.stringify({ url: result.url }),
    });
    showMsg("Image replaced!");
    await loadSections(currentProjectId.value);
  } catch (err: any) { showMsg(`Error: ${err.message}`); }
  input.value = "";
};

const updateSectionTitle = async (sectionId: number, newAlt: string) => {
  if (!currentProjectId.value) return;
  try {
    await api(`/api/admin/projects/${currentProjectId.value}/images/${sectionId}`, {
      method: "PUT", body: JSON.stringify({ alt: newAlt }),
    });
    showMsg("Section title saved!");
    await loadSections(currentProjectId.value);
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const moveSection = async (sectionId: number, direction: number) => {
  if (!currentProjectId.value) return;
  const idx = sections.value.findIndex(s => s.id === sectionId);
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= sections.value.length) return;
  const current = sections.value[idx]!;
  const target = sections.value[targetIdx]!;
  const tempOrder = current.sort_order;
  try {
    await api(`/api/admin/projects/${currentProjectId.value}/images/${current.id}`, { method: "PUT", body: JSON.stringify({ sort_order: target.sort_order }) });
    await api(`/api/admin/projects/${currentProjectId.value}/images/${target.id}`, { method: "PUT", body: JSON.stringify({ sort_order: tempOrder }) });
    await loadSections(currentProjectId.value);
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const deleteSection = async (sectionId: number) => {
  if (!confirm("Delete this section and all its descriptions?") || !currentProjectId.value) return;
  try {
    await api(`/api/admin/projects/${currentProjectId.value}/images/${sectionId}`, { method: "DELETE" });
    if (expandedSection.value === sectionId) expandedSection.value = null;
    await loadSections(currentProjectId.value);
    showMsg("Section deleted");
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

// --- Descriptions ---
const addDescription = async (sectionId: number) => {
  if (!currentProjectId.value || !newDescText.value.trim()) { showMsg("Error: Description text is required"); return; }
  const section = sections.value.find(s => s.id === sectionId);
  const nextOrder = section?.descriptions?.length || 0;
  try {
    await api(`/api/admin/projects/${currentProjectId.value}/images/${sectionId}/descriptions`, {
      method: "POST",
      body: JSON.stringify({ title: newDescTitle.value.trim() || null, text: newDescText.value.trim(), sort_order: nextOrder }),
    });
    newDescTitle.value = "";
    newDescText.value = "";
    showMsg("Description added!");
    await loadSections(currentProjectId.value);
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const startEditDesc = (desc: SectionDescription) => {
  editingDescId.value = desc.id;
  editDescTitle.value = desc.title || "";
  editDescText.value = desc.text;
};

const cancelEditDesc = () => { editingDescId.value = null; };

const saveEditDesc = async (sectionId: number, descId: number) => {
  if (!currentProjectId.value) return;
  try {
    await api(`/api/admin/projects/${currentProjectId.value}/images/${sectionId}/descriptions/${descId}`, {
      method: "PUT", body: JSON.stringify({ title: editDescTitle.value.trim() || null, text: editDescText.value.trim() }),
    });
    editingDescId.value = null;
    showMsg("Description updated!");
    await loadSections(currentProjectId.value);
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const moveDescription = async (sectionId: number, descId: number, direction: number) => {
  if (!currentProjectId.value) return;
  const section = sections.value.find(s => s.id === sectionId);
  if (!section) return;
  const descs = section.descriptions;
  const idx = descs.findIndex(d => d.id === descId);
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= descs.length) return;
  const current = descs[idx]!;
  const target = descs[targetIdx]!;
  const tempOrder = current.sort_order;
  try {
    await api(`/api/admin/projects/${currentProjectId.value}/images/${sectionId}/descriptions/${current.id}`, { method: "PUT", body: JSON.stringify({ sort_order: target.sort_order }) });
    await api(`/api/admin/projects/${currentProjectId.value}/images/${sectionId}/descriptions/${target.id}`, { method: "PUT", body: JSON.stringify({ sort_order: tempOrder }) });
    await loadSections(currentProjectId.value);
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const deleteDescription = async (sectionId: number, descId: number) => {
  if (!confirm("Delete this description?") || !currentProjectId.value) return;
  try {
    await api(`/api/admin/projects/${currentProjectId.value}/images/${sectionId}/descriptions/${descId}`, { method: "DELETE" });
    await loadSections(currentProjectId.value);
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

// --- Code Cells ---
const addCodeCell = async (sectionId: number) => {
  if (!currentProjectId.value || !newCodeContent.value.trim()) { showMsg("Error: Code content is required"); return; }
  const section = sections.value.find(s => s.id === sectionId);
  const nextOrder = (section as any)?.codeCells?.length || 0;
  try {
    await api(`/api/admin/projects/${currentProjectId.value}/images/${sectionId}/code-cells`, {
      method: "POST",
      body: JSON.stringify({ title: newCodeTitle.value.trim() || null, code: newCodeContent.value, language: newCodeLanguage.value, output: newCodeOutput.value.trim() || null, sort_order: nextOrder }),
    });
    newCodeTitle.value = "";
    newCodeContent.value = "";
    newCodeLanguage.value = "python";
    newCodeOutput.value = "";
    showMsg("Code cell added!");
    await loadSections(currentProjectId.value);
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const deleteCodeCell = async (sectionId: number, cellId: number) => {
  if (!confirm("Delete this code cell?") || !currentProjectId.value) return;
  try {
    await api(`/api/admin/projects/${currentProjectId.value}/images/${sectionId}/code-cells/${cellId}`, { method: "DELETE" });
    await loadSections(currentProjectId.value);
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const startEditCode = (cell: SectionCodeCell) => {
  editingCodeId.value = cell.id;
  editCodeTitle.value = cell.title || "";
  editCodeContent.value = cell.code;
  editCodeOutput.value = cell.output || "";
};

const cancelEditCode = () => { editingCodeId.value = null; };

const saveEditCode = async (sectionId: number, cellId: number) => {
  if (!currentProjectId.value) return;
  try {
    await api(`/api/admin/projects/${currentProjectId.value}/images/${sectionId}/code-cells/${cellId}`, {
      method: "PUT", body: JSON.stringify({ title: editCodeTitle.value.trim() || null, code: editCodeContent.value, output: editCodeOutput.value.trim() || null }),
    });
    editingCodeId.value = null;
    showMsg("Code cell updated!");
    await loadSections(currentProjectId.value);
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const toggleSection = (id: number) => {
  expandedSection.value = expandedSection.value === id ? null : id;
  newDescTitle.value = "";
  newDescText.value = "";
  newCodeTitle.value = "";
  newCodeContent.value = "";
  newCodeLanguage.value = "python";
  newCodeOutput.value = "";
  editingDescId.value = null;
};

const showMsg = (msg: string) => { message.value = msg; setTimeout(() => (message.value = ""), 4000); };

onMounted(load);
</script>

<template>
  <div class="projects-panel">
    <div class="panel-header">
      <button v-if="viewMode === 'list'" class="btn-primary" @click="startCreate">+ New Project</button>
      <button v-else-if="viewMode !== 'diagram'" class="btn-secondary" @click="goToList">← Back to Projects</button>
      <p v-if="message" :class="['msg', message.startsWith('Error') && 'msg-error']">{{ message }}</p>
    </div>

    <!-- Create Form -->
    <div v-if="viewMode === 'create'" class="form-card">
      <h3>New Project</h3>
      <div class="form-grid">
        <div class="field"><label>Title</label><input v-model="newProject.title" class="field-input" /></div>
        <div class="field"><label>Slug</label><input v-model="newProject.slug" class="field-input" placeholder="auto-generated if empty" /></div>
        <div class="field full"><label>Description</label><textarea v-model="newProject.description" class="field-input" rows="4" placeholder="Write your project description here in plain text..."></textarea></div>
        <div class="field"><label>Tags (comma separated)</label><input v-model="tagsInput" class="field-input" placeholder="pyspark, kafka" /></div>
        <div class="field"><label>Theme</label><select v-model="newProject.theme" class="field-input"><option value="light">Light</option><option value="dark">Dark</option></select></div>
        <div class="field"><label>Live URL</label><input v-model="newProject.live_url" class="field-input" /></div>
        <div class="field"><label>Source URL</label><input v-model="newProject.source_url" class="field-input" /></div>
        <div class="field"><label>Sort Order</label><input v-model.number="newProject.sort_order" type="number" class="field-input" /></div>
        <div class="field full">
          <label>Banner / Poster</label>
          <div class="upload-row">
            <label class="btn-upload">{{ uploadingPoster ? "Uploading..." : "Upload Banner" }}<input type="file" accept="image/*" @change="(e) => handlePosterUpload(e, 'create')" hidden /></label>
            <span v-if="newProject.poster_url" class="upload-status">✓ Uploaded</span>
          </div>
          <img v-if="newProject.poster_url" :src="assetUrl(newProject.poster_url)" class="poster-preview" />
        </div>
      </div>
      <div class="form-actions"><button class="btn-primary" @click="saveNew">Create</button><button class="btn-secondary" @click="goToList">Cancel</button></div>
    </div>

    <!-- Edit Form -->
    <div v-if="viewMode === 'edit' && editing" class="form-card">
      <h3>Edit: {{ editing.title }}</h3>
      <div class="form-grid">
        <div class="field"><label>Title</label><input v-model="editing.title" class="field-input" /></div>
        <div class="field"><label>Slug</label><input v-model="editing.slug" class="field-input" /></div>
        <div class="field full"><label>Description</label><textarea v-model="editing.description" class="field-input" rows="4" placeholder="Write your project description here in plain text..."></textarea></div>
        <div class="field"><label>Tags (comma separated)</label><input v-model="tagsInput" class="field-input" /></div>
        <div class="field"><label>Theme</label><select v-model="editing.theme" class="field-input"><option value="light">Light</option><option value="dark">Dark</option></select></div>
        <div class="field"><label>Live URL</label><input v-model="editing.live_url" class="field-input" /></div>
        <div class="field"><label>Source URL</label><input v-model="editing.source_url" class="field-input" /></div>
        <div class="field"><label>Sort Order</label><input v-model.number="editing.sort_order" type="number" class="field-input" /></div>
        <div class="field"><label>Published</label><select v-model.number="editing.is_published" class="field-input"><option :value="1">Published</option><option :value="0">Draft</option></select></div>
        <div class="field full">
          <label>Banner / Poster</label>
          <div class="upload-row">
            <label class="btn-upload">{{ uploadingPoster ? "Uploading..." : "Upload Banner" }}<input type="file" accept="image/*" @change="(e) => handlePosterUpload(e, 'edit')" hidden /></label>
            <span v-if="editing.poster_url" class="upload-status">✓ {{ editing.poster_url }}</span>
          </div>
          <img v-if="editing.poster_url" :src="assetUrl(editing.poster_url)" class="poster-preview" />
        </div>
      </div>
      <div class="form-actions"><button class="btn-primary" @click="saveEdit">Save</button><button class="btn-secondary" @click="goToList">Cancel</button></div>
    </div>

    <!-- Sections Manager -->
    <div v-if="viewMode === 'sections' && currentProjectId" class="sections-manager">
      <h3>📸 Project Sections: {{ projects.find(p => p.id === currentProjectId)?.title }}</h3>
      <p class="hint">Each section is an image with multiple descriptions (title + text). Sections render below the project chart on the website. Reorder sections and their descriptions to control the narrative.</p>

      <!-- Add new section -->
      <div class="add-section-area">
        <label class="btn-upload btn-upload-large">
          {{ uploadingImage ? "⏳ Uploading..." : "➕ Add New Section (Upload Image)" }}
          <input type="file" accept="image/*" @change="addSection" hidden :disabled="uploadingImage" />
        </label>
      </div>

      <!-- Section list -->
      <div class="sections-list">
        <div v-for="(section, idx) in sections" :key="section.id" class="section-card" :class="{ expanded: expandedSection === section.id }">
          <!-- Section header -->
          <div class="section-header" @click="toggleSection(section.id)">
            <div class="section-num">{{ idx + 1 }}</div>
            <img :src="assetUrl(section.url)" :alt="section.alt || ''" class="section-thumb" />
            <div class="section-meta">
              <p class="section-name">{{ section.alt || `Section ${idx + 1}` }}</p>
              <p class="section-desc-count">{{ section.descriptions?.length || 0 }} description(s)</p>
            </div>
            <div class="section-actions" @click.stop>
              <button class="btn-sm" @click="moveSection(section.id, -1)" :disabled="idx === 0" title="Move up">↑</button>
              <button class="btn-sm" @click="moveSection(section.id, 1)" :disabled="idx === sections.length - 1" title="Move down">↓</button>
              <button class="btn-sm btn-danger" @click="deleteSection(section.id)" title="Delete section">🗑️</button>
            </div>
            <span class="expand-icon">{{ expandedSection === section.id ? '▼' : '▶' }}</span>
          </div>

          <!-- Expanded section detail -->
          <div v-if="expandedSection === section.id" class="section-detail">
            <!-- Section image & title edit -->
            <div class="section-detail-top">
              <img :src="assetUrl(section.url)" class="section-detail-img" />
              <div class="section-detail-controls">
                <div class="field">
                  <label>Section Title</label>
                  <div class="section-title-row">
                    <input :id="`section-title-${section.id}`" :value="section.alt || ''" class="field-input" placeholder="e.g. Step 1: Data Pipeline" />
                    <button class="btn-save-title" @click="updateSectionTitle(section.id, (document.getElementById(`section-title-${section.id}`) as HTMLInputElement).value)">Save</button>
                  </div>
                </div>
                <label class="btn-upload btn-sm-upload">Replace Image<input type="file" accept="image/*" @change="(e) => replaceSectionImage(e, section.id)" hidden /></label>
              </div>
            </div>

            <!-- Descriptions list -->
            <div class="desc-area">
              <h5>Descriptions (ordered)</h5>
              <div class="desc-list">
                <div v-for="(desc, dIdx) in section.descriptions" :key="desc.id" class="desc-item">
                  <!-- View mode -->
                  <template v-if="editingDescId !== desc.id">
                    <div class="desc-order">{{ dIdx + 1 }}</div>
                    <div class="desc-content">
                      <p class="desc-title" v-if="desc.title"><strong>{{ desc.title }}</strong></p>
                      <p class="desc-text">{{ desc.text.slice(0, 120) }}{{ desc.text.length > 120 ? '...' : '' }}</p>
                    </div>
                    <div class="desc-actions">
                      <button class="btn-xs" @click="moveDescription(section.id, desc.id, -1)" :disabled="dIdx === 0">↑</button>
                      <button class="btn-xs" @click="moveDescription(section.id, desc.id, 1)" :disabled="dIdx === section.descriptions.length - 1">↓</button>
                      <button class="btn-xs btn-edit-xs" @click="startEditDesc(desc)">✏️</button>
                      <button class="btn-xs btn-danger-xs" @click="deleteDescription(section.id, desc.id)">✕</button>
                    </div>
                  </template>
                  <!-- Edit mode -->
                  <template v-else>
                    <div class="desc-edit-form">
                      <input v-model="editDescTitle" class="field-input" placeholder="Title (optional)" />
                      <textarea v-model="editDescText" class="field-input" rows="2" placeholder="Description text"></textarea>
                      <div class="desc-edit-actions">
                        <button class="btn-xs btn-save-xs" @click="saveEditDesc(section.id, desc.id)">Save</button>
                        <button class="btn-xs" @click="cancelEditDesc">Cancel</button>
                      </div>
                    </div>
                  </template>
                </div>
                <p v-if="!section.descriptions?.length" class="empty">No descriptions yet.</p>
              </div>

              <!-- Add description form -->
              <div class="add-desc-form">
                <h6>Add Description</h6>
                <input v-model="newDescTitle" class="field-input" placeholder="Heading / Title (optional)" />
                <textarea v-model="newDescText" class="field-input" rows="2" placeholder="Description text (required)"></textarea>
                <button class="btn-primary btn-sm-primary" @click="addDescription(section.id)">+ Add</button>
              </div>

              <!-- Code Cells -->
              <div class="code-cells-area">
                <h5>💻 Code Cells</h5>
                <div class="desc-list" v-if="(section as any).codeCells?.length">
                  <div v-for="cell in (section as any).codeCells" :key="cell.id" class="desc-item">
                    <!-- View mode -->
                    <template v-if="editingCodeId !== cell.id">
                      <div class="desc-content">
                        <p class="desc-title" v-if="cell.title"><strong>{{ cell.title }}</strong></p>
                        <p class="desc-text">{{ cell.code.slice(0, 80) }}{{ cell.code.length > 80 ? '...' : '' }}</p>
                        <p class="desc-text" v-if="cell.output" style="color:#34d399">↳ {{ cell.output.slice(0, 50) }}</p>
                      </div>
                      <div class="desc-actions">
                        <button class="btn-xs btn-edit-xs" @click="startEditCode(cell)">✏️</button>
                        <button class="btn-xs btn-danger-xs" @click="deleteCodeCell(section.id, cell.id)">✕</button>
                      </div>
                    </template>
                    <!-- Edit mode -->
                    <template v-else>
                      <div class="desc-edit-form">
                        <input v-model="editCodeTitle" class="field-input" placeholder="Cell title (optional)" />
                        <textarea v-model="editCodeContent" class="field-input field-code" rows="6" placeholder="Code"></textarea>
                        <textarea v-model="editCodeOutput" class="field-input" rows="2" placeholder="Output (optional)"></textarea>
                        <div class="desc-edit-actions">
                          <button class="btn-xs btn-save-xs" @click="saveEditCode(section.id, cell.id)">Save</button>
                          <button class="btn-xs" @click="cancelEditCode">Cancel</button>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
                <p v-else class="empty">No code cells yet.</p>

                <!-- Add code cell form -->
                <div class="add-desc-form">
                  <h6>Add Code Cell</h6>
                  <input v-model="newCodeTitle" class="field-input" placeholder="Cell title (optional, e.g. 'Parquet File Read')" />
                  <textarea v-model="newCodeContent" class="field-input field-code" rows="6" placeholder="Paste your code here..."></textarea>
                  <textarea v-model="newCodeOutput" class="field-input" rows="2" placeholder="Output (optional, e.g. 'Total rows: 1,234,567')"></textarea>
                  <button class="btn-primary btn-sm-primary" @click="addCodeCell(section.id)">+ Add Code Cell</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p v-if="!sections.length" class="empty">No sections yet. Upload an image above to create the first section.</p>
      </div>
    </div>

    <!-- Diagram Manager -->
    <DiagramPanel v-if="viewMode === 'diagram' && currentProjectId" :projectId="currentProjectId" @back="goToList" />

    <!-- Projects List -->
    <div v-if="viewMode === 'list' && loading" class="loading">Loading...</div>
    <div v-if="viewMode === 'list' && !loading" class="project-list">
      <div v-for="project in projects" :key="project.id" class="project-card">
        <div class="project-card-info">
          <h4>{{ project.title }}</h4>
          <div class="project-card-meta">
            <span class="badge" :class="project.is_published ? 'badge-green' : 'badge-yellow'">{{ project.is_published ? "Published" : "Draft" }}</span>
            <span class="badge badge-blue">{{ project.theme }}</span>
            <span v-if="project.poster_url" class="badge badge-purple">Has Banner</span>
            <span v-for="tag in project.tags.slice(0, 3)" :key="tag" class="badge badge-gray">{{ tag }}</span>
          </div>
        </div>
        <div class="project-card-actions">
          <button class="btn-sm" @click="startEdit(project)">Edit</button>
          <button class="btn-sm btn-sections" @click="startSections(project.id)">📸 Sections</button>
          <button class="btn-sm btn-chart" @click="startDiagram(project.id)">📊 Chart</button>
          <button class="btn-sm btn-danger" @click="deleteProject(project.id)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.hint { font-size: 0.8rem; color: #6b7394; margin-bottom: 20px; line-height: 1.5; }

.form-card { background: #1a1d2e; border: 1px solid #2e3250; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
.form-card h3 { color: #fff; margin-bottom: 16px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-grid .full { grid-column: 1 / -1; }
.form-actions { display: flex; gap: 12px; margin-top: 20px; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 0.75rem; color: #8892b0; text-transform: uppercase; letter-spacing: 0.04em; }
.field-input { background: #0f1117; border: 1px solid #2e3250; border-radius: 6px; padding: 9px 12px; color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; }
.field-input:focus { border-color: #4fa3ff; }

.upload-row { display: flex; align-items: center; gap: 12px; }
.btn-upload { display: inline-block; background: #2e3250; color: #c9d1e8; padding: 9px 16px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: background 0.2s; }
.btn-upload:hover { background: #3a3f5c; }
.btn-upload-large { padding: 14px 28px; font-size: 0.95rem; background: #1e3a5f; color: #60a5fa; border-radius: 10px; }
.btn-upload-large:hover { background: #264a73; }
.btn-sm-upload { font-size: 0.75rem; padding: 6px 12px; margin-top: 8px; }
.upload-status { font-size: 0.75rem; color: #34d399; }
.poster-preview { margin-top: 10px; max-width: 200px; max-height: 120px; border-radius: 6px; border: 1px solid #2e3250; object-fit: cover; }

/* Sections Manager */
.sections-manager h3 { color: #fff; margin-bottom: 8px; }
.add-section-area { margin-bottom: 24px; text-align: center; padding: 20px; border: 1px dashed #2e3250; border-radius: 12px; background: #0f1117; }

.sections-list { display: flex; flex-direction: column; gap: 12px; }

.section-card { background: #1a1d2e; border: 1px solid #2e3250; border-radius: 12px; overflow: hidden; transition: border-color 0.15s; }
.section-card:hover { border-color: #3a3f5c; }
.section-card.expanded { border-color: #4fa3ff; }

.section-header { display: flex; align-items: center; gap: 12px; padding: 14px 18px; cursor: pointer; }
.section-num { font-size: 1.1rem; font-weight: 700; color: #4fa3ff; background: #1e2a4a; border-radius: 6px; min-width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; }
.section-thumb { width: 64px; height: 42px; object-fit: cover; border-radius: 6px; flex-shrink: 0; border: 1px solid #2e3250; }
.section-meta { flex: 1; min-width: 0; }
.section-name { font-size: 0.85rem; color: #fff; font-weight: 600; }
.section-desc-count { font-size: 0.7rem; color: #6b7394; }
.section-actions { display: flex; gap: 4px; }
.expand-icon { color: #6b7394; font-size: 0.75rem; margin-left: 8px; }

.section-detail { padding: 0 18px 18px; border-top: 1px solid #2e3250; }
.section-detail-top { display: flex; gap: 16px; padding-top: 16px; margin-bottom: 20px; }
.section-detail-img { width: 160px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #2e3250; flex-shrink: 0; }
.section-detail-controls { flex: 1; display: flex; flex-direction: column; gap: 8px; }

.section-title-row { display: flex; gap: 8px; align-items: center; }
.section-title-row .field-input { flex: 1; }
.btn-save-title { background: #4fa3ff; color: #fff; border: none; border-radius: 6px; padding: 8px 14px; font-size: 0.8rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
.btn-save-title:hover { background: #3b8de6; }

/* Descriptions */
.desc-area h5 { color: #c9d1e8; font-size: 0.85rem; margin-bottom: 10px; }
.desc-area h6 { color: #8892b0; font-size: 0.75rem; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em; }
.desc-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }

.desc-item { display: flex; align-items: flex-start; gap: 10px; background: #0f1117; border: 1px solid #2e3250; border-radius: 8px; padding: 10px 14px; }
.desc-order { font-size: 0.8rem; font-weight: 700; color: #8892b0; min-width: 20px; padding-top: 2px; }
.desc-content { flex: 1; min-width: 0; }
.desc-title { font-size: 0.8rem; color: #fff; margin-bottom: 2px; }
.desc-text { font-size: 0.75rem; color: #6b7394; line-height: 1.4; }
.desc-actions { display: flex; gap: 3px; flex-shrink: 0; }

.desc-edit-form { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.desc-edit-actions { display: flex; gap: 6px; }

.add-desc-form { border-top: 1px solid #2e3250; padding-top: 14px; display: flex; flex-direction: column; gap: 8px; }

/* Buttons */
.btn-primary { background: #4fa3ff; color: #fff; border: none; border-radius: 8px; padding: 9px 20px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #3b8de6; }
.btn-sm-primary { padding: 7px 14px; font-size: 0.8rem; align-self: flex-start; }
.btn-secondary { background: transparent; color: #8892b0; border: 1px solid #2e3250; border-radius: 8px; padding: 9px 20px; font-size: 0.85rem; cursor: pointer; }

.btn-sm { padding: 6px 10px; font-size: 0.75rem; border-radius: 6px; border: 1px solid #2e3250; background: transparent; color: #8892b0; cursor: pointer; }
.btn-sm:hover { background: #1e2235; color: #fff; }
.btn-sm:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-sections { color: #60a5fa; border-color: #1e3a5f; }
.btn-sections:hover { background: #1e2a4a; }
.btn-chart { color: #fbbf24; border-color: #451a03; }
.btn-chart:hover { background: #2a1a00; }
.btn-danger { color: #ff4d6d; border-color: #5c1a2a; }
.btn-danger:hover { background: #3b1020; }

.btn-xs { padding: 4px 8px; font-size: 0.7rem; border-radius: 4px; border: 1px solid #2e3250; background: transparent; color: #8892b0; cursor: pointer; }
.btn-xs:hover { background: #1e2235; color: #fff; }
.btn-xs:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-edit-xs { color: #fbbf24; border-color: #451a03; }
.btn-danger-xs { color: #ff4d6d; border-color: #5c1a2a; }
.btn-save-xs { color: #34d399; border-color: #064e3b; }

/* Project list */
.project-list { display: flex; flex-direction: column; gap: 12px; }
.project-card { background: #1a1d2e; border: 1px solid #2e3250; border-radius: 10px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; }
.project-card-info h4 { color: #fff; margin-bottom: 6px; }
.project-card-meta { display: flex; gap: 6px; flex-wrap: wrap; }
.project-card-actions { display: flex; gap: 8px; }

.badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
.badge-green { background: #064e3b; color: #34d399; }
.badge-yellow { background: #451a03; color: #fbbf24; }
.badge-blue { background: #1e3a5f; color: #60a5fa; }
.badge-purple { background: #3b1a5e; color: #c084fc; }
.badge-gray { background: #1e2235; color: #8892b0; }

.msg { font-size: 0.85rem; color: #22c55e; }
.msg-error { color: #ff4d6d; }
.loading { color: #8892b0; }
.empty { color: #6b7394; font-size: 0.8rem; font-style: italic; }

.code-cells-area { border-top: 1px solid #2e3250; padding-top: 14px; margin-top: 14px; }
.code-cells-area h5 { color: #c9d1e8; font-size: 0.85rem; margin-bottom: 10px; }
.field-code { font-family: "Consolas", "Monaco", "Courier New", monospace; font-size: 0.8rem; white-space: pre; }
</style>
