import { createRegisteredUserValidator } from '#validators/registered_user'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class RegisteredUserController {
  /**
   * Display form to create a new record
   */
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/Register')
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, auth, response }: HttpContext) {
    // Validate request data
    const data = await request.validateUsing(createRegisteredUserValidator)

    // Create the user
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
    })

    // Log the user in
    await auth.use('web').login(user)

    // Redirect to dashboard
    return response.redirect('/dashboard')
  }
}
