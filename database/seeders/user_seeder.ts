import User from '#models/user'
import Role from '#models/role'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password',
    })

    // Create moderator user
    const moderatorUser = await User.create({
      name: 'Moderator User',
      email: 'moderator@example.com',
      password: 'password',
    })

    // Create standard user (default role 'user' is assigned via afterCreate hook)
    const standardUser = await User.create({
      name: 'Standard User',
      email: 'user@example.com',
      password: 'password',
    })

    // Get roles
    const adminRole = await Role.findByOrFail('slug', 'admin')
    const moderatorRole = await Role.findByOrFail('slug', 'moderator')
    const userRole = await Role.findByOrFail('slug', 'user')

    // Assign roles to users
    await adminUser.related('roles').sync([adminRole.id])
    await moderatorUser.related('roles').sync([moderatorRole.id])
    await standardUser.related('roles').sync([userRole.id])
  }
}
