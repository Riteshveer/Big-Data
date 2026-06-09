import thumbnailCubeWar from "../../../assets/thumbnails/cubewar.webp";
import thumbnailStreakon from "../../../assets/thumbnails/streakon.webp";

import type { ProjectPreview } from "../../types";

export default [
  {
    title: "Kundenanalyse-Plattform",
    slug: "streakon",
    thumbnail: thumbnailStreakon,
    description: "KI-gestützte Big-Data-Analytik",
  },
  {
    title: "CubeWar",
    slug: "cubewar",
    thumbnail: thumbnailCubeWar,
    description: "Multiplayer-Strategiespiel",
  },
] as const satisfies ProjectPreview[];
