import factory from '@adonisjs/lucid/factories'
import Role from '#models/role'

export const RoleFactory = factory
  .define(Role, async ({ faker }) => {
    return {
      name: faker.person.jobDescriptor(),
      slug: faker.person.jobDescriptor().toLowerCase(),
      weight: faker.number.int(),
    }
  })
  .build()
