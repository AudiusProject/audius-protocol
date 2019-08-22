const { getEthWeb3AndAccounts, convertAudsToWeiBN } = require('./utils')

/**
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 */
async function getClaimInfo (audiusLibs) {
  // @dev - audius instance numbering is off-by-1 from accounts to
  // align with creator/track numbering below, which are 1-indexed
  return audiusLibs.ethContracts.StakingProxyClient.getClaimInfo()
}

/**
 * Funds the treasury that service providers can claim from
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 * @param {String} privateKey The private key string
 */
async function fundNewClaim (audiusLibs, privateKey = null) {
  // Set default claim to 1,000,000 tokens
  const claimAmountInAUDS = 1000000
  const { ethWeb3 } = await getEthWeb3AndAccounts(audiusLibs)
  const libOwner = audiusLibs.ethContracts.ethWeb3Manager.getWalletAddress()

  console.log('/---- Funding new claim')
  let bal = await audiusLibs.ethContracts.AudiusTokenClient.balanceOf(libOwner)
  console.log(bal)
  let claimAmountInAudWeiBN = convertAudsToWeiBN(ethWeb3, claimAmountInAUDS)
  console.log(claimAmountInAudWeiBN)

  // Actually perform fund op
  let tx = await audiusLibs.ethContracts.StakingProxyClient.fundNewClaim(claimAmountInAudWeiBN, privateKey)
  console.log(tx)
  console.log('/---- End funding new claim')

  return getClaimInfo(audiusLibs)
}

module.exports = { getClaimInfo, fundNewClaim }
