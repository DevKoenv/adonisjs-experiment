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
  user: User | { id: string }
  permission: Permission
  resourceType?: ResourceType
  resourceId?: ResourceId
}

/**
 * Service for checking user permissions, both globally and for specific resources.
 *
 * @example
 * ```ts
 * // Check a global permission
 * const allowed = await PermissionService.user(user).permission('document.create').check()
 *
 * // Check a resource-specific permission
 * const allowed = await PermissionService
 *   .user(user)
 *   .permission('document.edit')
 *   .resource('document', 'uuid-or-id')
 *   .check()
 * ```
 */
export class PermissionService {
  /**
   * Entry point for permission checks. Chain with `.permission()` and optionally `.resource()`.
   * @param user - The user object or an object with an `id` property (UUID string)
   * @returns Permission builder
   */
  static user(user: User | { id: string }) {
    return {
      /**
       * Specify the permission to check.
       * @param permission - The permission name (enum or string)
       * @returns Permission builder
       */
      permission: (permission: Permission) => ({
        /**
         * Specify the resource type and ID for resource-specific checks.
         * @param type - The resource type (e.g., 'document')
         * @param id - The resource ID (UUID string or number)
         * @returns Permission builder
         */
        resource: (type: ResourceType, id: ResourceId) => ({
          /**
           * Perform the permission check for the user, permission, and resource.
           * @returns Promise<boolean>
           */
          check: () =>
            PermissionService._check({
              user,
              permission,
              resourceType: type,
              resourceId: id,
            }),
        }),
        /**
         * Perform a global permission check (not resource-specific).
         * @returns Promise<boolean>
         */
        check: () =>
          PermissionService._check({
            user,
            permission,
          }),
      }),
    }
  }

  /**
   * Internal method to check if a user has a given permission, optionally for a resource.
   * @param ctx - PermissionContext
   * @returns Promise<boolean>
   */
  private static async _check(ctx: PermissionContext): Promise<boolean> {
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
    // If both resourceType and resourceId are provided, check for a direct grant/deny
    if (ctx.resourceType && ctx.resourceId !== undefined) {
      //* Note: resource_id is stored as a string in the DB, so we cast here

      const resourcePerm = await ResourcePermission.query()
        .where('user_id', userId)
        .where('permission_id', permissionModel.id)
        .where('resource_type', ctx.resourceType)
        .where('resource_id', String(ctx.resourceId))
        .first()

      // If a resource-specific permission exists, return its value (true/false)
      if (resourcePerm) {
        return Boolean(resourcePerm.value)
      }
    }

    // --- 4. Load user and their roles with permissions (global) ---
    // If no resource-specific permission, check global permissions via roles
    const user = await User.find(userId)
    if (!user) return false

    // Preload only roles that have this permission
    await user.load('roles', (roleQuery) => {
      roleQuery.preload('permissions', (permQuery) => {
        permQuery.where('permissions.id', permissionModel.id)
      })
    })

    // --- 5. Gather all role-permission grants ---
    // Each role may grant or deny the permission; collect all grants
    const grants = PermissionService._collectRoleGrants(user, permissionModel.id)
    if (grants.length === 0) return false

    // --- 6. Resolve the final permission decision ---
    // Use the highest-weight role; if tied, deny wins
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

    // Loop through each role and its permissions
    for (const role of user.roles) {
      for (const perm of role.permissions) {
        // Compare as string, since both are UUIDs
        if (perm.id === permissionId) {
          // The pivot_value may be boolean or number (1/0)
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
    // Sort by descending weight (higher = more important)
    grants.sort((a, b) => b.weight - a.weight)
    const topWeight = grants[0].weight

    // Filter to only the highest-weight grants
    const topGrants = grants.filter((g) => g.weight === topWeight)

    // If any of the top grants is a denial, deny access
    return !topGrants.some((g) => g.value === false)
  }
}
