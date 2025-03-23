import type { RouteJSON } from '@adonisjs/core/types/http'

/**
 * Options for route URL generation
 */
export interface RouteOptions {
  /**
   * Query parameters to append to the URL
   */
  qs?: Record<string, any>

  /**
   * Whether to generate an absolute URL with origin
   */
  absolute?: boolean

  /**
   * Custom prefix to prepend to the URL
   */
  prefixUrl?: string
}

declare global {
  interface Window {
    routes: Record<string, RouteJSON[]>
  }
}
