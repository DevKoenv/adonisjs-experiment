<template>
  <RadioGroupRoot data-slot="radio-group" :class="cn('grid gap-3', props.class)" v-bind="forwarded">
    <slot />
  </RadioGroupRoot>
</template>

<script setup lang="ts">
import { cn } from '@/assets/js/cn'
import { RadioGroupRoot, type RadioGroupRootEmits, type RadioGroupRootProps, useForwardPropsEmits } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'

const props = defineProps<RadioGroupRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<RadioGroupRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>
