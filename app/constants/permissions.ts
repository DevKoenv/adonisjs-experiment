export const PERMISSIONS = [
  'post.view',
  'post.create',
  'post.update',
  'post.delete',
  'comment.view',
  'comment.create',
  'comment.update',
  'comment.delete',
  // add more as needed
] as const

export type Permission = (typeof PERMISSIONS)[number]
