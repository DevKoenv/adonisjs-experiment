import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, manyToMany, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Permission from '#models/permission'
import AccessControlEntry from '#models/access_control_entries'

export default class Role extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string // UUID

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare weight: number

  @manyToMany(() => User, {
    pivotTable: 'user_roles',
    pivotTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
  })
  declare users: ManyToMany<typeof User>

  @manyToMany(() => Permission, {
    pivotTable: 'role_permissions',
    pivotColumns: ['value'],
  })
  declare permissions: ManyToMany<typeof Permission>

  @hasMany(() => AccessControlEntry)
  declare accessControlEntries: HasMany<typeof AccessControlEntry>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static assignUuid(role: Role) {
    role.id = randomUUID()
  }
}
