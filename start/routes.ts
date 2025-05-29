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
    router.on('/dashboard').renderInertia('Dashboard').as('dashboard')

    router.delete('/logout', [AuthenticatedSessionController, 'destroy']).as('logout')
  })
  .middleware(middleware.auth())
