/**
 * This file includes schemas for use in EIP-712 compliant signature generation and
 * signature validation, generator functions for generating data
 * in the form needed by eth_personalSign / eth-sig-util's signTypedData functions,
 * generators for contract signing domains, and a helper function for generating
 * cryptographically secure nonces in nodejs or in the browser.
 * modeled off: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
 */

const domains = {}

function getDomainData(
  contractName,
  signatureVersion,
  chainId,
  contractAddress
) {
  return {
    name: contractName,
    version: signatureVersion,
    chainId: chainId,
    verifyingContract: contractAddress
  }
}

domains.getEntityManagerDomain = function (chainId, contractAddress) {
  return getDomainData('Entity Manager', '1', chainId, contractAddress)
}

const schemas = {}

/* contract signing domain */
schemas.domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
]

schemas.manageEntity = [
  { name: 'userId', type: 'uint' },
  { name: 'entityType', type: 'string' },
  { name: 'entityId', type: 'uint' },
  { name: 'action', type: 'string' },
  { name: 'metadata', type: 'string' },
  { name: 'nonce', type: 'bytes32' }
]

const generators = {}

function getRequestData(
  domainDataFn,
  chainId,
  contractAddress,
  messageTypeName,
  messageSchema,
  message
) {
  const domainData = domainDataFn(chainId, contractAddress)
  const types = {
    EIP712Domain: schemas.domain
  }
  types[messageTypeName] = messageSchema
  return {
    types: types,
    domain: domainData,
    primaryType: messageTypeName,
    message: message
  }
}

/* User Factory Generators */
generators.getAddUserRequestData = function (
  chainId,
  contractAddress,
  handle,
  nonce
) {
  const message = {
    handle: handle,
    nonce: nonce
  }
  return getRequestData(
    domains.getUserFactoryDomain,
    chainId,
    contractAddress,
    'AddUserRequest',
    schemas.addUserRequest,
    message
  )
}

generators.getManageEntityData = function (
  chainId,
  contractAddress,
  userId,
  entityType,
  entityId,
  action,
  metadata,
  nonce
) {
  const message = {
    userId,
    entityType,
    entityId,
    action,
    metadata,
    nonce
  }
  return getRequestData(
    domains.getEntityManagerDomain,
    chainId,
    contractAddress,
    'ManageEntity',
    schemas.manageEntity,
    message
  )
}

/** Return a secure random hex string of nChar length in a browser-compatible way
 *  Taken from https://stackoverflow.com/questions/37378237/how-to-generate-a-random-token-of-32-bit-in-javascript
 */
function browserRandomHash(nChar) {
  // convert number of characters to number of bytes
  var nBytes = Math.ceil((nChar = (+nChar || 8) / 2))

  // create a typed array of that many bytes
  var u = new Uint8Array(nBytes)

  // populate it wit crypto-random values
  window.crypto.getRandomValues(u)

  // convert it to an Array of Strings (e.g. '01', 'AF', ..)
  var zpad = function (str) {
    return '00'.slice(str.length) + str
  }
  var a = Array.prototype.map.call(u, function (x) {
    return zpad(x.toString(16))
  })

  // Array of String to String
  var str = a.join('').toLowerCase()
  // and snip off the excess digit if we want an odd number
  if (nChar % 2) str = str.slice(1)

  // return what we made
  return str
}

async function getNonce() {
  // We need to detect whether the nodejs crypto module is available to determine how to
  // generate secure random numbers below
  let nodeCrypto
  try {
    nodeCrypto = await import('crypto')
  } catch (e) {
    nodeCrypto = null
  }
  // detect whether we are in browser or in nodejs, and use the correct csprng
  if (typeof window === 'undefined' || window === null) {
    return '0x' + nodeCrypto.randomBytes(32).toString('hex')
  } else {
    return '0x' + browserRandomHash(64)
  }
}

module.exports = { domains, schemas, generators, getNonce }
