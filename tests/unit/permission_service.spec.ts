import { test } from '@japa/runner'
import { PermissionService } from '#services/permission_service'
import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
import ResourcePermission from '#models/resource_permission'

// Use test-only permissions to avoid conflicts with app permissions
const TEST_PERMISSIONS = {
  EDIT: 'test.edit',
  EDIT_OTHERS: 'test.edit.others',
  VIEW: 'test.view',
} as const

test.group('PermissionService (test-only permissions)', (group) => {
  let user: User
  let owner: User
  let admin: User
  let role: Role
  let adminRole: Role
  let permission: Permission
  let othersPermission: Permission

  group.setup(async () => {
    await User.query().delete()
    await Role.query().delete()
    await Permission.query().delete()
    await ResourcePermission.query().delete()

    user = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password',
    })
    admin = await User.create({
      name: 'Test Admin',
      email: 'admin@example.com',
      password: 'password',
    })
    owner = await User.create({
      name: 'Test Owner',
      email: 'owner@example.com',
      password: 'password',
    })

    role = await Role.create({ name: 'User', slug: 'user', weight: 1 })
    adminRole = await Role.create({ name: 'Admin', slug: 'admin', weight: 10 })

    // Create test-only permissions
    permission = await Permission.create({
      name: TEST_PERMISSIONS.EDIT as Permission['name'],
      description: 'Edit test resource',
    })
    othersPermission = await Permission.create({
      name: TEST_PERMISSIONS.EDIT_OTHERS as Permission['name'],
      description: 'Edit any test resource',
    })

    await role.related('permissions').attach({ [permission.id]: { value: true } })
    await adminRole.related('permissions').attach({ [othersPermission.id]: { value: true } })

    await user.related('roles').attach([role.id])
    await admin.related('roles').attach([adminRole.id])
    await owner.related('roles').attach([role.id])
  })

  test('allows global permission (no resource context)', async ({ assert }) => {
    const allowed = await PermissionService.builder()
      .user(user)
      .permission(TEST_PERMISSIONS.EDIT as Permission['name'])
      .check()
    assert.isTrue(allowed)
  })

  test('denies without permission (no resource context)', async ({ assert }) => {
    const stranger = await User.create({
      name: 'Stranger',
      email: 'stranger@example.com',
      password: 'password',
    })
    const allowed = await PermissionService.builder()
      .user(stranger)
      .permission(TEST_PERMISSIONS.EDIT as Permission['name'])
      .check()
    assert.isFalse(allowed)
  })

  test('allows owner with base permission', async ({ assert }) => {
    const allowed = await PermissionService.builder()
      .user(owner)
      .permission(TEST_PERMISSIONS.EDIT as Permission['name'])
      .resource('test-resource', 'res-owner')
      .owner(owner.id)
      .check()
    assert.isTrue(allowed)
  })

  test('denies non-owner without .others', async ({ assert }) => {
    const allowed = await PermissionService.builder()
      .user(user)
      .permission(TEST_PERMISSIONS.EDIT as Permission['name'])
      .resource('test-resource', 'res-no-others')
      .owner(owner.id)
      .check()
    assert.isFalse(allowed)
  })

  test('allows non-owner with .others', async ({ assert }) => {
    const allowed = await PermissionService.builder()
      .user(admin)
      .permission(TEST_PERMISSIONS.EDIT as Permission['name'])
      .resource('test-resource', 'res-admin')
      .owner(owner.id)
      .check()
    assert.isTrue(allowed)
  })

  test('allows resource-specific ACL allow (non-owner, no .others)', async ({ assert }) => {
    await ResourcePermission.create({
      user_id: user.id,
      permission_id: permission.id,
      resource_type: 'test-resource',
      resource_id: 'res-acl-allow',
      value: true,
    })
    const allowed = await PermissionService.builder()
      .user(user)
      .permission(TEST_PERMISSIONS.EDIT as Permission['name'])
      .resource('test-resource', 'res-acl-allow')
      .owner(owner.id)
      .check()
    assert.isTrue(allowed)
  })

  test('denies resource-specific ACL deny (non-owner, no .others)', async ({ assert }) => {
    await ResourcePermission.create({
      user_id: user.id,
      permission_id: permission.id,
      resource_type: 'test-resource',
      resource_id: 'res-acl-deny',
      value: false,
    })
    const allowed = await PermissionService.builder()
      .user(user)
      .permission(TEST_PERMISSIONS.EDIT as Permission['name'])
      .resource('test-resource', 'res-acl-deny')
      .owner(owner.id)
      .check()
    assert.isFalse(allowed)
  })

  test('allows .others even if ACL says deny', async ({ assert }) => {
    // admin has .others, but ACL says deny for this resource
    await ResourcePermission.create({
      user_id: admin.id,
      permission_id: permission.id,
      resource_type: 'test-resource',
      resource_id: 'res-acl-deny-admin',
      value: false,
    })
    const allowed = await PermissionService.builder()
      .user(admin)
      .permission(TEST_PERMISSIONS.EDIT as Permission['name'])
      .resource('test-resource', 'res-acl-deny-admin')
      .owner(owner.id)
      .check()
    assert.isTrue(allowed)
  })

  test('denies if permission does not exist', async ({ assert }) => {
    const allowed = await PermissionService.builder()
      .user(user)
      .permission('test.nonexistent' as Permission['name'])
      .check()
    assert.isFalse(allowed)
  })

  test('denies if user does not exist', async ({ assert }) => {
    const allowed = await PermissionService.builder()
      .user({ id: 'nonexistent-user-id' })
      .permission(TEST_PERMISSIONS.EDIT as Permission['name'])
      .check()
    assert.isFalse(allowed)
  })

  test('denies if no owner, no .others, no ACL', async ({ assert }) => {
    const stranger = await User.create({
      name: 'Stranger 2',
      email: 'stranger2@example.com',
      password: 'password',
    })
    const allowed = await PermissionService.builder()
      .user(stranger)
      .permission(TEST_PERMISSIONS.EDIT as Permission['name'])
      .resource('test-resource', 'res-no-access')
      .check()
    assert.isFalse(allowed)
  })

  test('denies .others for global permission (no resource context)', async ({ assert }) => {
    // admin only has .others, not base permission
    const allowed = await PermissionService.builder()
      .user(admin)
      .permission(TEST_PERMISSIONS.EDIT as Permission['name'])
      .check()
    assert.isFalse(allowed)
  })

  test('explicit deny via role overrides allow', async ({ assert }) => {
    const denyRole = await Role.create({ name: 'DenyRole', slug: 'deny', weight: 20 })
    await denyRole.related('permissions').attach({ [permission.id]: { value: false } })
    await user.related('roles').attach([denyRole.id])

    const allowed = await PermissionService.builder()
      .user(user)
      .permission(TEST_PERMISSIONS.EDIT as Permission['name'])
      .check()
    assert.isFalse(allowed)
  })

  test('multiple roles: highest weight wins', async ({ assert }) => {
    const lowRole = await Role.create({ name: 'LowRole', slug: 'low', weight: 1 })
    const highRole = await Role.create({ name: 'HighRole', slug: 'high', weight: 100 })
    await lowRole.related('permissions').attach({ [permission.id]: { value: true } })
    await highRole.related('permissions').attach({ [permission.id]: { value: false } })
    const multiUser = await User.create({ name: 'MultiRole User', email: 'multi@example.com', password: 'password' })
    await multiUser.related('roles').attach([lowRole.id, highRole.id])

    const allowed = await PermissionService.builder()
      .user(multiUser)
      .permission(TEST_PERMISSIONS.EDIT as Permission['name'])
      .check()
    assert.isFalse(allowed)
  })
})
