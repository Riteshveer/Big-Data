<script setup lang="ts">
import Github from "./icons/Github.vue";
import Linkedin from "./icons/Linkedin.vue";
import Instagram from "./icons/Instagram.vue";
import Mail from "./icons/Mail.vue";
import X from "./icons/X.vue";
import Link from "./Link.vue";
import { t } from "../i18n/utils/translate";
import ButtonRound from "./ButtonRound.vue";
import { ref, onMounted } from "vue";

import { social as staticSocial } from "../content/social";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

const props = defineProps<{
  variant?: "theme" | "background";
}>();

const social = ref([...staticSocial]);

// Override with admin settings
onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (res.ok) {
      const settings = await res.json();
      social.value = social.value.map(item => {
        if (item.name === "github" && settings.github_url) return { ...item, url: settings.github_url };
        if (item.name === "linkedin" && settings.linkedin_url) return { ...item, url: settings.linkedin_url };
        if (item.name === "x" && settings.x_url) return { ...item, url: settings.x_url };
        if (item.name === "mail" && settings.email) return { ...item, url: `mailto:${settings.email}` };
        return item;
      });
    }
  } catch { /* use static fallback */ }
});

// map icon names to components
const icons = {
  mail: Mail,
  github: Github,
  linkedin: Linkedin,
  x: X,
  instagram: Instagram,
} as const;

const getAriaLabel = (name: string) => `${t("go-to")} ${name.charAt(0).toUpperCase() + name.slice(1)}`;
</script>

<template>
  <div class="social">
    <Link
      v-for="item in social"
      :key="item.name"
      external
      :href="item.url"
      :aria-label="getAriaLabel(item.name)"
      class="social-link"
      data-cursor="circle-white"
    >
      <ButtonRound
        renderAs="div"
        :variant="props.variant ?? 'theme'"
        class="children-unclickable"
        data-hoversound="hover"
      >
        <component :is="icons[item.name]" :aria-label="getAriaLabel(item.name)" external />
      </ButtonRound>
    </Link>
  </div>
</template>

<style scoped lang="scss">
.social {
  display: flex;
  gap: var(--space-md);
}
</style>
