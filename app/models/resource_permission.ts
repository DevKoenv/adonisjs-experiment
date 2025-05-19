import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Permission from '#models/permission'

export default class ResourcePermission extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string // UUID

  @column()
  declare resource_type: string

  @column()
  declare resource_id: string

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Permission)
  declare permission: BelongsTo<typeof Permission>

  @column()
  declare value: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static assignUuid(resourcePermission: ResourcePermission) {
    resourcePermission.id = crypto.randomUUID()
  }

  /**
   * Check if a resource permission exists for a user
   * @param userId - The ID of the user
   * @param permissionId - The ID of the permission
   * @param resourceType - The type of the resource
   * @param resourceId - The ID of the resource
   * @returns True if the resource permission exists, false otherwise
   */
  static async existsFor(
    userId: string,
    permissionId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<boolean> {
    const found = await this.query().where({ userId, permissionId, resourceType, resourceId }).first()
    return !!found
  }

  /**
   * Get the resource permissions for a user
   * @param userId - The ID of the user
   * @returns The resource permissions for the user
   */
  static async getForUser(userId: string) {
    const resourcePermissions = await this.query()
      .where('user_id', userId)
      .preload('permission')
      .preload('user')
      .orderBy('created_at', 'desc')

    return resourcePermissions
  }
}
