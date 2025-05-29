import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Permission from '#models/permission'

export default class AccessControlEntry extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string // UUID

  @column()
  declare resourceType: string

  @column()
  declare resourceId: string

  @column()
  declare userId: string

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare permissionId: string

  @belongsTo(() => Permission)
  declare permission: BelongsTo<typeof Permission>

  @column({
    serialize: (value: number) => Boolean(value),
  })
  declare value: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static assignUuid(accessControlEntry: AccessControlEntry) {
    accessControlEntry.id = crypto.randomUUID()
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
    const found = await this.findBy({
      user_id: userId,
      permission_id: permissionId,
      resource_type: resourceType,
      resource_id: resourceId,
    })
    return !!found
  }

  /**
   * @deprecated use `findBy` instead
   *
   * Get a resource permission for a user
   * @param userId - The ID of the user
   * @param permissionId - The ID of the permission
   * @param resourceType - The type of the resource
   * @param resourceId - The ID of the resource
   * @returns The resource permission if found, null otherwise
   */
  static async getFor(
    userId: string,
    permissionId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<AccessControlEntry | null> {
    return await this.findBy({
      user_id: userId,
      permission_id: permissionId,
      resource_type: resourceType,
      resource_id: resourceId,
    })
  }
}
