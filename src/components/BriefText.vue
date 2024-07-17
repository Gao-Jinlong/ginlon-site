<script setup lang="ts">
import useTypewriter from '../composables/useTypeWriter';
const props = defineProps<{
  briefs: string[];
}>();

const { text, blink } = useTypewriter({
  content: props.briefs,
  speed: 60,
  hold: 2500,
  loop: true,
});
</script>

<template>
  <div>{{ text }}{{ blink ? '|' : '' }}</div>
</template>

<style lang="scss" scoped></style>
