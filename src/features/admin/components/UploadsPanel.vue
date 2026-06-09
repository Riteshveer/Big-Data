<script setup lang="ts">
import { ref, onMounted } from "vue";
import { api, uploadFile } from "../composables/useApi";

interface Upload {
  id: number;
  filename: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

const uploads = ref<Upload[]>([]);
const loading = ref(true);
const uploading = ref(false);
const message = ref("");
const dragOver = ref(false);

const load = async () => {
  loading.value = true;
  try {
    uploads.value = await api("/api/admin/uploads");
  } catch (e: any) {
    message.value = e.message;
  }
  loading.value = false;
};

const handleFiles = async (files: FileList | null) => {
  if (!files || files.length === 0) return;
  uploading.value = true;
  message.value = "";

  try {
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
    message.value = `${files.length} file(s) uploaded!`;
    await load();
    setTimeout(() => (message.value = ""), 3000);
  } catch (e: any) {
    message.value = `Error: ${e.message}`;
  }
  uploading.value = false;
};

const handleDrop = (e: DragEvent) => {
  dragOver.value = false;
  handleFiles(e.dataTransfer?.files || null);
};

const handleInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  handleFiles(input.files);
  input.value = "";
};

const deleteUpload = async (id: number) => {
  if (!confirm("Delete this file?")) return;
  try {
    await api(`/api/admin/uploads/${id}`, { method: "DELETE" });
    await load();
  } catch (e: any) {
    message.value = `Error: ${e.message}`;
  }
};

const copyUrl = (url: string) => {
  navigator.clipboard.writeText(url);
  message.value = "URL copied!";
  setTimeout(() => (message.value = ""), 2000);
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

onMounted(load);
</script>

<template>
  <div class="uploads-panel">
    <!-- Drop zone -->
    <div
      class="dropzone"
      :class="{ 'dropzone-active': dragOver, 'dropzone-uploading': uploading }"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="handleDrop"
    >
      <p v-if="uploading">Uploading...</p>
      <p v-else>Drop files here or <label class="dropzone-browse">browse<input type="file" multiple @change="handleInput" hidden /></label></p>
    </div>

    <p v-if="message" :class="['msg', message.startsWith('Error') && 'msg-error']">{{ message }}</p>

    <!-- Files grid -->
    <div v-if="loading" class="loading">Loading uploads...</div>
    <div v-else class="uploads-grid">
      <div v-for="upload in uploads" :key="upload.id" class="upload-card">
        <div class="upload-preview">
          <img v-if="upload.mime_type?.startsWith('image/')" :src="upload.url" :alt="upload.filename" />
          <span v-else class="upload-icon">📄</span>
        </div>
        <div class="upload-info">
          <p class="upload-name">{{ upload.filename }}</p>
          <p class="upload-meta">{{ formatSize(upload.size_bytes) }}</p>
        </div>
        <div class="upload-actions">
          <button class="btn-sm" @click="copyUrl(upload.url)">Copy URL</button>
          <button class="btn-sm btn-danger" @click="deleteUpload(upload.id)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropzone {
  border: 2px dashed #2e3250;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  color: #8892b0;
  margin-bottom: 24px;
  transition: all 0.2s;
}

.dropzone-active {
  border-color: #4fa3ff;
  background: rgba(79, 163, 255, 0.05);
}

.dropzone-uploading {
  opacity: 0.6;
}

.dropzone-browse {
  color: #4fa3ff;
  cursor: pointer;
  text-decoration: underline;
}

.uploads-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.upload-card {
  background: #1a1d2e;
  border: 1px solid #2e3250;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-preview {
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  background: #0f1117;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-icon {
  font-size: 2rem;
}

.upload-name {
  font-size: 0.8rem;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-meta {
  font-size: 0.7rem;
  color: #6b7394;
}

.upload-actions {
  display: flex;
  gap: 6px;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.7rem;
  border-radius: 5px;
  border: 1px solid #2e3250;
  background: transparent;
  color: #8892b0;
  cursor: pointer;
}

.btn-sm:hover { background: #1e2235; color: #fff; }
.btn-danger { color: #ff4d6d; border-color: #5c1a2a; }
.btn-danger:hover { background: #3b1020; }

.msg { font-size: 0.85rem; color: #22c55e; margin-bottom: 16px; }
.msg-error { color: #ff4d6d; }
.loading { color: #8892b0; }
</style>
