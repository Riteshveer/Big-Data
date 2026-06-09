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
  stage1Sources = sources.filter(s => s.stage === 1);
  stage2Sources = sources.filter(s => s.stage === 2);
  stage3Sources = sources.filter(s => s.stage === 3);

  toLoad = this.stage1Sources.length;
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

    // Only load stage 1 initially
    for (const source of this.stage1Sources) {
      this.loadSource(source);
    }
  }

  private loadSource(source: { name: string; type: string; path: string }) {
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

  private loadStage(stageSources: typeof sources) {
    for (const source of stageSources) {
      this.loadSource(source);
    }
  }

  sourceLoaded(source: { name: string; type: string; path: string }, file: ResourceType) {
    this.items[source.name] = file;
    this.loaded++;

    const progress = Math.min(this.loaded / this.toLoad, 1);
    this.emit("progress", progress);

    // Stage 1 complete — show the site
    if (this.loaded === this.stage1Sources.length && !this.isReady) {
      this.isReady = true;
      this.emit("ready");
      this.log("Stage 1 loaded — site visible");

      // Start loading stage 2 after a short delay
      setTimeout(() => {
        this.log("Loading stage 2...");
        this.loadStage(this.stage2Sources);
      }, 200);
    }

    // Stage 2 complete — load stage 3
    if (this.loaded === this.stage1Sources.length + this.stage2Sources.length) {
      this.log("Stage 2 loaded");
      setTimeout(() => {
        this.log("Loading stage 3...");
        this.loadStage(this.stage3Sources);
      }, 200);
    }

    // All done
    if (this.loaded === sources.length) {
      this.log("All resources loaded");
    }
  }

  log(message: string) {
    if (isProd) return;
    console.log(`[Resources] ${message}`);
  }
}

export const resources = new Resources();
resources.startLoading();
