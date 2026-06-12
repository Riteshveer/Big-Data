<script setup lang="ts">
import { ref, onMounted } from "vue";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

interface EditorBlock {
  type: string;
  data: any;
}

const post = ref<any>(null);
const blocks = ref<EditorBlock[]>([]);
const loading = ref(true);
const error = ref(false);

const slug = window.location.pathname.replace("/blog/", "");

const formatDate = (date: string | null) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const load = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/blog/${slug}`);
    if (res.ok) {
      post.value = await res.json();
      // Parse Editor.js content
      try {
        const parsed = JSON.parse(post.value.content);
        if (parsed.blocks) blocks.value = parsed.blocks;
      } catch {
        // Legacy plain text
        if (post.value.content) {
          blocks.value = [{ type: "paragraph", data: { text: post.value.content } }];
        }
      }
    } else {
      error.value = true;
    }
  } catch { error.value = true; }
  loading.value = false;
};

const goBack = () => { window.location.href = "/journey"; };

onMounted(load);
</script>

<template>
  <div class="blog-post-page">
    <div v-if="loading" class="blog-post-loading">Loading...</div>
    <div v-else-if="error" class="blog-post-error">
      <p>Post not found.</p>
      <button @click="goBack">← Back to Journey</button>
    </div>
    <template v-else-if="post">
      <header class="blog-post-header">
        <button class="blog-post-back" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div class="blog-post-meta">
          <span v-if="post.published_at" class="blog-post-date">{{ formatDate(post.published_at) }}</span>
          <div class="blog-post-tags" v-if="post.tags?.length">
            <span v-for="tag in post.tags" :key="tag" class="blog-post-tag">{{ tag }}</span>
          </div>
        </div>
      </header>

      <div class="blog-post-cover" v-if="post.cover_image_url">
        <img :src="post.cover_image_url" :alt="post.title" />
      </div>

      <h1 class="blog-post-title">{{ post.title }}</h1>

      <article class="blog-post-content">
        <template v-for="(block, idx) in blocks" :key="idx">
          <!-- Paragraph -->
          <p v-if="block.type === 'paragraph'" v-html="block.data.text" class="bp-paragraph"></p>

          <!-- Header -->
          <h2 v-else-if="block.type === 'header' && block.data.level === 2" v-html="block.data.text" class="bp-h2"></h2>
          <h3 v-else-if="block.type === 'header' && block.data.level === 3" v-html="block.data.text" class="bp-h3"></h3>
          <h4 v-else-if="block.type === 'header'" v-html="block.data.text" class="bp-h4"></h4>

          <!-- List -->
          <ul v-else-if="block.type === 'list' && block.data.style === 'unordered'" class="bp-list">
            <li v-for="(item, i) in block.data.items" :key="i" v-html="item"></li>
          </ul>
          <ol v-else-if="block.type === 'list'" class="bp-list bp-list-ordered">
            <li v-for="(item, i) in block.data.items" :key="i" v-html="item"></li>
          </ol>

          <!-- Code -->
          <pre v-else-if="block.type === 'code'" class="bp-code"><code>{{ block.data.code }}</code></pre>

          <!-- Image -->
          <figure v-else-if="block.type === 'image'" class="bp-image">
            <img :src="block.data.url" :alt="block.data.caption || ''" />
            <figcaption v-if="block.data.caption">{{ block.data.caption }}</figcaption>
          </figure>

          <!-- Quote -->
          <blockquote v-else-if="block.type === 'quote'" class="bp-quote">
            <p v-html="block.data.text"></p>
            <cite v-if="block.data.caption">— {{ block.data.caption }}</cite>
          </blockquote>

          <!-- Warning/Callout -->
          <div v-else-if="block.type === 'warning'" class="bp-callout">
            <strong v-if="block.data.title">{{ block.data.title }}</strong>
            <p v-html="block.data.message"></p>
          </div>

          <!-- Delimiter -->
          <hr v-else-if="block.type === 'delimiter'" class="bp-divider" />
        </template>
      </article>
    </template>
  </div>
</template>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');

.blog-post-page {
  min-height: 100vh;
  background: #0A1628;
  color: #FFFFFF;
  padding: 40px var(--space-outer, 24px);
  max-width: 800px;
  margin: 0 auto;
}

.blog-post-loading, .blog-post-error { color: #888; text-align: center; padding: 60px 0; }
.blog-post-error button { margin-top: 16px; background: none; border: 2px solid #FF6B00; color: #FF6B00; padding: 8px 16px; border-radius: 999px; cursor: pointer; font-weight: 700; }

.blog-post-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.blog-post-back {
  background: #3b6df0; border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
}
.blog-post-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.blog-post-date { font-size: 0.8rem; color: #5a6380; }
.blog-post-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.blog-post-tag { font-family: "Space Mono", monospace; font-size: 0.7rem; padding: 3px 10px; border-radius: 20px; border: 1px solid #FF6B00; color: #fff; background: #0D2247; }

.blog-post-cover {
  width: 100%; border-radius: 14px; overflow: hidden; margin-bottom: 32px;
  img { width: 100%; height: auto; display: block; }
}

.blog-post-title {
  font-family: "Poppins", sans-serif;
  font-weight: 900;
  font-size: 2.5rem;
  letter-spacing: 0.01em;
  line-height: 1.1;
  margin-bottom: 40px;
  @media (min-width: 768px) { font-size: 3.2rem; }
}

/* Content blocks */
.blog-post-content { line-height: 1.8; font-size: 1rem; }

.bp-paragraph { margin-bottom: 20px; color: #E0E0E0; :deep(a) { color: #FF6B00; text-decoration: underline; } :deep(code) { background: #0D1F3C; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; color: #FF8C33; font-family: "Space Mono", monospace; } }
.bp-h2 { font-family: "Poppins", sans-serif; font-weight: 800; font-size: 1.8rem; margin: 40px 0 16px; color: #fff; }
.bp-h3 { font-family: "Poppins", sans-serif; font-weight: 700; font-size: 1.3rem; margin: 32px 0 12px; color: #fff; }
.bp-h4 { font-family: "Poppins", sans-serif; font-weight: 600; font-size: 1.1rem; margin: 24px 0 10px; color: #E0E0E0; }

.bp-list { margin: 0 0 20px 24px; color: #c9d1e8; li { margin-bottom: 8px; } }
.bp-list-ordered { list-style-type: decimal; }

.bp-code {
  background: #0D1F3C; color: #E0E0E0; border: 1px solid #1A3A5C; border-radius: 8px;
  padding: 16px 20px; margin-bottom: 24px; overflow-x: auto; font-family: "Space Mono", monospace;
  font-size: 0.85rem; line-height: 1.6;
  code { color: inherit; }
}

.bp-image {
  margin: 24px 0; text-align: center;
  img { max-width: 100%; border-radius: 10px; }
  figcaption { margin-top: 8px; font-size: 0.8rem; color: #5a6380; font-style: italic; }
}

.bp-quote {
  border-left: 3px solid #FF6B00; margin: 24px 0; padding: 12px 20px; background: #0D1F3C; border-radius: 0 8px 8px 0;
  p { color: #E0E0E0; font-style: italic; margin: 0; }
  cite { display: block; margin-top: 8px; font-size: 0.8rem; color: #888; }
}

.bp-callout {
  background: #0D1F3C; border: 1px solid #FF6B00; border-radius: 10px; padding: 16px 20px; margin: 24px 0;
  strong { color: #FF6B00; display: block; margin-bottom: 6px; }
  p { color: #E0E0E0; margin: 0; font-size: 0.9rem; }
}

.bp-divider { border: none; height: 1px; background: #1A3A5C; margin: 40px 0; }
</style>
