import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class AuthenticatedSessionController {
  /**
   * Display form to create a new record
   */
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/Login')
  }

  /**
   * Handle form submission for the create action
   */
  async store({ auth, request, response }: HttpContext) {
    // Validate request data
    const { email, password } = request.only(['email', 'password'])

    // Check if the user exists and verify credentials
    const user = await User.verifyCredentials(email, password)

    // Log the user in
    await auth.use('web').login(user)

    // Redirect to dashboard
    return response.redirect('/dashboard')
  }

  /**
   * Delete record
   */
  async destroy({ auth, response }: HttpContext) {
    // Log out the user
    await auth.use('web').logout()

    // Redirect to the login page
    return response.redirect('/login')
  }
}
