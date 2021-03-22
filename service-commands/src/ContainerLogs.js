const moment = require('moment')
const { exec } = require('child_process')
const NUMBER_OF_CONTENT_NODES = 3

class ContainerLogs {
  /**
   * Append a log entry with the structure:
   * {
   *    containerName: errorInfo
   * }
   * @param {Object} errorInfo follows the structure
   * {
   *     error: <Object; the error message thrown>,
   *     start: <momentjs Object; time errored method was called>,
   *     end: <momentjs Object; time errored method was caught in try/catch>
   *  }
   */
  static append (errorInfo) {
    const { start, end, error } = errorInfo

    if (this.logs.start.isAfter(start)) {
      this.logs.start = start
    }

    if (this.logs.end.isBefore(end)) {
      this.logs.end = end
    }

    this.logs.errors.push(error)
  }

  /**
   * Logs out the container logs and returns the output
   * @param {Object} param
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

      proc.stdout.on('data', data => {
        stdout += data
      })

      // All stderr and stdout will be piped to stdout
      proc.stderr.on('data', data => {
        stdout += data
      })

      proc.on('close', exitCode => {
        if (stdout) {
          output += stdout
        }
        resolve(output)
      })
    })
  }

  /**
   * Prints the docker logs in a pretty way
   */
  static async print () {
    // Print general error messages from tests
    console.log('Error Contexts:')
    this.logs.errors.forEach((e, i) => {
      console.log(`\t(${i}) error: `, e)
    })

    // Print container logs
    const services = Object.values(ContainerLogs.services)

    const { start, end } = this.logs
    console.log(`Displaying logs from ${start} to ${end}`)
    for (const service of services) {
      console.log(`------------------- ${service} logs start -------------------`)
      const containerLogs = await this.getLogs({
        containerName: service,
        start,
        end
      })
      console.log(containerLogs)
      console.log(`------------------- ${service} logs end -------------------`)
    }
  }
}

ContainerLogs.logs = {
  // Initial values
  start: moment().add(10, 'days'),
  end: moment().subtract(10, 'days'),
  errors: []
}

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
