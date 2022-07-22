const { libs } = require('@audius/sdk')
const LibsUtils = libs.Utils
const Web3 = require('web3')
const web3 = new Web3()

/**
 * Max age of signature in milliseconds
 * Set to 5 minutes
 */
const MAX_SIGNATURE_AGE_MS = 300000

/**
 * Generate the timestamp and signature for api signing
 */
const generateTimestampAndSignature = (data: Object, privateKey: string) => {
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
let cachedListenSignature: { timestamp: string; signature: string } | null =
  null

/**
 * Generates a signature for `data` if only the previous signature
 * generated is invalid (expired). Otherwise returns an existing signature.
 */
const generateListenTimestampAndSignature = (
  privateKey: string
): { timestamp: string; signature: string } => {
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
 */
// eslint-disable-next-line no-unused-vars
const recoverWallet = (
  data: { timestamp: string; [key: string]: any },
  signature: string
): string => {
  const structuredData = JSON.stringify(sortKeys(data))
  const hashedData = web3.utils.keccak256(structuredData)
  const recoveredWallet = web3.eth.accounts.recover(hashedData, signature)

  return recoveredWallet
}

/**
 * Returns boolean indicating if provided timestamp is older than MAX_SIGNATURE_AGE
 * @param {string} signatureTimestamp unix timestamp string when signature was generated
 */
const signatureHasExpired = (signatureTimestamp: string): boolean => {
  const signatureTimestampDate = new Date(signatureTimestamp).getTime()
  const currentTimestampDate = new Date().getTime()
  const signatureAge = currentTimestampDate - signatureTimestampDate

  return signatureAge >= MAX_SIGNATURE_AGE_MS
}

/**
 * Recursively sorts keys of object or object array
 */
const sortKeys: any = (x: any) => {
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

const generateTimestampAndSignatureForSPVerification = (
  spID: string | number,
  privateKey: string
) => {
  return generateTimestampAndSignature({ spID }, privateKey)
}

/**
 * Wrapper fn to perform basic validation that the requester is a valid SP and that the request came
 * from the SP node itself. Uses the {spID, timestamp} as the input data to recover.
 */
const verifyRequesterIsValidSP = async ({
  audiusLibs,
  spID, // the spID of the node to verify
  reqTimestamp, // the timestamp from the request body
  reqSignature // the signature from the request body
}: {
  audiusLibs: any
  spID: string
  reqTimestamp: string
  reqSignature: string
}) => {
  if (!reqTimestamp || !reqSignature) {
    throw new Error(
      'Must provide all required query parameters: timestamp, signature'
    )
  }

  const spIDNumber = validateSPId(spID)

  const spRecordFromSPFactory =
    await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo(
      'content-node',
      spIDNumber
    )

  let {
    owner: ownerWalletFromSPFactory,
    delegateOwnerWallet: delegateOwnerWalletFromSPFactory,
    endpoint: nodeEndpointFromSPFactory
  } = spRecordFromSPFactory
  delegateOwnerWalletFromSPFactory =
    delegateOwnerWalletFromSPFactory.toLowerCase()

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
      `SpID ${spIDNumber} is not registered as valid SP on L1 ServiceProviderFactory or missing field endpoint=${nodeEndpointFromSPFactory}`
    )
  }

  /**
   * Confirm request was signed by delegate owner wallet registered on L1 for spID, given request signature artifacts
   */
  const requesterWalletRecoveryObj = {
    spID: spIDNumber,
    timestamp: reqTimestamp
  }
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
    spID: spIDNumber
  }
}

/**
 * Validates the request query param spID
 * @param {string} spID
 * @returns a parsed spID
 */
function validateSPId(spID: string): number {
  if (!spID) {
    throw new Error('Must provide all required query parameters: spID')
  }

  const spIDNumber = parseInt(spID)

  if (isNaN(spIDNumber) || spIDNumber < 0) {
    throw new Error(`Provided spID is not a valid id. spID=${spIDNumber}`)
  }

  return spIDNumber
}

module.exports = {
  generateTimestampAndSignature,
  generateListenTimestampAndSignature,
  generateTimestampAndSignatureForSPVerification,
  recoverWallet,
  sortKeys,
  MAX_SIGNATURE_AGE_MS,
  signatureHasExpired,
  verifyRequesterIsValidSP
}
