import vine from '@vinejs/vine'

/**
 * Validator to validate the payload when creating
 * a new registered user.
 */
export const createRegisteredUserValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(255),
    email: vine.string().email().maxLength(255),
    password: vine
      .string()
      .minLength(8)
      .maxLength(255)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .confirmed(),
  }),
)
