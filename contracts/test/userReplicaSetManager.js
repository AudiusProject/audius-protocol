import * as _lib from './_lib/lib.js'
import {
  Registry,
  UserStorage,
  UserFactory,
  UserReplicaSetManager
} from './_lib/artifacts.js'
import * as _constants from './utils/constants'

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
  })

  it('Register creator nodes', async () => {
    // Setup cnode 1
    let cnode1WalletFromChain = await userReplicaSetManager.getCreatorNodeWallet(cnode1SpID)
    assert.equal(cnode1WalletFromChain, _constants.addressZero, 'Expect no wallet initially')
    await userReplicaSetManager.registerCreatorNode(cnode1SpID, { from: cnode1Account })
    cnode1WalletFromChain = await userReplicaSetManager.getCreatorNodeWallet(cnode1SpID)
    assert.equal(cnode1WalletFromChain, cnode1Account, 'Expect wallet assignment')

    // Setup cnode 2
    let cnode2WalletFromChain = await userReplicaSetManager.getCreatorNodeWallet(cnode2SpID)
    assert.equal(cnode2WalletFromChain, _constants.addressZero, 'Expect no wallet initially')
    await userReplicaSetManager.registerCreatorNode(cnode2SpID, { from: cnode2Account })
    cnode2WalletFromChain = await userReplicaSetManager.getCreatorNodeWallet(cnode2SpID)
    assert.equal(cnode2WalletFromChain, cnode2Account, 'Expect wallet assignment')

    // Setup cnode 3
    let cnode3WalletFromChain = await userReplicaSetManager.getCreatorNodeWallet(cnode3SpID)
    assert.equal(cnode3WalletFromChain, _constants.addressZero, 'Expect no wallet initially')
    await userReplicaSetManager.registerCreatorNode(cnode3SpID, { from: cnode3Account })
    cnode3WalletFromChain = await userReplicaSetManager.getCreatorNodeWallet(cnode3SpID)
    assert.equal(cnode3WalletFromChain, cnode3Account, 'Expect wallet assignment')
  })
})
