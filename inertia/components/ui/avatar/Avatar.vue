<template>
  <AvatarRoot data-slot="avatar" :class="cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', props.class)">
    <slot />
  </AvatarRoot>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/assets/js/cn'
import { AvatarRoot } from 'reka-ui'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>
