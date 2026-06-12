<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[];
  published_at: string | null;
  content?: string;
}

defineProps<{ posts: BlogPost[] }>();

// Scroll animation observer
const observerRef = ref<IntersectionObserver | null>(null);

const getReadTime = (content?: string) => {
  if (!content) return "3 min read";
  const words = content.split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

const formatDate = (date: string | null) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

onMounted(() => {
  observerRef.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("blog-card-visible");
          }, idx * 100);
          observerRef.value?.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".blog-card").forEach((el) => {
    observerRef.value?.observe(el);
  });
});

onUnmounted(() => {
  observerRef.value?.disconnect();
});
</script>

<template>
  <div class="blog-section">
    <!-- Featured Hero Post (first/latest) -->
    <a v-if="posts.length" :href="`/blog/${posts[0].slug}`" class="blog-featured blog-card">
      <div class="blog-featured-bg" :style="posts[0].cover_image_url ? { backgroundImage: `url(${posts[0].cover_image_url})` } : {}"></div>
      <div class="blog-featured-overlay"></div>
      <div class="blog-featured-accent"></div>
      <div class="blog-featured-content">
        <div class="blog-featured-meta">
          <span class="blog-date">{{ formatDate(posts[0].published_at) }}</span>
          <span class="blog-readtime">{{ getReadTime(posts[0].content) }}</span>
        </div>
        <h2 class="blog-featured-title">{{ posts[0].title }}</h2>
        <p class="blog-featured-excerpt" v-if="posts[0].excerpt">{{ posts[0].excerpt }}</p>
        <div class="blog-tags" v-if="posts[0].tags?.length">
          <span v-for="tag in posts[0].tags.slice(0, 4)" :key="tag" class="blog-tag">{{ tag }}</span>
        </div>
        <span class="blog-cta">Read More →</span>
      </div>
    </a>

    <!-- Bento Grid for other posts -->
    <div class="blog-grid" v-if="posts.length > 1">
      <a
        v-for="(post, idx) in posts.slice(1)"
        :key="post.id"
        :href="`/blog/${post.slug}`"
        :class="['blog-card', 'blog-grid-card', idx === 0 && 'blog-grid-card-wide']"
      >
        <div class="blog-grid-card-image" v-if="post.cover_image_url">
          <img :src="post.cover_image_url" :alt="post.title" loading="lazy" />
        </div>
        <div class="blog-grid-card-body">
          <div class="blog-grid-card-meta">
            <span class="blog-date">{{ formatDate(post.published_at) }}</span>
            <span class="blog-readtime">{{ getReadTime(post.content) }}</span>
          </div>
          <h3 class="blog-grid-card-title">{{ post.title }}</h3>
          <p class="blog-grid-card-excerpt" v-if="post.excerpt">{{ post.excerpt }}</p>
          <div class="blog-tags" v-if="post.tags?.length">
            <span v-for="tag in post.tags.slice(0, 3)" :key="tag" class="blog-tag">{{ tag }}</span>
          </div>
          <span class="blog-cta">Read More →</span>
        </div>
      </a>
    </div>

    <p v-if="!posts.length" class="blog-empty">No blog posts yet. Check back soon!</p>
  </div>
</template>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

/* =========================================
   THEME VARIABLES
   ========================================= */
.blog-section {
  --neon-cyan: #00ffff;
  --neon-orange: #ff6b00;
  --bg-dark: #0a0a0f;
  --bg-card: #111118;
  --bg-card-hover: #16161f;
  --text-primary: #f0f0f5;
  --text-secondary: #8892b0;
  --text-muted: #5a6380;
  --border-subtle: rgba(255, 255, 255, 0.06);
  --glow-cyan: 0 0 20px rgba(0, 255, 255, 0.15);
  --glow-orange: 0 0 20px rgba(255, 107, 0, 0.15);

  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* =========================================
   FEATURED HERO CARD
   ========================================= */
.blog-featured {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  min-height: 320px;
  display: flex;
  align-items: flex-end;
  text-decoration: none;
  color: var(--text-primary);
  transition: transform 0.3s, box-shadow 0.3s;

  @media (min-width: 768px) {
    min-height: 400px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--glow-cyan);

    .blog-featured-bg {
      transform: scale(1.05);
    }

    .blog-cta {
      box-shadow: 0 0 12px rgba(0, 255, 255, 0.4), inset 0 0 12px rgba(0, 255, 255, 0.1);
    }
  }

  &-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    background-color: var(--bg-card);
    transition: transform 8s ease;
    animation: kenBurns 20s ease infinite alternate;
  }

  &-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(10, 10, 15, 0.95) 0%, rgba(10, 10, 15, 0.4) 50%, rgba(10, 10, 15, 0.2) 100%);
  }

  &-accent {
    position: absolute;
    left: 0;
    top: 10%;
    bottom: 10%;
    width: 3px;
    background: var(--neon-cyan);
    box-shadow: 0 0 10px var(--neon-cyan), 0 0 30px rgba(0, 255, 255, 0.3);
    border-radius: 0 2px 2px 0;
  }

  &-content {
    position: relative;
    z-index: 2;
    padding: 32px;
    width: 100%;

    @media (min-width: 768px) {
      padding: 48px;
      max-width: 70%;
    }
  }

  &-meta {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
  }

  &-title {
    font-family: "Bebas Neue", "Impact", sans-serif;
    font-size: 2rem;
    letter-spacing: 0.04em;
    line-height: 1.1;
    margin-bottom: 12px;

    @media (min-width: 768px) {
      font-size: 3rem;
    }
  }

  &-excerpt {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 16px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* =========================================
   BENTO GRID
   ========================================= */
.blog-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1100px) {
    grid-template-columns: repeat(3, 1fr);
  }

  &-card {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    overflow: hidden;
    text-decoration: none;
    color: var(--text-primary);
    transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--glow-cyan);
      border-color: rgba(0, 255, 255, 0.2);

      .blog-grid-card-image img {
        transform: scale(1.08);
      }

      .blog-cta {
        box-shadow: 0 0 12px rgba(0, 255, 255, 0.4), inset 0 0 12px rgba(0, 255, 255, 0.1);
      }
    }

    &-wide {
      @media (min-width: 768px) {
        grid-column: span 2;
      }
    }

    &-image {
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background: var(--bg-dark);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }
    }

    &-body {
      padding: 20px 24px 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    &-meta {
      display: flex;
      gap: 12px;
    }

    &-title {
      font-family: "Bebas Neue", "Impact", sans-serif;
      font-size: 1.4rem;
      letter-spacing: 0.03em;
      line-height: 1.2;
    }

    &-excerpt {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
}

/* =========================================
   SHARED ELEMENTS
   ========================================= */
.blog-date, .blog-readtime {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.blog-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.blog-tag {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid rgba(0, 255, 255, 0.3);
  color: var(--neon-cyan);
  background: rgba(0, 255, 255, 0.05);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: box-shadow 0.3s, background 0.3s;

  &:hover {
    box-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
    background: rgba(0, 255, 255, 0.1);
  }
}

.blog-cta {
  display: inline-block;
  margin-top: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--neon-cyan);
  border: 1px solid rgba(0, 255, 255, 0.4);
  padding: 6px 16px;
  border-radius: 6px;
  transition: box-shadow 0.3s, background 0.3s;
  width: fit-content;

  &:hover {
    background: rgba(0, 255, 255, 0.08);
  }
}

.blog-empty {
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  padding: 48px 0;
}

/* =========================================
   SCROLL ANIMATION
   ========================================= */
.blog-card-visible {
  opacity: 1 !important;
  transform: translateY(0) !important;
}

/* Featured card is always visible */
.blog-featured {
  opacity: 1;
  transform: none;
}

/* =========================================
   KEN BURNS ANIMATION
   ========================================= */
@keyframes kenBurns {
  0% { transform: scale(1) translate(0, 0); }
  100% { transform: scale(1.1) translate(-1%, -1%); }
}
</style>
