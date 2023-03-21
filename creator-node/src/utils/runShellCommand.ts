import type Logger from 'bunyan'

import util from 'util'
import { spawn, exec } from 'child_process'
import { logger } from '../logging'

const execute = util.promisify(exec)

/**
 * Generic function to run shell commands, eg `ls -alh`
 * @param {String} command Command you want to execute from the shell eg `ls`
 * @param {Array} args array of string quoted arguments to pass eg ['-alh']
 * @param {Object} logger logger object with context
 */
export async function runShellCommand(
  command: string,
  args: string[],
  logger: Logger
) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(command, args)
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (data: any) => (stdout += data.toString()))
    proc.stderr.on('data', (data: any) => (stderr += data.toString()))

    proc.on('close', (code: number) => {
      if (code === 0) {
        logger.debug(
          `Successfully executed command ${command} ${args} with output: \n${stdout}`
        )
        resolve()
      } else {
        logger.error(
          `Error while executing command ${command} ${args} with stdout: \n${stdout}, \nstderr: \n${stderr}`
        )
        reject(new Error(`Error while executing command ${command} ${args}`))
      }
    })
  })
}

export async function execShellCommand(cmd: string, log = false) {
  if (log) logger.debug(`calling execShellCommand: ${cmd}`)
  const { stdout, stderr } = await execute(`${cmd}`, {
    maxBuffer: 1024 * 1024 * 5
  }) // 5mb buffer
  if (stderr) throw stderr

  return stdout
}
