<template>
  <div
    :class="
      cn(
        'relative [&>[data-slot=input]]:has-[[data-slot=decrement]]:pl-5 [&>[data-slot=input]]:has-[[data-slot=increment]]:pr-5',
        props.class,
      )
    "
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
