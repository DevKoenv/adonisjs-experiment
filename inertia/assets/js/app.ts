/// <reference path="../../../adonisrc.ts" />
/// <reference path="../../../config/inertia.ts" />
/// <reference types="vite/client" />

import '../css/app.css'
import { createApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import type { DefineComponent } from 'vue'
import { route } from '@izzyjs/route/client'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title: string) => `${title} - ${appName}`,

  resolve: (name: string) => {
    return resolvePageComponent(`../../pages/${name}.vue`, import.meta.glob<DefineComponent>('../../pages/**/*.vue'))
  },

  setup({ el, App, props, plugin }) {
    const app = createApp({ render: () => h(App, props) })

    app.config.globalProperties.$route = route

    app.use(plugin).mount(el)
  },
})
