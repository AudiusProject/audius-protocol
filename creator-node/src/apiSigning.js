const { Utils: LibsUtils } = require('@audius/libs')
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

// Keeps track of a cached listen signature
// Two field object: { timestamp, signature }
let cachedListenSignature = null

/**
 * Generates a signature for `data` if only the previous signature
 * generated is invalid (expired). Otherwise returns an existing signature.
 * @param {string} privateKey
 * @returns {object} {signature, timestamp} signature data
 */
const generateListenTimestampAndSignature = (privateKey) => {
  if (cachedListenSignature) {
    const signatureTimestamp = cachedListenSignature.timestamp
    if (signatureHasExpired(signatureTimestamp)) {
      // If the signature has expired, remove it from the cache
      cachedListenSignature = null
    } else {
      // If the signature has not expired (still valid), use it!
      return cachedListenSignature
    }
  }
  // We don't have a signature already
  const { timestamp, signature } = generateTimestampAndSignature(
    { data: 'listen' },
    privateKey
  )
  cachedListenSignature = { timestamp, signature }
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

/**
 * Wrapper fn to perform basic validation that the requester is a valid SP and that the request came
 * from the SP node itself. Uses the {spID, timestamp} as the input data to recover.
 * @param {Object} data
 * @param {Object} data.audiusLibs
 * @param {number} data.spID the spID of the node to verify
 * @param {string} data.reqTimestamp the timestamp from the request body
 * @param {string} data.reqSignature the signature from the request body
 */
const verifyRequesterIsValidSP = async ({
  audiusLibs,
  spID,
  reqTimestamp,
  reqSignature
}) => {
  validateSPSignatureInfo(reqTimestamp, reqSignature)
  spID = validateSPId(spID)

  const spRecordFromSPFactory = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo(
    'content-node',
    spID
  )

  let {
    owner: ownerWalletFromSPFactory,
    delegateOwnerWallet: delegateOwnerWalletFromSPFactory,
    endpoint: nodeEndpointFromSPFactory
  } = spRecordFromSPFactory
  delegateOwnerWalletFromSPFactory = delegateOwnerWalletFromSPFactory.toLowerCase()

  if (!ownerWalletFromSPFactory || !delegateOwnerWalletFromSPFactory) {
    throw new Error(`Missing fields: ownerWallet=${ownerWalletFromSPFactory}, delegateOwnerWallet=${delegateOwnerWalletFromSPFactory}`)
  }

  /**
   * Reject if node is not registered as valid SP on L1 ServiceProviderFactory
   */
  if (
    LibsUtils.isZeroAddress(ownerWalletFromSPFactory) ||
    LibsUtils.isZeroAddress(delegateOwnerWalletFromSPFactory) ||
    !nodeEndpointFromSPFactory
  ) {
    throw new Error(`SpID ${spID} is not registered as valid SP on L1 ServiceProviderFactory or missing field endpoint=${nodeEndpointFromSPFactory}`)
  }

  /**
   * Confirm request was signed by delegate owner wallet registered on L1 for spID, given request signature artifacts
   */
  let requesterWalletRecoveryObj = { spID, timestamp: reqTimestamp }
  let recoveredDelegateOwnerWallet = (recoverWallet(requesterWalletRecoveryObj, reqSignature)).toLowerCase()
  if (delegateOwnerWalletFromSPFactory !== recoveredDelegateOwnerWallet) {
    throw new Error(
      'Request for signature must be signed by delegate owner wallet registered on L1 for spID'
    )
  }

  return {
    ownerWalletFromSPFactory,
    delegateOwnerWalletFromSPFactory,
    nodeEndpointFromSPFactory,
    spID
  }
}

/**
 * Validates the request query params used for verifying sp.
 * @param {string} reqTimestamp the timestamp off of the req query params
 * @param {string} reqSignature the signature off of the req query params
 */
function validateSPSignatureInfo (reqTimestamp, reqSignature) {
  if (!reqTimestamp || !reqSignature) {
    throw new Error('Must provide all required query parameters: timestamp, signature')
  }
}

/**
 * Validates the request query param spID
 * @param {string} spID
 * @returns a parsed spID
 */
function validateSPId (spID) {
  if (!spID) {
    throw new Error('Must provide all required query parameters: spID')
  }

  spID = parseInt(spID)

  if (isNaN(spID) || spID < 0) {
    throw new Error(`Provided spID is not a valid id. spID=${spID}`)
  }

  return spID
}

module.exports = {
  generateTimestampAndSignature,
  generateListenTimestampAndSignature,
  recoverWallet,
  sortKeys,
  MAX_SIGNATURE_AGE_MS,
  signatureHasExpired,
  verifyRequesterIsValidSP
}
