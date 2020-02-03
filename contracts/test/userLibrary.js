import * as _lib from './_lib/lib.js'
import {
  Registry,
  UserStorage,
  UserFactory,
  TrackStorage,
  TrackFactory,
  PlaylistStorage,
  PlaylistFactory,
  UserLibraryFactory
} from './_lib/artifacts.js'
import * as _constants from './utils/constants'

contract('UserLibrary', async (accounts) => {
  const testUserId1 = 1
  const testUserId2 = 2
  const testTrackId1 = 1
  const testTrackId2 = 2
  const invalidUserId = 3
  const invalidTrackId = 3
  const invalidPlaylistId = 2

  let playlistName = 'UserLibrary Test Playlist'
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
  let userLibraryFactory

  beforeEach(async () => {
    // init contract state
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

    userLibraryFactory = await UserLibraryFactory.new(
      registry.address,
      _constants.userFactoryKey,
      _constants.trackFactoryKey,
      _constants.playlistFactoryKey,
      networkId)

    await registry.addContract(_constants.userLibraryFactoryKey, userLibraryFactory.address)

    // Add two users
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

    // Add 2 tracks
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

    // Add a playlist
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

  it('Should add one track save', async () => {
    // add track save and validate
    await _lib.addTrackSaveAndValidate(
      userLibraryFactory,
      accounts[0],
      testUserId1,
      testTrackId1)
  })

  it('Should delete one track save', async () => {
    // add track save and validate
    await _lib.addTrackSaveAndValidate(
      userLibraryFactory,
      accounts[0],
      testUserId1,
      testTrackId1)

    // delete track save and validate
    await _lib.deleteTrackSaveAndValidate(
      userLibraryFactory,
      accounts[0],
      testUserId1,
      testTrackId1)
  })

  it('Should add one playlist save', async () => {
    // add playlist save and validate
    await _lib.addPlaylistSaveAndValidate(
      userLibraryFactory,
      accounts[0],
      testUserId1,
      expectedPlaylistId)
  })

  it('Should delete one playlist save', async () => {
    // add playlist save and validate
    await _lib.addPlaylistSaveAndValidate(
      userLibraryFactory,
      accounts[0],
      testUserId1,
      expectedPlaylistId
    )

    // delete playlist save and validate
    await _lib.deletePlaylistSaveAndValidate(
      userLibraryFactory,
      accounts[0],
      testUserId1,
      expectedPlaylistId
    )
  })

  it('Should fail to add playlist save with non-existent user and non-existent playlist', async () => {
    let caughtError = false
    try {
      // add playlist save with invalid user
      await _lib.addPlaylistSaveAndValidate(
        userLibraryFactory,
        accounts[0],
        invalidUserId,
        expectedPlaylistId)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('Caller does not own userId') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')

    caughtError = false
    try {
      // add playlist save with invalid playlist
      await _lib.addPlaylistSaveAndValidate(
        userLibraryFactory,
        accounts[0],
        testUserId1,
        invalidPlaylistId)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('valid playlist ID') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        console.log('throwing unexpected err')
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to delete playlist save with non-existent user and non-existent playlist', async () => {
    let caughtError = false
    try {
      // add playlist save with invalid user
      await _lib.deletePlaylistSaveAndValidate(
        userLibraryFactory,
        accounts[0],
        invalidUserId,
        expectedPlaylistId)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('Caller does not own userId') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
    caughtError = false
    try {
      // add playlist save with invalid playlist
      await _lib.deletePlaylistSaveAndValidate(
        userLibraryFactory,
        accounts[0],
        testUserId1,
        invalidPlaylistId)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('valid playlist ID') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        console.log('throwing unexpected err')
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to add track save with non-existent user and non-existent track', async () => {
    let caughtError = false
    try {
      await _lib.addTrackSaveAndValidate(
        userLibraryFactory,
        accounts[0],
        invalidUserId,
        testTrackId1)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('Caller does not own userId') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')

    caughtError = false
    try {
      await _lib.addTrackSaveAndValidate(
        userLibraryFactory,
        accounts[0],
        testUserId1,
        invalidTrackId)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('must provide valid track ID') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to delete track save with non-existent user and non-existent track', async () => {
    let caughtError = false
    try {
      await _lib.deleteTrackSaveAndValidate(
        userLibraryFactory,
        accounts[0],
        invalidUserId,
        testTrackId1)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('Caller does not own userId') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
    caughtError = false
    try {
      await _lib.deleteTrackSaveAndValidate(
        userLibraryFactory,
        accounts[0],
        testUserId1,
        invalidTrackId)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('must provide valid track ID') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to add track save due to lack of ownership of user', async () => {
    let caughtError = false
    try {
      await _lib.addTrackSaveAndValidate(
        userLibraryFactory,
        accounts[8],
        testUserId1,
        testTrackId1)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('Caller does not own userId') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to add playlist save due to lack of ownership of user', async () => {
    let caughtError = false
    try {
      await _lib.addPlaylistSaveAndValidate(
        userLibraryFactory,
        accounts[8],
        testUserId1,
        expectedPlaylistId
      )
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('Caller does not own userId') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to delete track save due to lack of ownership of user', async () => {
    // add track save and validate
    await _lib.addTrackSaveAndValidate(
      userLibraryFactory,
      accounts[0],
      testUserId1,
      testTrackId1
    )
    let caughtError = false
    try {
      await _lib.deleteTrackSaveAndValidate(
        userLibraryFactory,
        accounts[8],
        testUserId1,
        testTrackId1
      )
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('Caller does not own userId') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to delete playlist save due to lack of ownership of user', async () => {
    // add playlist save and validate
    await _lib.addPlaylistSaveAndValidate(
      userLibraryFactory,
      accounts[0],
      testUserId1,
      expectedPlaylistId
    )

    let caughtError = false
    try {
      await _lib.deletePlaylistSaveAndValidate(
        userLibraryFactory,
        accounts[8],
        testUserId1,
        expectedPlaylistId
      )
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('Caller does not own userId') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })
})
