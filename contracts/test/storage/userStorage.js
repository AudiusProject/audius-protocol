import * as _lib from '../_lib/lib.js'
import {
  Registry,
  UserStorage,
  UserFactory
} from '../_lib/artifacts.js'
import * as _constants from '../utils/constants'
import { getUserFromFactory } from '../utils/getters'
import { validateObj } from '../utils/validator'
import { toStr } from '../utils/util'

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
    await registry.addContract(_constants.userStorageKey, userStorage.address)
    userFactory = await UserFactory.new(registry.address, _constants.userStorageKey, networkId, accounts[5])
    await registry.addContract(_constants.userFactoryKey, userFactory.address)
  })

  it('Should ensure UserStorage contents decoupled from UserFactory instances', async () => {
    // add user
    await _lib.addUserAndValidate(
      userFactory,
      testUserId,
      accounts[0],
      _constants.testMultihash.digest1,
      _constants.userHandle1,
      _constants.isCreatorTrue)

    // kill userFactory instance
    await _lib.unregisterContractAndValidate(registry, _constants.userFactoryKey, userFactory.address)

    // deploy new userFactory instance
    let newUserFactory = await UserFactory.new(registry.address, _constants.userStorageKey, networkId, accounts[5])
    await registry.addContract(_constants.userFactoryKey, newUserFactory.address)
    assert.notEqual(newUserFactory.address, userFactory.address, 'Expected different contract instance addresses')

    // retrieve original user through new useryFactory instance
    let user = await getUserFromFactory(testUserId, newUserFactory)

    // validate retrieved user fields match transaction inputs
    validateObj(user, { wallet: accounts[0], handle: toStr(_constants.userHandle1) })
  })
})
