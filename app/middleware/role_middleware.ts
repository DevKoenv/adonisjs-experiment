import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AuthMiddlewareMissingException from '#exceptions/auth_middleware_missing_exception'

/**
 * Role middleware ensures users have required roles to access resources
 * Following zero-trust principles - deny by default
 */
export default class RoleMiddleware {
  /**
   * URL to redirect to when access is denied
   */
  redirectTo = '/unauthorized'

  async handle(ctx: HttpContext, next: NextFn, roles: string) {
    // Ensure the auth middleware has run by checking if authentication has been verified
    if (!ctx.auth.isAuthenticated) {
      throw new AuthMiddlewareMissingException()
    }

    // Convert comma-separated roles to array
    const requiredRoles = roles.split(',')

    // User should be guaranteed to exist at this point
    const user = ctx.auth.user!
    const hasRole = await user.hasRole(requiredRoles)

    if (!hasRole) {
      return ctx.response.redirect(this.redirectTo)
    }

    // User has required role, proceed
    return next()
  }
}
