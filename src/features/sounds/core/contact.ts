import { playSound } from "../utils/sounds";
import { sprites } from "../definitions/sprites";
import { sceneWeights } from "../../../animations/scenes";
import { clamp } from "../../../utils/math";
import { projectVisible } from "../../../composables/useRouteObserver";
import gsap from "gsap";

const SNORE_INTERVAL = 2.0833332538604736 * 2;

let snoreTimeout: gsap.core.Tween | null = null;
let currentId: number | undefined;
let snoreStarted = false;

const scheduleNextSnore = () => {
  if (snoreTimeout) {
    snoreTimeout.kill();
  }

  snoreTimeout = gsap.delayedCall(SNORE_INTERVAL, () => {
    if (sceneWeights.contact > 0.01) {
      currentId = playSound("snore");
    }
    scheduleNextSnore();
  });
};

export const tick = () => {
  const volume = projectVisible.value ? 0 : clamp(sceneWeights.contact * 0.5, 0, 1);
  sprites.contact.howl.volume(volume);

  // Start snore loop only when user first reaches contact section
  if (!snoreStarted && sceneWeights.contact > 0.01) {
    snoreStarted = true;
    currentId = playSound("snore");
    scheduleNextSnore();
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
};
