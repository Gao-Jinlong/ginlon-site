<script setup lang="ts">
import useTypewriter from '../composables/useTypeWriter';

const briefs = ['A Frontend Engineer', 'Coding Enthusiast', 'A Learner'];

const { text, blink } = useTypewriter({
  content: briefs,
  speed: 60,
  hold: 2500,
  loop: true,
});
</script>

<template>
  <div>{{ text }}</div>
</template>

<style lang="scss" scoped></style>
