<template>
  <div
    data-slot="card"
    :class="cn('flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm', props.class)"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/assets/js/cn'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>
