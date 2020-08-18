const assert = require('assert')
const helpers = require('./helpers')

const serviceTypeList = ['discovery-provider', 'creator-node', 'content-service']
const latestVersionStr = '0.1.0'

const audius0 = helpers.audiusInstance

let ownerWallet
let accounts

before(async function () {
  await audius0.init()
  ownerWallet = audius0.ethWeb3Manager.getWalletAddress()
  accounts = await audius0.ethWeb3Manager.getWeb3().eth.getAccounts()
})

it('register service versions', async function () {
  for (const serviceType of serviceTypeList) {
    let testTx
    try {
      testTx = await audius0.ethContracts.ServiceTypeManagerClient.setServiceVersion(
        serviceType,
        latestVersionStr)
    } catch (e) {
      if (!e.toString().includes('Already registered')) {
        console.log(e)
      } else {
        console.log(`${serviceType} already registered`)
      }
    }
  }
})

it('query service versions', async function () {
  for (const serviceType of serviceTypeList) {
    try {
      let currentVersion = await audius0.ethContracts.ServiceTypeManagerClient.getCurrentVersion(serviceType)
      assert(currentVersion === latestVersionStr, 'Expect latest version')
    } catch (e) {
      if (!e.toString().includes('Already registered')) {
        console.log(e)
      } else {
        console.log('Already registered')
      }
    }
  }
})
