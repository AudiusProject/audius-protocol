const moment = require('moment')
const ContainerLogs = require('../ContainerLogs')

class Command {
  /**
   * A wrapper function around libs APIs in the commands folder. This is to catch any errors
   * these methods might throw and record the necessary container logs.
   * @param {Object} param
   * @param {string} param.methodName the name of the method
   * @param {function} param.fn the fn associated with the method name
   * @param {function} param.determineContainersFn each API call = different, relevant containers
   *  this fn is unique to each API file and each API file should determine which container to log out
   * @returns the usual API response if no error is thrown
   */
  static wrapFn ({ methodName, fn, determineContainersFn }) {
    return async function () {
      let timeOfCall
      let resp
      try {
        timeOfCall = moment()
        resp = await fn.apply(null, arguments)
      } catch (e) {
        // TODO: do not log false positives, like how libsWraper fns throw when no users are found not actual error
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

  /**
   * Helper method to add an entry to the ContainerLogs
   * @param {Object} libs libs wrapper instance
   * @param {Object} metadata metadata pertaining to the function (see wrapper function above)
   * @param {function} determineContainersFn each API call = different, relevant containers
   *  this fn is unique to each API file and each API file should determine which container to log out
   */
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
