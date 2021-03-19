const moment = require('moment')
const ContainerLogs = require('../ContainerLogs')

class Command {
  static wrapFn ({ methodName, fn, determineContainersFn }) {
    return async function () {
      let timeOfCall
      let resp
      try {
        timeOfCall = moment()
        resp = await fn.apply(null, arguments)
      } catch (e) {
        const endTimeOfCall = moment()
        const libs = arguments[0] // should be libs
        const metadata = {
          methodName,
          userId: libs.userId,
          error: e,
          start: timeOfCall,
          end: endTimeOfCall
        }

        await Command.recordContainerLogs(libs, metadata, determineContainersFn)
        throw e
      }

      return resp
    }
  }

  static recordContainerLogs (libs, metadata, determineContainersFn) {
    const containers = determineContainersFn(libs, metadata.methodName)
    if (containers.length === 0) {
      console.warn(`recordContainerLogs - No container provided. metadata=${JSON.stringify(metadata)}`)
    }
    containers.forEach(container => {
      ContainerLogs.append({
        containerName: container,
        metadata
      })
    })
  }
}

module.exports = Command
