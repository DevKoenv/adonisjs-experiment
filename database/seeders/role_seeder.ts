import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#models/role'

export default class extends BaseSeeder {
  async run() {
    // First clear existing roles to avoid conflicts
    await Role.query().delete()

    // Create all the roles
    const guestRole = await Role.create({
      name: 'Guest',
      slug: 'guest',
      description: 'Can view content but cannot create or edit',
    })

    const userRole = await Role.create({
      name: 'User',
      slug: 'user',
      description: 'Basic user with limited permissions',
    })

    const moderatorRole = await Role.create({
      name: 'Moderator',
      slug: 'moderator',
      description: 'Can moderate content and users',
    })

    const adminRole = await Role.create({
      name: 'Administrator',
      slug: 'admin',
      description: 'Has full system access',
    })

    // Set up the inheritance hierarchy
    // User inherits from Guest
    await userRole.related('parentRoles').attach([guestRole.id])

    // Moderator inherits from User
    await moderatorRole.related('parentRoles').attach([userRole.id])

    // Admin inherits from Moderator
    await adminRole.related('parentRoles').attach([moderatorRole.id])
  }
}
