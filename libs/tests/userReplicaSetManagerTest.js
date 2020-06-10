const assert = require('assert')
const nock = require('nock')
const helpers = require('./helpers')

const audius0 = helpers.audiusInstance
// const audiusConfig = helpers.audiusLibsConfig
const initializeLibConfig = helpers.initializeLibConfig
const ethContractsConfig = require('../eth-contracts/config.json')
const AudiusLibs = require('../src/index')

let token
let ownerWallet
let ethAccounts
let dataAccounts
let audius1
let audius2

// sp accounts
let sp1
let sp2
let deployer

const assertThrows = async (blockOrPromise, expectedErrorCode, expectedReason) => {
  try {
    (typeof blockOrPromise === 'function') ? await blockOrPromise() : await blockOrPromise
  } catch (error) {
    assert(error.message.search(expectedErrorCode) > -1, `Expected error code "${expectedErrorCode}" but failed with "${error}" instead.`)
    return error
  }
  // assert.fail() for some reason does not have its error string printed 🤷
  assert(false, `Expected "${expectedErrorCode}"${expectedReason ? ` (with reason: "${expectedReason}")` : ''} but it did not fail`)
}

describe('UserReplicaSetManager Tests', () => {
  let testServiceType = 'discovery-provider'
  before(async function () {
    await audius0.init()
    token = audius0.ethContracts.AudiusTokenClient
    ethAccounts = await audius0.ethWeb3Manager.getWeb3().eth.getAccounts()
    dataAccounts = await audius0.web3Manager.getWeb3().eth.getAccounts()
    console.log(ethAccounts)
    console.log(dataAccounts)
    deployer = dataAccounts[0]

    // Reset min stake
    await audius0.ethContracts.StakingProxyClient.setMinStakeAmount(0)

    ownerWallet = ethAccounts[0]
    sp1 = ethAccounts[1]
    sp2 = ethAccounts[2]

    // Initialize more lib instances
    let libsConfig1 = await initializeLibConfig(sp1)
    assert(ethContractsConfig.ownerWallet !== libsConfig1.ownerWallet, 'New wallet addr')
    audius1 = new AudiusLibs(libsConfig1)
    await audius1.init()

    let libsConfig2 = await initializeLibConfig(ethAccounts[2])
    assert(ethContractsConfig.ownerWallet !== libsConfig2.ownerWallet, 'New wallet addr')
    audius2 = new AudiusLibs(libsConfig2)
    await audius2.init()
  })

  beforeEach(async () => {
    try {
      // Deregister any previously registered endpoints
      // await testDeregisterSPEndpoint(audius1, sp1, testServiceType)
      // await testDeregisterSPEndpoint(audius2, sp2, testServiceType)
    } catch (e) {
      // console.log(`benign error: ${e}`)
    }
  })

  it('test state', async function () {
    let sp1Wallet = await audius1.contracts.UserReplicaSetManagerClient.getCreatorNodeWallet(1)
    console.log('----')
    console.log(sp1Wallet)
    console.log('---->>>>>')
    console.log(ownerWallet)
    console.log(audius0.web3Manager.getWalletAddress())
  })
})
