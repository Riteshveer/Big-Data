import { onMounted, onUnmounted, ref, watch } from "vue";
import gsap from "gsap";
import { lerp } from "../../../utils/math";
import { Howler } from "howler";
import { isFeatureEnabled } from "../../../utils/features";
import { tick as contactTick } from "../core/contact";
import { stopSnoreRepetition } from "../core/contact";
import { tick as roomTick } from "../core/room";
import { sounds } from "../definitions/sounds";
import { getSoundsHowl } from "../utils/sounds";

import type { SoundKey } from "../types";

export const howlerUnlocked = ref(false);
export const soundsEnabled = ref(false);

Howler.volume(0);

export const useHowler = () => {
  const enabledVolume = ref<number>(0);

  const handleUnlocked = () => {
    if (howlerUnlocked.value) return;
    howlerUnlocked.value = true;

    // Always enable sounds on every visit (desktop + mobile)
    soundsEnabled.value = true;
  };

  const tick = () => {
    if (!howlerUnlocked.value) {
      if (!Howler.ctx || Howler.ctx.state !== "running") return;
      handleUnlocked();
    } else {
      // Process ambient sounds on all devices
      contactTick();
      roomTick();

      // Volume ramping works for both desktop and mobile
      const currentVolume = Howler.volume();
      if (currentVolume > 0.99 && enabledVolume.value === 1) {
        return;
      }
      const speed = enabledVolume.value === 1 ? 0.01 : 0.05;
      Howler.volume(lerp(currentVolume, enabledVolume.value, speed));
    }
  };

  const handleVisibilityChange = () => {
    Howler.mute(document.visibilityState === "hidden");
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.code === "KeyM") {
      soundsEnabled.value = !soundsEnabled.value;
    }
  };

  watch(soundsEnabled, (newVal) => {
    if (!isFeatureEnabled("sounds")) return;
    enabledVolume.value = newVal ? 1 : 0;
  });

  const loadAllSounds = () => {
    for (const sound of Object.keys(sounds) as SoundKey[]) {
      const howl = getSoundsHowl(sound);
      if (howl) {
        howl.load();
      }
    }
  };

  // Unlock audio context on first user interaction (required by all browsers)
  const setupUnlock = () => {
    const unlockAudio = () => {
      if (Howler.ctx) {
        if (Howler.ctx.state !== "running") {
          Howler.ctx.resume().then(() => {
            // Force a silent play to fully unlock on iOS
            Howler.volume(0);
          });
        }
      }
      // Remove all listeners after first successful unlock
      if (Howler.ctx && Howler.ctx.state === "running") {
        window.removeEventListener("touchstart", unlockAudio, true);
        window.removeEventListener("touchend", unlockAudio, true);
        window.removeEventListener("click", unlockAudio, true);
        window.removeEventListener("keydown", unlockAudio, true);
        window.removeEventListener("mousedown", unlockAudio, true);
        window.removeEventListener("pointerdown", unlockAudio, true);
        window.removeEventListener("pointerup", unlockAudio, true);
      }
    };
    // Use capture phase to fire before anything else
    // Note: browsers only allow audio unlock from trusted gestures: click, touchend, keydown, mousedown, pointerdown
    window.addEventListener("touchstart", unlockAudio, { capture: true });
    window.addEventListener("touchend", unlockAudio, { capture: true });
    window.addEventListener("click", unlockAudio, { capture: true });
    window.addEventListener("keydown", unlockAudio, { capture: true });
    window.addEventListener("mousedown", unlockAudio, { capture: true });
    window.addEventListener("pointerdown", unlockAudio, { capture: true });
    window.addEventListener("pointerup", unlockAudio, { capture: true });

    // Also try immediately in case context was already created
    unlockAudio();
  };

  onMounted(() => {
    if (!isFeatureEnabled("sounds")) return;
    Howler.volume(0);

    // On desktop, audio context might already be running — start immediately
    if (Howler.ctx && Howler.ctx.state === "running") {
      handleUnlocked();
    }

    if (howlerUnlocked.value) {
      soundsEnabled.value = true;
    }

    gsap.ticker.add(tick);
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleKeyPress);

    // Load sounds and setup unlock for ALL devices
    loadAllSounds();
    setupUnlock();
  });

  onUnmounted(() => {
    if (!isFeatureEnabled("sounds")) return;
    gsap.ticker.remove(tick);
    window.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("keydown", handleKeyPress);
    stopSnoreRepetition();
  });
};
