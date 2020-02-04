import * as _lib from './_lib/lib.js'
import * as _constants from './utils/constants'
import {
  Registry,
  UserStorage,
  UserFactory,
  TrackStorage,
  TrackFactory,
  PlaylistStorage,
  PlaylistFactory
} from './_lib/artifacts.js'

contract('PlaylistFactory', async (accounts) => {
  const testUserId1 = 1
  const testUserId2 = 2
  const testTrackId1 = 1
  const testTrackId2 = 2
  const testTrackId3 = 3

  let playlistName = 'PlaylistFactory Test Playlist'
  let playlistTracks = [1, 2]
  let expectedPlaylistId = 1
  let playlistOwnerId = testUserId1

  let registry
  let userStorage
  let userFactory
  let trackStorage
  let trackFactory
  let playlistStorage
  let playlistFactory

  beforeEach(async () => {
    registry = await Registry.new()
    const networkId = Registry.network_id
    userStorage = await UserStorage.new(registry.address)
    await registry.addContract(_constants.userStorageKey, userStorage.address)
    trackStorage = await TrackStorage.new(registry.address)
    await registry.addContract(_constants.trackStorageKey, trackStorage.address)
    userFactory = await UserFactory.new(registry.address, _constants.userStorageKey, networkId, accounts[5])
    await registry.addContract(_constants.userFactoryKey, userFactory.address)
    trackFactory = await TrackFactory.new(registry.address, _constants.trackStorageKey, _constants.userFactoryKey, networkId)
    await registry.addContract(_constants.trackFactoryKey, trackFactory.address)

    // Deploy playlist related contracts
    playlistStorage = await PlaylistStorage.new(registry.address)
    await registry.addContract(_constants.playlistStorageKey, playlistStorage.address)
    playlistFactory = await PlaylistFactory.new(
      registry.address,
      _constants.playlistStorageKey,
      _constants.userFactoryKey,
      _constants.trackFactoryKey,
      networkId)

    await registry.addContract(_constants.playlistFactoryKey, playlistFactory.address)

    // add two users
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

    // add two tracks
    await _lib.addTrackAndValidate(
      trackFactory,
      testTrackId1,
      accounts[0],
      testUserId1,
      _constants.testMultihash.digest2,
      _constants.testMultihash.hashFn,
      _constants.testMultihash.size)
    await _lib.addTrackAndValidate(
      trackFactory,
      testTrackId2,
      accounts[0],
      testUserId2,
      _constants.testMultihash.digest2,
      _constants.testMultihash.hashFn,
      _constants.testMultihash.size)
  })

  it('Should create a playlist', async () => {
    await _lib.addPlaylistAndValidate(
      playlistFactory,
      expectedPlaylistId,
      accounts[0],
      playlistOwnerId,
      playlistName,
      false,
      false,
      playlistTracks)
  })

  it('Should create a playlist and add a separate track', async () => {
    // Add a 3rd track that is not in the initial playlist tracks list
    await _lib.addTrackAndValidate(
      trackFactory,
      testTrackId3,
      accounts[0],
      testUserId2,
      _constants.testMultihash.digest2,
      _constants.testMultihash.hashFn,
      _constants.testMultihash.size)

    // Create playlist
    await _lib.addPlaylistAndValidate(
      playlistFactory,
      expectedPlaylistId,
      accounts[0],
      playlistOwnerId,
      playlistName,
      false,
      false,
      playlistTracks)

    await _lib.addPlaylistTrack(
      playlistFactory,
      accounts[0],
      expectedPlaylistId,
      testTrackId3)
  })

  it('Should create a playlist and delete a track', async () => {
    // Create playlist
    await _lib.addPlaylistAndValidate(
      playlistFactory,
      expectedPlaylistId,
      accounts[0],
      playlistOwnerId,
      playlistName,
      false,
      false,
      playlistTracks)

    await _lib.deletePlaylistTrack(
      playlistFactory,
      accounts[0],
      expectedPlaylistId,
      testTrackId2,
      1551912253)
  })

  it('Should create a playlist and perform update operations', async () => {
    // Test following update operations:
    // 1 - Reorder tracks
    // 2 - Update playlist name
    // 3 - Update playlist privacy
    // 4 - Update playlist cover photo
    // 5 - Update playlist UPC
    // Create playlist
    await _lib.addPlaylistAndValidate(
      playlistFactory,
      expectedPlaylistId,
      accounts[0],
      playlistOwnerId,
      playlistName,
      false,
      false,
      playlistTracks)

    let playlistTracksNewOrder = [2, 1]

    // 1 - Update playlist order
    await _lib.orderPlaylistTracksAndValidate(
      playlistFactory,
      accounts[0],
      expectedPlaylistId,
      playlistTracksNewOrder)

    // 2 - Update playlist name
    await _lib.updatePlaylistNameAndValidate(
      playlistFactory,
      accounts[0],
      expectedPlaylistId,
      'Updated test playlist name')

    // 3 - Update playlist privacy
    await _lib.updatePlaylistPrivacyAndValidate(
      playlistFactory,
      accounts[0],
      expectedPlaylistId,
      true)

    // Attempt updating a playlist order with an invalid track
    let invalidPlaylistTracksOrder = [2, 3, 1]
    let updatedTrackOrder = null
    try {
      await _lib.orderPlaylistTracksAndValidate(
        playlistFactory,
        accounts[0],
        expectedPlaylistId,
        invalidPlaylistTracksOrder)

      updatedTrackOrder = true
    } catch (err) {
      // Update flag to indicate that invalid update cannot be performed
      if (err.message.indexOf('Expected valid playlist track id') >= 0) {
        updatedTrackOrder = false
      }
    }

    assert.isFalse(
      updatedTrackOrder,
      'Expect failure with invalid track ID in reorder operation')

    // 4 - Update playlist cover photo
    await _lib.updatePlaylistCoverPhotoAndValidate(
      playlistFactory,
      accounts[0],
      expectedPlaylistId,
      _constants.userMetadata.coverPhotoDigest)

    // 5 - Update playlist description
    await _lib.updatePlaylistDescriptionAndValidate(
      playlistFactory,
      accounts[0],
      expectedPlaylistId,
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis')

    // 6 - Update playlist UPC
    // TODO: Fix these numbas yo
    await _lib.updatePlaylistUPCAndValidate(
      playlistFactory,
      accounts[0],
      expectedPlaylistId,
      web3.utils.utf8ToHex('123456789abc'))

    // 7 - Update operations with invalid fields
    let invalidPlaylistId = 50
    let caughtError = false
    try {
      await _lib.updatePlaylistPrivacyAndValidate(
        playlistFactory,
        accounts[0],
        invalidPlaylistId,
        true)
    } catch (e) {
      if (e.message.indexOf('Must provide valid playlist ID')) {
        caughtError = true
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')

    caughtError = false
    try {
      await _lib.updatePlaylistPrivacyAndValidate(
        playlistFactory,
        accounts[1], // Incorrect account
        expectedPlaylistId,
        true)
    } catch (e) {
      if (e.message.indexOf('Invalid signature')) {
        caughtError = true
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should create then delete a playlist', async () => {
    await _lib.addPlaylistAndValidate(
      playlistFactory,
      expectedPlaylistId,
      accounts[0],
      playlistOwnerId,
      playlistName,
      false,
      false,
      playlistTracks
    )
    await _lib.deletePlaylistAndValidate(
      playlistFactory,
      accounts[0],
      expectedPlaylistId
    )
  })

  it('Should fail to create playlist with non-existent user', async () => {
    let caughtError = false
    try {
      await _lib.addPlaylistAndValidate(
        playlistFactory,
        expectedPlaylistId,
        accounts[0],
        10,
        playlistName,
        false,
        false,
        playlistTracks
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
      'Failed to handle case where caller tries to create playlist with non-existent user'
    )
  })

  it('Should fail to create playlist with user that caller does not own', async () => {
    let caughtError = false
    try {
      await _lib.addPlaylistAndValidate(
        playlistFactory,
        expectedPlaylistId,
        accounts[1],
        playlistOwnerId,
        playlistName,
        false,
        false,
        playlistTracks
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
      'Failed to handle case where caller tries to create playlist user that it does not own'
    )
  })

  it('Should fail to update non-existent playlist', async () => {
    let caughtError = false
    try {
      await _lib.updatePlaylistNameAndValidate(
        playlistFactory,
        accounts[0],
        expectedPlaylistId,
        'Updated test playlist name'
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
      'Failed to handle case where caller tries to update non-existent playlist'
    )
  })

  it('Should fail to update playlist that caller does not own', async () => {
    await _lib.addPlaylistAndValidate(
      playlistFactory,
      expectedPlaylistId,
      accounts[0],
      playlistOwnerId,
      playlistName,
      false,
      false,
      playlistTracks
    )

    let caughtError = false
    try {
      await _lib.updatePlaylistNameAndValidate(
        playlistFactory,
        accounts[1],
        expectedPlaylistId,
        'Updated test playlist name'
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
      'Failed to handle case where caller tries to update playlist that caller does not own'
    )
  })

  it('Should fail to delete non-existent playlist', async () => {
    let caughtError = false
    try {
      await _lib.deletePlaylistAndValidate(
        playlistFactory,
        accounts[0],
        expectedPlaylistId
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
      'Failed to handle case where caller tries to delete non-existent playlist'
    )
  })

  it('Should fail to delete playlist that caller does not own', async () => {
    await _lib.addPlaylistAndValidate(
      playlistFactory,
      expectedPlaylistId,
      accounts[0],
      playlistOwnerId,
      playlistName,
      false,
      false,
      playlistTracks
    )

    let caughtError = false
    try {
      await _lib.deletePlaylistAndValidate(
        playlistFactory,
        accounts[1],
        expectedPlaylistId
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
      'Failed to handle case where caller tries to delete playlist that caller does not own'
    )
  })
})
