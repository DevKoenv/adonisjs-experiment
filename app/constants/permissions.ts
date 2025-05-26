export const PERMISSIONS = [
  // Wildcard permission
  '*',

  // Post permissions
  'post.view',
  'post.create',
  'post.update',
  'post.delete',

  // Comment permissions
  'comment.view',
  'comment.create',
  'comment.update',
  'comment.delete',
  // add more as needed

  'dashboard.view',
  'document.view',
  'document.edit',
  'document.edit.others',
] as const

export type Permission = (typeof PERMISSIONS)[number]
