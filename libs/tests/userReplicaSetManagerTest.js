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
let audius3

// sp accounts
let sp1EthWallet
let sp1DataWallet
let sp2EthWallet
let sp2DataWallet
let sp3EthWallet
let sp3DataWallet
let deployer
const sp1Id = 1
const sp2Id = 2
const sp3Id = 3

const existingUserId = 1
const addressZero = '0x0000000000000000000000000000000000000000'

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

const getUsersForCreatorNode = async (cnodeId, userId, expectedPrimary, expectedSecondaries) => {
  let resp = await audius1.discoveryProvider.getUsersForCreatorNode(cnodeId)
  assert(resp.length > 0, 'Expect users to exist for creator node 1')
  let filteredResp = resp.filter(x=>x.user_id == userId)
  assert(filteredResp.length === 1, 'Expect single entry for user')
  let entry = filteredResp[0]
  let primaryEqual = entry.primary === expectedPrimary
  assert(primaryEqual, 'Expect primary update')
  let secondariesEqual = JSON.stringify(entry.secondaries)==JSON.stringify(expectedSecondaries)
  assert(secondariesEqual, 'Expect secondaries update')
}

describe('UserReplicaSetManager Tests', () => {
  let testServiceType = 'discovery-provider'
  let newPrimary
  let newSecondaries
  before(async function () {
    await audius0.init()
    token = audius0.ethContracts.AudiusTokenClient
    ethAccounts = await audius0.ethWeb3Manager.getWeb3().eth.getAccounts()
    dataAccounts = await audius0.web3Manager.getWeb3().eth.getAccounts()
    deployer = dataAccounts[0]

    const user1 = await audius0.contracts.UserFactoryClient.getUser(existingUserId)
    assert(user1.wallet !== addressZero, `userId1 must exist - ${user1}`)
    assert(user1.wallet === deployer, 'Expected address for existing user not found')

    ownerWallet = ethAccounts[0]

    sp1EthWallet = ethAccounts[1]
    sp2EthWallet = ethAccounts[2]
    sp3EthWallet = ethAccounts[3]
    sp1DataWallet = dataAccounts[1]
    sp2DataWallet = dataAccounts[2]
    sp3DataWallet = dataAccounts[3]

    console.log(ethAccounts)
    console.log(dataAccounts)
    console.log(`Deployer: ${deployer}`)
    console.log(`SP1 Data Wallet: ${sp1DataWallet}`)

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
      // TODO: See if we can remove everything here
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

    // Try to make an update with an invalid spID for audius1
    await assertRevert(audius1.contracts.UserReplicaSetManagerClient.addOrUpdateCreatorNode(sp2Id, sp2DataWallet, 3), 'Mismatch proposer')
    // From sp1 account, configure sp2Id -> sp2DataWallet
    await audius1.contracts.UserReplicaSetManagerClient.addOrUpdateCreatorNode(sp2Id, sp2DataWallet, sp1Id)
    assert.strict.equal(await audius1.contracts.UserReplicaSetManagerClient.getCreatorNodeWallet(sp2Id), sp2DataWallet, 'Expect updated wallet')

    // From sp2 account, configure sp3Id -> sp3DataWallet
    await audius2.contracts.UserReplicaSetManagerClient.addOrUpdateCreatorNode(sp3Id, sp3DataWallet, sp2Id)
    assert.strict.equal(await audius1.contracts.UserReplicaSetManagerClient.getCreatorNodeWallet(sp3Id), sp3DataWallet, 'Expect updated wallet')
  })

  it('Configure user1 replica set', async function () {
    let currentReplicaSet = await audius1.contracts.UserReplicaSetManagerClient.getArtistReplicaSet(existingUserId)
    // console.log(currentReplicaSet)
    newPrimary = sp1Id
    newSecondaries = [sp3Id, sp2Id]
    // Issue update from audius0, account which owns existingUserId
    await audius0.contracts.UserReplicaSetManagerClient.updateReplicaSet(
      existingUserId,
      newPrimary,
      newSecondaries,
      currentReplicaSet.primary,
      currentReplicaSet.secondaries)
    currentReplicaSet = await audius1.contracts.UserReplicaSetManagerClient.getArtistReplicaSet(existingUserId)
    let primaryFromChain = parseInt(currentReplicaSet.primary)
    let secondariesFromChain = currentReplicaSet.secondaries.map(x => parseInt(x))
    assert(primaryFromChain === (newPrimary), 'Expect primary update')
    assert(secondariesFromChain.length === newSecondaries.length, 'Expect secondary lengths to be equal')
    assert(secondariesFromChain.every((replicaId, i) => replicaId === newSecondaries[i]), 'Secondary mismatch')

    // Confirm user exists for all 3 nodes
    await getUsersForCreatorNode(sp1Id, existingUserId, newPrimary, newSecondaries)
    await getUsersForCreatorNode(sp2Id, existingUserId, newPrimary, newSecondaries)
    await getUsersForCreatorNode(sp3Id, existingUserId, newPrimary, newSecondaries)
  })
})
