const config = require('./config')
const Web3 = require('web3')
const web3 = new Web3()

const { requestNotExcludedFromLogging } = require('./logging')
const versionInfo = require('../.version.json')

module.exports.handleResponse = (func) => {
  return async function (req, res, next) {
    try {
      const resp = await func(req, res, next)

      if (!isValidResponse(resp)) {
        throw new Error('Invalid response returned by function')
      }

      sendResponse(req, res, resp)
      next()
    } catch (error) {
      console.error('HandleResponse', error)
      next(error)
    }
  }
}

const sendResponse = module.exports.sendResponse = (req, res, resp) => {
  const endTime = process.hrtime(req.startTime)
  const duration = Math.round(endTime[0] * 1e3 + endTime[1] * 1e-6)
  let logger = req.logger.child({
    statusCode: resp.statusCode,
    duration
  })
  if (resp.statusCode === 200) {
    if (requestNotExcludedFromLogging(req.originalUrl)) {
      logger.info('Success')
    }
  } else {
    logger = logger.child({
      errorMessage: resp.object.error
    })
    if (req && req.body) {
      logger.info('Error processing request:', resp.object.error, '|| Request Body:', req.body)
    } else {
      logger.info('Error processing request:', resp.object.error)
    }
  }

  // set custom CORS headers that's required if you want to response
  // headers through axios
  res.set('Access-Control-Expose-Headers', 'CN-Request-ID')

  res.status(resp.statusCode).send(resp.object)
}

const isValidResponse = module.exports.isValidResponse = (resp) => {
  if (!resp || !resp.statusCode || !resp.object) {
    return false
  }

  return true
}

module.exports.successResponse = (obj = {}) => {
  const toSignData = {
    data: {
      ...obj
    },
    // TODO: remove duplication of obj -- kept for backwards compatibility
    ...obj,
    signer: config.get('delegateOwnerWallet'),
    ...versionInfo
  }

  const { timestamp, signature } = generateTimestampAndSignature(toSignData, config.get('delegatePrivateKey'))

  return {
    statusCode: 200,
    object: {
      ...toSignData,
      timestamp,
      signature
    }
  }
}

/**
 * Generate the timestamp and signature for api signing
 * @param {object} data
 * @param {string} privateKey
 */
const generateTimestampAndSignature = (data, privateKey) => {
  const timestamp = new Date().toISOString()
  const toSignObj = { ...data, timestamp }
  // JSON stringify automatically removes white space given 1 param
  const toSignStr = JSON.stringify(sortKeys(toSignObj))
  const toSignHash = web3.utils.keccak256(toSignStr)
  const signedResponse = web3.eth.accounts.sign(toSignHash, privateKey)

  return { timestamp, signature: signedResponse.signature }
}
module.exports.generateTimestampAndSignature = generateTimestampAndSignature

/**
 * Recover the public wallet address
 * @param {*} data obj with structure {...data, timestamp}
 * @param {*} signature signature generated with signed data
 */
// eslint-disable-next-line no-unused-vars
const recoverWallet = (data, signature) => {
  let structuredData = JSON.stringify(sortKeys(data))
  const hashedData = web3.utils.keccak256(structuredData)
  const recoveredWallet = web3.eth.accounts.recover(hashedData, signature)

  return recoveredWallet
}
module.exports.recoverWallet = recoverWallet

const sortKeys = x => {
  if (typeof x !== 'object' || !x) { return x }
  if (Array.isArray(x)) { return x.map(sortKeys) }
  return Object.keys(x).sort().reduce((o, k) => ({ ...o, [k]: sortKeys(x[k]) }), {})
}
module.exports.sortKeys = sortKeys

const errorResponse = module.exports.errorResponse = (statusCode, message) => {
  return {
    statusCode: statusCode,
    object: { error: message }
  }
}

module.exports.errorResponseUnauthorized = (message) => {
  return errorResponse(401, message)
}

module.exports.errorResponseForbidden = (message) => {
  return errorResponse(403, message)
}

module.exports.errorResponseBadRequest = (message) => {
  return errorResponse(400, message)
}

module.exports.errorResponseRangeNotSatisfiable = (message) => {
  return errorResponse(416, message)
}

module.exports.errorResponseServerError = (message) => {
  return errorResponse(500, message)
}

module.exports.errorResponseNotFound = (message) => {
  return errorResponse(404, message)
}

module.exports.errorResponseSocketTimeout = (socketTimeout) => {
  return errorResponse(500, `${socketTimeout} socket timeout exceeded for request`)
}
