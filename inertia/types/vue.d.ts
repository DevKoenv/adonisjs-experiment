import '@vue/runtime-core'
import { RouteOptions } from './global'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    /**
     * Generate a URL for a named route
     * @param name The name of the route
     * @param params The parameters for the route
     * @param options Additional options for generating the URL
     */
    $route: (name: string, params?: Record<string, any> | any[], options?: RouteOptions) => string
  }
}
