import router from '@adonisjs/core/services/router'
import { defineConfig } from '@adonisjs/inertia'
import type { InferSharedProps } from '@adonisjs/inertia/types'

const inertiaConfig = defineConfig({
  rootView: 'app',

  sharedData: {
    routes: () => router.toJSON(),
  },

  ssr: {
    enabled: false,
    entrypoint: 'inertia/assets/js/ssr.ts',
  },
})

export default inertiaConfig

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig> {}
}
