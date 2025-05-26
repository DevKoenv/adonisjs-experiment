/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import { PermissionService } from '#services/permission_service'
const RegisteredUserController = () => import('#controllers/Auth/registered_user_controller')
const AuthenticatedSessionController = () => import('#controllers/Auth/authenticated_session_controller')

router.on('/').renderInertia('home').as('home')

router
  .group(() => {
    router.get('/register', [RegisteredUserController, 'create']).as('register')
    router.post('/register', [RegisteredUserController, 'store'])

    router.get('/login', [AuthenticatedSessionController, 'create']).as('login')
    router.post('/login', [AuthenticatedSessionController, 'store'])
  })
  .middleware(middleware.guest())

router
  .group(() => {
    router
      .get('/me', async ({ auth, response }) => {
        const user = auth.user
        if (!user) {
          return response.status(401).json({ error: 'Unauthorized' })
        }

        await user.load('roles')
        await user.load('resourcePermissions')

        return response.json({ user })
      })
      .as('me')

    router.on('/dashboard').renderInertia('Dashboard').as('dashboard')

    router.delete('/logout', [AuthenticatedSessionController, 'destroy']).as('logout')
  })
  .middleware(middleware.auth())

// Test routes (for development purposes)
router
  .group(() => {
    // 1. Root '*' permission test
    router.get('/test/root', async ({ auth, response }) => {
      const user = auth.user!
      const allowed = await PermissionService.builder().user(user).permission('*').check()
      return response.json({ user: user?.id, permission: '*', allowed })
    })

    // 2. ACL allow/deny test (resource-specific)
    router.get('/test/acl/:resourceType/:resourceId/:perm', async ({ auth, params, response }) => {
      const user = auth.user!
      const allowed = await PermissionService.builder()
        .user(user)
        .permission(params.perm)
        .resource(params.resourceType, params.resourceId)
        .check()
      return response.json({
        user: user?.id,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        permission: params.perm,
        allowed,
      })
    })

    // 3. User direct permission test (wildcards supported)
    router.get('/test/user/:perm', async ({ auth, params, response }) => {
      const user = auth.user!
      const allowed = await PermissionService.builder().user(user).permission(params.perm).check()
      return response.json({ user: user?.id, permission: params.perm, allowed })
    })

    // 4. Role-based permission test (wildcards supported)
    router.get('/test/role/:perm', async ({ auth, params, response }) => {
      const user = auth.user!
      const allowed = await PermissionService.builder().user(user).permission(params.perm).check()
      return response.json({ user: user?.id, permission: params.perm, allowed })
    })

    // 5. Ownership test (user is owner)
    router.get('/test/owner/:resourceType/:resourceId/:perm/:ownerId', async ({ auth, params, response }) => {
      const user = auth.user!
      const allowed = await PermissionService.builder()
        .user(user)
        .permission(params.perm)
        .resource(params.resourceType, params.resourceId)
        .owner(params.ownerId)
        .check()
      return response.json({
        user: user?.id,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        permission: params.perm,
        ownerId: params.ownerId,
        allowed,
      })
    })

    // 6. .others permission test (user is NOT owner)
    router.get('/test/others/:resourceType/:resourceId/:perm/:ownerId', async ({ auth, params, response }) => {
      const user = auth.user!
      const allowed = await PermissionService.builder()
        .user(user)
        .permission(params.perm)
        .resource(params.resourceType, params.resourceId)
        .owner(params.ownerId)
        .check()
      return response.json({
        user: user?.id,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        permission: params.perm,
        ownerId: params.ownerId,
        allowed,
      })
    })

    // 7. Default deny test (no grants anywhere)
    router.get('/test/deny/:perm', async ({ auth, params, response }) => {
      const user = auth.user!
      const allowed = await PermissionService.builder().user(user).permission(params.perm).check()
      return response.json({ user: user?.id, permission: params.perm, allowed })
    })

    // 8. Debug route: see why a permission is allowed/denied
    router.get('/test/debug/:perm', async ({ auth, params, request, response }) => {
      const user = auth.user!
      const resourceType = request.input('resourceType')
      const resourceId = request.input('resourceId')
      const ownerId = request.input('ownerId')

      const builder = PermissionService.builder().user(user).permission(params.perm)

      if (resourceType && resourceId !== undefined) {
        builder.resource(resourceType, resourceId)
      }
      if (ownerId) {
        builder.owner(ownerId)
      }

      const debugResult = await builder.debug()
      return response.json({
        user: user?.id,
        permission: params.perm,
        resourceType,
        resourceId,
        ownerId,
        ...debugResult,
      })
    })
  })
  .middleware(middleware.auth())
