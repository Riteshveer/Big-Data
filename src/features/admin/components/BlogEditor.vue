<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Code from "@editorjs/code";
import Delimiter from "@editorjs/delimiter";
import Quote from "@editorjs/quote";
import Warning from "@editorjs/warning";
import { api, uploadFile } from "../composables/useApi";

interface BlogPost {
  id?: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[];
  is_published: number;
  published_at: string | null;
}

const emit = defineEmits<{ (e: "saved"): void; (e: "back"): void }>();
const props = defineProps<{ postSlug?: string | null }>();

const title = ref("");
const slug = ref("");
const excerpt = ref("");
const coverUrl = ref("");
const tagsInput = ref("");
const status = ref<"draft" | "published">("draft");
const message = ref("");
const saving = ref(false);
const uploadingCover = ref(false);

let editor: EditorJS | null = null;
const editorRef = ref<HTMLElement | null>(null);
const isEdit = ref(false);

// Auto-generate slug from title
watch(title, (val) => {
  if (!isEdit.value) {
    slug.value = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
});

// Image upload tool configuration
class ImageTool {
  static get toolbox() {
    return { title: "Image", icon: '<svg width="17" height="15" viewBox="0 0 336 276"><path d="M291 150.242V79c0-11.046-8.954-20-20-20H66c-11.046 0-20 8.954-20 20v42.242l67.526-67.526a15 15 0 0 1 21.213 0L191 109.977l56.263-56.263a15 15 0 0 1 21.213 0L291 76.236z"></path></svg>' };
  }

  data: any;
  wrapper: HTMLElement | null = null;

  constructor({ data }: any) {
    this.data = data || {};
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("editorjs-image-block");

    if (this.data.url) {
      this._createImage(this.data.url, this.data.caption);
    } else {
      this._createUploader();
    }

    return this.wrapper;
  }

  _createUploader() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";

    const btn = document.createElement("button");
    btn.textContent = "📷 Upload Image";
    btn.className = "editorjs-img-btn";
    btn.onclick = () => input.click();

    input.onchange = async () => {
      if (!input.files?.length) return;
      btn.textContent = "Uploading...";
      try {
        const result = await uploadFile(input.files[0]!);
        this.data.url = result.url;
        this.wrapper!.innerHTML = "";
        this._createImage(result.url, "");
      } catch {
        btn.textContent = "Upload failed. Try again.";
      }
    };

    this.wrapper!.appendChild(btn);
    this.wrapper!.appendChild(input);
  }

  _createImage(url: string, caption: string) {
    const img = document.createElement("img");
    img.src = url;
    img.style.maxWidth = "100%";
    img.style.borderRadius = "8px";

    const cap = document.createElement("input");
    cap.placeholder = "Image caption (optional)";
    cap.value = caption || "";
    cap.className = "editorjs-img-caption";
    cap.onchange = () => { this.data.caption = cap.value; };

    this.wrapper!.appendChild(img);
    this.wrapper!.appendChild(cap);
  }

  save() {
    return { url: this.data.url || "", caption: this.data.caption || "" };
  }

  validate(savedData: any) {
    return !!savedData.url;
  }
}

const initEditor = (data?: any) => {
  if (!editorRef.value) return;

  editor = new EditorJS({
    holder: editorRef.value,
    placeholder: "Start writing your blog post...",
    tools: {
      header: { class: Header as any, config: { levels: [2, 3, 4], defaultLevel: 2 } },
      list: { class: List as any, inlineToolbar: true },
      code: { class: Code as any },
      delimiter: Delimiter as any,
      quote: { class: Quote as any, inlineToolbar: true },
      warning: { class: Warning as any, inlineToolbar: true },
      image: ImageTool as any,
    },
    data: data || { blocks: [] },
  });
};

const loadPost = async () => {
  if (!props.postSlug) return;
  try {
    const posts = await api("/api/admin/blog/all");
    const post = posts.find((p: any) => p.slug === props.postSlug);
    if (post) {
      isEdit.value = true;
      title.value = post.title;
      slug.value = post.slug;
      excerpt.value = post.excerpt || "";
      coverUrl.value = post.cover_image_url || "";
      tagsInput.value = (post.tags || []).join(", ");
      status.value = post.is_published ? "published" : "draft";

      // Parse content as Editor.js JSON or plain text
      let editorData = { blocks: [] };
      try {
        const parsed = JSON.parse(post.content);
        if (parsed.blocks) editorData = parsed;
      } catch {
        // Legacy plain text content — wrap in a paragraph block
        if (post.content) {
          editorData = { blocks: [{ type: "paragraph", data: { text: post.content } }] } as any;
        }
      }
      initEditor(editorData);
    }
  } catch (e: any) { message.value = `Error: ${e.message}`; }
};

const handleCoverUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  uploadingCover.value = true;
  try {
    const result = await uploadFile(input.files[0]!);
    coverUrl.value = result.url;
  } catch (err: any) { message.value = `Error: ${err.message}`; }
  uploadingCover.value = false;
  input.value = "";
};

const save = async (publish: boolean) => {
  if (!title.value.trim()) { message.value = "Error: Title required"; return; }
  saving.value = true;

  try {
    const editorData = await editor?.save();
    const content = JSON.stringify(editorData);
    const tags = tagsInput.value.split(",").map(t => t.trim()).filter(Boolean);

    const payload = {
      title: title.value.trim(),
      slug: slug.value.trim(),
      content,
      excerpt: excerpt.value.trim() || null,
      cover_image_url: coverUrl.value.trim() || null,
      tags,
      is_published: publish ? 1 : 0,
    };

    if (isEdit.value) {
      await api(`/api/admin/blog/${props.postSlug}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await api("/api/admin/blog", { method: "POST", body: JSON.stringify(payload) });
      isEdit.value = true;
    }

    message.value = publish ? "Published!" : "Draft saved!";
    setTimeout(() => (message.value = ""), 3000);
    emit("saved");
  } catch (e: any) { message.value = `Error: ${e.message}`; }
  saving.value = false;
};

onMounted(() => {
  if (props.postSlug) {
    loadPost();
  } else {
    initEditor();
  }
});

onUnmounted(() => {
  editor?.destroy();
});
</script>

<template>
  <div class="blog-editor">
    <div class="editor-header">
      <button class="btn-back" @click="emit('back')">← Back</button>
      <h3>{{ isEdit ? 'Edit Post' : 'New Post' }}</h3>
      <div class="editor-actions">
        <p v-if="message" :class="['msg', message.startsWith('Error') && 'msg-error']">{{ message }}</p>
        <button class="btn-draft" @click="save(false)" :disabled="saving">Save Draft</button>
        <button class="btn-publish" @click="save(true)" :disabled="saving">Publish</button>
      </div>
    </div>

    <div class="editor-meta">
      <div class="field">
        <label>Title</label>
        <input v-model="title" class="field-input field-title" placeholder="Blog post title..." />
      </div>
      <div class="field">
        <label>Slug</label>
        <input v-model="slug" class="field-input" placeholder="url-friendly-slug" />
      </div>
      <div class="field">
        <label>Excerpt</label>
        <textarea v-model="excerpt" class="field-input" rows="2" placeholder="Short summary for previews..."></textarea>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Cover Image</label>
          <div class="cover-upload">
            <label class="btn-upload">
              {{ uploadingCover ? "Uploading..." : "Upload Cover" }}
              <input type="file" accept="image/*" @change="handleCoverUpload" hidden />
            </label>
            <input v-model="coverUrl" class="field-input" placeholder="Or paste image URL" style="flex:1" />
          </div>
          <img v-if="coverUrl" :src="coverUrl" class="cover-preview" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Tags (comma separated)</label>
          <input v-model="tagsInput" class="field-input" placeholder="PySpark, ETL, Big Data" />
        </div>
        <div class="field" style="max-width: 160px">
          <label>Status</label>
          <select v-model="status" class="field-input">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
    </div>

    <div class="editor-content">
      <label>Content</label>
      <div ref="editorRef" class="editorjs-container"></div>
    </div>
  </div>
</template>

<style scoped>
.blog-editor { color: #e0e0e0; }

.editor-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.editor-header h3 { color: #fff; margin: 0; flex: 1; }
.editor-actions { display: flex; align-items: center; gap: 10px; }

.editor-meta { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; background: #1a1d2e; border: 1px solid #2e3250; border-radius: 12px; padding: 20px; }
.editor-content { background: #1a1d2e; border: 1px solid #2e3250; border-radius: 12px; padding: 20px; }
.editor-content label { display: block; font-size: 0.75rem; color: #8892b0; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 0.75rem; color: #8892b0; text-transform: uppercase; letter-spacing: 0.04em; }
.field-input { background: #0f1117; border: 1px solid #2e3250; border-radius: 6px; padding: 9px 12px; color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; width: 100%; }
.field-input:focus { border-color: #4fa3ff; }
.field-title { font-size: 1.3rem; font-weight: 700; padding: 12px 14px; }
.field-row { display: flex; gap: 16px; }

.cover-upload { display: flex; gap: 10px; align-items: center; }
.cover-preview { margin-top: 8px; max-width: 240px; max-height: 140px; border-radius: 8px; border: 1px solid #2e3250; object-fit: cover; }

.btn-back { background: transparent; border: 1px solid #2e3250; color: #8892b0; padding: 8px 14px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; }
.btn-back:hover { color: #fff; border-color: #4fa3ff; }
.btn-upload { display: inline-block; background: #2e3250; color: #c9d1e8; padding: 9px 14px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; }
.btn-upload:hover { background: #3a3f5c; }
.btn-draft { background: transparent; border: 1px solid #2e3250; color: #8892b0; padding: 8px 18px; border-radius: 8px; font-size: 0.85rem; cursor: pointer; font-weight: 600; }
.btn-draft:hover { border-color: #4fa3ff; color: #4fa3ff; }
.btn-publish { background: #4fa3ff; color: #fff; border: none; border-radius: 8px; padding: 8px 18px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-publish:hover { background: #3b8de6; }

.msg { font-size: 0.8rem; color: #22c55e; }
.msg-error { color: #ff4d6d; }

/* Editor.js container styling */
.editorjs-container {
  background: #0f1117;
  border: 1px solid #2e3250;
  border-radius: 8px;
  padding: 16px 20px;
  min-height: 300px;
  color: #e0e0e0;
}

:deep(.ce-block__content) { max-width: 100%; }
:deep(.ce-toolbar__content) { max-width: 100%; }
:deep(.cdx-block) { color: #e0e0e0; }
:deep(.ce-paragraph) { color: #e0e0e0; line-height: 1.7; }
:deep(.ce-header) { color: #fff; }
:deep(.cdx-input) { background: #0f1117; border-color: #2e3250; color: #e0e0e0; }
:deep(.ce-code__textarea) { background: #0a0a10; color: #a6e3a1; border: 1px solid #2e3250; border-radius: 6px; font-family: "Consolas", monospace; }
:deep(.cdx-quote__text) { color: #c9d1e8; border-left: 3px solid #4fa3ff; }
:deep(.cdx-warning) { background: #1a1a2e; border: 1px solid #ff6b35; border-radius: 8px; }
:deep(.ce-toolbar__plus) { color: #8892b0; }
:deep(.ce-toolbar__settings-btn) { color: #8892b0; }
:deep(.ce-inline-toolbar) { background: #1a1d2e; border: 1px solid #2e3250; }
:deep(.ce-inline-tool) { color: #c9d1e8; }
:deep(.ce-conversion-toolbar) { background: #1a1d2e; border: 1px solid #2e3250; }
:deep(.ce-conversion-tool) { color: #c9d1e8; }
:deep(.ce-conversion-tool:hover) { background: #2e3250; }
:deep(.ce-popover) { background: #1a1d2e; border: 1px solid #2e3250; }
:deep(.ce-popover-item) { color: #c9d1e8; }
:deep(.ce-popover-item:hover) { background: #2e3250; }
</style>

<style>
/* Global Editor.js image block styles */
.editorjs-image-block { margin: 12px 0; }
.editorjs-img-btn { background: #2e3250; color: #c9d1e8; border: 1px dashed #4fa3ff; padding: 20px 40px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; width: 100%; }
.editorjs-img-btn:hover { background: #3a3f5c; }
.editorjs-img-caption { width: 100%; margin-top: 8px; background: #0f1117; border: 1px solid #2e3250; border-radius: 4px; padding: 6px 10px; color: #c9d1e8; font-size: 0.8rem; outline: none; }
</style>
