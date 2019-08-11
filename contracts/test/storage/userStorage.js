import * as _lib from '../_lib/lib.js'
import {
  Registry,
  UserStorage,
  UserFactory } from '../_lib/artifacts.js'

contract('UserStorage', async (accounts) => {
  const testUserId = 1

  let registry
  let userStorage
  let userFactory
  let networkId

  beforeEach(async () => {
    registry = await Registry.new()
    networkId = Registry.network_id
    userStorage = await UserStorage.new(registry.address)
    await registry.addContract(_lib.userStorageKey, userStorage.address)
    userFactory = await UserFactory.new(registry.address, _lib.userStorageKey, networkId, accounts[5])
    await registry.addContract(_lib.userFactoryKey, userFactory.address)
  })

  it('Should ensure UserStorage contents decoupled from UserFactory instances', async () => {
    // add user
    await _lib.addUserAndValidate(
      userFactory,
      testUserId,
      accounts[0],
      _lib.testMultihash.digest1,
      _lib.userHandle1,
      _lib.isCreatorTrue)

    // kill userFactory instance
    await _lib.unregisterContractAndValidate(registry, _lib.userFactoryKey, userFactory.address)

    // deploy new userFactory instance
    let newUserFactory = await UserFactory.new(registry.address, _lib.userStorageKey, networkId, accounts[5])
    await registry.addContract(_lib.userFactoryKey, newUserFactory.address)
    assert.notEqual(newUserFactory.address, userFactory.address, 'Expected different contract instance addresses')

    // retrieve original user through new useryFactory instance
    let user = await _lib.getUserFromFactory(testUserId, newUserFactory)

    // validate retrieved user fields match transaction inputs
    _lib.validateUser(
      user,
      accounts[0],
      _lib.testMultihash.digest1,
      _lib.userHandle1)
  })
})
