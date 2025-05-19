import Permission from '#models/permission'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { PERMISSIONS } from '#constants/permissions'

export default class extends BaseSeeder {
  static environment = ['production', 'development', 'testing']

  async run() {
    for (const name of PERMISSIONS) {
      await Permission.firstOrCreate({ name })
    }
  }
}
