<template>
  <Separator
    data-slot="sidebar-separator"
    data-sidebar="separator"
    :class="cn('mx-2 w-auto bg-sidebar-border', props.class)"
  >
    <slot />
  </Separator>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/assets/js/cn'
import { Separator } from '@/components/ui/separator'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>
