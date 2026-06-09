<script setup lang="ts">
import { computed } from "vue";
import { tagLabels, type TagVariant } from "./tagVariants";

const props = defineProps<{
  variant: TagVariant;
}>();

const classes = computed(() => ["tag", `tag-variant-${props.variant}`]);
</script>

<template>
  <div :class="classes">
    <p class="tag-copy">{{ tagLabels[props.variant] }}</p>
  </div>
</template>

<style scoped lang="scss">
.tag {
  border-radius: var(--radius-md);
  padding: calc(var(--space-xxs) - var(--stroke-md)) calc(var(--space-sm  ) - var(--stroke-md));
  border: var(--stroke-md) solid transparent;

  &-copy {
    font-size: var(--font-size-xs);
    font-weight: 700;
  }

  &-variant {
    &-three {
      background-color: #ed9c55;
      color: #492708;
    }

    &-react {
      background-color: #61dafb;
      color: #0f2e36;
    }

    &-websockets {
      background-color: #2674a4;
      color: white;
    }

    &-redis {
      background-color: #ce4036;
      color: white;
    }

    &-html {
      color: var(--color-text-400);
      border-color: var(--color-grayscale-400);
    }

    &-css {
      color: var(--color-text-400);
      border-color: var(--color-grayscale-400);
    }

    &-javascript {
      background-color: #ffdf4f;
      color: #362d03;
    }

    &-node {
      background-color: #237d23;
      color: white;
    }

    &-next {
      background-color: white;
      color: black;
    }

    &-kubernetes {
      background-color: #326ce5;
      color: white;
    }

    &-postgresql {
      background-color: #2f6c92;
      color: white;
    }

    &-ogl {
      background-color: #0e5495;
      color: white;
    }

    &-glsl {
      background-color: #95630e;
      color: white;
    }

    &-pyspark {
      background-color: #e25a1c;
      color: white;
    }

    &-kafka {
      background-color: #231f20;
      color: white;
    }

    &-airflow {
      background-color: #017cee;
      color: white;
    }

    &-hadoop {
      background-color: #d4a928;
      color: #1a1200;
    }

    &-hive {
      background-color: #fdee21;
      color: #333;
    }

    &-databricks {
      background-color: #ff3621;
      color: white;
    }

    &-deltalake {
      background-color: #00add4;
      color: white;
    }

    &-snowflake {
      background-color: #29b5e8;
      color: white;
    }

    &-tensorflow {
      background-color: #ff6f00;
      color: white;
    }

    &-mlflow {
      background-color: #0194e2;
      color: white;
    }

    &-fastapi {
      background-color: #009688;
      color: white;
    }

    &-docker {
      background-color: #2496ed;
      color: white;
    }

    &-powerbi {
      background-color: #f2c811;
      color: #1a1200;
    }

    &-grafana {
      background-color: #f46800;
      color: white;
    }

    &-python {
      background-color: #3776ab;
      color: white;
    }
  }
}
</style>
