<template>
  <TabsContent data-slot="tabs-content" :class="cn('flex-1 outline-none', props.class)" v-bind="delegatedProps">
    <slot />
  </TabsContent>
</template>

<script setup lang="ts">
import { cn } from '@/assets/js/cn'
import { TabsContent, type TabsContentProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'

const props = defineProps<TabsContentProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>
