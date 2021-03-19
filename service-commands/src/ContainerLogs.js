const { exec } = require('child_process')
const NUMBER_OF_CONTENT_NODES = 10

class ContainerLogs {
  /**
   * Append a log entry with the structure:
   * {
   *    containerName: metadata
   * }
   *
   * When print() is called, will get the docker logs of the container from the containerName.
   * This method is used for deduping docker logs calls by keeping track of the start and end times.
   * @param {Object} param
   * @param {string} param.containerName name of the container to log
   * @param {Object} param.metadata follows the structure
   * {
   *     methodName: <string; name of the method that errored>,
   *     userId: <number; impacted userId of the method that errored>,
   *     error: <Object; the error message thrown>,
   *     start: <momentjs Object; time errored method was called>,
   *     end: <momentjs Object; time errored method was caught in try/catch>
   *  }
   */
  static append ({ containerName, metadata }) {
    const { start, end, error, userId, methodName } = metadata
    const errorContext = {
      error,
      userId,
      methodName
    }

    if (!this.logs[containerName]) {
      this.logs[containerName] = {
        start,
        end,
        errorContexts: [errorContext]
      }
    } else {
      const entry = this.logs[containerName]

      if (start.isBefore(entry.start)) {
        entry.start = start
      }

      if (end.isAfter(entry.end)) {
        entry.end = end
      }

      entry.errorContexts.push(errorContext)
    }
  }

  /**
   * Logs out the container logs and returns the output
   * @param {Object} param
   * @param {string} param.containerName name of the container to log
   * @param {Moment} param.start start time of docker logs to log
   * @param {Moment} param.end end time of docker logs to log
   * @returns the output from docker logs command
   */
  static getLogs ({ containerName, start, end }) {
    return new Promise((resolve, reject) => {
      const proc = exec(
        `docker logs ${containerName} --since ${start.format('YYYY-MM-DDTHH:mm:ss[.]SSSS')} --until ${end.format('YYYY-MM-DDTHH:mm:ss[.]SSSS')}`,
        { maxBuffer: 1024 * 1024 }
      )
      let output = ''
      let stdout = ''
      let stderr = ''

      // Stream the stdout
      proc.stdout.on('data', data => {
        stdout += data
      })

      // Stream the stderr
      proc.stderr.on('data', data => {
        stderr += data
      })

      proc.on('close', exitCode => {
        if (stdout) {
          output += 'stdout:\n' + stdout
        }

        if (stderr) {
          output += '\nstderr:\n' + stderr
        }
        resolve(output)
      })
    })
  }

  /**
   * Prints the docker log command in a pretty way
   */
  static async print () {
    const entries = Object.entries(this.logs)
    for (const entry of entries) {
      console.log(`Container Name: ${entry[0]}`)
      console.log('Error Contexts:')
      entry[1].errorContexts.forEach(ec => {
        const { error, userId, methodName } = ec
        console.log(`\tuserId=${userId}, method: ${methodName}`)
        console.log('\terror:', error)
      })

      const { start, end } = entry[1]
      const containerLogs = await this.getLogs({
        containerName: entry[0],
        start,
        end
      })
      console.log(`Container Logs: ${containerLogs}`)
      console.log('-------------------------------------')
    }
  }
}

ContainerLogs.logs = {}

// Services and their respective container names
ContainerLogs.services = (() => {
  const services = {
    DISCOVERY_NODE: 'audius-disc-prov_web-server_1',
    IDENTITY_SERVICE: 'audius-identity-service_identity-service_1',
    USER_METADATA_NODE: 'cn-um_creator-node_1'
  }

  let i
  for (i = 1; i <= NUMBER_OF_CONTENT_NODES; i++) {
    services[`CONTENT_NODE_${i}`] = `cn${i}_creator-node_1`
  }

  return services
})()

module.exports = ContainerLogs
