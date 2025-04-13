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
const RegisteredUserController = () => import('#controllers/Auth/registered_user_controller')
const AuthenticatedSessionController = () => import('#controllers/Auth/authenticated_session_controller')

import Role from '#models/role'

router.on('/').renderInertia('home').as('home')

router
  .group(() => {
    router.get('/register', [RegisteredUserController, 'create']).as('register')
    router.post('/register', [RegisteredUserController, 'store']).as('register.store')

    router.get('/login', [AuthenticatedSessionController, 'create']).as('login')
    router.post('/login', [AuthenticatedSessionController, 'store']).as('login.store')
  })
  .middleware(middleware.guest())

router
  .group(() => {
    router.on('/dashboard').renderInertia('Dashboard').as('dashboard')

    router.delete('/logout', [AuthenticatedSessionController, 'destroy']).as('logout')
  })
  .middleware(middleware.auth())

router
  .group(() => {
    router.get('/test/post-create', async ({ auth }) => {
      const user = auth.user!
      const hasPermission = await user.hasPermission('post.create')
      return { permission: 'post.create', allowed: hasPermission }
    })

    router.get('/test/post-read', async ({ auth }) => {
      const user = auth.user!
      const hasPermission = await user.hasPermission('post.read')
      return { permission: 'post.read', allowed: hasPermission }
    })

    router.get('/test/post-update', async ({ auth }) => {
      const user = auth.user!
      const hasPermission = await user.hasPermission('post.update')
      return { permission: 'post.update', allowed: hasPermission }
    })

    router.get('/test/post-delete', async ({ auth }) => {
      const user = auth.user!
      const hasPermission = await user.hasPermission('post.delete')
      return { permission: 'post.delete', allowed: hasPermission }
    })

    router.get('/test/permissions/all', async ({ auth }) => {
      const user = auth.user!
      const permissions = await user.getAllPermissions()
      return { permissions }
    })
    router.get('/test/permissions/has-permission/:permission', async ({ auth, params }) => {
      const user = auth.user!
      const permission = params.permission
      const hasPermission = await user.hasPermission(permission)
      return { permission, allowed: hasPermission }
    })
  })

  .middleware([middleware.auth()])

router.get('/test/roles/all', async () => {
  const roles = await Role.query().preload('permissions')

  // Map the roles to a more readable format
  const formattedRoles = roles.map((role) => ({
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    permissions: role.permissions.map((permission) => permission.name),
  }))

  return formattedRoles
})
