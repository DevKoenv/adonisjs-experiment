<template>
  <Primitive data-slot="pin-input-group" v-bind="forwardedProps" :class="cn('flex items-center', props.class)">
    <slot />
  </Primitive>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'
import { Primitive, type PrimitiveProps, useForwardProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'

const props = defineProps<PrimitiveProps & { class?: HTMLAttributes['class'] }>()
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
const forwardedProps = useForwardProps(delegatedProps)
</script>
