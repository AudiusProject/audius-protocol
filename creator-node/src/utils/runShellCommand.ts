import type Logger from 'bunyan'
import { spawn } from 'child_process'

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
        logger.info(
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
