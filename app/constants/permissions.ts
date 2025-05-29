export const PERMISSIONS = [
  // Wildcard permission
  '*',

  // Define all permissions here.
  // See https://notes.koenv.dev/share/1959qzb7i8/p/permission-system-n0Bs9c3Lag for the permission naming conventions.
  // All permissions here will be automatically added to the database when seeding the database.
] as const

export type Permission = (typeof PERMISSIONS)[number]
