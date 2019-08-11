import * as _lib from '../_lib/lib.js'
import {
  Registry,
  UserStorage,
  UserFactory,
  TrackStorage,
  TrackFactory } from '../_lib/artifacts.js'

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
    await registry.addContract(_lib.userStorageKey, userStorage.address)
    trackStorage = await TrackStorage.new(registry.address)
    await registry.addContract(_lib.trackStorageKey, trackStorage.address)
    userFactory = await UserFactory.new(registry.address, _lib.userStorageKey, networkId, accounts[5])
    await registry.addContract(_lib.userFactoryKey, userFactory.address)
    trackFactory = await TrackFactory.new(registry.address, _lib.trackStorageKey, _lib.userFactoryKey, networkId)
    await registry.addContract(_lib.trackFactoryKey, trackFactory.address)
  })

  it('Should ensure TrackStorage contents decoupled from TrackFactory instances', async () => {
    // add user to associate track with
    await _lib.addUserAndValidate(
      userFactory,
      testUserId,
      accounts[0],
      _lib.testMultihash.digest1,
      _lib.userHandle1,
      _lib.isCreatorTrue)

    // add track
    await _lib.addTrackAndValidate(
      trackFactory,
      testTrackId,
      accounts[0],
      testUserId,
      _lib.testMultihash.digest2,
      _lib.testMultihash.hashFn,
      _lib.testMultihash.size)

    // kill trackFactory inst
    await _lib.unregisterContractAndValidate(registry, _lib.trackFactoryKey, trackFactory.address)

    // deploy new trackFactory instance
    let newTrackFactory = await TrackFactory.new(registry.address, _lib.trackStorageKey, _lib.userFactoryKey, networkId)
    await registry.addContract(_lib.trackFactoryKey, newTrackFactory.address)
    assert.notEqual(newTrackFactory.address, trackFactory.address, 'Expected different contract instance addresses')

    // retrieve original track through new trackFactory instance
    let track = await _lib.getTrackFromFactory(testTrackId, newTrackFactory)

    // validate retrieved track fields match transaction inputs
    _lib.validateTrack(
      track,
      testUserId,
      _lib.testMultihash.digest2,
      _lib.testMultihash.hashFn,
      _lib.testMultihash.size)
  })
})
