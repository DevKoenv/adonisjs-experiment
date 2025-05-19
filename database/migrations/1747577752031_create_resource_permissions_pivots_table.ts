import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'resource_permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()

      table.string('resource_type').notNullable().index()
      table.uuid('resource_id').notNullable().index()

      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE').index()
      table.uuid('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE').index()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
