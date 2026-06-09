<script setup lang="ts">
import Header from "./components/Header.vue";
import { useTranslations } from "./i18n/composables/useTranslations";
import { usePreloader } from "./composables/usePreloader";
import Cursor from "./components/Cursor.vue";
import { useAgent } from "./composables/useAgent";
import { useMusic } from "./features/sounds/composables/useMusic";
import { useHowler } from "./features/sounds/composables/useHowler";
import { useRouteObserver, path } from "./composables/useRouteObserver";
import Home from "./features/home/components/Home.vue";
import Project from "./features/projects/components/Project.vue";
import AdminPage from "./features/admin/AdminPage.vue";
import { useProjectTransition } from "./composables/useProjectTransition";
import { useScroll } from "./composables/useScroll";
import { projectVisible } from "./composables/useRouteObserver";
import ProjectBackground from "./features/projects/components/ProjectBackground.vue";
import { useClickSound } from "./features/sounds/composables/useClickSounds";
import { computed } from "vue";
//import { useHoverSound } from "./features/sounds/composables/useHoverSounds";

const { isTransitioning } = useProjectTransition();

const isAdmin = computed(() => path.value === "/admin");

useTranslations();
usePreloader();
useMusic();
useHowler();
useScroll();
useRouteObserver();
useClickSound();
//useHoverSound();
const { isTouch } = useAgent();
</script>

<template>
  <!-- Admin Panel (separate from portfolio) -->
  <AdminPage v-if="isAdmin" />

  <!-- Portfolio Site -->
  <template v-else>
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
</style>
