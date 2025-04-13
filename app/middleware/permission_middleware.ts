import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
// import AuthMiddlewareMissingException from '#exceptions/auth_middleware_missing_exception'

export default class PermissionMiddleware {
  /**
   * URL to redirect to when access is denied
   */
  redirectTo = '/unauthorized'

  async handle(ctx: HttpContext, next: NextFn, permissions: string) {
    // Ensure the auth middleware has run by checking if authentication has been verified
    if (!ctx.auth.isAuthenticated) {
      // throw new AuthMiddlewareMissingException()
      throw new Error(
        'Auth middleware has not run. Please ensure the auth middleware is registered before the permission middleware.',
      )
    }

    // Convert comma-separated permissions to array
    const requiredPermissions = permissions.split(',')

    // User should be guaranteed to exist at this point
    const user = ctx.auth.user!

    // Check if the user has at least one of the required permissions
    const hasPermission = await user
      .getAllPermissions()
      .then((userPermissions) => requiredPermissions.some((perm) => userPermissions.includes(perm)))

    if (!hasPermission) {
      return ctx.response.json({
        status: 403,
        message: 'You do not have permission to access this resource.',
        requiredPermissions: requiredPermissions,
        userPermissions: await user.getAllPermissions(),
      })
    }

    // User has required permission, proceed
    return next()
  }
}
