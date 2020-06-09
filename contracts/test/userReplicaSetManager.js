import * as _lib from './_lib/lib.js'
import {
  Registry,
  UserStorage,
  UserFactory,
  UserReplicaSetManager
} from './_lib/artifacts.js'
import * as _constants from './utils/constants'
const { expectRevert } = require('@openzeppelin/test-helpers');

contract('UserReplicaSetManager', async (accounts) => {
  const deployer = accounts[0]
  const verifierAddress = accounts[2]
  const userId1 = 1
  const userAcct1 = accounts[3]
  const userId2 = 2
  const userAcct2 = accounts[4]
  // First spID = 1, account = accounts[3]
  const cnode1SpID = 1
  const cnode1Account = accounts[5]
  // Second spID = 2, accounts = accounts[4]
  const cnode2SpID = 2
  const cnode2Account = accounts[6]
  // Third spID = 3, accounts = accounts[5]
  const cnode3SpID = 3
  const cnode3Account = accounts[7]
  // Fourth spID = 4, accounts = accounts[6]
  const cnode4SpID = 4
  const cnode4Account = accounts[8]

  // Contract objects
  let registry
  let userStorage
  let userFactory
  let userReplicaSetManager

  beforeEach(async () => {
    // init contract state
    registry = await Registry.new()
    const networkId = Registry.network_id

    // Add user storage and user factory
    userStorage = await UserStorage.new(registry.address)
    await registry.addContract(_constants.userStorageKey, userStorage.address)
    userFactory = await UserFactory.new(registry.address, _constants.userStorageKey, networkId, verifierAddress)
    await registry.addContract(_constants.userFactoryKey, userFactory.address)

    userReplicaSetManager = await UserReplicaSetManager.new(registry.address, _constants.userFactoryKey, networkId, { from: deployer })
    await registry.addContract(_constants.userReplicaSetManagerKey, userReplicaSetManager.address)

    // Add 2 users
    await _lib.addUserAndValidate(
      userFactory,
      userId1,
      userAcct1,
      _constants.testMultihash.digest1,
      _constants.userHandle1,
      true)
    await _lib.addUserAndValidate(
      userFactory,
      userId2,
      userAcct2,
      _constants.testMultihash.digest1,
      _constants.userHandle2,
      true)

    // Setup cnode 1 from deployer address
    await updateCreatorNode(cnode1SpID, cnode1Account, 0, deployer)
    // Setup cnode 2 through cnode1Account
    await updateCreatorNode(cnode2SpID, cnode2Account, cnode1SpID, cnode1Account)
    // Setup cnode 3 through cn2Account
    await updateCreatorNode(cnode3SpID, cnode3Account, cnode2SpID, cnode2Account)
    // Setup cnode 4 through cn3Account
    await updateCreatorNode(cnode4SpID, cnode4Account, cnode3SpID, cnode3Account)
  })

  /** Helper Functions **/
  let updateCreatorNode = async (newCnodeId, newCnodeDelegateOwnerWallet, proposerId, proposerWallet) => {
    await userReplicaSetManager.updateCreatorNode(
      newCnodeId,
      newCnodeDelegateOwnerWallet,
      proposerId,
      proposerWallet,
      { from: proposerWallet }
    )
    let walletFromChain = await userReplicaSetManager.getCreatorNodeWallet(newCnodeId)
    assert.equal(walletFromChain, newCnodeDelegateOwnerWallet, 'Expect wallet assignment')
  }

  let updateReplicaSet = async (userId, newPrimary, newSecondaries, oldPrimary, oldSecondaries, senderAcct) => {
    await userReplicaSetManager.updateReplicaSet(
      userId, newPrimary, newSecondaries, oldPrimary, oldSecondaries,
      { from: senderAcct }
    )
    let replicaSetFromChain = await userReplicaSetManager.getArtistReplicaSet(userId)
    assert.isTrue(replicaSetFromChain.primary.eq(newPrimary), 'Primary mismatch')
    assert.isTrue(replicaSetFromChain.secondaries.every((replicaId, i) => replicaId.eq(newSecondaries[i])), 'Secondary mismatch')
  }

  /** Test Cases **/
  it('Configure artist replica set', async () => {
    const user1Primary = _lib.toBN(1)
    const user1Secondaries = _lib.toBNArray([2, 3])
    await updateReplicaSet(userId1, user1Primary, user1Secondaries, 0, [], userAcct1)
  })

  it('Configure + update artist replica set', async () => {
    let user1Primary = _lib.toBN(1)
    let user1Secondaries = _lib.toBNArray([2, 3])
    let oldPrimary = user1Primary
    let oldSecondaries = user1Secondaries
    await updateReplicaSet(userId1, user1Primary, user1Secondaries, 0, [], userAcct1)
    // Fail with out of date prior configuration
    await expectRevert(
      updateReplicaSet(userId1, user1Primary, user1Secondaries, 0, [], userAcct1),
      'Invalid prior primary configuration'
    )
    await expectRevert(
      updateReplicaSet(userId1, user1Primary, user1Secondaries, user1Primary, [], userAcct1),
      'Invalid prior secondary configuration'
    )
    // Now issue update from userAcct1
    user1Primary = _lib.toBN(2)
    user1Secondaries = _lib.toBNArray([3, 1])
    await updateReplicaSet(userId1, user1Primary, user1Secondaries, oldPrimary, oldSecondaries, userAcct1)

    // Swap out secondary cn1 for cn4 from cn3
    oldPrimary = user1Primary
    oldSecondaries = user1Secondaries
    // 5 is an invalid ID
    let invalidUser1Secondaries = _lib.toBNArray([3, 5])
    await expectRevert(
      updateReplicaSet(userId1, user1Primary, invalidUser1Secondaries, oldPrimary, oldSecondaries, cnode3Account),
      'Secondary must exist'
    )
    user1Secondaries = _lib.toBNArray([3, 4])
    await updateReplicaSet(userId1, user1Primary, user1Secondaries, oldPrimary, oldSecondaries, cnode3Account)
  })
})
