import { existsSync } from 'fs'
import { resolve } from 'path'
import glob from 'glob'
import { expect } from 'vitest'

export interface DefaultTemplateOptions {
  cwd: string
  projectName?: string
}

export interface ProjectFiles extends DefaultTemplateOptions {
  files: string[]
}

export interface ProjectDeps extends DefaultTemplateOptions {
  type: 'dependencies' | 'devDependencies'
  deps: string[]
}

export const projectFilesShouldExist = ({
  cwd,
  projectName = '.',
  files
}: ProjectFiles) => {
  const projectRoot = resolve(cwd, projectName)
  for (const file of files) {
    try {
      const path = resolve(projectRoot, file)
      expect(existsSync(path)).toBe(true)
    } catch (err) {
      require('console').error(
        `missing expected file ${file}`,
        glob.sync('**/*', { cwd, ignore: '**/node_modules/**' }),
        files
      )
      throw err
    }
  }
}

export const projectFilesShouldNotExist = ({
  cwd,
  projectName = '.',
  files
}: ProjectFiles) => {
  const projectRoot = resolve(cwd, projectName)
  for (const file of files) {
    try {
      expect(existsSync(resolve(projectRoot, file))).toBe(false)
    } catch (err) {
      require('console').error(
        `unexpected file present ${file}`,
        glob.sync('**/*', { cwd, ignore: '**/node_modules/**' }),
        files
      )
      throw err
    }
  }
}
