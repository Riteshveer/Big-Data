import thumbnailCubeWar from "../../../assets/thumbnails/cubewar.webp";
import thumbnailStreakon from "../../../assets/thumbnails/streakon.webp";

import type { ProjectPreview } from "../../types";

export default [
  {
    title: "Customer Analytics Platform",
    slug: "streakon",
    thumbnail: thumbnailStreakon,
    description: "AI-powered big data analytics",
  },
  {
    title: "CubeWar",
    slug: "cubewar",
    thumbnail: thumbnailCubeWar,
    description: "Multiplayer strategy game",
  },
] as const satisfies ProjectPreview[];
