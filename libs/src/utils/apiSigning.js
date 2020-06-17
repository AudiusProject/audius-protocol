/**
 * Recover the public wallet address given the response contains the signature and timestamp
 * @param {object} response discovery provider response
 */
function recoverWallet (web3, response) {
  let ownerWallet = null
  try {
    const dataForRecovery = { data: response.data, timestamp: response.timestamp }
    const dataForRecoveryStr = JSON.stringify(sortKeys(dataForRecovery))

    const hashedData = web3.utils.keccak256(dataForRecoveryStr)
    ownerWallet = web3.eth.accounts.recover(hashedData, response.signature)
  } catch (e) {
    console.error(`Issue with recovering public wallet address: ${e}`)
  }

  return ownerWallet
}

/**
 * Sort the object keys alphabetically
 * @param {object} x
 */
function sortKeys (x) {
  if (typeof x !== 'object' || !x) { return x }
  if (Array.isArray(x)) { return x.map(sortKeys) }
  return Object.keys(x).sort().reduce((o, k) => ({ ...o, [k]: sortKeys(x[k]) }), {})
}

module.exports.recoverWallet = recoverWallet
module.exports.sortKeys = sortKeys
