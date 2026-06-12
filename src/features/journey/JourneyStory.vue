<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

interface ChapterImage { url: string; caption: string; tilt?: number; }
interface Chapter { id: string; year: string; title: string; story: string; mindsetShift: string | null; skills: string[]; images: ChapterImage[]; visible: boolean; }

const chapters = ref<Chapter[]>([]);
const lightboxImage = ref<ChapterImage | null>(null);
const lightboxChapterImages = ref<ChapterImage[]>([]);
const lightboxIdx = ref(0);
const timelineProgress = ref(0);
const animReady = ref(false);
let observer: IntersectionObserver | null = null;

const defaultChapters: Chapter[] = [
  { id: "ch_2021", year: "2021", title: "The First Spark", story: "It started with curiosity — a YouTube video about Python automating boring tasks. I didn't know what 'data' really meant yet, but I knew I wanted to understand the numbers behind everything. That year was about exploration: writing my first Python scripts, getting comfortable with Excel beyond SUM formulas, and realizing that data wasn't just rows and columns — it was stories waiting to be told.", mindsetShift: null, skills: ["Python", "Excel", "Basic Statistics"], images: [], visible: true },
  { id: "ch_2022", year: "2022", title: "Building the Foundation", story: "This was the year I went all-in on Data Science. Kaggle competitions became my playground. I learned that asking the right question matters more than running the fanciest model. Pandas became second nature. SQL became my language of truth. I built projects that actually answered real questions — customer segmentation, churn prediction, sales forecasting.", mindsetShift: null, skills: ["Pandas", "SQL", "Matplotlib", "Seaborn", "Scikit-learn"], images: [], visible: true },
  { id: "ch_2023", year: "2023", title: "The Pivot — Thinking at Scale", story: "The turning point. I was building a recommendation engine when it hit me: my model worked on 10,000 rows. But what about 10 million? I realized there's a massive gap between analyzing data and engineering the systems that carry it. That's when I decided to become a Big Data Engineer.", mindsetShift: "I stopped building models and started building the roads data travels on.", skills: ["PySpark", "Hadoop", "Hive", "Spark SQL"], images: [], visible: true },
  { id: "ch_2024", year: "2024", title: "Pipelines, Architectures, and Real Systems", story: "This year was about building things that actually run in production. Real-time streaming with Kafka. Orchestration with Airflow. Medallion architectures with Delta Lake. I started thinking about fault tolerance, exactly-once semantics, and what happens when your pipeline fails at 3 AM.", mindsetShift: null, skills: ["Apache Kafka", "Airflow", "dbt", "Spark Streaming"], images: [], visible: true },
  { id: "ch_2025", year: "2025 — Now", title: "Going Global", story: "Right now, I'm actively building toward international opportunities. Singapore, Germany, Netherlands, Sweden, Australia — the world needs data engineers who can think at scale. I'm sharpening my system design skills, contributing to open source, and building this portfolio.", mindsetShift: null, skills: ["System Design", "Portfolio Development", "Open Source"], images: [], visible: true },
];

const loadChapters = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (res.ok) {
      const settings = await res.json();
      if (settings.journey_chapters) {
        const parsed = JSON.parse(settings.journey_chapters);
        if (Array.isArray(parsed) && parsed.length > 0) { chapters.value = parsed; return; }
      }
    }
  } catch { /* */ }
  chapters.value = defaultChapters;
};

const assignTilts = () => { chapters.value.forEach(ch => { ch.images.forEach(img => { img.tilt = (Math.random() - 0.5) * 6; }); }); };

const handleScroll = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  timelineProgress.value = scrollable > 0 ? window.scrollY / scrollable : 0;
};

const openLightbox = (images: ChapterImage[], idx: number) => { lightboxChapterImages.value = images; lightboxIdx.value = idx; lightboxImage.value = images[idx]!; };
const closeLightbox = () => { lightboxImage.value = null; };
const nextImage = () => { if (lightboxIdx.value < lightboxChapterImages.value.length - 1) { lightboxIdx.value++; lightboxImage.value = lightboxChapterImages.value[lightboxIdx.value]!; } };
const prevImage = () => { if (lightboxIdx.value > 0) { lightboxIdx.value--; lightboxImage.value = lightboxChapterImages.value[lightboxIdx.value]!; } };
const handleKey = (e: KeyboardEvent) => { if (!lightboxImage.value) return; if (e.key === "Escape") closeLightbox(); if (e.key === "ArrowRight") nextImage(); if (e.key === "ArrowLeft") prevImage(); };

// Check if element is in viewport
const isInViewport = (el: Element) => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; };

const checkAlreadyVisible = () => {
  document.querySelectorAll(".js-anim").forEach(el => {
    if (isInViewport(el)) el.classList.add("in-view");
  });
};

onMounted(async () => {
  await loadChapters();
  assignTilts();
  await nextTick();
  await new Promise(r => setTimeout(r, 50));

  // Enable animations (progressive enhancement)
  animReady.value = true;

  // Set stagger delays on skill badges
  document.querySelectorAll(".journey__chapter").forEach(ch => {
    ch.querySelectorAll(".journey__skill").forEach((badge, i) => {
      (badge as HTMLElement).style.transitionDelay = `${400 + (i * 60)}ms`;
    });
  });

  // Observer — fire once per element
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer?.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".js-anim").forEach(el => observer?.observe(el));

  // Immediately show anything already visible
  checkAlreadyVisible();
  setTimeout(checkAlreadyVisible, 300);

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("keydown", handleKey);
  handleScroll();
});

onUnmounted(() => { observer?.disconnect(); window.removeEventListener("scroll", handleScroll); window.removeEventListener("keydown", handleKey); });
</script>

<template>
  <div :class="['journey__section', animReady && 'anim-ready']">
    <div class="journey__container">
      <!-- Timeline line (DO NOT TOUCH) -->
      <div class="journey__timeline">
        <div class="journey__timeline-line" :style="{ transform: `scaleY(${timelineProgress})` }"></div>
      </div>

      <!-- Chapters -->
      <div
        v-for="(chapter, idx) in chapters"
        :key="chapter.id"
        :class="['journey__chapter', 'js-anim', idx % 2 === 0 ? 'journey__chapter--odd' : 'journey__chapter--even']"
      >
        <div class="journey__node js-anim"></div>

        <div class="journey__content">
          <span class="journey__year js-anim">{{ chapter.year }}</span>
          <h3 class="journey__title js-anim">{{ chapter.title }}</h3>
          <p class="journey__story-text js-anim">{{ chapter.story }}</p>

          <div v-if="chapter.mindsetShift" class="journey__mindset js-anim">
            <span class="journey__mindset-icon">💡</span>
            <p>{{ chapter.mindsetShift }}</p>
          </div>

          <div v-if="chapter.skills.length" class="journey__skills">
            <span v-for="skill in chapter.skills" :key="skill" class="journey__skill js-anim">{{ skill }}</span>
          </div>

          <div v-if="chapter.images.length" class="journey__images">
            <div v-for="(img, imgIdx) in chapter.images" :key="imgIdx" class="journey__polaroid js-anim" :style="{ transform: `rotate(${img.tilt || 0}deg)` }" @click="openLightbox(chapter.images, imgIdx)">
              <img :src="img.url" :alt="img.caption" />
              <p>{{ img.caption }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <div v-if="lightboxImage" class="journey__lightbox" @click.self="closeLightbox">
      <button class="journey__lb-close" @click="closeLightbox">✕</button>
      <button v-if="lightboxIdx > 0" class="journey__lb-prev" @click="prevImage">‹</button>
      <div class="journey__lb-content">
        <img :src="lightboxImage.url" :alt="lightboxImage.caption" />
        <p v-if="lightboxImage.caption">{{ lightboxImage.caption }}</p>
      </div>
      <button v-if="lightboxIdx < lightboxChapterImages.length - 1" class="journey__lb-next" @click="nextImage">›</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');

/* ═══════════════════════════════════════════
   FIX 2 — WIDTH & LAYOUT
   ═══════════════════════════════════════════ */
.journey__section {
  background: #0A1628;
  margin: 0 calc(var(--space-outer, 24px) * -1);
  padding: 60px var(--space-outer, 24px);
  border-radius: 20px;
}

.journey__container {
  width: 90%;
  max-width: 1100px;
  margin: 0 auto;
  position: relative;
}

/* Timeline (DO NOT TOUCH scroll logic) */
.journey__timeline { position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; transform: translateX(-50%); }
.journey__timeline-line { width: 100%; height: 100%; background: #FF6B00; transform-origin: top; border-radius: 2px; box-shadow: 0 0 8px rgba(255,107,0,0.3); }

/* Chapter layout */
.journey__chapter {
  position: relative;
  padding: 40px 0;
  display: flex;
  width: 44%;
  min-width: 300px;
}
.journey__chapter--odd { margin-left: 0; margin-right: auto; padding-right: 50px; }
.journey__chapter--even { margin-left: auto; margin-right: 0; padding-left: 50px; }

@media (max-width: 768px) {
  .journey__chapter { width: 85%; margin: 0 auto !important; padding: 24px 0 24px 50px !important; }
  .journey__timeline { left: 20px; }
  .journey__node { left: 20px !important; }
}

/* Node dot */
.journey__node {
  position: absolute;
  left: 50%;
  top: 52px;
  width: 16px;
  height: 16px;
  background: #FF6B00;
  border-radius: 50%;
  transform: translateX(-50%);
  border: 3px solid #0A1628;
  box-shadow: 0 0 12px rgba(255,107,0,0.6);
  z-index: 2;
}

/* Content */
.journey__content { width: 100%; }

/* ═══════════════════════════════════════════
   FIX 3 — THEME COLORS
   ═══════════════════════════════════════════ */
.journey__year {
  display: inline-block;
  font-family: "Poppins", sans-serif;
  font-weight: 800;
  font-size: 2.2rem;
  color: #FF6B00;
  margin-bottom: 8px;
  line-height: 1;
}

.journey__title {
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 1.35rem;
  color: #FFFFFF;
  margin-bottom: 14px;
}

.journey__story-text {
  font-family: "Poppins", sans-serif;
  font-size: 0.98rem;
  font-weight: 400;
  color: #C8D0DC;
  line-height: 1.8;
  margin-bottom: 16px;
  white-space: pre-line;
}

.journey__mindset {
  background: #0D1F3C;
  border-left: 3px solid #FF6B00;
  border-radius: 0 8px 8px 0;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  &-icon { font-size: 1.1rem; color: #FF6B00; }
  p { color: #E0E0E0; font-family: "Space Mono", monospace; font-size: 0.85rem; font-style: italic; margin: 0; line-height: 1.6; }
}

.journey__skills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.journey__skill {
  font-family: "Space Mono", monospace;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid #FF6B00;
  color: #FFFFFF;
  background: #0D2247;
  &:hover { box-shadow: 0 0 10px rgba(255,107,0,0.4); background: #1A3A5C; }
}

.journey__images { display: flex; gap: 12px; flex-wrap: wrap; }
.journey__polaroid {
  background: #0D1F3C;
  border: 2px solid #FF6B00;
  border-radius: 6px;
  padding: 6px;
  width: 140px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover { transform: rotate(0deg) scale(1.05) !important; box-shadow: 0 0 16px rgba(255,107,0,0.3); z-index: 10; }
  img { width: 100%; height: 90px; object-fit: cover; border-radius: 4px; }
  p { font-family: "Space Mono", monospace; font-size: 0.65rem; color: #E0E0E0; margin-top: 4px; text-align: center; }
}

/* Lightbox */
.journey__lightbox { position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.92); display: flex; align-items: center; justify-content: center; }
.journey__lb-content { text-align: center; img { max-width: 90vw; max-height: 80vh; border-radius: 10px; } p { color: #C8D0DC; margin-top: 12px; font-size: 0.9rem; } }
.journey__lb-close { position: absolute; top: 20px; right: 24px; background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer; }
.journey__lb-prev, .journey__lb-next { position: absolute; top: 50%; background: none; border: none; color: #fff; font-size: 3rem; cursor: pointer; transform: translateY(-50%); }
.journey__lb-prev { left: 20px; }
.journey__lb-next { right: 20px; }

/* ═══════════════════════════════════════════
   FIX 1 — PROGRESSIVE ENHANCEMENT ANIMATIONS
   Content is ALWAYS VISIBLE by default.
   Animations only fire when .anim-ready is on parent.
   ═══════════════════════════════════════════ */

/* DEFAULT: everything visible, no animation */
.journey__chapter, .journey__year, .journey__title,
.journey__story-text, .journey__mindset, .journey__skill,
.journey__polaroid, .journey__node {
  opacity: 1;
  transform: translateX(0) translateY(0) scale(1);
}

/* WHEN JS IS READY: hide elements, prepare for animation */
.anim-ready {
  .journey__chapter { opacity: 0; transition: opacity 600ms ease, transform 600ms cubic-bezier(0.25,0.46,0.45,0.94); }
  .journey__chapter--odd { transform: translateX(-50px); }
  .journey__chapter--even { transform: translateX(50px); }
  .journey__year { opacity: 0; transform: translateY(10px); transition: opacity 500ms ease, transform 500ms ease; }
  .journey__title { opacity: 0; transform: translateY(10px); transition: opacity 500ms ease 100ms, transform 500ms ease 100ms; }
  .journey__story-text { opacity: 0; transform: translateY(10px); transition: opacity 500ms ease 200ms, transform 500ms ease 200ms; }
  .journey__mindset { opacity: 0; transform: translateY(20px); transition: opacity 500ms ease 300ms, transform 500ms ease 300ms; }
  .journey__skill { opacity: 0; transform: scale(0); transition: opacity 400ms ease, transform 400ms cubic-bezier(0.34,1.56,0.64,1); }
  .journey__polaroid { opacity: 0; transition: opacity 500ms ease 500ms; }
  .journey__node { opacity: 0; transform: translateX(-50%) scale(0); transition: opacity 400ms ease, transform 400ms ease; }

  /* WHEN IN VIEW — animate to visible */
  .in-view { opacity: 1 !important; transform: none !important; }
  .journey__node.in-view { transform: translateX(-50%) !important; }

  /* Node dot pulse after appearing */
  .journey__node.in-view { animation: dotPulse 1.5s ease-out 0.3s 2; }
}

@keyframes dotPulse {
  0%   { box-shadow: 0 0 0 0 rgba(255,107,0,0.6); }
  70%  { box-shadow: 0 0 0 10px rgba(255,107,0,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,107,0,0); }
}

/* Reduced motion — disable all animations */
@media (prefers-reduced-motion: reduce) {
  .anim-ready .journey__chapter,
  .anim-ready .journey__year,
  .anim-ready .journey__title,
  .anim-ready .journey__story-text,
  .anim-ready .journey__mindset,
  .anim-ready .journey__skill,
  .anim-ready .journey__polaroid,
  .anim-ready .journey__node { opacity: 1 !important; transform: none !important; transition: none !important; animation: none !important; }
  .journey__timeline-line { transform: scaleY(1) !important; }
}
</style>
