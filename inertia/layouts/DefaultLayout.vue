<template>
  <SidebarProvider :default-open="sidebarOpenValue">
    <AppSidebar />
    <SidebarInset>
      <!-- Header -->
      <header
        class="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/70 px-6 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 md:px-4"
      >
        <div class="flex items-center gap-2">
          <!-- Sidebar Collapse Button -->
          <SidebarTrigger class="-ml-1 cursor-pointer" />

          <!-- Page Breadcrumbs -->
          <Breadcrumb v-if="breadcrumbs.length > 0">
            <BreadcrumbList>
              <template v-for="(item, index) in breadcrumbs" :key="index">
                <BreadcrumbItem>
                  <template v-if="index === breadcrumbs.length - 1">
                    <BreadcrumbPage>{{ item.title }}</BreadcrumbPage>
                  </template>
                  <template v-else>
                    <BreadcrumbLink as-child>
                      <Link :href="item.href ?? '#'">{{ item.title }}</Link>
                    </BreadcrumbLink>
                  </template>
                </BreadcrumbItem>
                <BreadcrumbSeparator v-if="index !== breadcrumbs.length - 1" />
              </template>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <!-- Main Content -->

      <slot />
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { SharedData } from '@adonisjs/inertia/types'
import { usePage, Link } from '@inertiajs/vue3'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import AppSidebar from '@/components/sidebar/AppSidebar.vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface Props {
  breadcrumbs?: any[]
}

withDefaults(defineProps<Props>(), {
  breadcrumbs: () => [],
})

const { props } = usePage<SharedData>()
const sidebarOpenValue = props.sidebarOpen === 'true' || props.sidebarOpen === true
</script>
