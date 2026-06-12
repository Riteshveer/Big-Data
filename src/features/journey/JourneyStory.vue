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
          chapters.value = parsed.filter((c: Chapter) => c.visible);
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

  document.querySelectorAll(".journey__chapter").forEach(el => observer?.observe(el));

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
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

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
  background: linear-gradient(to bottom, #00ffff, #ff6b00);
  transform-origin: top;
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
}

/* Chapter */
.journey__chapter {
  position: relative;
  padding: 40px 0;
  display: flex;
  opacity: 0;
  transition: opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  &--left {
    justify-content: flex-start;
    padding-right: 55%;
    transform: translateX(-60px);
    @media (max-width: 767px) { padding-right: 0; padding-left: 50px; transform: translateX(-30px); }
  }

  &--right {
    justify-content: flex-end;
    padding-left: 55%;
    transform: translateX(60px);
    @media (max-width: 767px) { padding-left: 50px; padding-right: 0; transform: translateX(-30px); justify-content: flex-start; }
  }

  &--visible {
    opacity: 1;
    transform: translateX(0);

    .journey__node { transform: scale(1); }
    .journey__year { opacity: 1; transform: translateY(0); transition-delay: 0ms; }
    .journey__title { opacity: 1; transform: translateY(0); transition-delay: 100ms; }
    .journey__story { opacity: 1; transform: translateY(0); transition-delay: 200ms; }
    .journey__mindset { opacity: 1; transform: translateY(0); transition-delay: 300ms; }
    .journey__skills .journey__skill { opacity: 1; transform: scale(1); }
    .journey__images { opacity: 1; }
  }
}

/* Node dot */
.journey__node {
  position: absolute;
  left: 50%;
  top: 50px;
  width: 14px;
  height: 14px;
  background: #00ffff;
  border-radius: 50%;
  transform: translateX(-50%) scale(0);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 12px #00ffff, 0 0 24px rgba(0, 255, 255, 0.3);
  z-index: 2;

  @media (max-width: 767px) { left: 20px; }
}

/* Content */
.journey__content { width: 100%; }

.journey__year {
  display: inline-block;
  font-family: "Bebas Neue", sans-serif;
  font-size: 1.3rem;
  color: #ff6b00;
  background: rgba(255, 107, 0, 0.1);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 4px 14px;
  border-radius: 6px;
  margin-bottom: 8px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.journey__title {
  font-family: "Bebas Neue", sans-serif;
  font-size: 1.8rem;
  color: #f0f0f5;
  letter-spacing: 0.02em;
  margin-bottom: 12px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.journey__story {
  font-size: 0.95rem;
  color: #8892b0;
  line-height: 1.8;
  margin-bottom: 16px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

/* Mindset shift */
.journey__mindset {
  background: rgba(0, 255, 255, 0.03);
  border-left: 3px solid #00ffff;
  border-radius: 0 8px 8px 0;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.4s ease, transform 0.4s ease;

  &-icon { font-size: 1.1rem; flex-shrink: 0; }
  p { color: #c9d1e8; font-size: 0.9rem; font-style: italic; margin: 0; line-height: 1.6; }
}

/* Skills */
.journey__skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.journey__skill {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid rgba(0, 255, 255, 0.3);
  color: #00ffff;
  background: rgba(0, 255, 255, 0.05);
  opacity: 0;
  transform: scale(0);
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  @for $i from 1 through 10 {
    &:nth-child(#{$i}) { transition-delay: #{400 + ($i * 50)}ms; }
  }

  &:hover {
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
    background: rgba(0, 255, 255, 0.1);
  }
}

/* Polaroid images */
.journey__images {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  opacity: 0;
  transition: opacity 0.5s ease 500ms;
}

.journey__polaroid {
  background: #1a1d2e;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 6px;
  width: 140px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s;

  &:hover {
    transform: rotate(0deg) scale(1.05) !important;
    box-shadow: 0 0 16px rgba(0, 255, 255, 0.2);
    z-index: 10;
  }

  img { width: 100%; height: 90px; object-fit: cover; border-radius: 4px; }

  &-caption { font-size: 0.65rem; color: #5a6380; margin-top: 4px; text-align: center; }
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
.journey__story { background: #0a0a0f; margin: 0 calc(var(--space-outer, 24px) * -1); padding: 60px var(--space-outer, 24px); border-radius: 20px; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .journey__chapter { opacity: 1; transform: none; }
  .journey__chapter--visible .journey__year,
  .journey__chapter--visible .journey__title,
  .journey__chapter--visible .journey__story,
  .journey__chapter--visible .journey__mindset,
  .journey__chapter--visible .journey__skills .journey__skill,
  .journey__chapter--visible .journey__images { opacity: 1; transform: none; }
  .journey__node { transform: translateX(-50%) scale(1); }
  .journey__timeline-line { transform: scaleY(1); }
}
</style>
