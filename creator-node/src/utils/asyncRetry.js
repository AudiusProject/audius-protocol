const retry = require('async-retry')

const { logger: genericLogger } = require('../logging')

/**
 * Wrapper around async-retry API.
 *
 * NOTE: The asyncFn must throw in order for the function to retry.
 *
 * options described here https://github.com/tim-kos/node-retry#retrytimeoutsoptions
 * @param {Object} param
 * @param {func} param.asyncFn the fn to asynchronously retry
 * @param {Object} param.options optional options. defaults to the params listed below if not explicitly passed in
 * @param {number} [param.options.factor=2] exponential factor for timeout between retries
 * @param {number} [param.options.retries=5] the max number of retries. defaulted to 5. So, this will attempt once and retry 5 times for a total of 6 tries.
 * @param {number} [param.options.minTimeout=1000] minimum number of ms to wait after first retry
 * @param {number} [param.options.maxTimeout=Infinity] maximum number of ms between two retries
 * @param {func} [param.options.onRetry] fn that gets called per retry
 * @param {Object} param.logger
 * @param {Boolean} param.log enables/disables onRetry logging
 * @param {string?} param.logLabel
 * @returns the fn response if success, or throws an error
 */
module.exports = function asyncRetry({
  asyncFn,
  options = {},
  logger = genericLogger,
  log = true,
  logLabel = null
}) {
  options = {
    retries: 5,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: Infinity,
    onRetry: (err, i) => {
      if (err && log) {
        const logPrefix =
          (logLabel ? `[${logLabel}] ` : '') + `[asyncRetry] [attempt #${i}]`
        logger.warn(`${logPrefix}: `, err.message || err)
      }
    },
    ...options
  }

  return retry(asyncFn, options)
}
