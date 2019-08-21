/**
 * Local only
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 */
async function distributeTokens (audiusLibs) {
  let ethWeb3 = audiusLibs.ethWeb3Manager.getWeb3()
  const ethAccounts = await ethWeb3.eth.getAccounts()
  console.log(ethAccounts)

  const amountOfAUDS = 100000
  let initialTokenInAudWei = ethWeb3.utils.toWei(amountOfAUDS.toString(), 'ether')
  let initialTokenInAudWeiBN = ethWeb3.utils.toBN(initialTokenInAudWei)
  for (const acct of ethAccounts) {
    if (acct === ethAccounts[0]) { continue }
    console.log(acct)
    let tx = await audiusLibs.ethContracts.AudiusTokenClient.transfer(acct, initialTokenInAudWeiBN)
    console.log(tx)
  }
}

module.exports = { distributeTokens }
