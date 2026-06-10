import { playSound } from "../utils/sounds";
import { sprites } from "../definitions/sprites";
import { sceneWeights } from "../../../animations/scenes";
import { clamp } from "../../../utils/math";
import { projectVisible } from "../../../composables/useRouteObserver";

let hasPlayedSnore = false;
let wasOnContact = false;

export const tick = () => {
  const volume = projectVisible.value ? 0 : clamp(sceneWeights.contact * 0.5, 0, 1);
  sprites.contact.howl.volume(volume);

  const onContact = sceneWeights.contact > 0.3;

  // Play snore only once when user first arrives at contact section
  if (onContact && !wasOnContact && !hasPlayedSnore) {
    hasPlayedSnore = true;
    playSound("snore");
  }

  // Reset so it can play again if user leaves and comes back
  if (!onContact && wasOnContact) {
    hasPlayedSnore = false;
  }

  wasOnContact = onContact;
};

export const stopSnoreRepetition = () => {
  // Nothing to clean up — no repeating timers
};
