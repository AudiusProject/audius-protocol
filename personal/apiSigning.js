const assert = require('assert')
const Web3 = require('web3')
// @ts-ignore
const web3 = new Web3()

/**
 * Recursively sorts keys of object or object array
 */
const sortKeys = (x) => {
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

/**
 * Recover the public wallet address
 * @param {*} data obj with structure {...data, timestamp}
 * @param {*} signature signature generated with signed data
 */
// eslint-disable-next-line no-unused-vars
const recoverWallet = (data, signature) => {
  const structuredData = JSON.stringify(sortKeys(data))
  const hashedData = web3.utils.keccak256(structuredData)
  const recoveredWallet = web3.eth.accounts.recover(hashedData, signature)

  return recoveredWallet
}

// {spID, timestamp}

// const privKey =
//   '0xdb527e4d4a2412a443c17e1666764d3bba43e89e61129a35f9abc337ec170a5d'
// const pubKey = '0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25'
// const { timestamp, signature } = generateTimestampAndSignature(
//   { spID: 1 },
//   privKey
// )

// const recoveredPubKey = recoverWallet({ spID: 1, timestamp }, signature)

// console.log('timestamp', timestamp, 'signature', signature)
// console.log('recovered', recoveredPubKey, 'expected', pubKey)
// assert.strictEqual(recoveredPubKey, pubKey)

module.exports = { generateTimestampAndSignature, recoverWallet }
