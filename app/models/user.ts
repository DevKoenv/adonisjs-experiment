import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, beforeCreate, manyToMany, afterCreate } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Role from '#models/role'
import { randomUUID } from 'node:crypto'

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

  /**
   * Checks if the user has a specific role or any of the specified roles,
   * taking into account the full role inheritance hierarchy.
   *
   * This method efficiently traverses the role hierarchy using a breadth-first
   * approach and supports circular references. It performs lazy loading of
   * parent roles only when needed.
   *
   * @param roles - Either a single role slug or an array of role slugs to check against
   * @returns A promise that resolves to true if the user has any of the specified roles (directly or through inheritance)
   *
   * @example
   * // Check for a single role
   * if (await user.hasRole('admin')) {
   *   // User has admin role or inherits from a role with admin privileges
   * }
   *
   * @example
   * // Check for multiple roles (returns true if user has ANY of these roles)
   * if (await user.hasRole(['admin', 'editor'])) {
   *   // User has either admin or editor role (or inherits from them)
   * }
   *
   * @example
   * // Check for "or" logic across multiple roles
   * if (await user.hasRole('admin') || await user.hasRole('superuser')) {
   *   // User has either admin or superuser role
   * }
   *
   * @example
   * // Check for "and" logic across multiple roles (requires separate calls)
   * if (await user.hasRole('editor') && await user.hasRole('reviewer')) {
   *   // User has both editor and reviewer roles
   * }
   */
  async hasRole(roles: string | string[]): Promise<boolean> {
    // Ensure roles are loaded
    if (!this.$preloaded.roles) {
      await (this as User).load('roles')
    }

    const checkRoles = new Set(Array.isArray(roles) ? roles : [roles])
    const visited = new Set<string>()
    const queue = [...this.roles]

    for (let i = 0; i < queue.length; i++) {
      const role = queue[i]

      if (!role || visited.has(role.id)) continue

      visited.add(role.id)

      // Check if this role matches any requested role
      if (checkRoles.has(role.slug)) return true

      // If parent roles aren't loaded, load them
      if (!role.$preloaded.parentRoles) {
        await role.load('parentRoles')
      }

      // Add all parent roles to the queue
      queue.push(...role.parentRoles)
    }

    return false
  }
}
