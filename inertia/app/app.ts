// @ts-nocheck
/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />
/// <reference path="../types/global.d.ts" />
/// <reference types="vite/client" />

import '../css/app.css'
import { createApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import type { SharedProps } from '@adonisjs/inertia/types'
import { UrlBuilder } from '../utils/url_builder'
import type { RouteOptions } from '../types/global'
import type { DefineComponent } from 'vue'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

/**
 * Resolve Adonis route
 * @param routeName Route identifier
 * @param params Route path params
 * @param options Make url options
 * @returns Full path with params
 */
export function createRoute(routeName: string, params?: Record<string, any> | any[], options?: RouteOptions): string {
  return new UrlBuilder(window.routes as any)
    .params(params)
    .qs(options?.qs)
    .prefixUrl(options?.prefixUrl || (options?.absolute ? window.location.origin : undefined))
    .make(routeName)
}

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title: string) => `${title} - ${appName}`,

  resolve: (name: string) => {
    return resolvePageComponent(`../pages/${name}.vue`, import.meta.glob<DefineComponent>('../pages/**/*.vue'))
  },

  setup({ el, App, props, plugin }) {
    window.routes = props.initialPage.props.routes as SharedProps['routes']

    const app = createApp({ render: () => h(App, props) })

    app.config.globalProperties.$route = createRoute

    app.use(plugin).mount(el)
  },
})
