/**
 * Initiate a round
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 * @param {String?} privateKey optional private key string
 */
async function initiateRound (audiusLibs, privateKey) {
  if (!audiusLibs) throw new Error('audiusLibs is not defined')

  const resp = await audiusLibs.ethContracts.ClaimsManagerClient.initiateRound(privateKey)
  console.log('initiateRound resp', resp)
  return resp
}

/**
 * Returns the block when a round was last initiated
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 */
async function getLastFundedBlock (audiusLibs) {
  const resp = await audiusLibs.ethContracts.ClaimsManagerClient.getLastFundedBlock()
  console.log('getLastFundedBlock', resp)
  return resp
}

module.exports = { initiateRound, getLastFundedBlock }
