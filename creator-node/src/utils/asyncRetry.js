const retry = require('async-retry')

const { logger: genericLogger } = require('../logging')

/**
 * Wrapper around async-retry API.
 *
 * options described here https://github.com/tim-kos/node-retry#retrytimeoutsoptions
 * @param {Object} param
 * @param {() => AxiosPromise<any>} param.asyncFn the fn to asynchronously retry
 * @param {Object} [param.logger=genericLogger]
 * @param {boolean} [param.log=true] enables/disables logging
 * @param {string} [param.logLabel=null]
 * @param {Object} [param.options={}] optional options. defaults to the params listed below if not explicitly passed in
 * @param {number} [param.options.factor=2] the exponential factor
 * @param {number} [param.options.retries=5] the max number of retries. defaulted to 5
 * @param {number} [param.options.minTimeout=1000] minimum number of ms to wait after first retry. defaulted to 1000ms
 * @param {number} [param.options.maxTimeout=5000] maximum number of ms between two retries. defaulted to 5000ms
 * @param {((...any) => any)} [param.options.onRetry=((err, i) => void)] fn that gets called per retry
 * @returns the fn response if success, or throws an error
 */
export function asyncRetry({
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
    maxTimeout: 5000,
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
