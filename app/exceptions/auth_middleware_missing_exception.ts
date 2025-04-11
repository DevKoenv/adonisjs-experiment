import { Exception } from '@adonisjs/core/exceptions'

export default class AuthMiddlewareMissingException extends Exception {
  static status = 500
  static code = 'E_AUTH_MIDDLEWARE_MISSING'

  constructor() {
    super(
      'The role middleware requires the auth middleware to run first. ' +
        'Please ensure you have added middleware.auth() before middleware.role().',
    )
  }
}
