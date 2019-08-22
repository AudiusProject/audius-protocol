const { getEthWeb3AndAccounts, convertAudsToWeiBN } = require('./utils')

/**
 * Local only
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 */
async function distributeTokens (audiusLibs) {
  const { ethWeb3, ethAccounts } = await getEthWeb3AndAccounts(audiusLibs)
  console.log(ethAccounts)

  const amountOfAUDS = 100000
  let initialTokenInAudWeiBN = convertAudsToWeiBN(ethWeb3, amountOfAUDS)
  for (const account of ethAccounts) {
    if (account === ethAccounts[0]) { continue }
    console.log(account)
    let tx = await audiusLibs.ethContracts.AudiusTokenClient.transfer(account, initialTokenInAudWeiBN)
    console.log(tx)
  }
}

module.exports = { distributeTokens }
