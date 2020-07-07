const assert = require('assert')

/**
 * Recover the public wallet address given the response contains the signature and timestamp
 * @param {object} response entire service provider response (not axios)
 */
function recoverWallet (web3, response) {
  let recoveredDelegateWallet = null

  const dataForRecovery = JSON.parse(JSON.stringify(response))
  delete dataForRecovery['signature']
  const dataForRecoveryStr = JSON.stringify(_sortKeys(dataForRecovery))

  try {
    const hashedData = web3.utils.keccak256(dataForRecoveryStr)
    recoveredDelegateWallet = web3.eth.accounts.recover(hashedData, response.signature)

    assert.strictEqual(response.signer, recoveredDelegateWallet)
  } catch (e) {
    console.error(`Issue with recovering public wallet address: ${e}`)
  }

  return recoveredDelegateWallet
}

/**
 * Sort the object keys alphabetically
 * @param {object} x
 */
function _sortKeys (x) {
  if (typeof x !== 'object' || !x) { return x }
  if (Array.isArray(x)) { return x.map(_sortKeys) }
  return Object.keys(x).sort().reduce((o, k) => ({ ...o, [k]: _sortKeys(x[k]) }), {})
}

module.exports.recoverWallet = recoverWallet
