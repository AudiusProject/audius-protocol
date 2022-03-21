const { getEthWeb3AndAccounts, convertAudsToWeiBN } = require('./utils')

/**
 * Local only
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 * @param {String} amountOfAUDS integer amount of auds tokens
 */
async function distributeTokens (audiusLibs, amountOfAUDS) {
  if (!audiusLibs) throw new Error('audiusLibs is not defined')

  const { ethWeb3, ethAccounts } = await getEthWeb3AndAccounts(audiusLibs)

  const initialTokenInAudWeiBN = convertAudsToWeiBN(ethWeb3, amountOfAUDS)
  await Promise.all(ethAccounts.map(async (account) => {
    if (account === ethAccounts[0]) { return }
    const tx = await audiusLibs.ethContracts.AudiusTokenClient.transfer(account, initialTokenInAudWeiBN)
    console.log(`${tx.txReceipt.transactionHash} Transferred ${amountOfAUDS} to ${account}`)
  }))
  for (const account of ethAccounts) {
    if (account === ethAccounts[0]) { continue }
  }
}

module.exports = { distributeTokens }
