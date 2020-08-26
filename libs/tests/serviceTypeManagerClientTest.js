const assert = require('assert')
const helpers = require('./helpers')

const latestVersionStr = '0.1.0'

const audius0 = helpers.audiusInstance

let serviceTypeList
let ownerWallet
let accounts

before(async function () {
  await audius0.init()
  ownerWallet = audius0.ethWeb3Manager.getWalletAddress()
  accounts = await audius0.ethWeb3Manager.getWeb3().eth.getAccounts()
  serviceTypeList = await audius0.ethContracts.ServiceTypeManagerClient.getValidServiceTypes()
})

it('register service versions', async function () {
  for (const serviceType of serviceTypeList) {
    await audius0.ethContracts.ServiceTypeManagerClient.setServiceVersion(
      serviceType,
      latestVersionStr
    )
  }
})

it('query service versions', async function () {
  for (const serviceType of serviceTypeList) {
    let currentVersion = await audius0.ethContracts.ServiceTypeManagerClient.getCurrentVersion(serviceType)
    assert(currentVersion === latestVersionStr, 'Expect latest version')
  }
})
