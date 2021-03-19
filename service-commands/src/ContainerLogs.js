const { exec } = require('child_process')
const NUMBER_OF_CONTENT_NODES = 10

class ContainerLogs {
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
