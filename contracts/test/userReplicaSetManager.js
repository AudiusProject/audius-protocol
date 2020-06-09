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
  const verifierAddress = accounts[2]
  const testUserId1 = 1
  const testUserId2 = 2
  // First spID = 1, account = accounts[3]
  const cnode1SpID = 1
  const cnode1Account = accounts[3]
  // Second spID = 2, accounts = accounts[4]
  const cnode2SpID = 2
  const cnode2Account = accounts[4]
  // Third spID = 3, accounts = accounts[5]
  const cnode3SpID = 3
  const cnode3Account = accounts[5]
  // Fourth spID = 4, accounts = accounts[6]
  const cnode4SpID = 4
  const cnode4Account = accounts[6]

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

    userReplicaSetManager = await UserReplicaSetManager.new(registry.address, _constants.userFactoryKey, networkId)
    await registry.addContract(_constants.userReplicaSetManagerKey, userReplicaSetManager.address)

    // Add 2 users
    await _lib.addUserAndValidate(
      userFactory,
      testUserId1,
      accounts[0],
      _constants.testMultihash.digest1,
      _constants.userHandle1,
      true)
    await _lib.addUserAndValidate(
      userFactory,
      testUserId2,
      accounts[0],
      _constants.testMultihash.digest1,
      _constants.userHandle2,
      true)

    // Setup cnode 1
    await registerCnode(cnode1SpID, cnode1Account)
    // Setup cnode 2
    await registerCnode(cnode2SpID, cnode2Account)
    // Setup cnode 3
    await registerCnode(cnode3SpID, cnode3Account)
  })

  let registerCnode = async (spID, delegateOwnerWallet) => {
    // Setup cnode
    let walletFromChain = await userReplicaSetManager.getCreatorNodeWallet(spID)
    assert.equal(walletFromChain, _constants.addressZero, 'Expect no wallet initially')
    await userReplicaSetManager.registerCreatorNode(spID, delegateOwnerWallet, { from: delegateOwnerWallet })
    walletFromChain = await userReplicaSetManager.getCreatorNodeWallet(spID)
    assert.equal(walletFromChain, delegateOwnerWallet, 'Expect wallet assignment')
    await expectRevert(
      userReplicaSetManager.registerCreatorNode(spID, delegateOwnerWallet, { from: delegateOwnerWallet }),
      'No value permitted'
    )
  }

  it('Add creator nodes', async () => {

  })
})
