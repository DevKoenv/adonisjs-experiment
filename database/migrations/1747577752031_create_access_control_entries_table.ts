import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'access_control_entries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('granted_by_id').nullable().references('id').inTable('users').onDelete('SET NULL').index()

      table.string('resource_type').notNullable().index()
      table.uuid('resource_id').notNullable().index()

      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('CASCADE').index()
      table.uuid('role_id').nullable().references('id').inTable('roles').onDelete('CASCADE').index()
      table.uuid('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE').index()

      table.boolean('value').notNullable().defaultTo(true)

      table.primary(['user_id', 'permission_id', 'resource_type', 'resource_id'])

      table.check('(user_id IS NOT NULL AND role_id IS NULL) OR (user_id IS NULL AND role_id IS NOT NULL)')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
