import * as _lib from '../_lib/lib.js'
import {
  Registry,
  UserStorage,
  UserFactory,
  TrackStorage,
  TrackFactory
} from '../_lib/artifacts.js'
import * as _constants from '../utils/constants'
import { getTrackFromFactory } from '../utils/getters'
import { validateObj } from '../utils/validator'

contract('TrackStorage', async (accounts) => {
  const testUserId = 1
  const testTrackId = 1

  let registry
  let userStorage
  let userFactory
  let trackStorage
  let trackFactory
  let networkId

  beforeEach(async () => {
    registry = await Registry.new()
    networkId = Registry.network_id
    userStorage = await UserStorage.new(registry.address)
    await registry.addContract(_constants.userStorageKey, userStorage.address)
    trackStorage = await TrackStorage.new(registry.address)
    await registry.addContract(_constants.trackStorageKey, trackStorage.address)
    userFactory = await UserFactory.new(registry.address, _constants.userStorageKey, networkId, accounts[5])
    await registry.addContract(_constants.userFactoryKey, userFactory.address)
    trackFactory = await TrackFactory.new(registry.address, _constants.trackStorageKey, _constants.userFactoryKey, networkId)
    await registry.addContract(_constants.trackFactoryKey, trackFactory.address)
  })

  it('Should ensure TrackStorage contents decoupled from TrackFactory instances', async () => {
    // add user to associate track with
    await _lib.addUserAndValidate(
      userFactory,
      testUserId,
      accounts[0],
      _constants.testMultihash.digest1,
      _constants.userHandle1,
      _constants.isCreatorTrue)

    // add track
    await _lib.addTrackAndValidate(
      trackFactory,
      testTrackId,
      accounts[0],
      testUserId,
      _constants.testMultihash.digest2,
      _constants.testMultihash.hashFn,
      _constants.testMultihash.size)

    // kill trackFactory inst
    await _lib.unregisterContractAndValidate(registry, _constants.trackFactoryKey, trackFactory.address)

    // deploy new trackFactory instance
    let newTrackFactory = await TrackFactory.new(registry.address, _constants.trackStorageKey, _constants.userFactoryKey, networkId)
    await registry.addContract(_constants.trackFactoryKey, newTrackFactory.address)
    assert.notEqual(newTrackFactory.address, trackFactory.address, 'Expected different contract instance addresses')

    // retrieve original track through new trackFactory instance
    let track = await getTrackFromFactory(testTrackId, newTrackFactory)

    // validate retrieved track fields match transaction inputs
    validateObj(
      track,
      {
        trackOwnerId: testUserId,
        multihashDigest: _constants.testMultihash.digest2,
        multihashHashFn: _constants.testMultihash.hashFn,
        multihashSize: _constants.testMultihash.size
      }
    )
  })
})
