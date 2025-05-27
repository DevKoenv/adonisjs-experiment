import User from '#models/user'
import { Permission } from '#constants/permissions'
import PermissionModel from '#models/permission'
import ResourcePermission from '#models/resource_permission'

type ResourceType = string
type ResourceId = string | number

interface PermissionContext {
  user?: User
  permission?: Permission
  resourceType?: ResourceType
  resourceId?: ResourceId
  ownerId?: string
}

export interface PermissionDebugResult {
  allowed: boolean
  reason: string
  details?: any
}

/**
 * Evaluates whether the current user has the requested permission in the current context.
 *
 * @remarks
 * Follows the strict evaluation order: root, ACL, ownership, user, role, default deny.
 *
 * @example
 * ```typescript
 * const allowed = await PermissionService.builder()
 *   .user(user)
 *   .permission('document.edit')
 *   .resource('document', 'resource-uuid')
 *   .owner('user-uuid')
 *   .check();
 * ```
 *
 * @returns {Promise<boolean>} True if allowed, false otherwise.
 * @author DevKoenv
 */
export class PermissionService {
  private ctx: PermissionContext = {}

  static builder(): PermissionService {
    return new PermissionService()
  }

  user(user: User): this {
    this.ctx.user = user
    return this
  }

  permission(permission: Permission): this {
    this.ctx.permission = permission
    return this
  }

  resource(type: ResourceType, id: ResourceId): this {
    this.ctx.resourceType = type
    this.ctx.resourceId = id
    return this
  }

  owner(ownerId: string): this {
    this.ctx.ownerId = ownerId
    return this
  }

  async check(): Promise<boolean> {
    const ctx = this.ctx
    if (!ctx.user || !ctx.permission) throw new Error('User and permission must be set')
    const userId: string = ctx.user.id

    // 1. Root '*' permission always grants access (user or any role)
    if (await this._hasUserOrRolePermission(userId, '*')) return true

    // 2. ACL (resource-specific, no wildcards)
    if (ctx.resourceType && ctx.resourceId !== undefined) {
      const permissionModel = await PermissionModel.findBy('name', ctx.permission)
      if (permissionModel) {
        const acl = await ResourcePermission.findBy({
          user_id: userId,
          permission_id: permissionModel.id,
          resource_type: ctx.resourceType,
          resource_id: String(ctx.resourceId),
        })
        if (acl) return Boolean(acl.value)
      }
    }

    // 3. Ownership Check (if resource has owner)
    if (ctx.resourceType && ctx.resourceId !== undefined && ctx.ownerId) {
      if (ctx.ownerId === userId) {
        // User is owner: only check base permission (never .others)
        if (await this._hasUserOrRolePermission(userId, ctx.permission)) return true
        return false
      } else {
        // User is not owner: must have BOTH base and .others permission
        if (
          (await this._hasUserOrRolePermission(userId, ctx.permission)) &&
          (await this._hasUserOrRolePermission(userId, `${ctx.permission}.others`))
        ) {
          return true
        }
        return false
      }
    }

    // 4. User direct permission (wildcards supported)
    const userPerm = await this._findUserPermission(userId, ctx.permission)
    if (userPerm !== undefined) return userPerm

    // 5. Role-based permission (wildcards supported)
    const rolePerm = await this._findRolePermission(userId, ctx.permission)
    if (rolePerm !== undefined) return rolePerm

    // 6. Default deny
    return false
  }

  async debug(): Promise<PermissionDebugResult> {
    const ctx = this.ctx
    if (!ctx.user || !ctx.permission) throw new Error('User and permission must be set')
    const userId: string = ctx.user.id

    // 1. Root '*' permission always grants access (user or any role)
    if (await this._hasUserOrRolePermission(userId, '*')) {
      return {
        allowed: true,
        reason: "User or one of user's roles has root '*' permission",
      }
    }

    // 2. ACL (resource-specific, no wildcards)
    if (ctx.resourceType && ctx.resourceId !== undefined) {
      const permissionModel = await PermissionModel.findBy('name', ctx.permission)
      if (permissionModel) {
        const acl = await ResourcePermission.findBy({
          user_id: userId,
          permission_id: permissionModel.id,
          resource_type: ctx.resourceType,
          resource_id: String(ctx.resourceId),
        })

        if (acl) {
          return {
            allowed: Boolean(acl.value),
            reason: `ACL entry for user on resource (${ctx.resourceType}:${ctx.resourceId}) with permission '${ctx.permission}'`,
            details: { acl },
          }
        }
      }
    }

    // 3. Ownership Check (if resource has owner)
    if (ctx.resourceType && ctx.resourceId !== undefined && ctx.ownerId) {
      if (ctx.ownerId === userId) {
        // User is owner: only check base permission (never .others)
        if (await this._hasUserOrRolePermission(userId, ctx.permission)) {
          return {
            allowed: true,
            reason: `User is owner and has base permission '${ctx.permission}'`,
          }
        }
        return {
          allowed: false,
          reason: `User is owner but lacks base permission '${ctx.permission}'`,
        }
      } else {
        // User is not owner: must have BOTH base and .others permission
        const hasBase = await this._hasUserOrRolePermission(userId, ctx.permission)
        const hasOthers = await this._hasUserOrRolePermission(userId, `${ctx.permission}.others`)
        if (hasBase && hasOthers) {
          return {
            allowed: true,
            reason: `User is not owner but has both base ('${ctx.permission}') and .others ('${ctx.permission}.others') permissions`,
          }
        }
        if (!hasBase && !hasOthers) {
          return {
            allowed: false,
            reason: `User is not owner and lacks both base ('${ctx.permission}') and .others ('${ctx.permission}.others') permissions`,
          }
        }
        if (!hasBase) {
          return {
            allowed: false,
            reason: `User is not owner and lacks base permission '${ctx.permission}'`,
          }
        }
        return {
          allowed: false,
          reason: `User is not owner and lacks .others permission '${ctx.permission}.others'`,
        }
      }
    }

    // 4. User direct permission (wildcards supported)
    const userPerm = await this._findUserPermission(userId, ctx.permission)
    if (userPerm !== undefined) {
      return {
        allowed: userPerm,
        reason: `Direct user permission${userPerm ? ' grants' : ' denies'} '${ctx.permission}'`,
      }
    }

    // 5. Role-based permission (wildcards supported)
    const rolePerm = await this._findRolePermission(userId, ctx.permission)
    if (rolePerm !== undefined) {
      return {
        allowed: rolePerm,
        reason: `Role-based permission${rolePerm ? ' grants' : ' denies'} '${ctx.permission}'`,
      }
    }

    // 6. Default deny
    return {
      allowed: false,
      reason: 'No matching permission found, default deny',
    }
  }

  // --- Internal helpers ---

  /**
   * Returns true if user or any role has the specified permission (including wildcards).
   */
  private async _hasUserOrRolePermission(userId: string, permName: string): Promise<boolean> {
    // User direct
    if ((await this._findUserPermission(userId, permName)) === true) return true
    // Role
    if ((await this._findRolePermission(userId, permName)) === true) return true
    return false
  }

  /**
   * Find direct user permission (including wildcards). Returns true/false if found, else undefined.
   * (Direct user-permission assignment not implemented in schema, so always undefined.)
   */
  private async _findUserPermission(_userId: string, _permName: string): Promise<boolean | undefined> {
    //TODO: add a user_permissions table, implement lookup here.
    // For now, always undefined.
    return undefined
  }

  /**
   * Find role-based permission (including wildcards). Returns true/false if found, else undefined.
   */
  private async _findRolePermission(userId: string, permName: string): Promise<boolean | undefined> {
    const user = await User.find(userId)
    if (!user) return undefined
    await user.load('roles', (roleQuery) => {
      roleQuery.preload('permissions')
    })

    // Try exact match
    let permModel = await PermissionModel.findBy('name', permName)
    if (permModel) {
      const grants = PermissionService._collectRoleGrants(user, permModel.id)
      if (grants.length > 0) return PermissionService._resolveGrant(grants)
    }

    // Wildcard logic
    const parts = permName.split('.')
    if (parts.length >= 2) {
      if (parts.length === 3 && parts[2] === 'others') {
        const wildcardOthers = `${parts[0]}.*.others`
        permModel = await PermissionModel.findBy('name', wildcardOthers)
        if (permModel) {
          const grants = PermissionService._collectRoleGrants(user, permModel.id)
          if (grants.length > 0) return PermissionService._resolveGrant(grants)
        }
      }
      if (parts.length === 2) {
        const wildcard = `${parts[0]}.*`
        permModel = await PermissionModel.findBy('name', wildcard)
        if (permModel) {
          const grants = PermissionService._collectRoleGrants(user, permModel.id)
          if (grants.length > 0) return PermissionService._resolveGrant(grants)
        }
      }
    }

    // Global wildcard: '*'
    permModel = await PermissionModel.findBy('name', '*')
    if (permModel) {
      const grants = PermissionService._collectRoleGrants(user, permModel.id)
      if (grants.length > 0) return PermissionService._resolveGrant(grants)
    }

    return undefined
  }

  /**
   * Collects all grants/denials for a permission from the user's roles.
   */
  private static _collectRoleGrants(user: User, permissionId: string): { value: boolean; weight: number }[] {
    const grants: { value: boolean; weight: number }[] = []
    for (const role of user.roles) {
      for (const perm of role.permissions) {
        if (perm.id === permissionId) {
          const value = perm.$extras.pivot_value === true || perm.$extras.pivot_value === 1
          grants.push({ value, weight: role.weight })
        }
      }
    }
    return grants
  }

  /**
   * Resolves the final permission decision from all grants.
   * Uses the highest-weight role; if tied, deny wins.
   */
  private static _resolveGrant(grants: { value: boolean; weight: number }[]): boolean {
    grants.sort((a, b) => b.weight - a.weight)
    const topWeight = grants[0].weight
    const topGrants = grants.filter((g) => g.weight === topWeight)
    return !topGrants.some((g) => g.value === false)
  }
}
