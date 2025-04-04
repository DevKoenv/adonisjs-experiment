import vine, { SimpleMessagesProvider } from '@vinejs/vine'

/**
 * Validator to validate the payload when creating
 * a new registered user.
 */
export const createRegisteredUserValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(255),
    email: vine.string().email().maxLength(255).unique({ table: 'users', column: 'email' }),
    password: vine
      .string()
      .minLength(8)
      .maxLength(255)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .confirmed(),
  }),
)

createRegisteredUserValidator.messagesProvider = new SimpleMessagesProvider(
  {
    // General messages
    'required': 'The {{ field }} field is required',
    'string': 'The {{ field }} must be a string',

    // Name field messages
    'name.required': 'Please provide your name',
    'name.maxLength': 'Name cannot exceed {{ max }} characters',

    // Email field messages
    'email.required': 'Email address is required',
    'email.email': 'Please provide a valid email address',
    'email.maxLength': 'Email address cannot exceed {{ max }} characters',
    'email.unique': 'This email address is already registered',

    // Password field messages
    'password.required': 'Password is required',
    'password.minLength': 'Password must be at least {{ min }} characters long',
    'password.maxLength': 'Password cannot exceed {{ max }} characters',
    'password.regex':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'password.confirmed': 'Password confirmation does not match',
    'password_confirmation.required': 'Please confirm your password',
  },
  {
    // Human-readable field names
    name: 'name',
    email: 'email address',
    password: 'password',
    password_confirmation: 'password confirmation',
  },
)
