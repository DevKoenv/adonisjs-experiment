import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Role extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => User, {
    pivotTable: 'role_user',
  })
  declare users: ManyToMany<typeof User>

  // Parent roles that this role inherits from
  @manyToMany(() => Role, {
    pivotTable: 'role_parents',
    pivotForeignKey: 'role_id', // This role is the child
    pivotRelatedForeignKey: 'parent_role_id', // Related to parent roles
    relatedKey: 'id',
    localKey: 'id',
    serializeAs: null,
  })
  declare parentRoles: ManyToMany<typeof Role>

  // Child roles that inherit from this role
  @manyToMany(() => Role, {
    pivotTable: 'role_parents',
    pivotForeignKey: 'parent_role_id', // This role is the parent
    pivotRelatedForeignKey: 'role_id', // Related to child roles
    relatedKey: 'id',
    localKey: 'id',
    serializeAs: null,
  })
  declare childRoles: ManyToMany<typeof Role>

  @beforeCreate()
  static assignUuid(role: Role) {
    role.id = randomUUID()
  }
}
