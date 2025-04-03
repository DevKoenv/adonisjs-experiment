<template>
  <MenubarRoot
    data-slot="menubar"
    v-bind="forwarded"
    :class="cn('flex h-9 items-center gap-1 rounded-md border bg-background p-1 shadow-xs', props.class)"
  >
    <slot />
  </MenubarRoot>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'
import { MenubarRoot, type MenubarRootEmits, type MenubarRootProps, useForwardPropsEmits } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'

const props = defineProps<MenubarRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<MenubarRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>
