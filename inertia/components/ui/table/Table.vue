<template>
  <div data-slot="table-container" class="relative w-full overflow-auto">
    <table data-slot="table" :class="cn('w-full caption-bottom text-sm', props.class)">
      <slot />
    </table>
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/assets/js/cn'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>
