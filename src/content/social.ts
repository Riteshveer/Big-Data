export const social = [
  { url: "mailto:riteshveer0326@gmail.com", name: "mail" },
  { url: "https://github.com/Riteshveer", name: "github" },
  { url: "https://www.linkedin.com/in/riteshveer", name: "linkedin" },
  { url: "https://x.com/DavidHckh", name: "x" },
  //{ url: "https://www.instagram.com/davidhckh/", name: "instagram" },
] as const satisfies { url: string; name: "mail" | "github" | "instagram" | "linkedin" | "x" }[];
