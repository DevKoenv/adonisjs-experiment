import { randomUUID } from 'node:crypto'
import { BaseModel, column, manyToMany, hasMany, beforeCreate } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Role from '#models/role'
import AccessControlEntry from '#models/access_control_entries'
import type { Permission as PermissionType } from '#constants/permissions'

export default class Permission extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string // UUID

  @column()
  declare name: PermissionType

  @column()
  declare description: string

  @manyToMany(() => Role, {
    pivotTable: 'role_permissions',
  })
  declare roles: ManyToMany<typeof Role>

  @hasMany(() => AccessControlEntry)
  declare accessControlEntries: HasMany<typeof AccessControlEntry>

  @beforeCreate()
  static assignUuid(permission: Permission) {
    permission.id = randomUUID()
  }
}
