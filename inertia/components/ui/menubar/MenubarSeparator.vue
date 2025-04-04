<template>
  <MenubarSeparator
    data-slot="menubar-separator"
    :class="cn('-mx-1 my-1 h-px bg-border', props.class)"
    v-bind="forwardedProps"
  />
</template>

<script setup lang="ts">
import { cn } from '@/assets/js/cn'
import { MenubarSeparator, type MenubarSeparatorProps, useForwardProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'

const props = defineProps<MenubarSeparatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>
