<script setup lang="ts">
import { ref, onMounted } from "vue";
import { api } from "../composables/useApi";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  tags: string[];
  is_published: number;
  published_at: string | null;
  created_at: string;
}

const posts = ref<BlogPost[]>([]);
const loading = ref(true);
const editing = ref<BlogPost | null>(null);
const creating = ref(false);
const message = ref("");

const newPost = ref({
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  tags: [] as string[],
  is_published: false,
});
const tagsInput = ref("");

const load = async () => {
  loading.value = true;
  try {
    posts.value = await api("/api/admin/blog/all");
  } catch (e: any) {
    message.value = e.message;
  }
  loading.value = false;
};

const startCreate = () => {
  creating.value = true;
  editing.value = null;
  newPost.value = { title: "", slug: "", content: "", excerpt: "", tags: [], is_published: false };
  tagsInput.value = "";
};

const startEdit = (post: BlogPost) => {
  editing.value = { ...post };
  creating.value = false;
  tagsInput.value = post.tags.join(", ");
};

const saveNew = async () => {
  try {
    const tags = tagsInput.value.split(",").map((t) => t.trim()).filter(Boolean);
    await api("/api/admin/blog", {
      method: "POST",
      body: JSON.stringify({ ...newPost.value, tags }),
    });
    creating.value = false;
    message.value = "Post created!";
    await load();
    setTimeout(() => (message.value = ""), 3000);
  } catch (e: any) {
    message.value = `Error: ${e.message}`;
  }
};

const saveEdit = async () => {
  if (!editing.value) return;
  try {
    const tags = tagsInput.value.split(",").map((t) => t.trim()).filter(Boolean);
    await api(`/api/admin/blog/${editing.value.slug}`, {
      method: "PUT",
      body: JSON.stringify({ ...editing.value, tags }),
    });
    editing.value = null;
    message.value = "Post updated!";
    await load();
    setTimeout(() => (message.value = ""), 3000);
  } catch (e: any) {
    message.value = `Error: ${e.message}`;
  }
};

const deletePost = async (slug: string) => {
  if (!confirm("Delete this post?")) return;
  try {
    await api(`/api/admin/blog/${slug}`, { method: "DELETE" });
    await load();
  } catch (e: any) {
    message.value = `Error: ${e.message}`;
  }
};

const cancel = () => {
  editing.value = null;
  creating.value = false;
};

onMounted(load);
</script>

<template>
  <div class="blog-panel">
    <div class="panel-header">
      <button class="btn-primary" @click="startCreate">+ New Post</button>
      <p v-if="message" :class="['msg', message.startsWith('Error') && 'msg-error']">{{ message }}</p>
    </div>

    <!-- Create Form -->
    <div v-if="creating" class="form-card">
      <h3>New Blog Post</h3>
      <div class="form-stack">
        <div class="field">
          <label>Title</label>
          <input v-model="newPost.title" class="field-input" />
        </div>
        <div class="field">
          <label>Slug</label>
          <input v-model="newPost.slug" class="field-input" placeholder="auto-generated if empty" />
        </div>
        <div class="field">
          <label>Excerpt</label>
          <input v-model="newPost.excerpt" class="field-input" />
        </div>
        <div class="field">
          <label>Tags (comma separated)</label>
          <input v-model="tagsInput" class="field-input" />
        </div>
        <div class="field">
          <label>Content (Markdown/HTML)</label>
          <textarea v-model="newPost.content" class="field-input field-textarea" rows="12"></textarea>
        </div>
        <div class="field-row">
          <label><input type="checkbox" v-model="newPost.is_published" /> Publish immediately</label>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" @click="saveNew">Create</button>
        <button class="btn-secondary" @click="cancel">Cancel</button>
      </div>
    </div>

    <!-- Edit Form -->
    <div v-if="editing" class="form-card">
      <h3>Edit: {{ editing.title }}</h3>
      <div class="form-stack">
        <div class="field">
          <label>Title</label>
          <input v-model="editing.title" class="field-input" />
        </div>
        <div class="field">
          <label>Excerpt</label>
          <input v-model="editing.excerpt" class="field-input" />
        </div>
        <div class="field">
          <label>Tags (comma separated)</label>
          <input v-model="tagsInput" class="field-input" />
        </div>
        <div class="field">
          <label>Content (Markdown/HTML)</label>
          <textarea v-model="editing.content" class="field-input field-textarea" rows="12"></textarea>
        </div>
        <div class="field-row">
          <label><input type="checkbox" :checked="!!editing.is_published" @change="editing!.is_published = ($event.target as HTMLInputElement).checked ? 1 : 0" /> Published</label>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" @click="saveEdit">Save</button>
        <button class="btn-secondary" @click="cancel">Cancel</button>
      </div>
    </div>

    <!-- Posts List -->
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else class="post-list">
      <div v-for="post in posts" :key="post.id" class="post-card">
        <div class="post-info">
          <h4>{{ post.title }}</h4>
          <div class="post-meta">
            <span class="badge" :class="post.is_published ? 'badge-green' : 'badge-yellow'">
              {{ post.is_published ? "Published" : "Draft" }}
            </span>
            <span v-if="post.published_at" class="post-date">{{ new Date(post.published_at).toLocaleDateString() }}</span>
          </div>
        </div>
        <div class="post-actions">
          <button class="btn-sm" @click="startEdit(post)">Edit</button>
          <button class="btn-sm btn-danger" @click="deletePost(post.slug)">Delete</button>
        </div>
      </div>
      <p v-if="!posts.length && !loading" class="empty">No blog posts yet. Create your first one!</p>
    </div>
  </div>
</template>

<style scoped>
.panel-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.form-card {
  background: #1a1d2e;
  border: 1px solid #2e3250;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.form-card h3 { color: #fff; margin-bottom: 16px; }

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field label {
  font-size: 0.75rem;
  color: #8892b0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-row label {
  font-size: 0.85rem;
  color: #c9d1e8;
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-input {
  background: #0f1117;
  border: 1px solid #2e3250;
  border-radius: 6px;
  padding: 9px 12px;
  color: #fff;
  font-size: 0.85rem;
  outline: none;
  font-family: inherit;
}

.field-input:focus { border-color: #4fa3ff; }

.field-textarea {
  resize: vertical;
  min-height: 200px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  line-height: 1.5;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.post-card {
  background: #1a1d2e;
  border: 1px solid #2e3250;
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.post-info h4 { color: #fff; margin-bottom: 4px; }
.post-meta { display: flex; gap: 8px; align-items: center; }
.post-date { font-size: 0.7rem; color: #6b7394; }
.post-actions { display: flex; gap: 8px; }

.badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; }
.badge-green { background: #064e3b; color: #34d399; }
.badge-yellow { background: #451a03; color: #fbbf24; }

.btn-primary {
  background: #4fa3ff; color: #fff; border: none; border-radius: 8px;
  padding: 9px 20px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
}
.btn-primary:hover { background: #3b8de6; }

.btn-secondary {
  background: transparent; color: #8892b0; border: 1px solid #2e3250;
  border-radius: 8px; padding: 9px 20px; font-size: 0.85rem; cursor: pointer;
}

.btn-sm {
  padding: 5px 10px; font-size: 0.7rem; border-radius: 5px;
  border: 1px solid #2e3250; background: transparent; color: #8892b0; cursor: pointer;
}
.btn-sm:hover { background: #1e2235; color: #fff; }
.btn-danger { color: #ff4d6d; border-color: #5c1a2a; }
.btn-danger:hover { background: #3b1020; }

.msg { font-size: 0.85rem; color: #22c55e; }
.msg-error { color: #ff4d6d; }
.loading { color: #8892b0; }
.empty { color: #6b7394; font-size: 0.9rem; }
</style>
