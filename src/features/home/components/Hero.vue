<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Banner from "../../../components/Banner.vue";
import { preloaderVisible } from "../../../composables/usePreloader";
import { userHasEntered } from "../../../composables/useEntryGate";
import { t } from "../../../i18n/utils/translate";

// CONFIG
const PACKET_SPEED = 0.9;
const PACKET_COLORS = ["#4fa3ff", "#ff6b35"];
const LOOP_PAUSE_MS = 600;
const PACKET_START_DELAY_MS = 900;
const PACKET_W = 28;
const PACKET_H = 11;

const nameRef = ref(null);
const svgRef = ref(null);
const settled = ref(false);

let loopTimeout = null;
let animFrameId = null;

const handleAnimEnd = () => {
  settled.value = true;
};

// --- Packet animation logic ---
const getRoutes = () => {
  if (!nameRef.value || !svgRef.value) return [0, 0];
  const nameRect = nameRef.value.getBoundingClientRect();
  const svgRect = svgRef.value.getBoundingClientRect();
  const topOffset = nameRect.top - svgRect.top;
  return [
    topOffset + nameRect.height * 0.22,
    topOffset + nameRect.height * 0.72,
  ];
};

const createPacket = (color, filterId) => {
  const ns = "http://www.w3.org/2000/svg";
  const g = document.createElementNS(ns, "g");
  g.setAttribute("filter", `url(#${filterId})`);

  const rect = document.createElementNS(ns, "rect");
  rect.setAttribute("width", PACKET_W);
  rect.setAttribute("height", PACKET_H);
  rect.setAttribute("rx", "2");
  rect.setAttribute("fill", color);
  g.appendChild(rect);

  const highlight = document.createElementNS(ns, "rect");
  highlight.setAttribute("x", "3");
  highlight.setAttribute("y", "2");
  highlight.setAttribute("width", "18");
  highlight.setAttribute("height", "3");
  highlight.setAttribute("rx", "1");
  highlight.setAttribute("fill", "rgba(255,255,255,0.55)");
  g.appendChild(highlight);

  svgRef.value.appendChild(g);
  return g;
};

const spawnTrail = (x, y, color) => {
  const ns = "http://www.w3.org/2000/svg";
  const trail = document.createElementNS(ns, "rect");
  const tw = PACKET_W * 0.55;
  const th = PACKET_H * 0.7;
  trail.setAttribute("width", tw);
  trail.setAttribute("height", th);
  trail.setAttribute("rx", "1");
  trail.setAttribute("x", x - tw / 2 + PACKET_W / 2);
  trail.setAttribute("y", y - th / 2 + PACKET_H / 2);
  trail.setAttribute("fill", color);
  trail.setAttribute("opacity", "0.35");
  svgRef.value.appendChild(trail);

  let op = 0.35;
  const fade = setInterval(() => {
    op -= 0.04;
    if (op <= 0) {
      clearInterval(fade);
      trail.remove();
    } else {
      trail.setAttribute("opacity", `${op}`);
    }
  }, 25);
};

const animatePacket = (packetEl, routeY, color, onDone) => {
  if (!svgRef.value) return;
  const svgWidth = svgRef.value.clientWidth;
  let x = -PACKET_W - 10;
  const endX = svgWidth + 10;
  const cy = routeY - PACKET_H / 2;
  let frameCount = 0;

  const step = () => {
    x += PACKET_SPEED;
    packetEl.setAttribute("transform", `translate(${x - PACKET_W / 2}, ${cy})`);

    frameCount++;
    if (frameCount % 5 === 0) {
      spawnTrail(x, cy, color);
    }

    if (x < endX) {
      animFrameId = requestAnimationFrame(step);
    } else {
      onDone();
    }
  };

  animFrameId = requestAnimationFrame(step);
};

const runLoop = () => {
  if (!svgRef.value) return;
  const routes = getRoutes();

  const p1 = createPacket(PACKET_COLORS[0], "pg1");
  const p2 = createPacket(PACKET_COLORS[1], "pg2");
  let done = 0;

  const onDone = () => {
    done++;
    if (done === 2) {
      p1.remove();
      p2.remove();
      loopTimeout = setTimeout(runLoop, LOOP_PAUSE_MS);
    }
  };

  animatePacket(p1, routes[0], PACKET_COLORS[0], onDone);
  setTimeout(() => {
    animatePacket(p2, routes[1], PACKET_COLORS[1], onDone);
  }, 280);
};

onMounted(() => {
  loopTimeout = setTimeout(runLoop, PACKET_START_DELAY_MS);
});

onUnmounted(() => {
  if (loopTimeout) clearTimeout(loopTimeout);
  if (animFrameId) cancelAnimationFrame(animFrameId);
});
</script>

<template>
  <div class="hero">
    <div class="hero-content grid">
      <div class="hero-content-inner" id="hero-content-inner">
        <div class="hero-content-copys">
          <h1
            ref="nameRef"
            class="hero-title"
            :class="{ 'hero-title-settled': settled, 'hero-title-animate': userHasEntered }"
            @animationend="handleAnimEnd"
          >
            <span class="hero-title-line">Ritesh</span>
            <span class="hero-title-line hero-title-line-last">Veer</span>
          </h1>
          <Banner class="hero-banner" :copy="t('job-title')" v-if="!preloaderVisible && userHasEntered" animated />
        </div>

        <!-- Packet SVG overlay -->
        <svg ref="svgRef" class="hero-packets" aria-hidden="true">
          <defs>
            <filter id="pg1">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="pg2">
              <feGaussianBlur stdDeviation="2.0" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.hero {
  max-height: calc(var(--lvh) * 100);
  height: calc(var(--lvh) * 100);
  width: 100%;
  display: flex;
  position: relative;
  overflow: hidden;

  &-content {
    align-items: center;
    justify-content: center;
    height: 46%;

    @include mixins.landscape {
      height: 100%;

      @include mixins.mq("md") {
        padding-bottom: 30%;
      }

      @include mixins.mq("lg") {
        padding-bottom: 5%;
      }
    }

    &-inner {
      transform-origin: center center;
      grid-column: 1 / 13;
      gap: var(--space-xxl);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: fit-content;
      position: relative;
      left: 50%;
      transform: translateX(-50%);

      @include mixins.landscape {
        left: 0;
        transform: translateX(0);
        grid-column: 2 / 13;
        width: fit-content;
      }
    }

    &-copys {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      position: relative;

      @include mixins.mq("md") {
        gap: var(--space-md);
      }
    }
  }

  &-title {
    font-weight: 900;
    letter-spacing: 0.03em;
    font-size: var(--font-size-title-lg);
    line-height: 0.9;
    text-shadow: 4px 0 0 #ff6b35;
    opacity: 0;

    @include mixins.landscape {
      font-size: var(--font-size-title-lg);
    }

    @include mixins.landscape-large {
      @include mixins.mq("sm") {
        font-size: var(--font-size-title-xl);
      }

      @include mixins.mq("xl") {
        font-size: var(--font-size-title-xxl);
      }
    }

    &-animate {
      animation: glitchIn 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
    }

    &-line {
      display: block;
    }

    &-line-last {
      font-size: 1.1em;
      text-shadow: 5px 0 0 #ff6b35, -2px 0 0 rgba(255, 107, 53, 0.25);
    }

    &-settled {
      opacity: 1;
      animation: glitchFlicker 4s ease 0s infinite;
    }
  }

  &-banner {
    position: relative;
    bottom: auto;
    right: auto;
    z-index: 10;
    transform: none;
    margin-top: var(--space-md);
    opacity: 0;
    animation: glitchIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;

    @include mixins.mq("sm") {
      right: auto;
      transform: none;
    }

    @include mixins.mq("lg") {
      right: auto;
      transform: none;
    }
  }

  &-packets {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    pointer-events: none;
    overflow: visible;
  }
}

@keyframes glitchIn {
  0% {
    opacity: 0;
    transform: skewX(-20deg) translateX(-20px);
  }
  30% {
    opacity: 1;
    transform: skewX(5deg) translateX(4px);
  }
  60% {
    transform: skewX(-2deg) translateX(-1px);
  }
  100% {
    opacity: 1;
    transform: none;
  }
}

@keyframes glitchFlicker {
  0% {
    text-shadow: 4px 0 0 #ff6b35;
  }
  10% {
    text-shadow: -4px 0 0 #4fa3ff, 4px 0 0 #ff6b35;
    clip-path: inset(18% 0 65% 0);
  }
  12% {
    text-shadow: 4px 0 0 #ff6b35;
    clip-path: none;
  }
  22% {
    text-shadow: 3px 0 0 #ff4d6d, -3px 0 0 #4fa3ff;
    clip-path: inset(52% 0 28% 0);
  }
  24% {
    text-shadow: 4px 0 0 #ff6b35;
    clip-path: none;
  }
  100% {
    text-shadow: 4px 0 0 #ff6b35;
  }
}
</style>
