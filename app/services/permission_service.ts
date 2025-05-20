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
 * @property ownerId - Optional owner ID for ownership checks (UUID string)
 */
interface PermissionContext {
  user?: User | { id: string }
  permission?: Permission
  resourceType?: ResourceType
  resourceId?: ResourceId
  ownerId?: string
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
   * Specify the owner ID for ownership checks.
   * @param ownerId - The owner ID (UUID string)
   * @returns this (for chaining)
   */
  owner(ownerId: string): this {
    this.ctx.ownerId = ownerId
    return this
  }

  /**
   * Perform the permission check for the user, permission, and resource.
   * Follows the order:
   * 1. Resource-specific (ACL)
   * 2. Ownership
   * 3. .others
   * 4. Global permission (if not resource-specific)
   * 5. Deny
   *
   * @returns Promise<boolean> - True if the user is allowed, false otherwise.
   */
  async check(): Promise<boolean> {
    const ctx = this.ctx
    // Ensure both user and permission are set before proceeding
    if (!ctx.user || !ctx.permission) throw new Error('User and permission must be set')
    const userId: string = ctx.user.id

    // Look up the permission model by its name (enum or string)
    const permissionModel = await PermissionModel.findBy('name', ctx.permission)
    if (!permissionModel) return false

    // 1. Resource-specific (ACL) check
    if (ctx.resourceType && ctx.resourceId !== undefined) {
      // 1. Ownership check
      if (ctx.ownerId && ctx.ownerId === userId) {
        if (await this._hasGlobalPermission(userId, permissionModel.id)) return true
      }

      // 2. .others (admin/manager override)
      if (!ctx.ownerId || ctx.ownerId !== userId) {
        const othersPermission = `${ctx.permission}.others`
        const othersPermissionModel = await PermissionModel.findBy('name', othersPermission)
        if (othersPermissionModel) {
          if (await this._hasGlobalPermission(userId, othersPermissionModel.id)) return true
        }
      }

      // 3. Resource-specific (ACL) check (only if not owner and no .others)
      const resourcePerm = await ResourcePermission.getFor(
        userId,
        permissionModel.id,
        ctx.resourceType,
        String(ctx.resourceId),
      )
      if (resourcePerm) {
        return Boolean(resourcePerm.value)
      }

      // 4. Deny (do NOT check global permission here)
      return false
    }

    // 5. Global permission (no resource context)
    return this._hasGlobalPermission(userId, permissionModel.id)
  }

  /**
   * Internal method to check if a user has a given global permission.
   * Loads the user's roles and their permissions, then aggregates grants/denials.
   * @param userId - The user ID (UUID string)
   * @param permissionId - The permission ID (UUID string)
   * @returns Promise<boolean> - True if the user is granted the permission, false otherwise.
   */
  private async _hasGlobalPermission(userId: string, permissionId: string): Promise<boolean> {
    // Find the user by ID
    const user = await User.find(userId)
    if (!user) return false

    // Load the user's roles and preload only the relevant permission
    await user.load('roles', (roleQuery) => {
      roleQuery.preload('permissions', (permQuery) => {
        permQuery.where('permissions.id', permissionId)
      })
    })

    // Collect all grants/denials from the user's roles for this permission
    const grants = PermissionService._collectRoleGrants(user, permissionId)
    if (grants.length === 0) return false

    // Resolve the final decision based on role weights and grant values
    return PermissionService._resolveGrant(grants)
  }

  /**
   * Collects all grants/denials for a permission from the user's roles.
   * Iterates through each role assigned to the user, and for each role,
   * checks if the role has the specified permission. If so, it extracts
   * the grant/deny value from the pivot table (role_permission) and the
   * role's weight for later resolution.
   *
   * @param user - The user model with preloaded roles and permissions.
   * @param permissionId - The permission ID to check (UUID string)
   * @returns Array of grant objects with value and role weight.
   *
   * @remarks
   * - The `permissionId` is a UUID string, matching the database schema.
   * - The `value` is determined from the pivot table's `pivot_value` field,
   *   which may be a boolean or a number (1 for true, 0 for false).
   * - The returned array may be empty if the user has no roles with this permission.
   */
  private static _collectRoleGrants(user: User, permissionId: string): { value: boolean; weight: number }[] {
    const grants: { value: boolean; weight: number }[] = []

    // Iterate over each role assigned to the user
    for (const role of user.roles) {
      // For each role, check all permissions assigned to that role
      for (const perm of role.permissions) {
        // If the permission matches the one we're checking
        if (perm.id === permissionId) {
          // Extract the grant/deny value from the pivot table
          // Accepts both boolean true and numeric 1 as "grant"
          const value = perm.$extras.pivot_value === true || perm.$extras.pivot_value === 1
          // Store the grant/deny value along with the role's weight
          grants.push({ value, weight: role.weight })
        }
      }
    }

    // Return all collected grants/denials for this permission
    return grants
  }

  /**
   * Resolves the final permission decision from all grants.
   * Uses the highest-weight role; if tied, deny wins.
   * @param grants - Array of grant objects.
   * @returns boolean - True if granted, false if denied.
   *
   * @remarks
   * - Sorts grants by role weight descending (highest first).
   * - Only considers grants from roles with the highest weight.
   * - If any of the top-weight roles deny (value === false), the result is denied.
   * - If all top-weight roles grant (value === true), the result is granted.
   * - This ensures that denial takes precedence in case of conflict at the highest weight.
   * - If grants array is empty, this method should not be called (handled by caller).
   */
  private static _resolveGrant(grants: { value: boolean; weight: number }[]): boolean {
    // Sort grants by descending role weight so highest-weight roles come first
    grants.sort((a, b) => b.weight - a.weight)

    // Get the highest weight among all roles
    const topWeight = grants[0].weight
    // Filter to only those grants from roles with the highest weight
    const topGrants = grants.filter((g) => g.weight === topWeight)

    // If any top-weight role denies, deny takes precedence
    return !topGrants.some((g) => g.value === false)
  }
}
