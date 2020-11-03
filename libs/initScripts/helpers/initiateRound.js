const { getEthWeb3AndAccounts, convertAudsToWeiBN } = require('./utils')

async function initiateRound (audiusLibs, privateKey) {
  if (!audiusLibs) throw new Error('audiusLibs is not defined')

  const resp = await audiusLibs.ethContracts.ClaimsManagerClient.initiateRound(privateKey)
  console.log('initiateRound resp', resp)
  return resp
}

async function getLastFundedBlock (audiusLibs) {
  const resp = await audiusLibs.ethContracts.ClaimsManagerClient.getLastFundedBlock()
  console.log('getLastFundedBlock', resp)
  return resp
}

module.exports = { initiateRound, getLastFundedBlock }
