import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'role_user'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // UUID foreign keys
      table.uuid('user_id').notNullable()
      table.uuid('role_id').notNullable()

      // Foreign key constraints
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE')

      // Ensure each user-role combination is unique
      table.unique(['user_id', 'role_id'])

      table.timestamp('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
