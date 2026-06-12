<script setup lang="ts">
import { ref, onMounted } from "vue";
import { api, uploadFile } from "../composables/useApi";

interface Contribution {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  type: string;
  date: string | null;
  sort_order: number;
}

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string;
  is_published: number;
  published_at: string | null;
}

const activeTab = ref<"settings" | "blog" | "contributions">("settings");
const contributions = ref<Contribution[]>([]);
const blogPosts = ref<BlogPost[]>([]);
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

// New blog form
const newBlogTitle = ref("");
const newBlogSlug = ref("");
const newBlogExcerpt = ref("");
const newBlogContent = ref("");
const newBlogCover = ref("");
const newBlogTags = ref("");

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

const loadBlog = async () => {
  try {
    blogPosts.value = await api("/api/admin/blog/all");
  } catch (e: any) { showMsg(e.message); }
};

const addBlogPost = async () => {
  if (!newBlogTitle.value.trim()) { showMsg("Error: Title required"); return; }
  try {
    const slug = newBlogSlug.value.trim() || newBlogTitle.value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await api("/api/admin/blog", {
      method: "POST",
      body: JSON.stringify({
        title: newBlogTitle.value.trim(),
        slug,
        content: newBlogContent.value || "",
        excerpt: newBlogExcerpt.value.trim() || null,
        cover_image_url: newBlogCover.value.trim() || null,
        tags: newBlogTags.value.split(",").map((t: string) => t.trim()).filter(Boolean),
        is_published: 1,
      }),
    });
    newBlogTitle.value = ""; newBlogSlug.value = ""; newBlogContent.value = ""; newBlogExcerpt.value = ""; newBlogCover.value = ""; newBlogTags.value = "";
    showMsg("Blog post added!");
    await loadBlog();
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const deleteBlogPost = async (id: number) => {
  if (!confirm("Delete this blog post?")) return;
  const post = blogPosts.value.find(p => p.id === id);
  if (!post) return;
  try {
    await api(`/api/admin/blog/${post.slug}`, { method: "DELETE" });
    await loadBlog();
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const togglePublish = async (post: BlogPost) => {
  try {
    await api(`/api/admin/blog/${post.slug}`, { method: "PUT", body: JSON.stringify({ is_published: post.is_published ? 0 : 1 }) });
    await loadBlog();
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
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

// Manage contribution content
interface ContentBlock {
  id: number;
  contribution_id: number;
  title: string | null;
  description: string | null;
  image_url: string | null;
  sort_order: number;
}

const managingContribId = ref<number | null>(null);
const contribContent = ref<ContentBlock[]>([]);
const newBlockTitle = ref("");
const newBlockDesc = ref("");
const newBlockImage = ref("");
const uploadingContribImg = ref(false);

const startManageContrib = async (id: number) => {
  managingContribId.value = id;
  await loadContribContent(id);
};

const stopManageContrib = () => { managingContribId.value = null; };

const loadContribContent = async (id: number) => {
  try {
    contribContent.value = await api(`/api/contributions/${id}/content`);
  } catch (e: any) { showMsg(e.message); }
};

const addContentBlock = async () => {
  if (!managingContribId.value) return;
  if (!newBlockTitle.value.trim() && !newBlockDesc.value.trim() && !newBlockImage.value.trim()) { showMsg("Error: Add at least a title, description, or image"); return; }
  try {
    await api(`/api/admin/contributions/${managingContribId.value}/content`, {
      method: "POST",
      body: JSON.stringify({ title: newBlockTitle.value.trim() || null, description: newBlockDesc.value.trim() || null, image_url: newBlockImage.value.trim() || null, sort_order: contribContent.value.length }),
    });
    newBlockTitle.value = ""; newBlockDesc.value = ""; newBlockImage.value = "";
    showMsg("Content added!");
    await loadContribContent(managingContribId.value);
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const handleContribImgUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  uploadingContribImg.value = true;
  try {
    const result = await uploadFile(input.files[0]!);
    newBlockImage.value = result.url;
    showMsg("Image uploaded!");
  } catch (err: any) { showMsg(`Error: ${err.message}`); }
  uploadingContribImg.value = false;
  input.value = "";
};

const deleteContentBlock = async (contentId: number) => {
  if (!confirm("Delete this content block?") || !managingContribId.value) return;
  try {
    await api(`/api/admin/contributions/${managingContribId.value}/content/${contentId}`, { method: "DELETE" });
    await loadContribContent(managingContribId.value);
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const moveContentBlock = async (contentId: number, direction: number) => {
  if (!managingContribId.value) return;
  const idx = contribContent.value.findIndex(c => c.id === contentId);
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= contribContent.value.length) return;
  const current = contribContent.value[idx]!;
  const target = contribContent.value[targetIdx]!;
  const tempOrder = current.sort_order;
  try {
    await api(`/api/admin/contributions/${managingContribId.value}/content/${current.id}`, { method: "PUT", body: JSON.stringify({ sort_order: target.sort_order }) });
    await api(`/api/admin/contributions/${managingContribId.value}/content/${target.id}`, { method: "PUT", body: JSON.stringify({ sort_order: tempOrder }) });
    await loadContribContent(managingContribId.value);
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const showMsg = (msg: string) => { message.value = msg; setTimeout(() => (message.value = ""), 4000); };

onMounted(async () => {
  await loadSettings();
  await loadContributions();
  await loadBlog();
  loading.value = false;
});
</script>

<template>
  <div class="journey-panel">
    <p v-if="message" :class="['msg', message.startsWith('Error') && 'msg-error']">{{ message }}</p>

    <div class="tabs">
      <button :class="['tab', activeTab === 'settings' && 'tab-active']" @click="activeTab = 'settings'">Visibility</button>
      <button :class="['tab', activeTab === 'blog' && 'tab-active']" @click="activeTab = 'blog'">Blog</button>
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

    <!-- Blog Management -->
    <div v-if="activeTab === 'blog'" class="section">
      <h3>Blog Posts</h3>

      <div class="items-list">
        <div v-for="post in blogPosts" :key="post.id" class="item-row">
          <div class="item-info">
            <p class="item-title">{{ post.title }}</p>
            <p class="item-meta">
              <span :class="post.is_published ? 'status-published' : 'status-draft'">{{ post.is_published ? 'Published' : 'Draft' }}</span>
              {{ post.published_at || '' }}
            </p>
            <p class="item-desc" v-if="post.excerpt">{{ post.excerpt }}</p>
          </div>
          <div class="item-actions">
            <button class="btn-xs" @click="togglePublish(post)">{{ post.is_published ? 'Unpublish' : 'Publish' }}</button>
            <button class="btn-xs btn-danger-xs" @click="deleteBlogPost(post.id)">✕</button>
          </div>
        </div>
        <p v-if="!blogPosts.length" class="empty">No blog posts yet.</p>
      </div>

      <div class="add-form">
        <h4>Add Blog Post</h4>
        <input v-model="newBlogTitle" class="field-input" placeholder="Post title" />
        <input v-model="newBlogSlug" class="field-input" placeholder="Slug (auto-generated if empty)" />
        <input v-model="newBlogExcerpt" class="field-input" placeholder="Short excerpt / summary" />
        <textarea v-model="newBlogContent" class="field-input" rows="5" placeholder="Post content (plain text or markdown)"></textarea>
        <input v-model="newBlogCover" class="field-input" placeholder="Cover image URL (optional)" />
        <input v-model="newBlogTags" class="field-input" placeholder="Tags (comma separated)" />
        <button class="btn-primary btn-sm-primary" @click="addBlogPost">+ Add Post</button>
      </div>
    </div>

    <!-- Contributions Management -->
    <div v-if="activeTab === 'contributions'" class="section">
      <h3>Contributions</h3>

      <!-- Managing content for a specific contribution -->
      <div v-if="managingContribId" class="manage-content">
        <div class="manage-header">
          <button class="btn-xs" @click="stopManageContrib">← Back to list</button>
          <h4>Manage Content: {{ contributions.find(c => c.id === managingContribId)?.title }}</h4>
        </div>
        <p class="manage-desc" v-if="contributions.find(c => c.id === managingContribId)?.description">
          {{ contributions.find(c => c.id === managingContribId)?.description }}
        </p>

        <div class="items-list">
          <div v-for="(block, idx) in contribContent" :key="block.id" class="item-row">
            <div class="item-info">
              <p class="item-title" v-if="block.title">{{ block.title }}</p>
              <p class="item-desc" v-if="block.description">{{ block.description.slice(0, 80) }}...</p>
              <img v-if="block.image_url" :src="block.image_url" class="content-thumb" />
            </div>
            <div class="item-actions">
              <button class="btn-xs" @click="moveContentBlock(block.id, -1)" :disabled="idx === 0">↑</button>
              <button class="btn-xs" @click="moveContentBlock(block.id, 1)" :disabled="idx === contribContent.length - 1">↓</button>
              <button class="btn-xs btn-danger-xs" @click="deleteContentBlock(block.id)">✕</button>
            </div>
          </div>
          <p v-if="!contribContent.length" class="empty">No content blocks yet.</p>
        </div>

        <div class="add-form">
          <h4>Add Content Block</h4>
          <input v-model="newBlockTitle" class="field-input" placeholder="Paragraph title (optional)" />
          <textarea v-model="newBlockDesc" class="field-input" rows="3" placeholder="Description / paragraph text"></textarea>
          <div class="add-form-row">
            <input v-model="newBlockImage" class="field-input" placeholder="Image URL (or upload below)" readonly style="flex:1" />
            <label class="btn-upload-sm">
              {{ uploadingContribImg ? "..." : "Upload" }}
              <input type="file" accept="image/*" @change="handleContribImgUpload" hidden />
            </label>
          </div>
          <img v-if="newBlockImage" :src="newBlockImage" class="content-preview" />
          <button class="btn-primary btn-sm-primary" @click="addContentBlock">+ Add Block</button>
        </div>
      </div>

      <!-- Contributions list -->
      <template v-else>
        <div class="items-list">
          <div v-for="item in contributions" :key="item.id" class="item-row">
            <div class="item-info">
              <p class="item-title">{{ item.title }}</p>
              <p class="item-meta" v-if="item.type || item.date">{{ item.type }} {{ item.date ? `• ${item.date}` : '' }}</p>
              <p class="item-desc" v-if="item.description">{{ item.description.slice(0, 80) }}</p>
            </div>
            <div class="item-actions">
              <button class="btn-xs btn-manage" @click="startManageContrib(item.id)">Manage</button>
              <button class="btn-xs btn-danger-xs" @click="deleteContribution(item.id)">✕</button>
            </div>
          </div>
          <p v-if="!contributions.length" class="empty">No contributions yet.</p>
        </div>

        <div class="add-form">
          <h4>Add Contribution</h4>
          <input v-model="newTitle" class="field-input" placeholder="Title (e.g. 'Apache Spark PR #1234')" />
          <textarea v-model="newDesc" class="field-input" rows="3" placeholder="Description (optional)"></textarea>
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
      </template>
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
.item-row { display: flex; align-items: center; gap: 12px; background: #0f1117; border: 1px solid #2e3250; border-radius: 8px; padding: 16px 16px; min-height: 64px; }
.item-info { flex: 1; }
.item-actions { display: flex; gap: 6px; flex-shrink: 0; }
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
.status-published { color: #34d399; font-size: 0.7rem; font-weight: 600; }
.status-draft { color: #fbbf24; font-size: 0.7rem; font-weight: 600; }
.btn-manage { color: #60a5fa; border-color: #1e3a5f; }
.btn-manage:hover { background: #1e2a4a; }
.manage-content { }
.manage-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.manage-header h4 { color: #c9d1e8; font-size: 0.9rem; }
.manage-desc { font-size: 0.8rem; color: #8892b0; margin-bottom: 16px; line-height: 1.5; white-space: pre-line; }
.content-thumb { width: 60px; height: 40px; object-fit: cover; border-radius: 4px; margin-top: 4px; }
.content-preview { max-width: 200px; max-height: 120px; border-radius: 6px; border: 1px solid #2e3250; margin-top: 6px; }
.btn-upload-sm { display: inline-block; background: #2e3250; color: #c9d1e8; padding: 9px 14px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; }
.btn-upload-sm:hover { background: #3a3f5c; }
</style>
