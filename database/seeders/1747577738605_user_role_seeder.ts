import Role from '#models/role'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  static environment = ['development', 'testing']

  async run() {
    // Get the users
    const adminUser = await User.findBy('email', 'admin@example.com')
    const johnUser = await User.findBy('email', 'john@example.com')

    // Get the roles
    const adminRole = await Role.findBy('slug', 'admin')
    const userRole = await Role.findBy('slug', 'user')

    // Link John to the user role
    if (johnUser && userRole) {
      await johnUser.related('roles').attach([userRole.id])
    }

    // Link admin to both admin and user roles
    if (adminUser && adminRole && userRole) {
      await adminUser.related('roles').attach([adminRole.id, userRole.id])
    }
  }
}
