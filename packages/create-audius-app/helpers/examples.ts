import fs from 'fs'
import { install } from '../helpers/install'
import { copy } from '../helpers/copy'

import path from 'path'

export type ExampleType = 'react'

export interface GetExampleFileArgs {
  example: ExampleType
  file: string
}

export interface InstallExampleArgs {
  example: ExampleType
  appName: string
  root: string
  isOnline: boolean
}

export const exampleExists = (example: string) => {
  const examplePath = path.join(__dirname, '../examples', example)
  return fs.existsSync(examplePath)
}

export const getExampleFile = ({
  example,
  file
}: GetExampleFileArgs): string => {
  return path.join(__dirname, example, file)
}

export const installExample = async ({
  root,
  isOnline,
  example
}: InstallExampleArgs) => {
  /**
   * Copy the example files to the target directory.
   */
  const copySource = ['**']
  const examplePath = path.join(__dirname, '../examples', example)

  await copy(copySource, root, {
    parents: true,
    cwd: examplePath
  })

  console.log('\nInstalling dependencies:')

  await install(isOnline)
}
