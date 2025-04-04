<template>
  <span
    data-slot="context-menu-shortcut"
    :class="cn('ml-auto text-xs tracking-widest text-muted-foreground', props.class)"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/assets/js/cn'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>
