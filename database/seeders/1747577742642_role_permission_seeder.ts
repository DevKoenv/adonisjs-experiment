import Permission from '#models/permission'
import Role from '#models/role'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  static environment = ['production', 'development', 'testing']

  async run() {
    const permissions = await Permission.all()
    const adminRole = await Role.findBy('slug', 'admin')

    if (adminRole) {
      const attachData = Object.fromEntries(permissions.map((p) => [p.id, { value: true }]))
      await adminRole.related('permissions').attach(attachData)
    }
  }
}
