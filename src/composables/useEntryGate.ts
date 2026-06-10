import { ref } from "vue";

export const userHasEntered = ref(sessionStorage.getItem("userHasEntered") === "true");
