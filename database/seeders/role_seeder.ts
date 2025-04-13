import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#models/role'
import Permission from '#models/permission'

export default class extends BaseSeeder {
  async run() {
    // First clear existing roles to avoid conflicts
    await Role.query().delete()

    await Role.create({
      name: 'User',
      slug: 'user',
      description: 'Basic user with limited permissions',
    })

    await Role.create({
      name: 'Moderator',
      slug: 'moderator',
      description: 'Can moderate content and users',
    })

    const adminRole = await Role.create({
      name: 'Administrator',
      slug: 'admin',
      description: 'Has full system access',
    })

    // Assign permissions to roles
    const permissions = await Permission.all()
    adminRole.related('permissions').sync(permissions.map((permission) => permission.id))
  }
}
