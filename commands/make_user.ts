import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'
import Role from '#models/role'

export default class MakeUser extends BaseCommand {
  static commandName = 'make:user'
  static description = 'Interactively create a new user in the database'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Creating a new user interactively')

    try {
      // Get available roles
      const roles = await Role.all()

      if (roles.length === 0) {
        this.logger.error('No roles found in the database. Run migrations and seeders first.')
        return
      }

      // Ask for email
      const email = await this.prompt.ask('Enter email address', {
        validate: async (value) => {
          if (!value) return 'Email is required'
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format'

          const existingUser = await User.findBy('email', value)
          if (existingUser) return `User with email ${value} already exists`
          return true
        },
      })

      // Ask for password
      const password = await this.prompt.secure('Enter password', {
        validate: (value) => {
          if (!value) return 'Password is required'
          if (value.length < 8) return 'Password must be at least 8 characters'
          return true
        },
      })

      // Confirm password
      await this.prompt.secure('Confirm password', {
        validate: (value) => {
          if (value !== password) return 'Passwords do not match'
          return true
        },
      })

      // Ask for name (optional)
      const name = await this.prompt.ask('Enter name (optional)')

      // Ask if user should be an admin
      const isAdmin = await this.prompt.confirm('Should this user be an admin?', { default: false })

      // Get the appropriate role
      const role = isAdmin ? 'admin' : 'user'
      const roleInstance = await Role.findByOrFail('slug', role)

      // Confirm creation
      const confirmed = await this.prompt.confirm(`Create ${isAdmin ? 'admin' : 'regular'} user with email ${email}?`, {
        default: true,
      })

      if (!confirmed) {
        this.logger.info('Operation cancelled')
        return
      }

      // Create user
      const user = await User.create({
        email,
        password: 'password',
        name: name || `${isAdmin ? 'Admin' : 'Regular'} User`,
      })

      // Assign role (overriding the default 'user' role from afterCreate hook)
      await user.related('roles').sync([roleInstance.id])

      this.logger.success(`User created successfully:`)
      this.logger.info(`Email: ${user.email}`)
      this.logger.info(`Name: ${user.name}`)
      this.logger.info(`Role: ${role}`)
    } catch (error) {
      this.logger.error('Failed to create user')
      this.logger.error(error)
    }
  }
}
