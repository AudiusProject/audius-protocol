import { getContentNodeInfoFromSpId } from './services/ContentNodeInfoManager'

const { libs } = require('@audius/sdk')
const LibsUtils = libs.Utils
const Web3 = require('web3')
const web3 = new Web3()
const { logger: genericLogger } = require('./logging')

/**
 * Max age of signature in milliseconds
 * Set to 5 minutes
 */
const MAX_SIGNATURE_AGE_MS = 300000

export const generateSignature = (data: any, privateKey: string) => {
  // JSON stringify automatically removes white space given 1 param
  const toSignStr = JSON.stringify(sortKeys(data))
  const toSignHash = web3.utils.keccak256(toSignStr)
  const signedResponse = web3.eth.accounts.sign(toSignHash, privateKey)

  return signedResponse.signature
}

/**
 * Generate the timestamp and signature for api signing
 * @param {object} data
 * @param {string} privateKey
 */
export const generateTimestampAndSignature = (
  data: any,
  privateKey: string
) => {
  const timestamp = new Date().toISOString()
  const toSignObj = { ...data, timestamp }
  const signature = generateSignature(toSignObj, privateKey)

  return { timestamp, signature }
}

// Keeps track of a cached listen signature
// Two field object: { timestamp, signature }
let cachedListenSignature: { timestamp: string; signature: any } | null = null

/**
 * Generates a signature for `data` if only the previous signature
 * generated is invalid (expired). Otherwise returns an existing signature.
 * @param {string} privateKey
 * @returns {object} {signature, timestamp} signature data
 */
export const generateListenTimestampAndSignature = (privateKey: any) => {
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
export const recoverWallet = (data: any, signature: any) => {
  const structuredData = JSON.stringify(sortKeys(data))
  const hashedData = web3.utils.keccak256(structuredData)
  const recoveredWallet = web3.eth.accounts.recover(hashedData, signature)

  return recoveredWallet
}

/**
 * Returns boolean indicating if provided timestamp is older than maxTTL
 * @param {string | number} signatureTimestamp unix timestamp string when signature was generated
 */
export const signatureHasExpired = (
  signatureTimestamp: string | number,
  maxTTL = MAX_SIGNATURE_AGE_MS
) => {
  const signatureTimestampDate = new Date(signatureTimestamp)
  const currentTimestampDate = new Date()
  const signatureAge = +currentTimestampDate - +signatureTimestampDate

  return signatureAge >= maxTTL
}

/**
 * Recursively sorts keys of object or object array
 */
export const sortKeys = (x: any): any => {
  if (typeof x !== 'object' || !x) {
    return x
  }
  if (Array.isArray(x)) {
    return x.map(sortKeys)
  }
  return Object.keys(x)
    .sort()
    .reduce((o, k) => ({ ...o, [k]: sortKeys(x[k]) }), {})
}

export const generateTimestampAndSignatureForSPVerification = (
  spID: number,
  privateKey: string
) => {
  return generateTimestampAndSignature({ spID }, privateKey)
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
export const verifyRequesterIsValidSP = async ({
  spID,
  reqTimestamp,
  reqSignature
}: {
  spID: number | string
  reqTimestamp: string
  reqSignature: string
}) => {
  if (!reqTimestamp || !reqSignature) {
    throw new Error(
      'Must provide all required query parameters: timestamp, signature'
    )
  }

  spID = validateSPId(spID)

  let {
    owner: ownerWalletFromSPFactory,
    delegateOwnerWallet: delegateOwnerWalletFromSPFactory,
    endpoint: nodeEndpointFromSPFactory
  } = (await getContentNodeInfoFromSpId(spID, genericLogger)) || {}

  delegateOwnerWalletFromSPFactory =
    delegateOwnerWalletFromSPFactory?.toLowerCase()

  if (!ownerWalletFromSPFactory || !delegateOwnerWalletFromSPFactory) {
    throw new Error(
      `Missing fields: ownerWallet=${ownerWalletFromSPFactory}, delegateOwnerWallet=${delegateOwnerWalletFromSPFactory}`
    )
  }

  /**
   * Reject if node is not registered as valid SP on L1 ServiceProviderFactory
   */
  if (
    LibsUtils.isZeroAddress(ownerWalletFromSPFactory) ||
    LibsUtils.isZeroAddress(delegateOwnerWalletFromSPFactory) ||
    !nodeEndpointFromSPFactory
  ) {
    throw new Error(
      `SpID ${spID} is not registered as valid SP on L1 ServiceProviderFactory or missing field endpoint=${nodeEndpointFromSPFactory}`
    )
  }

  /**
   * Confirm request was signed by delegate owner wallet registered on L1 for spID, given request signature artifacts
   */
  const requesterWalletRecoveryObj = { spID, timestamp: reqTimestamp }
  const recoveredDelegateOwnerWallet = recoverWallet(
    requesterWalletRecoveryObj,
    reqSignature
  ).toLowerCase()
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
 * Validates the request query param spID
 * @param {string} spID
 * @returns a parsed spID
 */
export function validateSPId(spID: string | number): number {
  if (!spID) {
    throw new Error('Must provide all required query parameters: spID')
  }

  const spIDNum = parseInt(spID + '', 10)

  if (isNaN(spIDNum) || spIDNum < 0) {
    throw new Error(`Provided spID is not a valid id. spID=${spID}`)
  }

  return spIDNum
}

module.exports = {
  generateTimestampAndSignature,
  generateSignature,
  generateListenTimestampAndSignature,
  generateTimestampAndSignatureForSPVerification,
  recoverWallet,
  sortKeys,
  MAX_SIGNATURE_AGE_MS,
  signatureHasExpired,
  verifyRequesterIsValidSP
}
