<template>
  <p :id="formDescriptionId" data-slot="form-description" :class="cn('text-sm text-muted-foreground', props.class)">
    <slot />
  </p>
</template>

<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cn } from '@/assets/js/cn'
import { useFormField } from './useFormField'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { formDescriptionId } = useFormField()
</script>
