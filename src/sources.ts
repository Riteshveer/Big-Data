import avatarModel from "./assets/models/avatar.glb";
import labModel from "./assets/models/lab.glb";
import roomModel from "./assets/models/room.glb";
import contactModel from "./assets/models/contact.glb";

import contactTexture from "./assets/textures/contact.webp";
import contactShadowTexture from "./assets/textures/contact-shadow.webp";
import desktopsTexture from "./assets/textures/desktops.webp";
import diffuseMap from "./assets/textures/diffuse-map.png";
import faceTexture from "./assets/textures/face-spritesheet.png";
import headTexture from "./assets/textures/head.webp";
import iconSpritesheet from "./assets/textures/icon-spritesheet.webp";
import matcapBlack from "./assets/textures/matcap-black.webp";
import matcapGray from "./assets/textures/matcap-gray.webp";
import matcapSkin from "./assets/textures/matcap-skin.webp";
import matcapWhite from "./assets/textures/matcap-white.webp";
import numbersBitmap from "./assets/textures/numbers-bitmap.webp";
import roomTexture from "./assets/textures/room.webp";
import roomShadowTexture from "./assets/textures/room-shadow.webp";
import hologramPlaneTexture from "./assets/textures/hologram-plane.webp";

type Source = {
  name: string;
  type: "gltfModel" | "texture";
  path: string;
  stage: 1 | 2 | 3;
};

// Stage 1: Hero/Room scene (first page the user sees)
// Stage 2: About section (avatar details, lab)
// Stage 3: Contact section
export const sources = [
  // STAGE 1 — Room/Hero (first page)
  { name: "room-model", type: "gltfModel", path: roomModel, stage: 1 },
  { name: "room-texture", type: "texture", path: roomTexture, stage: 1 },
  { name: "room-shadow-texture", type: "texture", path: roomShadowTexture, stage: 1 },
  { name: "desktops-texture", type: "texture", path: desktopsTexture, stage: 1 },
  { name: "diffuse-map", type: "texture", path: diffuseMap, stage: 1 },
  { name: "matcap-black", type: "texture", path: matcapBlack, stage: 1 },
  { name: "matcap-gray", type: "texture", path: matcapGray, stage: 1 },
  { name: "matcap-white", type: "texture", path: matcapWhite, stage: 1 },
  { name: "numbers-bitmap", type: "texture", path: numbersBitmap, stage: 1 },

  // STAGE 2 — About section (avatar, lab, hologram)
  { name: "avatar-model", type: "gltfModel", path: avatarModel, stage: 2 },
  { name: "lab-model", type: "gltfModel", path: labModel, stage: 2 },
  { name: "head-texture", type: "texture", path: headTexture, stage: 2 },
  { name: "face-texture", type: "texture", path: faceTexture, stage: 2 },
  { name: "matcap-skin", type: "texture", path: matcapSkin, stage: 2 },
  { name: "hologram-plane-texture", type: "texture", path: hologramPlaneTexture, stage: 2 },
  { name: "icon-spritesheet", type: "texture", path: iconSpritesheet, stage: 2 },

  // STAGE 3 — Contact section
  { name: "contact-model", type: "gltfModel", path: contactModel, stage: 3 },
  { name: "contact-texture", type: "texture", path: contactTexture, stage: 3 },
  { name: "contact-shadow-texture", type: "texture", path: contactShadowTexture, stage: 3 },
] as const satisfies Source[];
