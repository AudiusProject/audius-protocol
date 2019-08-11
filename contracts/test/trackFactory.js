import * as _lib from './_lib/lib.js'
import {
  Registry,
  UserStorage,
  TrackStorage,
  UserFactory,
  TrackFactory } from './_lib/artifacts.js'

contract('TrackFactory', async (accounts) => {
  const testUserId = 1
  const testUserId2 = 2
  const testTrackId1 = 1
  const testTrackId2 = 2

  let registry
  let userStorage
  let userFactory
  let trackStorage
  let trackFactory

  beforeEach(async () => {
    registry = await Registry.new()
    const networkId = Registry.network_id
    userStorage = await UserStorage.new(registry.address)
    await registry.addContract(_lib.userStorageKey, userStorage.address)
    trackStorage = await TrackStorage.new(registry.address)
    await registry.addContract(_lib.trackStorageKey, trackStorage.address)
    userFactory = await UserFactory.new(registry.address, _lib.userStorageKey, networkId, accounts[5])
    await registry.addContract(_lib.userFactoryKey, userFactory.address)
    trackFactory = await TrackFactory.new(registry.address, _lib.trackStorageKey, _lib.userFactoryKey, networkId)
    await registry.addContract(_lib.trackFactoryKey, trackFactory.address)
  })

  it('Should add single track', async () => {
    // add user to associate track with
    await _lib.addUserAndValidate(
      userFactory,
      testUserId,
      accounts[0],
      _lib.testMultihash.digest1,
      _lib.userHandle1,
      true
    )

    // Add track
    await _lib.addTrackAndValidate(
      trackFactory,
      testTrackId1,
      accounts[0],
      testUserId,
      _lib.testMultihash.digest2,
      _lib.testMultihash.hashFn,
      _lib.testMultihash.size
    )
  })

  it('Should fail to add track due to lack of ownership of track owner', async () => {
    // add user to associate track with
    await _lib.addUserAndValidate(
      userFactory,
      testUserId,
      accounts[0],
      _lib.testMultihash.digest1,
      _lib.userHandle1,
      true
    )

    // attempt to add track from different account
    let caughtError = false
    try {
      // Add track
      await _lib.addTrackAndValidate(
        trackFactory,
        testTrackId1,
        accounts[1],
        testUserId,
        _lib.testMultihash.digest2,
        _lib.testMultihash.hashFn,
        _lib.testMultihash.size
      )
    } catch (e) {
      // expected error
      if (e.message.indexOf('Caller does not own userId') >= 0) {
        caughtError = true
      } else {
        // other unexpected error - throw it normally
        throw e
      }
    }
    assert.isTrue(
      caughtError,
      "Failed to handle case where calling address tries to add track for user it doesn't own"
    )
  })

  it('Should add multiple tracks', async () => {
    // add user to associate tracks with
    await _lib.addUserAndValidate(
      userFactory,
      testUserId,
      accounts[0],
      _lib.testMultihash.digest1,
      _lib.userHandle1,
      true)

    // add two tracks
    await _lib.addTrackAndValidate(
      trackFactory,
      testTrackId1,
      accounts[0],
      testUserId,
      _lib.testMultihash.digest2,
      _lib.testMultihash.hashFn,
      _lib.testMultihash.size)
    await _lib.addTrackAndValidate(
      trackFactory,
      testTrackId2,
      accounts[0],
      testUserId,
      _lib.testMultihash.digest3,
      _lib.testMultihash.hashFn,
      _lib.testMultihash.size)
  })

  it('Should upgrade TrackStorage used by TrackFactory', async () => {
    // add user to associate track with
    await _lib.addUserAndValidate(
      userFactory,
      testUserId,
      accounts[0],
      _lib.testMultihash.digest1,
      _lib.userHandle1,
      true)

    // add track and validate transaction
    await _lib.addTrackAndValidate(
      trackFactory,
      testTrackId1,
      accounts[0],
      testUserId,
      _lib.testMultihash.digest2,
      _lib.testMultihash.hashFn,
      _lib.testMultihash.size)

    // deploy new TrackStorage contract instance
    let trackStorage2 = await TrackStorage.new(registry.address)

    // upgrade registered TrackStorage
    await registry.upgradeContract(_lib.trackStorageKey, trackStorage2.address)

    // confirm first TrackStorage instance is dead
    _lib.assertNoContractExists(trackStorage.address)

    // add another track and validate transaction
    await _lib.addTrackAndValidate(
      trackFactory,
      testTrackId1,
      accounts[0],
      testUserId,
      _lib.testMultihash.digest2,
      _lib.testMultihash.hashFn,
      _lib.testMultihash.size)
  })

  it('Should update single track', async () => {
    // Define initial and update data
    let initialData = {
      userId: testUserId,
      digest: _lib.testMultihash.digest1,
      hashFn: _lib.testMultihash.hashFn,
      size: _lib.testMultihash.size
    }

    let updateData = {
      userId: testUserId2,
      digest: _lib.testMultihash.digest3,
      hashFn: 32,
      size: 16
    }

    // add user to associate track with
    await _lib.addUserAndValidate(
      userFactory,
      initialData.userId,
      accounts[0],
      initialData.digest,
      _lib.userHandle1,
      _lib.isCreatorTrue)

    // add 2nd user
    await _lib.addUserAndValidate(
      userFactory,
      updateData.userId,
      accounts[0],
      initialData.digest,
      _lib.userHandle2,
      _lib.isCreatorTrue)

    // Add track
    await _lib.addTrackAndValidate(
      trackFactory,
      testTrackId1,
      accounts[0],
      initialData.userId,
      _lib.testMultihash.digest1,
      _lib.testMultihash.hashFn,
      _lib.testMultihash.size)

    const tx = await _lib.updateTrack(
      trackFactory,
      accounts[0],
      testTrackId1,
      updateData.userId,
      updateData.digest,
      updateData.hashFn,
      updateData.size
    )

    // Verify event contents as expected
    let eventArgs = _lib.parseTx(tx).event.args
    assert.isTrue(eventArgs._multihashDigest === updateData.digest, 'Event argument - expect updated digest')
    assert.isTrue(eventArgs._multihashHashFn.toNumber() === updateData.hashFn, 'Event argument - expect updated hash')
    assert.isTrue(eventArgs._multihashSize.toNumber() === updateData.size, 'Event argument - expect updated size')
    assert.isTrue(eventArgs._trackOwnerId.toNumber() === updateData.userId, 'Event argument - expect updated userId')

    // Verify updated contents on chain
    let trackFromChain = await _lib.getTrackFromFactory(
      testTrackId1,
      trackFactory)

    assert.isTrue(trackFromChain.trackOwnerId.toNumber() === updateData.userId, 'Expect updated userId on chain')
    assert.isTrue(trackFromChain.multihashDigest === updateData.digest, 'Expect updated digest')
    assert.isTrue(trackFromChain.multihashHashFn.toNumber() === updateData.hashFn, 'Expect updated hash')
    assert.isTrue(trackFromChain.multihashSize.toNumber() === updateData.size, 'Expect updated size')
  })

  it('Should fail to update track due to lack of ownership of track', async () => {
    // add user to associate track with
    await _lib.addUserAndValidate(
      userFactory,
      testUserId,
      accounts[0],
      _lib.testMultihash.digest1,
      _lib.userHandle1,
      true
    )

    // Add track
    await _lib.addTrackAndValidate(
      trackFactory,
      testTrackId1,
      accounts[0],
      testUserId,
      _lib.testMultihash.digest2,
      _lib.testMultihash.hashFn,
      _lib.testMultihash.size
    )

    // attempt to update track from different account
    let caughtError = false
    try {
      await _lib.updateTrack(
        trackFactory,
        accounts[1],
        testTrackId1,
        testUserId,
        _lib.testMultihash.digest2,
        _lib.testMultihash.hashFn,
        _lib.testMultihash.size
      )
    } catch (e) {
      // expected error
      if (e.message.indexOf('Caller does not own userId') >= 0) {
        caughtError = true
      } else {
        // other unexpected error - throw it normally
        throw e
      }
    }
    assert.isTrue(
      caughtError,
      "Failed to handle case where calling address tries to update track it does not own"
    )
  })

  it('Should delete single track', async () => {
    // add user
    await _lib.addUserAndValidate(
      userFactory,
      testUserId,
      accounts[0],
      _lib.testMultihash.digest1,
      _lib.userHandle1,
      true)

    // Add track
    await _lib.addTrackAndValidate(
      trackFactory,
      testTrackId1,
      accounts[0],
      testUserId,
      _lib.testMultihash.digest2,
      _lib.testMultihash.hashFn,
      _lib.testMultihash.size)

    // delete track
    await _lib.deleteTrackAndValidate(
      trackFactory,
      accounts[0],
      testTrackId1)
  })

  it('Should fail to delete non-existent track', async () => {
    // add user
    await _lib.addUserAndValidate(
      userFactory,
      testUserId,
      accounts[0],
      _lib.testMultihash.digest1,
      _lib.userHandle1,
      true
    )


    // attempt to delete non-existent track
    let caughtError = false
    try {
      await _lib.deleteTrackAndValidate(
        trackFactory,
        accounts[0],
        testTrackId1
      )
    } catch (e) {
      // expected error
      if (e.message.indexOf('Caller does not own userId') >= 0) {
        caughtError = true
      } else {
        // other unexpected error - throw it normally
        throw e
      }
    }
    assert.isTrue(
      caughtError,
      "Failed to handle case where calling address tries to delete non-existent track"
    )
  })

  it('Should fail to delete track due to lack of ownership of track', async () => {
    // add user to associate track with
    await _lib.addUserAndValidate(
      userFactory,
      testUserId,
      accounts[0],
      _lib.testMultihash.digest1,
      _lib.userHandle1,
      true
    )

    // Add track
    await _lib.addTrackAndValidate(
      trackFactory,
      testTrackId1,
      accounts[0],
      testUserId,
      _lib.testMultihash.digest2,
      _lib.testMultihash.hashFn,
      _lib.testMultihash.size
    )

    // attempt to delete track from different account
    let caughtError = false
    try {
      await _lib.deleteTrackAndValidate(
        trackFactory,
        accounts[1],
        testTrackId1
      )
    } catch (e) {
      // expected error
      if (e.message.indexOf('Caller does not own userId') >= 0) {
        caughtError = true
      } else {
        // other unexpected error - throw it normally
        throw e
      }
    }
    assert.isTrue(
      caughtError,
      "Failed to handle case where calling address tries to delete track it does not own"
    )
  })

})
