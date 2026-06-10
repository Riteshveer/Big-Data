<script setup lang="ts">
import Header from "./components/Header.vue";
import { useTranslations } from "./i18n/composables/useTranslations";
import { usePreloader, preloaderVisible } from "./composables/usePreloader";
import Cursor from "./components/Cursor.vue";
import { useAgent } from "./composables/useAgent";
import { useMusic } from "./features/sounds/composables/useMusic";
import { useHowler, howlerUnlocked } from "./features/sounds/composables/useHowler";
import { useRouteObserver, path } from "./composables/useRouteObserver";
import Home from "./features/home/components/Home.vue";
import Project from "./features/projects/components/Project.vue";
import AdminPage from "./features/admin/AdminPage.vue";
import { useProjectTransition } from "./composables/useProjectTransition";
import { useScroll } from "./composables/useScroll";
import { projectVisible } from "./composables/useRouteObserver";
import ProjectBackground from "./features/projects/components/ProjectBackground.vue";
import { useClickSound } from "./features/sounds/composables/useClickSounds";
import { computed, ref, watch } from "vue";
import { Howler } from "howler";
//import { useHoverSound } from "./features/sounds/composables/useHoverSounds";

const { isTransitioning } = useProjectTransition();

const isAdmin = computed(() => path.value === "/admin");
const showTapOverlay = ref(false);

useTranslations();
usePreloader();
useMusic();
useHowler();
useScroll();
useRouteObserver();
useClickSound();
//useHoverSound();
const { isTouch } = useAgent();

// Show tap overlay on mobile after preloader finishes
watch(preloaderVisible, (visible) => {
  if (!visible && isTouch.value && !howlerUnlocked.value) {
    showTapOverlay.value = true;
  }
});

const handleTapEnter = () => {
  showTapOverlay.value = false;
  if (Howler.ctx && Howler.ctx.state !== "running") {
    Howler.ctx.resume();
  }
};
</script>

<template>
  <!-- Admin Panel (separate from portfolio) -->
  <AdminPage v-if="isAdmin" />

  <!-- Portfolio Site -->
  <template v-else>
    <!-- Mobile tap overlay to unlock audio -->
    <div v-if="showTapOverlay" class="tap-overlay" @click="handleTapEnter" @touchend="handleTapEnter">
      <p class="tap-overlay-text">Tap to enter</p>
    </div>

    <Header />

    <!-- main page -->
    <div :class="{ 'home-wrapper-projectIsReady': projectVisible }">
      <Home />
    </div>

    <!-- overlay page -->
    <ProjectBackground />
    <div
      class="project-wrapper"
      :class="{
        'project-wrapper-visible': projectVisible,
        'project-wrapper-transitioning': isTransitioning,
      }"
    >
      <div class="project-content">
        <Project />
      </div>
    </div>

    <Cursor v-if="!isTouch" />
  </template>
</template>

<style lang="scss">
.home-wrapper-projectIsReady {
  visibility: hidden;
  position: fixed;
  inset: 0;
}

.project-wrapper {
  position: fixed; /* <-- key */
  inset: 0;
  overflow: hidden; /* new page must NOT scroll during transition */
  z-index: var(--z-index-layout-project);
  visibility: hidden;
  pointer-events: none; /* avoid interaction before fully opened */

  &-visible {
    visibility: visible;
    pointer-events: auto;
    position: static;
  }
}

.project-content {
  width: 100%;
  height: 100%;
  overflow: hidden; /* ensure no scroll container */
}

.tap-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(2px);
  animation: tapFadeIn 0.3s ease;
}

.tap-overlay-text {
  color: #fff;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 16px 32px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  animation: tapPulse 1.5s ease-in-out infinite;
}

@keyframes tapFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes tapPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}
</style>
