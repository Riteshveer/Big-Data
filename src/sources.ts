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
  priority?: "high" | "low";
};

export const sources = [
  // HIGH PRIORITY — needed for initial scene
  { name: "room-model", type: "gltfModel", path: roomModel, priority: "high" },
  { name: "avatar-model", type: "gltfModel", path: avatarModel, priority: "high" },
  { name: "room-texture", type: "texture", path: roomTexture, priority: "high" },
  { name: "room-shadow-texture", type: "texture", path: roomShadowTexture, priority: "high" },
  { name: "desktops-texture", type: "texture", path: desktopsTexture, priority: "high" },
  { name: "diffuse-map", type: "texture", path: diffuseMap, priority: "high" },
  { name: "head-texture", type: "texture", path: headTexture, priority: "high" },
  { name: "face-texture", type: "texture", path: faceTexture, priority: "high" },
  { name: "matcap-black", type: "texture", path: matcapBlack, priority: "high" },
  { name: "matcap-gray", type: "texture", path: matcapGray, priority: "high" },
  { name: "matcap-skin", type: "texture", path: matcapSkin, priority: "high" },
  { name: "matcap-white", type: "texture", path: matcapWhite, priority: "high" },

  // LOW PRIORITY — loaded after site is visible
  { name: "lab-model", type: "gltfModel", path: labModel, priority: "low" },
  { name: "contact-model", type: "gltfModel", path: contactModel, priority: "low" },
  { name: "contact-texture", type: "texture", path: contactTexture, priority: "low" },
  { name: "contact-shadow-texture", type: "texture", path: contactShadowTexture, priority: "low" },
  { name: "hologram-plane-texture", type: "texture", path: hologramPlaneTexture, priority: "low" },
  { name: "icon-spritesheet", type: "texture", path: iconSpritesheet, priority: "low" },
  { name: "numbers-bitmap", type: "texture", path: numbersBitmap, priority: "low" },
] as const satisfies Source[];
