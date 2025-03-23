import type { RouteJSON } from '@adonisjs/core/types/http'

export class UrlBuilder {
  /**
   * Params to be used for building the URL
   */
  private routeParams: Record<string, any> | any[] = {}

  /**
   * Additional wildcard segments for routes with '*'
   */
  private wildcardSegments: string[] = []

  /**
   * A custom query string to append to the URL
   */
  private queryString: Record<string, any> = {}

  /**
   * BaseURL to prefix to the endpoint
   */
  private baseUrl: string = ''

  constructor(private routes: Record<string, RouteJSON[]>) {}

  /**
   * Processes the pattern with the route params
   */
  private processPattern(pattern: string): string {
    let url: string[] = []
    const isParamsAnArray = Array.isArray(this.routeParams)

    /*
     * Split pattern when route has dynamic segments
     */
    const tokens = pattern.split('/')
    let paramsIndex = 0

    for (const token of tokens) {
      /**
       * Expected wildcard param to be at the end always and hence
       * we must break out from the loop
       */
      if (token === '*') {
        // First check the traditional way (* property in object)
        let wildcardParams: string[] = []

        if (isParamsAnArray) {
          // Fix the array index type error by properly casting the array slice
          const arrayParams = this.routeParams as any[]
          wildcardParams = arrayParams.slice(paramsIndex) as string[]
        } else {
          // Handle wildcard segments for object parameters
          const objParams = this.routeParams as Record<string, any>

          // Check if there's a '*' property in the params object and it's an array
          if (objParams && '*' in objParams && Array.isArray(objParams['*'])) {
            wildcardParams = objParams['*'] as string[]
          } else {
            // Use the additional wildcardSegments passed through the wildcards method
            wildcardParams = this.wildcardSegments
          }
        }

        if (wildcardParams.length > 0) {
          url = url.concat(wildcardParams)
        }
        break
      }

      /**
       * Token is a static value
       */
      if (!token.startsWith(':')) {
        url.push(token)
      } else {
        const isOptional = token.endsWith('?')
        const paramName = token.replace(/^:/, '').replace(/\?$/, '')

        // Fix the indexing type error
        let param: any
        if (isParamsAnArray) {
          const arrayParams = this.routeParams as any[]
          param = arrayParams[paramsIndex]
        } else {
          const objParams = this.routeParams as Record<string, any>
          param = objParams[paramName]
        }

        paramsIndex++

        /*
         * A required param is always required to make the complete URL
         */
        if (!param && !isOptional) {
          throw new Error(`"${paramName}" param is required to make URL for "${pattern}" route`)
        }

        url.push(param)
      }
    }

    return url.join('/')
  }

  /**
   * Finds the route inside the list of registered routes and
   * raises exception when unable to
   */
  private findRouteOrFail(identifier: string): string {
    // Loop through all domains and find a route with matching name
    for (const domain in this.routes) {
      const routeList = this.routes[domain]
      const route = routeList.find((r) => r.name === identifier)
      if (route) {
        return route.pattern
      }
    }
    throw new Error(`Cannot find route for "${identifier}"`)
  }

  /**
   * Suffix the query string to the URL
   */
  private suffixQueryString(url: string): string {
    if (this.queryString && Object.keys(this.queryString).length > 0) {
      const params = new URLSearchParams()

      for (const [key, value] of Object.entries(this.queryString)) {
        if (Array.isArray(value)) {
          value.forEach((item) => params.append(key, item))
        } else {
          params.set(key, value)
        }
      }

      const encoded = params.toString()
      url = encoded ? `${url}?${encoded}` : url
    }

    return url
  }

  /**
   * Add wildcard segments for routes with wildcards (*)
   */
  public wildcards(...segments: string[]): this {
    this.wildcardSegments = segments
    return this
  }

  /**
   * Prefix a custom url to the final URI
   */
  public prefixUrl(url?: string): this {
    if (url) {
      this.baseUrl = url
    }
    return this
  }

  /**
   * Append query string to the final URI
   */
  public qs(queryString?: Record<string, any>): this {
    if (queryString) {
      this.queryString = queryString
    }
    return this
  }

  /**
   * Define required params to resolve the route
   */
  public params(params?: Record<string, any> | any[]): this {
    if (params) {
      this.routeParams = params
    }
    return this
  }

  /**
   * Generate url for the given route identifier
   */
  public make(identifier: string): string {
    const pattern = this.findRouteOrFail(identifier)
    const url = this.processPattern(pattern)
    return this.suffixQueryString(
      this.baseUrl ? `${this.baseUrl}/${url}`.replace(/\/+/g, '/') : url
    )
  }
}
