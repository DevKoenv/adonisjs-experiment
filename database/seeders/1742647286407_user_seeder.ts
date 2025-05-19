import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  static environment = ['development', 'testing']

  async run() {
    await User.createMany([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password',
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password',
      },
    ])
  }
}
