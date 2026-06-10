import { playSound } from "../utils/sounds";
import { sprites } from "../definitions/sprites";
import { sceneWeights } from "../../../animations/scenes";
import { clamp } from "../../../utils/math";
import { projectVisible } from "../../../composables/useRouteObserver";

let hasPlayedSnore = false;

export const tick = () => {
  const volume = projectVisible.value ? 0 : clamp(sceneWeights.contact * 0.5, 0, 1);
  sprites.contact.howl.volume(volume);

  // Play snore only once per session when user arrives at contact
  if (!hasPlayedSnore && sceneWeights.contact > 0.3) {
    hasPlayedSnore = true;
    playSound("snore");
  }
};

export const stopSnoreRepetition = () => {
  // Nothing to clean up
};
