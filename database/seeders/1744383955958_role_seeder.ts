import Role from '#models/role'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  static environment = ['production', 'development', 'testing']

  async run() {
    await Role.createMany([
      {
        name: 'Admin',
        slug: 'admin',
        weight: 1,
      },
      {
        name: 'User',
        slug: 'user',
        weight: 0,
      },
    ])
  }
}
