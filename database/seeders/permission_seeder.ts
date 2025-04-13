import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Permission from '#models/permission'

export default class PermissionSeeder extends BaseSeeder {
  public async run() {
    await Permission.createMany([
      { name: 'post.create' },
      { name: 'post.read' },
      { name: 'post.update' },
      { name: 'post.delete' },
    ])
  }
}
