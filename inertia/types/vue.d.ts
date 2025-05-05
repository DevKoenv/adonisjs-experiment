import { route } from '@izzyjs/route/client'

declare module 'vue' {
  interface ComponentCustomProperties {
    $route: typeof route
  }
}
