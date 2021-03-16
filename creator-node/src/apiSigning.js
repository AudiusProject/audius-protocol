const Web3 = require('web3')
const web3 = new Web3()

/**
 * Max age of signature in milliseconds
 * Set to 5 minutes
 */
const MAX_SIGNATURE_AGE_MS = 300000

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

// Keeps track of cached signatures for `generateTimestampAndSignatureIfNecessary`
const cachedSignatures = {}

/**
 * Generates a signature for `data` if only the previous signature
 * generated is invalid (expired). Otherwise returns an existing signature.
 * @param {string} data only string data supported
 * @param {string} privateKey
 * @returns {string} signature
 */
const generateTimestampAndSignatureIfNecessary = (data, privateKey) => {
  if (data in cachedSignatures) {
    const signatureTimestamp = cachedSignatures[data].timestamp
    if (signatureHasExpired(signatureTimestamp)) {
      // If the signature has expired, remove it from the cache
      delete cachedSignatures[data]
    } else {
      // If the signature has not expired (still valid), use it!
      return cachedSignatures[data]
    }
  }
  // We don't have a signature already
  const { timestamp, signature } = generateTimestampAndSignature({ data }, privateKey)
  cachedSignatures[data] = { timestamp, signature }
  return { timestamp, signature }
}

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

/**
 * Returns boolean indicating if provided timestamp is older than MAX_SIGNATURE_AGE
 * @param {string} signatureTimestamp unix timestamp string when signature was generated
 */
const signatureHasExpired = (signatureTimestamp) => {
  const signatureTimestampDate = new Date(signatureTimestamp)
  const currentTimestampDate = new Date()
  const signatureAge = currentTimestampDate - signatureTimestampDate

  return (signatureAge >= MAX_SIGNATURE_AGE_MS)
}

const sortKeys = x => {
  if (typeof x !== 'object' || !x) { return x }
  if (Array.isArray(x)) { return x.map(sortKeys) }
  return Object.keys(x).sort().reduce((o, k) => ({ ...o, [k]: sortKeys(x[k]) }), {})
}

module.exports = {
  generateTimestampAndSignature,
  generateTimestampAndSignatureIfNecessary,
  recoverWallet,
  sortKeys,
  MAX_SIGNATURE_AGE_MS,
  signatureHasExpired
}
