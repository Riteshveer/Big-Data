import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { SRGBColorSpace, TextureLoader } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import EventEmitter from "./EventEmitter";
import { sources } from "../sources";

import type { Texture } from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

const isProd = import.meta.env.PROD;

type ResourceType = Texture | GLTF;

class Resources extends EventEmitter<{
  ready: void;
  progress: number;
}> {
  highPrioritySources = sources.filter(s => s.priority === "high");
  lowPrioritySources = sources.filter(s => s.priority === "low");
  toLoad = this.highPrioritySources.length;
  isReady = false;
  loaded = 0;
  items: Record<string, any> = {};

  loaders: {
    gltfLoader: GLTFLoader;
    textureLoader: TextureLoader;
    fontLoader: FontLoader;
  };

  constructor() {
    super();

    this.loaders = {
      gltfLoader: new GLTFLoader(),
      textureLoader: new TextureLoader(),
      fontLoader: new FontLoader(),
    };
  }

  startLoading() {
    if (this.isReady) return;

    // Load high priority first
    for (const source of this.highPrioritySources) {
      this.loadSource(source);
    }
  }

  loadLowPriority() {
    for (const source of this.lowPrioritySources) {
      this.loadSource(source);
    }
  }

  loadSource(source: { name: string; type: string; path: string }) {
    if (source.type === "gltfModel") {
      this.loaders.gltfLoader.load(source.path, (file) => {
        this.sourceLoaded(source, file);
      });
    } else if (source.type === "texture") {
      this.loaders.textureLoader.load(source.path, (file: Texture) => {
        file.colorSpace = SRGBColorSpace;
        this.sourceLoaded(source, file);
      });
    }
  }

  sourceLoaded(source: { name: string; type: string; path: string }, file: ResourceType) {
    this.items[source.name] = file;

    this.loaded++;

    // Progress based on high-priority assets only
    const highProgress = Math.min(this.loaded / this.toLoad, 1);
    this.emit("progress", highProgress);

    if (this.loaded === this.toLoad && !this.isReady) {
      this.isReady = true;
      this.emit("ready");
      this.log("High-priority resources loaded — showing site");

      // Start loading low-priority assets in background
      setTimeout(() => this.loadLowPriority(), 100);
    }
  }

  log(message: string) {
    if (isProd) return;
    console.log(`[Resources] ${message}`);
  }
}

export const resources = new Resources();
resources.startLoading();
