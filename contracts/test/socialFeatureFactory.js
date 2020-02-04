import * as _lib from './_lib/lib.js'
import {
  Registry,
  UserStorage,
  UserFactory,
  TrackStorage,
  TrackFactory,
  PlaylistStorage,
  PlaylistFactory,
  SocialFeatureStorage,
  SocialFeatureFactory
} from './_lib/artifacts.js'
import * as _constants from './utils/constants'

contract('SocialFeatureFactory', async (accounts) => {
  const testUserId1 = 1
  const testUserId2 = 2
  const testUserId3 = 3
  const testTrackId1 = 1
  const testTrackId2 = 2
  const testTrackId3 = 3

  let playlistName1 = 'playlistName1'
  let playlistTracks1 = [1, 2]
  let playlistId1 = 1
  let playlistId2 = 2
  let playlistIsAlbum1 = false

  let registry
  let userStorage
  let userFactory
  let trackStorage
  let trackFactory
  let playlistStorage
  let playlistFactory
  let socialFeatureStorage
  let socialFeatureFactory

  beforeEach(async () => {
    // init contract state
    registry = await Registry.new()
    const networkId = Registry.network_id

    userStorage = await UserStorage.new(registry.address)
    await registry.addContract(_constants.userStorageKey, userStorage.address)
    userFactory = await UserFactory.new(registry.address, _constants.userStorageKey, networkId, accounts[5])
    await registry.addContract(_constants.userFactoryKey, userFactory.address)
    trackStorage = await TrackStorage.new(registry.address)
    await registry.addContract(_constants.trackStorageKey, trackStorage.address)
    trackFactory = await TrackFactory.new(registry.address, _constants.trackStorageKey, _constants.userFactoryKey, networkId)
    await registry.addContract(_constants.trackFactoryKey, trackFactory.address)
    playlistStorage = await PlaylistStorage.new(registry.address)
    await registry.addContract(_constants.playlistStorageKey, playlistStorage.address)
    playlistFactory = await PlaylistFactory.new(registry.address, _constants.playlistStorageKey, _constants.userFactoryKey, _constants.trackFactoryKey, networkId)
    await registry.addContract(_constants.playlistFactoryKey, playlistFactory.address)
    socialFeatureStorage = await SocialFeatureStorage.new(registry.address)
    await registry.addContract(_constants.socialFeatureStorageKey, socialFeatureStorage.address)
    socialFeatureFactory = await SocialFeatureFactory.new(registry.address, _constants.socialFeatureStorageKey, _constants.userFactoryKey, _constants.trackFactoryKey, _constants.playlistFactoryKey, networkId)
    await registry.addContract(_constants.socialFeatureFactoryKey, socialFeatureFactory.address)

    // add users and tracks
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
      testUserId1,
      _constants.testMultihash.digest2,
      _constants.testMultihash.hashFn,
      _constants.testMultihash.size)

    await _lib.addPlaylistAndValidate(
      playlistFactory,
      playlistId1,
      accounts[0],
      testUserId1,
      playlistName1,
      false,
      playlistIsAlbum1,
      playlistTracks1
    )
  })

  /******************** TrackRepost ********************/
  /*****************************************************/

  it('Should add one TrackRepost', async () => {
    // add track repost and validate
    await _lib.addTrackRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, testTrackId1)
  })

  it('Should add and delete one TrackRepost', async () => {
    // add track repost and validate
    await _lib.addTrackRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, testTrackId1)

    // delete track repost and validate
    await _lib.deleteTrackRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, testTrackId1)
  })

  it('Should confirm duplicate add/delete TrackReposts throw', async () => {
    // add track repost and validate
    await _lib.addTrackRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, testTrackId1)

    // confirm duplicate track repost throws
    let caughtError = false
    try {
      await _lib.addTrackRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, testTrackId1)
    } catch (e) {
      if (e.message.indexOf('track repost already exists') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')

    // delete track repost and validate
    await _lib.deleteTrackRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, testTrackId1)

    // confirm duplicate track repost delete throws
    caughtError = false
    try {
      await _lib.deleteTrackRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, testTrackId1)
    } catch (e) {
      if (e.message.indexOf('track repost does not exist') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to add TrackRepost with non-existent user', async () => {
    let caughtError = false
    try {
      await _lib.addTrackRepostAndValidate(socialFeatureFactory, accounts[0], testUserId3, testTrackId1)
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

  it('Should fail to delete TrackRepost with non-existent track', async () => {
    let caughtError = false
    try {
      await _lib.deleteTrackRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, testTrackId3)
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

  it('Should fail to add TrackRepost due to lack of ownership of reposter user', async () => {
    let caughtError = false
    try {
      await _lib.addTrackRepostAndValidate(socialFeatureFactory, accounts[1], testUserId1, testTrackId1)
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

  it('Should fail to delete TrackRepost due to lack of ownership of reposter user', async () => {
    let caughtError = false
    try {
      await _lib.deleteTrackRepostAndValidate(socialFeatureFactory, accounts[1], testUserId1, testTrackId1)
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

  /******************** PlaylistRepost ********************/
  /********************************************************/

  it('Should add one PlaylistRepost', async () => {
    await _lib.addPlaylistRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, playlistId1)
  })

  it('Should add and delete one PlaylistRepost', async () => {
    await _lib.addPlaylistRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, playlistId1)
    await _lib.deletePlaylistRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, playlistId1)
  })

  it('Should confirm duplicate add/delete PlaylistRepost throws', async () => {
    // add playlist repost
    await _lib.addPlaylistRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, playlistId1)

    // confirm duplicate playlist repost throws
    let caughtError = false
    try {
      await _lib.addPlaylistRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, playlistId1)
    } catch (e) {
      if (e.message.indexOf('playlist repost already exists') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')

    // delete playlist repost
    await _lib.deletePlaylistRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, playlistId1)

    // confirm duplicate playlist repost delete throws
    caughtError = false
    try {
      await _lib.deletePlaylistRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, playlistId1)
    } catch (e) {
      if (e.message.indexOf('playlist repost does not exist') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to add PlaylistRepost with non-existent user', async () => {
    let caughtError = false
    try {
      await _lib.addPlaylistRepostAndValidate(socialFeatureFactory, accounts[0], testUserId3, playlistId1)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('Caller does not own userId ') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to add PlaylistRepost with non-existent playlist', async () => {
    let caughtError = false
    try {
      await _lib.addPlaylistRepostAndValidate(socialFeatureFactory, accounts[0], testUserId1, playlistId2)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('must provide valid playlist ID') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to add PlaylistRepost due to lack of ownership of reposter user', async () => {
    let caughtError = false
    try {
      await _lib.addPlaylistRepostAndValidate(socialFeatureFactory, accounts[1], testUserId1, playlistId1)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('Caller does not own userId ') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to delete PlaylistRepost due to lack of ownership of reposter user', async () => {
    let caughtError = false
    try {
      await _lib.deletePlaylistRepostAndValidate(socialFeatureFactory, accounts[1], testUserId1, playlistId1)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('Caller does not own userId ') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  /******************** UserFollow ********************/
  /****************************************************/

  it('Should add one UserFollow', async () => {
    // add user follow and validate
    await _lib.addUserFollowAndValidate(socialFeatureFactory, accounts[0], testUserId1, testUserId2)
  })

  it('Should add and delete one UserFollow', async () => {
    // add UserFollow and validate
    await _lib.addUserFollowAndValidate(socialFeatureFactory, accounts[0], testUserId1, testUserId2)

    // delete UserFollow and validate
    await _lib.deleteUserFollowAndValidate(socialFeatureFactory, accounts[0], testUserId1, testUserId2)
  })

  it('Should fail to add UserFollow with non-existent user', async () => {
    let caughtError = false
    try {
      await _lib.addUserFollowAndValidate(socialFeatureFactory, accounts[0], testUserId1, testUserId3)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('must provide valid userID') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to add UserFollow with duplicate IDs', async () => {
    let caughtError = false
    try {
      await _lib.addUserFollowAndValidate(socialFeatureFactory, accounts[0], testUserId1, testUserId1)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('userIDs cannot be the same') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to delete UserFollow with non-existent user', async () => {
    let caughtError = false
    try {
      await _lib.deleteUserFollowAndValidate(socialFeatureFactory, accounts[0], testUserId1, testUserId3)
    } catch (e) {
      // handle expected error
      if (e.message.indexOf('must provide valid userID') >= 0) {
        caughtError = true
      } else {
        // unexpected error - throw normally
        throw e
      }
    }
    assert.isTrue(caughtError, 'Call succeeded unexpectedly')
  })

  it('Should fail to add UserFollow due to lack of ownership of follower user', async () => {
    let caughtError = false
    try {
      await _lib.addUserFollowAndValidate(socialFeatureFactory, accounts[1], testUserId1, testUserId2)
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

  it('Should fail to delete UserFollow due to lack of ownership of follower user', async () => {
    let caughtError = false
    try {
      await _lib.deleteUserFollowAndValidate(socialFeatureFactory, accounts[1], testUserId1, testUserId2)
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
