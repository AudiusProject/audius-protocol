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
let sp1EthWallet
let sp1DataWallet
let sp2EthWallet
let sp2DataWallet
let deployer
const sp1Id = 1
const sp2Id = 2

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

const assertRevert = async (blockOrPromise, expectedReason) => {
  const error = await assertThrows(blockOrPromise, 'revert', expectedReason)
  // console.log(error)
  if (!expectedReason) {
    return
  }
  const expectedMsgFound = error.message.indexOf(expectedReason) >= 0
  assert.equal(expectedMsgFound, true, 'Expected revert reason not found')
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
    console.log(`Deployer: ${deployer}`)

    // Reset min stake
    await audius0.ethContracts.StakingProxyClient.setMinStakeAmount(0)

    ownerWallet = ethAccounts[0]

    sp1EthWallet = ethAccounts[1]
    sp1DataWallet = dataAccounts[1]
    console.log(`SP1 Data Wallet: ${sp1DataWallet}`)

    sp2EthWallet = ethAccounts[2]
    sp2DataWallet = dataAccounts[2]

    // Initialize more lib instances
    let libsConfig1 = await initializeLibConfig(sp1EthWallet, sp1DataWallet)
    let libsConfig2 = await initializeLibConfig(sp2EthWallet, sp2DataWallet)

    assert(ethContractsConfig.ownerWallet !== libsConfig1.ownerWallet, 'New wallet addr')
    audius1 = new AudiusLibs(libsConfig1)
    await audius1.init()

    assert(ethContractsConfig.ownerWallet !== libsConfig2.ownerWallet, 'New wallet addr')
    audius2 = new AudiusLibs(libsConfig2)
    await audius2.init()

    let audius1DataOwnerWallet = audius1.web3Manager.getWalletAddress()
    console.log(`Audius Libs 1 - Data Wallet: ${audius1DataOwnerWallet}`)
    let audius2DataOwnerWallet = audius2.web3Manager.getWalletAddress()
    console.log(`Audius Libs 2 - Data Wallet: ${audius2DataOwnerWallet}`)
  })

  beforeEach(async () => {
    try {
      // Deregister any previously registered endpoints
      // await testDeregisterSPEndpoint(audius1, sp1, testServiceType)
      // await testDeregisterSPEndpoint(audius2, sp2EthWallet, testServiceType)
    } catch (e) {
      // console.log(`benign error: ${e}`)
    }
  })

  it('Add or update creator node', async function () {
    let sp1CnodeWalletFromChain = await audius1.contracts.UserReplicaSetManagerClient.getCreatorNodeWallet(sp1Id)

    // From deployerAccount, configure sp1Id -> sp1DataWallet. Note that this is actually the delegateWallet
    await audius0.contracts.UserReplicaSetManagerClient.addOrUpdateCreatorNode(sp1Id, sp1DataWallet, 0)
    sp1CnodeWalletFromChain = await audius1.contracts.UserReplicaSetManagerClient.getCreatorNodeWallet(sp1Id)
    assert.strict.equal(sp1CnodeWalletFromChain, sp1DataWallet, 'Expect updated wallet')

    // From sp1 account, configure sp2EthWallet
    console.log(await audius1.contracts.UserReplicaSetManagerClient.getCreatorNodeWallet(sp2Id))
    await assertRevert(audius1.contracts.UserReplicaSetManagerClient.addOrUpdateCreatorNode(sp2Id, sp2DataWallet, 3), 'Mismatch proposer')
    await audius1.contracts.UserReplicaSetManagerClient.addOrUpdateCreatorNode(sp2Id, sp2DataWallet, sp1Id)
    console.log(await audius1.contracts.UserReplicaSetManagerClient.getCreatorNodeWallet(sp2Id))
  })
})
