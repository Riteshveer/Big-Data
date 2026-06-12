<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

interface ChapterImage {
  url: string;
  caption: string;
  tilt?: number;
}

interface Chapter {
  id: string;
  year: string;
  title: string;
  story: string;
  mindsetShift: string | null;
  skills: string[];
  images: ChapterImage[];
  visible: boolean;
}

const chapters = ref<Chapter[]>([]);
const lightboxImage = ref<ChapterImage | null>(null);
const lightboxChapterImages = ref<ChapterImage[]>([]);
const lightboxIdx = ref(0);
const timelineProgress = ref(0);
let observer: IntersectionObserver | null = null;

// Default placeholder chapters
const defaultChapters: Chapter[] = [
  {
    id: "ch_2021", year: "2021", title: "The First Spark",
    story: "It started with curiosity — a YouTube video about Python automating boring tasks. I didn't know what 'data' really meant yet, but I knew I wanted to understand the numbers behind everything. That year was about exploration: writing my first Python scripts, getting comfortable with Excel beyond SUM formulas, and realizing that data wasn't just rows and columns — it was stories waiting to be told.",
    mindsetShift: null,
    skills: ["Python", "Excel", "Basic Statistics"],
    images: [], visible: true
  },
  {
    id: "ch_2022", year: "2022", title: "Building the Foundation",
    story: "This was the year I went all-in on Data Science. Kaggle competitions became my playground. I learned that asking the right question matters more than running the fanciest model. Pandas became second nature. SQL became my language of truth. I built projects that actually answered real questions — customer segmentation, churn prediction, sales forecasting. The more I built, the more I realized: the models are only as good as the data feeding them.",
    mindsetShift: null,
    skills: ["Pandas", "SQL", "Matplotlib", "Seaborn", "Scikit-learn"],
    images: [], visible: true
  },
  {
    id: "ch_2023", year: "2023", title: "The Pivot — Thinking at Scale",
    story: "The turning point. I was building a recommendation engine when it hit me: my model worked on 10,000 rows. But what about 10 million? 100 million? I realized there's a massive gap between analyzing data and engineering the systems that carry it. That's when I decided to become a Big Data Engineer. I stopped building models and started building the roads data travels on.",
    mindsetShift: "I stopped building models and started building the roads data travels on.",
    skills: ["PySpark", "Hadoop", "Hive", "Spark SQL"],
    images: [], visible: true
  },
  {
    id: "ch_2024", year: "2024", title: "Pipelines, Architectures, and Real Systems",
    story: "This year was about building things that actually run in production — or at least simulate it. Real-time streaming with Kafka. Orchestration with Airflow. Medallion architectures with Delta Lake. I started thinking about fault tolerance, exactly-once semantics, and what happens when your pipeline fails at 3 AM. The problems got harder, but they felt right. This is where I belong.",
    mindsetShift: null,
    skills: ["Apache Kafka", "Airflow", "dbt", "Spark Streaming"],
    images: [], visible: true
  },
  {
    id: "ch_2025", year: "2025 — Now", title: "Going Global",
    story: "Right now, I'm actively building toward international opportunities. Singapore, Germany, Netherlands, Sweden, Australia — the world needs data engineers who can think at scale. I'm sharpening my system design skills, contributing to open source, and building this portfolio you're looking at right now. The journey isn't over — it's accelerating.",
    mindsetShift: null,
    skills: ["System Design", "Portfolio Development", "Open Source"],
    images: [], visible: true
  },
];

const loadChapters = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (res.ok) {
      const settings = await res.json();
      if (settings.journey_chapters) {
        const parsed = JSON.parse(settings.journey_chapters);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Show all chapters (visible filter removed — admin can delete if not wanted)
          chapters.value = parsed;
          return;
        }
      }
    }
  } catch { /* */ }
  chapters.value = defaultChapters;
};

// Assign random tilts to images
const assignTilts = () => {
  chapters.value.forEach(ch => {
    ch.images.forEach(img => {
      img.tilt = (Math.random() - 0.5) * 6; // -3 to +3 degrees
    });
  });
};

// Timeline scroll progress
const handleScroll = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  timelineProgress.value = scrollable > 0 ? window.scrollY / scrollable : 0;
};

// Lightbox
const openLightbox = (images: ChapterImage[], idx: number) => {
  lightboxChapterImages.value = images;
  lightboxIdx.value = idx;
  lightboxImage.value = images[idx]!;
};

const closeLightbox = () => { lightboxImage.value = null; };

const nextImage = () => {
  if (lightboxIdx.value < lightboxChapterImages.value.length - 1) {
    lightboxIdx.value++;
    lightboxImage.value = lightboxChapterImages.value[lightboxIdx.value]!;
  }
};

const prevImage = () => {
  if (lightboxIdx.value > 0) {
    lightboxIdx.value--;
    lightboxImage.value = lightboxChapterImages.value[lightboxIdx.value]!;
  }
};

const handleKey = (e: KeyboardEvent) => {
  if (!lightboxImage.value) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") nextImage();
  if (e.key === "ArrowLeft") prevImage();
};

onMounted(async () => {
  await loadChapters();
  assignTilts();

  await nextTick();
  // Wait a frame for DOM to render
  await new Promise(r => setTimeout(r, 100));

  // Scroll observer for chapters
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("journey__chapter--visible");
          observer?.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".journey__chapter").forEach(el => {
    // If already in viewport, show immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.classList.add("journey__chapter--visible");
    } else {
      observer?.observe(el);
    }
  });

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("keydown", handleKey);
  handleScroll();
});

onUnmounted(() => {
  observer?.disconnect();
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("keydown", handleKey);
});
</script>

<template>
  <div class="journey__story">
    <!-- Timeline line -->
    <div class="journey__timeline">
      <div class="journey__timeline-line" :style="{ transform: `scaleY(${timelineProgress})` }"></div>
    </div>

    <!-- Chapters -->
    <div
      v-for="(chapter, idx) in chapters"
      :key="chapter.id"
      :class="['journey__chapter', idx % 2 === 0 ? 'journey__chapter--left' : 'journey__chapter--right']"
    >
      <!-- Node dot -->
      <div class="journey__node"></div>

      <!-- Content -->
      <div class="journey__content">
        <span class="journey__year">{{ chapter.year }}</span>
        <h3 class="journey__title">{{ chapter.title }}</h3>
        <p class="journey__story">{{ chapter.story }}</p>

        <!-- Mindset shift -->
        <div v-if="chapter.mindsetShift" class="journey__mindset">
          <span class="journey__mindset-icon">💡</span>
          <p>{{ chapter.mindsetShift }}</p>
        </div>

        <!-- Skills -->
        <div v-if="chapter.skills.length" class="journey__skills">
          <span v-for="skill in chapter.skills" :key="skill" class="journey__skill">{{ skill }}</span>
        </div>

        <!-- Images -->
        <div v-if="chapter.images.length" class="journey__images">
          <div
            v-for="(img, imgIdx) in chapter.images"
            :key="imgIdx"
            class="journey__polaroid"
            :style="{ transform: `rotate(${img.tilt || 0}deg)` }"
            @click="openLightbox(chapter.images, imgIdx)"
          >
            <img :src="img.url" :alt="img.caption" />
            <p class="journey__polaroid-caption">{{ img.caption }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <div v-if="lightboxImage" class="journey__lightbox" @click.self="closeLightbox">
      <button class="journey__lightbox-close" @click="closeLightbox">✕</button>
      <button v-if="lightboxIdx > 0" class="journey__lightbox-prev" @click="prevImage">‹</button>
      <div class="journey__lightbox-content">
        <img :src="lightboxImage.url" :alt="lightboxImage.caption" />
        <p v-if="lightboxImage.caption">{{ lightboxImage.caption }}</p>
      </div>
      <button v-if="lightboxIdx < lightboxChapterImages.length - 1" class="journey__lightbox-next" @click="nextImage">›</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');

.journey__story {
  position: relative;
  padding: 40px 0;
  max-width: 900px;
  margin: 0 auto;
}

/* Timeline */
.journey__timeline {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);

  @media (max-width: 767px) { left: 20px; }
}

.journey__timeline-line {
  width: 100%;
  height: 100%;
  background: #FF6B00;
  transform-origin: top;
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(255, 107, 0, 0.3);
}

/* Chapter */
.journey__chapter {
  position: relative;
  padding: 40px 0;
  display: flex;
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  &--left {
    justify-content: flex-start;
    padding-right: 55%;
    @media (max-width: 767px) { padding-right: 0; padding-left: 50px; }
  }

  &--right {
    justify-content: flex-end;
    padding-left: 55%;
    @media (max-width: 767px) { padding-left: 50px; padding-right: 0; justify-content: flex-start; }
  }

  &--visible {
    .journey__node { transform: translateX(-50%); }
  }
}

/* Node dot */
.journey__node {
  position: absolute;
  left: 50%;
  top: 50px;
  width: 14px;
  height: 14px;
  background: #FF6B00;
  border-radius: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 12px rgba(255, 107, 0, 0.6);
  z-index: 2;

  @media (max-width: 767px) { left: 20px; }
}

/* Content */
.journey__content { width: 100%; }

.journey__year {
  display: inline-block;
  font-family: "Poppins", sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
  color: #fff;
  background: #FF6B00;
  padding: 4px 14px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.journey__title {
  font-family: "Poppins", sans-serif;
  font-weight: 800;
  font-size: 1.8rem;
  color: #fff;
  letter-spacing: 0.01em;
  margin-bottom: 12px;
}

.journey__story {
  font-family: "Poppins", sans-serif;
  font-size: 0.95rem;
  color: #E0E0E0;
  line-height: 1.8;
  margin-bottom: 16px;
  white-space: pre-line;
}

/* Mindset shift */
.journey__mindset {
  background: #0D1F3C;
  border-left: 3px solid #FF6B00;
  border-radius: 0 8px 8px 0;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  gap: 10px;
  align-items: flex-start;

  &-icon { font-size: 1.1rem; flex-shrink: 0; }
  p { color: #E0E0E0; font-family: "Space Mono", monospace; font-size: 0.85rem; font-style: italic; margin: 0; line-height: 1.6; }
}

/* Skills */
.journey__skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.journey__skill {
  font-family: "Space Mono", monospace;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid #FF6B00;
  color: #fff;
  background: #0D2247;

  &:hover {
    box-shadow: 0 0 10px rgba(255, 107, 0, 0.4);
    background: #1A3A5C;
  }
}

/* Polaroid images */
.journey__images {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.journey__polaroid {
  background: #0D1F3C;
  border: 1px solid #FF6B00;
  border-radius: 6px;
  padding: 6px;
  width: 140px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s;

  &:hover {
    transform: rotate(0deg) scale(1.05) !important;
    box-shadow: 0 0 16px rgba(255, 107, 0, 0.3);
    z-index: 10;
  }

  img { width: 100%; height: 90px; object-fit: cover; border-radius: 4px; }

  &-caption { font-family: "Space Mono", monospace; font-size: 0.65rem; color: #E0E0E0; margin-top: 4px; text-align: center; }
}

/* Lightbox */
.journey__lightbox {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: lbFadeIn 0.2s ease;

  &-content {
    text-align: center;
    animation: lbZoomIn 0.3s ease;
    img { max-width: 90vw; max-height: 80vh; border-radius: 10px; }
    p { color: #8892b0; margin-top: 12px; font-size: 0.9rem; }
  }

  &-close { position: absolute; top: 20px; right: 24px; background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer; }
  &-prev, &-next { position: absolute; top: 50%; background: none; border: none; color: #fff; font-size: 3rem; cursor: pointer; transform: translateY(-50%); }
  &-prev { left: 20px; }
  &-next { right: 20px; }
}

@keyframes lbFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes lbZoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* Background */
.journey__story { background: #0A1628; margin: 0 calc(var(--space-outer, 24px) * -1); padding: 60px var(--space-outer, 24px); border-radius: 20px; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .journey__timeline-line { transform: scaleY(1); }
}
</style>
