import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE').index()
      table.uuid('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE').index()

      table.boolean('value').notNullable().defaultTo(true)

      table.primary(['user_id', 'permission_id'])

      table.timestamp('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
