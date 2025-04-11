import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'role_parents'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('role_id').references('id').inTable('roles').onDelete('CASCADE')
      table.uuid('parent_role_id').references('id').inTable('roles').onDelete('CASCADE')

      table.primary(['role_id', 'parent_role_id'])

      table.timestamp('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
