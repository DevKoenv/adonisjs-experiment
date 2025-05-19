import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'role_permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE').index()
      table.uuid('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE').index()

      table.primary(['role_id', 'permission_id'])

      table.timestamp('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
