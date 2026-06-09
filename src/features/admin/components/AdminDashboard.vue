<script setup lang="ts">
import { ref } from "vue";
import { logout } from "../composables/useApi";
import SettingsPanel from "./SettingsPanel.vue";
import ProjectsPanel from "./ProjectsPanel.vue";
import UploadsPanel from "./UploadsPanel.vue";
import BlogPanel from "./BlogPanel.vue";

const activeTab = ref<"settings" | "projects" | "uploads" | "blog">("settings");

const tabs = [
  { id: "settings", label: "Settings", icon: "⚙️" },
  { id: "projects", label: "Projects", icon: "📁" },
  { id: "uploads", label: "Uploads", icon: "🖼️" },
  { id: "blog", label: "Blog", icon: "✍️" },
] as const;

const handleLogout = () => {
  logout();
  window.location.reload();
};

const goHome = () => {
  window.location.href = "/";
};
</script>

<template>
  <div class="dashboard">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">Portfolio CMS</h2>
        <p class="sidebar-user">ritesh</p>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['sidebar-nav-item', activeTab === tab.id && 'active']"
          @click="activeTab = tab.id"
        >
          <span class="sidebar-nav-icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </nav>
      <button class="sidebar-home" @click="goHome">← Back to Site</button>
      <button class="sidebar-logout" @click="handleLogout">Logout</button>
    </aside>

    <main class="main">
      <header class="main-header">
        <h1 class="main-title">{{ tabs.find(t => t.id === activeTab)?.label }}</h1>
      </header>
      <div class="main-content">
        <SettingsPanel v-if="activeTab === 'settings'" />
        <ProjectsPanel v-if="activeTab === 'projects'" />
        <UploadsPanel v-if="activeTab === 'uploads'" />
        <BlogPanel v-if="activeTab === 'blog'" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
  background: #0a0a0f;
  color: #e0e0e0;
}

.sidebar {
  width: 240px;
  background: #12141f;
  border-right: 1px solid #1e2235;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 0 20px 24px;
  border-bottom: 1px solid #1e2235;
}

.sidebar-title {
  font-size: 1.1rem;
  color: #fff;
  margin-bottom: 4px;
}

.sidebar-user {
  font-size: 0.75rem;
  color: #6b7394;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #8892b0;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  width: 100%;
}

.sidebar-nav-item:hover {
  background: #1a1d2e;
  color: #fff;
}

.sidebar-nav-item.active {
  background: #1e2a4a;
  color: #4fa3ff;
}

.sidebar-nav-icon {
  font-size: 1.1rem;
}

.sidebar-home {
  margin: 16px 12px 0;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #2e3250;
  background: transparent;
  color: #60a5fa;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.sidebar-home:hover {
  background: rgba(96, 165, 250, 0.1);
}

.sidebar-logout {
  margin: 16px 12px 0;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #2e3250;
  background: transparent;
  color: #ff4d6d;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.sidebar-logout:hover {
  background: rgba(255, 77, 109, 0.1);
}

.main {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
}

.main-header {
  padding: 24px 32px;
  border-bottom: 1px solid #1e2235;
  background: #0f1117;
}

.main-title {
  font-size: 1.3rem;
  color: #fff;
}

.main-content {
  padding: 32px;
  flex: 1;
  overflow-y: auto;
}
</style>
