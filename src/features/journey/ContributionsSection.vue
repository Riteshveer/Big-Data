<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface Contribution {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  type: string;
  date: string | null;
}

const props = defineProps<{ contributions: Contribution[] }>();

const observerRef = ref<IntersectionObserver | null>(null);
const countersVisible = ref(false);
const headerVisible = ref(false);

// Dynamic settings from API
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";
const statOverrideTotal = ref(0);
const statOverrideRepos = ref(0);
const statOverridePRs = ref(0);

// Typewriter effect
const phrases = ref(["Open Source", "Community", "Real-World Impact", "Data Engineering"]);
const currentPhrase = ref("");
const phraseIdx = ref(0);
const charIdx = ref(0);
const isDeleting = ref(false);
let typeTimer: ReturnType<typeof setTimeout> | null = null;

const typewrite = () => {
  const phrase = phrases.value[phraseIdx.value]!;
  if (!isDeleting.value) {
    currentPhrase.value = phrase.slice(0, charIdx.value + 1);
    charIdx.value++;
    if (charIdx.value >= phrase.length) {
      setTimeout(() => { isDeleting.value = true; typewrite(); }, 2000);
      return;
    }
    typeTimer = setTimeout(typewrite, 80);
  } else {
    currentPhrase.value = phrase.slice(0, charIdx.value - 1);
    charIdx.value--;
    if (charIdx.value <= 0) {
      isDeleting.value = false;
      phraseIdx.value = (phraseIdx.value + 1) % phrases.value.length;
      typeTimer = setTimeout(typewrite, 400);
      return;
    }
    typeTimer = setTimeout(typewrite, 40);
  }
};

const totalContribs = ref(0);
const totalProjects = ref(0);
const totalTypes = ref(0);

const getTypeColor = (type: string) => {
  switch (type) {
    case "open-source": return "#00ffff";
    case "talk": return "#ff6b00";
    case "article": return "#a855f7";
    case "community": return "#22c55e";
    default: return "#00ffff";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "open-source": return "⚡";
    case "talk": return "🎤";
    case "article": return "📝";
    case "community": return "🤝";
    default: return "💡";
  }
};

const formatDate = (date: string | null) => {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch { return date; }
};

onMounted(() => {
  // Load settings from API
  fetch(`${API_BASE}/api/settings`).then(r => r.json()).then(settings => {
    if (settings.contrib_stat_total) statOverrideTotal.value = parseInt(settings.contrib_stat_total) || 0;
    if (settings.contrib_stat_repos) statOverrideRepos.value = parseInt(settings.contrib_stat_repos) || 0;
    if (settings.contrib_stat_prs) statOverridePRs.value = parseInt(settings.contrib_stat_prs) || 0;
    if (settings.contrib_typewriter) {
      phrases.value = settings.contrib_typewriter.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }).catch(() => {});

  typewrite();

  // Scroll observer for cards
  observerRef.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target.classList.contains("contrib-stats")) {
            countersVisible.value = true;
            const total = statOverrideTotal.value || props.contributions.length;
            const repos = statOverrideRepos.value || new Set(props.contributions.map(c => c.type)).size;
            const prs = statOverridePRs.value || 0;
            const start = performance.now();
            const duration = 1500;
            const animate = (now: number) => {
              const p = Math.min((now - start) / duration, 1);
              const ease = 1 - Math.pow(1 - p, 3);
              totalContribs.value = Math.floor(ease * total);
              totalProjects.value = Math.floor(ease * repos);
              totalTypes.value = Math.floor(ease * prs);
              if (p < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          }
          if (entry.target.classList.contains("contrib-header")) {
            headerVisible.value = true;
          }
          entry.target.classList.add("contrib-visible");
          observerRef.value?.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  setTimeout(() => {
    document.querySelectorAll(".contrib-animate").forEach((el, idx) => {
      (el as HTMLElement).style.transitionDelay = `${idx * 100}ms`;
      observerRef.value?.observe(el);
    });
  }, 100);
});

onUnmounted(() => {
  observerRef.value?.disconnect();
  if (typeTimer) clearTimeout(typeTimer);
});
</script>

<template>
  <div class="contrib-section">
    <!-- Hero Header -->
    <div class="contrib-header contrib-animate">
      <h2 class="contrib-title">CONTRIBUTIONS & IMPACT</h2>
      <p class="contrib-subtitle">
        <span class="contrib-typed">{{ currentPhrase }}</span>
        <span class="contrib-cursor">|</span>
      </p>
      <div class="contrib-divider"></div>
    </div>

    <!-- Stats -->
    <div class="contrib-stats contrib-animate">
      <div class="contrib-stat">
        <span class="contrib-stat-num">{{ totalContribs }}</span>
        <span class="contrib-stat-label">Total Contributions</span>
      </div>
      <div class="contrib-stat">
        <span class="contrib-stat-num">{{ totalProjects }}</span>
        <span class="contrib-stat-label">Repos Contributed To</span>
      </div>
      <div class="contrib-stat">
        <span class="contrib-stat-num">{{ totalTypes }}</span>
        <span class="contrib-stat-label">Pull Requests Merged</span>
      </div>
    </div>

    <!-- Contribution Cards -->
    <div class="contrib-grid" v-if="contributions.length">
      <a
        v-for="item in contributions"
        :key="item.id"
        :href="`/contribution/${item.id}`"
        class="contrib-card contrib-animate"
      >
        <div class="contrib-card-header">
          <span class="contrib-card-icon">{{ getTypeIcon(item.type) }}</span>
          <span class="contrib-card-type" :style="{ color: getTypeColor(item.type), borderColor: getTypeColor(item.type) }">{{ item.type }}</span>
          <span class="contrib-card-date" v-if="item.date">{{ formatDate(item.date) }}</span>
        </div>
        <h3 class="contrib-card-title">{{ item.title }}</h3>
        <p class="contrib-card-desc" v-if="item.description">{{ item.description }}</p>
        <div class="contrib-card-link" v-if="item.url">View →</div>
      </a>
    </div>

    <p v-else class="contrib-empty">No contributions yet. Check back soon!</p>
  </div>
</template>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');

.contrib-section {
  --accent: #FF6B00;
  --accent-light: #FF8C33;
  --accent-glow: rgba(255, 107, 0, 0.25);
  --bg-dark: #0A1628;
  --bg-card: #0D1F3C;
  --border: #1A3A5C;
  --text-primary: #FFFFFF;
  --text-secondary: #E0E0E0;
  --text-muted: #888888;

  background: var(--bg-dark);
  margin: 0 calc(var(--space-outer, 24px) * -1);
  padding: 60px var(--space-outer, 24px);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Header */
.contrib-header { text-align: center; margin-bottom: 48px; }

.contrib-title {
  font-family: "Poppins", sans-serif;
  font-weight: 900;
  font-size: 2.5rem;
  letter-spacing: 0.02em;
  color: var(--text-primary);
  margin-bottom: 8px;

  @media (min-width: 768px) { font-size: 3.5rem; }
}

.contrib-subtitle { font-family: "Poppins", sans-serif; font-size: 1rem; color: var(--text-secondary); min-height: 1.5em; }
.contrib-typed { color: var(--accent); }
.contrib-cursor { color: var(--accent); animation: blink 0.7s step-end infinite; }

.contrib-divider {
  margin: 24px auto 0;
  width: 120px;
  height: 2px;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent-glow);
}

/* Stats */
.contrib-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-bottom: 48px;
  flex-wrap: wrap;
}

.contrib-stat {
  text-align: center;

  &-num {
    display: block;
    font-family: "Poppins", sans-serif;
    font-weight: 900;
    font-size: 2.5rem;
    color: var(--accent);
    text-shadow: 0 0 10px var(--accent-glow);
  }

  &-label {
    font-family: "Space Mono", monospace;
    font-size: 0.8rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

/* Grid */
.contrib-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 768px) { grid-template-columns: repeat(2, 1fr); }
}

/* Card */
.contrib-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  text-decoration: none;
  color: var(--text-primary);
  transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 0 20px var(--accent-glow);
    border-color: var(--accent);
  }

  &-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &-icon { font-size: 1.2rem; }

  &-type {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
    border: 1px solid;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &-date {
    font-size: 0.7rem;
    color: var(--text-muted);
    margin-left: auto;
  }

  &-title {
    font-family: "Poppins", sans-serif;
    font-weight: 800;
    font-size: 1.3rem;
    letter-spacing: 0.01em;
    line-height: 1.2;
  }

  &-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &-link {
    font-size: 0.8rem;
    color: var(--accent);
    font-weight: 600;
    margin-top: auto;
  }
}

/* Scroll animation */
.contrib-animate {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.contrib-visible {
  opacity: 1 !important;
  transform: translateY(0) !important;
}

.contrib-empty {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  padding: 40px 0;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
