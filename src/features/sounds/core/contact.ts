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

  // Play snore only once per session when user arrives at contact
  if (onContact && !wasOnContact && !hasPlayedSnore) {
    hasPlayedSnore = true;
    const snoreId = playSound("snore");
    if (snoreId !== undefined) {
      sprites.contact.howl.volume(0.8, snoreId);
    }
  }

  wasOnContact = onContact;
};

export const stopSnoreRepetition = () => {
  // Nothing to clean up
};
