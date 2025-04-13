import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { afterCreate, BaseModel, beforeCreate, column, manyToMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { randomUUID } from 'node:crypto'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Role from '#models/role'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

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

  @beforeCreate()
  static assignUuid(user: User) {
    user.id = randomUUID()
  }

  @afterCreate()
  static async assignDefaultRole(user: User) {
    const role = await Role.findByOrFail('slug', 'user')
    await user.related('roles').attach([role.id])
  }

  async hasRole(roles: string | string[]): Promise<boolean> {
    if (!this.$preloaded.roles) {
      await (this as User).load('roles')
    }

    const checkRoles = new Set(Array.isArray(roles) ? roles : [roles])
    return this.roles.some((role) => checkRoles.has(role.slug))
  }

  /**
   * Get a list of all permissions the user has, including those inherited from roles.
   */
  async getAllPermissions(): Promise<string[]> {
    if (!this.$preloaded.roles) {
      await (this as User).load('roles', (query) => {
        query.preload('permissions')
      })
    }

    const permissions = new Set<string>()
    this.roles.forEach((role) => {
      role.permissions.forEach((permission) => {
        permissions.add(permission.name)
      })
    })

    return Array.from(permissions)
  }

  /**
   * Check if the user has a specific permission.
   */
  async hasPermission(permissionName: string): Promise<boolean> {
    const permissions = await this.getAllPermissions()
    return permissions.includes(permissionName)
  }
}
