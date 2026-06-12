import { playSound } from "../utils/sounds";
import { sprites } from "../definitions/sprites";
import { sceneWeights } from "../../../animations/scenes";
import { clamp } from "../../../utils/math";
import { projectVisible } from "../../../composables/useRouteObserver";

let hasPlayedSnore = false;
let wasOnContact = false;
let snoreId: number | undefined;

export const tick = () => {
  const volume = projectVisible.value ? 0 : clamp(sceneWeights.contact * 0.5, 0, 1);
  sprites.contact.howl.volume(volume);

  const onContact = sceneWeights.contact > 0.1;

  // Play snore only once per session when user first enters contact zone
  if (onContact && !wasOnContact && !hasPlayedSnore) {
    hasPlayedSnore = true;
    snoreId = playSound("snore");
    if (snoreId !== undefined) {
      sprites.contact.howl.volume(0.8, snoreId);
    }
  }

  wasOnContact = onContact;
};

// Called by wakeUp in avatar animations — stop snore immediately when gasp plays
export const stopSnoreRepetition = () => {
  if (snoreId !== undefined) {
    sprites.contact.howl.stop(snoreId);
    snoreId = undefined;
  }
};
