import { args, BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import fs from 'node:fs/promises'
import path from 'node:path'
import Role from '#models/role'

export default class MakeRoleDiagram extends BaseCommand {
  static commandName = 'make:role-diagram'
  static description = 'Generate a role hierarchy diagram in a Markdown file'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({
    description: 'Output file path (default: ./docs/role-hierarchy.md)',
    required: false,
    default: './docs/role-hierarchy.md',
  })
  declare outFile: string

  async run() {
    this.logger.info('Fetching role hierarchy...')

    // Fetch roles with many-to-many parent relationships
    const roles = await Role.query().preload('parentRoles')

    // Generate diagram based on type
    let content: string

    content = this.generateMermaidDiagram(roles)

    // Ensure directory exists
    const dir = path.dirname(this.outFile)
    await fs.mkdir(dir, { recursive: true })

    // Write to file
    await fs.writeFile(this.outFile, content)

    this.logger.success(`Role diagram generated at ${this.outFile}`)
  }

  /**
   * Generate a Mermaid diagram representing the role hierarchy
   */
  private generateMermaidDiagram(roles: Array<Role & { parentRoles: Role[] }>) {
    // Start the diagram
    let diagram = `# Role Hierarchy Diagram

  Generated on: ${new Date().toISOString().replace('T', ' ').split('.')[0]}

  \`\`\`mermaid
  flowchart TD
  `

    // Add nodes
    roles.forEach((role) => {
      diagram += `    ${role.slug}["${role.name}"]\n`
    })

    // Add connections
    roles.forEach((role) => {
      role.parentRoles.forEach((parent) => {
        diagram += `    ${parent.slug} --> ${role.slug}\n`
      })
    })

    // Add styling
    diagram += `
    
    %% Identify root and leaf nodes
`

    // Identify roots (roles with no parents)
    const rootRoles = roles.filter((role) => role.parentRoles.length === 0)
    if (rootRoles.length > 0) {
      diagram += `    class ${rootRoles.map((r) => r.slug).join(',')} root\n`
    }

    // Identify leaves (roles that are not parents to any other role)
    const parentIds = new Set()
    roles.forEach((role) => {
      role.parentRoles.forEach((parent) => {
        parentIds.add(parent.id)
      })
    })

    const leafRoles = roles.filter((role) => !parentIds.has(role.id))
    if (leafRoles.length > 0) {
      diagram += `    class ${leafRoles.map((r) => r.slug).join(',')} leaf\n`
    }

    // Close the Mermaid code block
    diagram += '```\n\n'

    // Add a summary table
    diagram += `## Role Summary

| Role | Slug | Description | Parent Roles |
|------|------|-------------|--------------|
`
    roles.forEach((role) => {
      const parents = role.parentRoles.map((p) => p.name).join(', ') || 'None'
      diagram += `| ${role.name} | \`${role.slug}\` | ${role.description || 'N/A'} | ${parents} |\n`
    })

    return diagram
  }
}
