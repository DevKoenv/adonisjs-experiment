import User from '#models/user'
import { Permission } from '#constants/permissions'
import PermissionModel from '#models/permission'
import ResourcePermission from '#models/resource_permission'

type ResourceType = string
type ResourceId = string | number

/**
 * Context object for permission checks.
 * @property user - The user instance or an object with an `id` property (UUID string)
 * @property permission - The permission name (enum or string)
 * @property resourceType - Optional resource type for resource-specific checks
 * @property resourceId - Optional resource ID for resource-specific checks (UUID string or number)
 */
interface PermissionContext {
  user?: User | { id: string }
  permission?: Permission
  resourceType?: ResourceType
  resourceId?: ResourceId
}

/**
 * Service for checking user permissions, both globally and for specific resources.
 *
 * @example
 * ```ts
 * // Check a global permission
 * const allowed = await PermissionService.builder()
 *   .user(user)
 *   .permission('document.create')
 *   .check()
 *
 * // Check a resource-specific permission
 * const allowed = await PermissionService.builder()
 *   .user(user)
 *   .permission('document.edit')
 *   .resource('document', 'uuid-or-id')
 *   .check()
 * ```
 */
export class PermissionService {
  private ctx: PermissionContext = {}

  /**
   * Create a new PermissionService builder.
   * @returns {PermissionService} A new builder instance.
   */
  static builder(): PermissionService {
    return new PermissionService()
  }

  /**
   * Set the user for the permission check.
   * @param user - The user object or an object with an `id` property (UUID string)
   * @returns this (for chaining)
   */
  user(user: User | { id: string }): this {
    this.ctx.user = user
    return this
  }

  /**
   * Specify the permission to check.
   * @param permission - The permission name (enum or string)
   * @returns this (for chaining)
   */
  permission(permission: Permission): this {
    this.ctx.permission = permission
    return this
  }

  /**
   * Specify the resource type and ID for resource-specific checks.
   * @param type - The resource type (e.g., 'document')
   * @param id - The resource ID (UUID string or number)
   * @returns this (for chaining)
   */
  resource(type: ResourceType, id: ResourceId): this {
    this.ctx.resourceType = type
    this.ctx.resourceId = id
    return this
  }

  /**
   * Perform the permission check for the user, permission, and resource.
   * @returns Promise<boolean>
   */
  async check(): Promise<boolean> {
    return this._check()
  }

  /**
   * Internal method to check if a user has a given permission, optionally for a resource.
   * @returns Promise<boolean>
   */
  private async _check(): Promise<boolean> {
    const ctx = this.ctx

    // --- 1. Validate input context ---
    if (!ctx.user || !ctx.permission) {
      throw new Error('User and permission must be set')
    }

    // Always treat userId as string (UUID)
    const userId: string = ctx.user.id

    // --- 2. Find the permission model by name ---
    const permissionModel = await PermissionModel.findBy('name', ctx.permission)
    if (!permissionModel) return false

    // --- 3. Check for resource-specific user permission ---
    if (ctx.resourceType && ctx.resourceId !== undefined) {
      // Note: resource_id is stored as a string in the DB, so we cast here
      const resourcePerm = await ResourcePermission.query()
        .where('user_id', userId)
        .where('permission_id', permissionModel.id)
        .where('resource_type', ctx.resourceType)
        .where('resource_id', String(ctx.resourceId))
        .first()

      if (resourcePerm) {
        return Boolean(resourcePerm.value)
      }
    }

    // --- 4. Load user and their roles with permissions (global) ---
    const user = await User.find(userId)
    if (!user) return false

    await user.load('roles', (roleQuery) => {
      roleQuery.preload('permissions', (permQuery) => {
        permQuery.where('permissions.id', permissionModel.id)
      })
    })

    // --- 5. Gather all role-permission grants ---
    const grants = PermissionService._collectRoleGrants(user, permissionModel.id)
    if (grants.length === 0) return false

    // --- 6. Resolve the final permission decision ---
    return PermissionService._resolveGrant(grants)
  }

  /**
   * Collects all grants/denials for a permission from the user's roles.
   * @param user - The user model with preloaded roles and permissions.
   * @param permissionId - The permission ID to check (UUID string)
   * @returns Array of grant objects with value and role weight.
   *
   * @remarks
   * The `permissionId` is a UUID string, matching the database schema.
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
   * @param grants - Array of grant objects.
   * @returns boolean
   *
   * @remarks
   * If multiple roles with the same highest weight have conflicting grants, denial takes precedence.
   */
  private static _resolveGrant(grants: { value: boolean; weight: number }[]): boolean {
    grants.sort((a, b) => b.weight - a.weight)
    const topWeight = grants[0].weight
    const topGrants = grants.filter((g) => g.weight === topWeight)
    return !topGrants.some((g) => g.value === false)
  }
}
