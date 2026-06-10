import { playSound } from "../utils/sounds";
import { sprites } from "../definitions/sprites";
import { sceneWeights } from "../../../animations/scenes";
import { clamp } from "../../../utils/math";
import { projectVisible } from "../../../composables/useRouteObserver";
import gsap from "gsap";

const SNORE_INTERVAL = 8; // seconds between snores

let snoreTimeout: gsap.core.Tween | null = null;
let currentId: number | undefined;
let snoreStarted = false;

const scheduleNextSnore = () => {
  if (snoreTimeout) {
    snoreTimeout.kill();
  }

  snoreTimeout = gsap.delayedCall(SNORE_INTERVAL, () => {
    // Only play if still on the contact section
    if (sceneWeights.contact > 0.3) {
      currentId = playSound("snore");
      scheduleNextSnore();
    } else {
      // Stop the loop if user scrolled away
      snoreStarted = false;
    }
  });
};

export const tick = () => {
  const volume = projectVisible.value ? 0 : clamp(sceneWeights.contact * 0.5, 0, 1);
  sprites.contact.howl.volume(volume);

  // Start snore when user reaches contact section
  if (!snoreStarted && sceneWeights.contact > 0.3) {
    snoreStarted = true;
    currentId = playSound("snore");
    scheduleNextSnore();
  }

  // Stop snoring if user scrolls away
  if (snoreStarted && sceneWeights.contact < 0.1) {
    snoreStarted = false;
    if (snoreTimeout) {
      snoreTimeout.kill();
      snoreTimeout = null;
    }
  }
};

export const stopSnoreRepetition = () => {
  if (snoreTimeout) {
    snoreTimeout.kill();
    snoreTimeout = null;
  }
  if (currentId) {
    sprites.contact.howl.stop(currentId);
    currentId = undefined;
  }
  snoreStarted = false;
};
