import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateRolePermissionsTable extends BaseSchema {
  protected tableName = 'role_permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('role_id').references('id').inTable('roles').onDelete('CASCADE')
      table.uuid('permission_id').references('id').inTable('permissions').onDelete('CASCADE')
      table.primary(['role_id', 'permission_id'])
      table.timestamp('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
