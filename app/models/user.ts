import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { BaseModel, column, beforeCreate, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Role from '#models/role'
import ResourcePermission from '#models/resource_permission'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string // UUID

  @column()
  declare name: string | null

  @column()
  declare avatar: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Role)
  declare roles: ManyToMany<typeof Role>

  @hasMany(() => ResourcePermission)
  declare resourcePermissions: HasMany<typeof ResourcePermission>

  @beforeCreate()
  static assignUuid(user: User) {
    user.id = randomUUID()
  }

  async hasRole(roles: string | string[]): Promise<boolean> {
    if (!this.$preloaded.roles) {
      await (this as User).load('roles')
    }

    const checkRoles = Array.isArray(roles) ? roles : [roles]
    return this.roles.some((role) => checkRoles.includes(role.name))
  }
}
