<template>
  <li data-slot="breadcrumb-item" :class="cn('inline-flex items-center gap-1.5', props.class)">
    <slot />
  </li>
</template>

<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cn } from '@/assets/js/cn'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>
