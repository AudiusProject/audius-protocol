/**
 * Mocks for Express res object and bunyan logger for unit tests
 */

/**
 * Creates a new response object that can be called like `res.statusCode().send()`. Also preserves
 * status code in a parameter that's accessible by the test
 */
const resFactory = () => {
  return {
    statusCode: null,
    status: function (statusCode) {
      this.statusCode = statusCode
      return {
        send: () => {}
      }
    },
    set: () => {}
  }
}

/**
 * Logger object with support for info, warn, error and creating child loggers
 */
const logger = {
  child: () => {
    return {
      ...logger
    }
  },
  info: () => {},
  warn: () => {},
  error: () => {}
}

/**
 * Creates a new logger object
 */
const loggerFactory = () => {
  return logger
}


module.exports = { resFactory, loggerFactory }