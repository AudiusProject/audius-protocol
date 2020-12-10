const Web3 = require('../src/web3')
const fs = require('fs')
const util = require('util')
const assert = require('assert').strict

const initAudiusLibs = require('./initAudiusLibs')

const imageFilePath = './examples/pic.jpg'
const audioFilePath = './examples/file.mp3'
const spType = 'discovery-provider'
const spEndpoint = 'http://localhost:5000'
const spEndpoint2 = 'http://localhost:5001'

run()

async function run () {
  // only used to get accounts
  const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545/'))
  const accounts = await web3.eth.getAccounts()
  const ethContractsWeb3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8546/'))
  const ethAccounts = await ethContractsWeb3.eth.getAccounts()

  // @dev - audius instance numbering is off-by-1 from accounts to
  //  align with creator/track numbering below, which are 1-indexed
  const audius1 = await initAudiusLibs(true, accounts[0])
  const audius2 = await initAudiusLibs(true, accounts[1])
  const audius3 = await initAudiusLibs(true, accounts[2])
  const audius4 = await initAudiusLibs(true, accounts[3])
  const audius5 = await initAudiusLibs(true, accounts[4])
  const audius6 = await initAudiusLibs(true, accounts[5])
  const audius7 = await initAudiusLibs(true, accounts[6])
  const audius8 = await initAudiusLibs(true, accounts[7])
  const audius9 = await initAudiusLibs(true, accounts[8])
  const audius10 = await initAudiusLibs(true, accounts[9])

  await testEthContracts(audius1, accounts)
  console.log('tested ethContracts')

  console.log('\nadding creators...\n')
  await addCreator(audius1, 'user1')
  await addCreator(audius2, 'user2')
  await addCreator(audius3, 'usER3')
  await addCreator(audius4, 'USER4')
  await addCreator(audius5, 'USER5')
  await addCreator(audius6, 'USER6')
  console.log('\nadded creators\n')
  await timeout(1000)

  console.log('\nadding tracks...\n')
  await addTrack(audius1)
  await addTrack(audius2)
  await addTrack(audius2)
  await addTrack(audius3)
  await addTrack(audius3)
  await addTrack(audius4)
  await addTrack(audius6)
  console.log('\nadded tracks\n')
  await timeout(5000)

  console.log('\nupdating tracks...\n')
  await updateTrack(audius3, 4)
  console.log('\nupdated tracks\n')
  await timeout(1000)

  console.log('\ndeleting tracks...\n')
  await audius2.contracts.TrackFactoryClient.deleteTrack(2)
  console.log(`\ndeleted tracks with id 2\n`)
  await timeout(1000)

  console.log('\nadding playlists...\n')
  let playlistId1 = await audius5.Playlist.createPlaylist(5, 'Test playlist name', false, false, [1, 3, 4])
  let playlistId2 = await audius6.Playlist.createPlaylist(6, 'Test playlist name 2', false, false, [5, 2, 3])
  console.log(`\nadded playlists with ids ${playlistId1} & ${playlistId2}\n`)

  console.log('\nupdating playlist fields')
  await audius5.contracts.PlaylistFactoryClient.updatePlaylistName(playlistId1, 'New playlist nameeeee')
  await audius6.contracts.PlaylistFactoryClient.updatePlaylistName(playlistId2, 'HERE is my new name baby yeah, >32 charactesr u know what it is')
  console.log('\nupdated playlist fields')

  console.log('\nadding albums...\n')
  let playlistId3 = await audius2.Playlist.createPlaylist(2, 'Test album name', false, true, [1, 2, 3, 4])
  let playlistId4 = await audius4.Playlist.createPlaylist(4, 'Test album name 2', false, true, [5, 2, 4, 3])
  console.log(`\nadded albums with ids ${playlistId3} & ${playlistId4}\n`)
  await timeout(1000)

  console.log('\ndeleting playlists...\n')
  await audius6.Playlist.deletePlaylist(2)
  console.log('\ndeleted playlist with id 2\n')
  await timeout(4000)

  // add track to playlist
  console.log(`\nadding track ${2} to playlist ${playlistId1}...\n`)
  await audius5.Playlist.addPlaylistTrack(playlistId1, 2)
  console.log(`\nadded track ${2} to playlist ${playlistId1}\n`)
  await timeout(4000)

  // re-order playlist tracks
  console.log(`\nreordering tracks in playlist ${playlistId1}...\n`)
  await audius5.Playlist.orderPlaylistTracks(playlistId1, [4, 3, 2, 1])
  console.log(`\nreordered tracks in playlist ${playlistId1}\n`)
  await timeout(4000)

  // comment this out because it takes hella long
  // await testPlaylistLimits(audius1, 1)

  console.log('\nadding track reposts...\n')
  await audius1.Track.addTrackRepost(1, 1)
  await audius2.Track.addTrackRepost(2, 1)
  await audius3.Track.addTrackRepost(3, 1)
  await audius4.Track.addTrackRepost(4, 7)
  await audius5.Track.addTrackRepost(5, 1)
  await audius1.Track.addTrackRepost(1, 2)
  await audius4.Track.addTrackRepost(4, 2)
  await audius5.Track.addTrackRepost(5, 2)
  console.log('\nadded track reposts\n')
  await timeout(1000)

  console.log('\ndeleting track reposts...\n')
  await audius1.Track.deleteTrackRepost(1, 1)
  console.log('\ndeleted track reposts\n')
  await timeout(1000)

  console.log('\nadding playlist reposts...\n')
  await audius3.Playlist.addPlaylistRepost(3, 4)
  await audius2.Playlist.addPlaylistRepost(2, 4)
  await audius5.Playlist.addPlaylistRepost(5, 1)
  console.log('\nadded playlist reposts\n')

  console.log('\ndeleting playlist reposts...\n')
  await audius3.Playlist.deletePlaylistRepost(3, 4)
  console.log('\ndeleted playlist reposts\n')

  console.log('\nadding user follows...\n')
  await audius1.User.addUserFollow(1, 2)
  await audius1.User.addUserFollow(1, 3)
  await audius1.User.addUserFollow(1, 4)
  await audius1.User.addUserFollow(1, 5)
  await audius2.User.addUserFollow(2, 1)
  await audius2.User.addUserFollow(2, 3)
  await audius3.User.addUserFollow(3, 4)
  await audius4.User.addUserFollow(4, 1)
  console.log('\nadded user follows\n')
  await timeout(1000)

  await audius1.User.deleteUserFollow(1, 3)
  console.log('\ndeleted user follow\n')
  await timeout(1000)

  console.log('\nadding track saves...\n')
  await audius1.Track.addTrackSave(1, 2)
  await audius2.Track.addTrackSave(2, 3)
  await audius2.Track.addTrackSave(2, 4)
  await audius3.Track.addTrackSave(3, 4)
  await audius4.Track.addTrackSave(4, 5)
  await audius4.Track.addTrackSave(4, 6)
  await audius5.Track.addTrackSave(5, 1)
  await audius6.Track.addTrackSave(6, 1)
  await audius6.Track.addTrackSave(6, 2)
  console.log('\nadded track saves')

  console.log('\ndeleting track saves...\n')
  await audius2.Track.deleteTrackSave(2, 4)
  await audius6.Track.deleteTrackSave(6, 1)
  console.log('\nadded track save deletes')

  console.log('\nadding playlist saves...\n')
  await audius1.Playlist.addPlaylistSave(1, 1)
  await audius2.Playlist.addPlaylistSave(2, 2)
  await audius3.Playlist.addPlaylistSave(3, 1)
  await audius4.Playlist.addPlaylistSave(4, 2)
  console.log('\nadded playlist saves')

  console.log('\nadding album saves...\n')
  await audius1.Playlist.addPlaylistSave(1, 3)
  await audius2.Playlist.addPlaylistSave(2, 3)
  await audius2.Playlist.addPlaylistSave(2, 4)
  await audius4.Playlist.addPlaylistSave(4, 4)
  await audius5.Playlist.addPlaylistSave(5, 4)
  await audius5.Playlist.addPlaylistSave(5, 3)
  console.log('\nadded album saves')
  await timeout(1000)

  console.log('\ndeleting playlist/album saves...\n')
  await audius5.Playlist.deletePlaylistSave(5, 3)
  await audius2.Playlist.deletePlaylistSave(2, 4)
  console.log('\nadded album and playlist delete operations')
  await timeout(1000)

  /** ********** QUERIES ************/

  // await timeout(1000)

  // let users = await audius1.User.getUsers(100, 0)
  // deepLog('get users', users)

  // let tracks = await audius1.Track.getTracks(100, 0)
  // deepLog('get tracks', tracks)

  // let playlists = await audius1.Playlist.getPlaylists(100, 0)
  // deepLog('get playlists', playlists)

  // let followIntersectionUsers = await audius1.User.getFollowIntersectionUsers(100, 0, 1, 1)  //should return userIds: [2, 4]
  // deepLog('follow intersection users for followee 1, follower 1', followIntersectionUsers)

  // let trackRepostIntersectionUsers = await audius1.discoveryProvider.getTrackRepostIntersectionUsers(100, 0, 1, 1)  //should return [2, 4, 5]
  // deepLog('track repost intersection users for track 1, user 1', trackRepostIntersectionUsers)

  // let playlistRepostIntersectionUsers = await audius1.discoveryProvider.getPlaylistRepostIntersectionUsers(100, 0, 1, 1)  //should return [5]
  // deepLog('playlist repost intersection users for playlist 1, user 1', playlistRepostIntersectionUsers)

  // let followers = await audius3.User.getFollowersForUser(100, 0, 1)  // should return [4-2, 2-1]
  // deepLog('followers of userId 1 sorted by follower count desc', followers)

  // let followees = await audius3.User.getFolloweesForUser(100, 0, 1)  // should return [4-2, 2-1, 5-1]
  // deepLog('followees of userId 1 sorted by follower count desc', followees)

  // let trackReposters = await audius1.discoveryProvider.getRepostersForTrack(100, 0, 1)  // should return [4-2, 3-1, 5-1, 2-1]
  // deepLog('reposters of trackId 1 sorted by follower count desc', trackReposters)

  // let playlistReposters = await audius1.discoveryProvider.getRepostersForPlaylist(100, 0, 1)  // should return [4-2, 3-1, 5-1, 2-1]
  // deepLog('reposters of playlistID 1 sorted by follower count desc', playlistReposters)

  // let tracksSorted = await audius1.Track.getTracks(100, 0, null, null, 'blocknumber:asc')
  // deepLog('getTracks sorted by blocknumber asc', tracksSorted)

  // // Search Queries
  // let res = await audius1.Account.searchFull('name')
  // deepLog('searchFull name', res)

  // res = await audius1.Account.searchAutocomplete('name')
  // deepLog('search autocomplete name', res)

  // // Feed Queries
  // let user1Feed = await audius1.User.getSocialFeed()
  // let user2Feed = await audius2.User.getSocialFeed()
  // let user3Feed = await audius3.User.getSocialFeed()
  // deepLog('user 1 social feed', user1Feed)
  // deepLog('user 2 social feed', user2Feed)
  // deepLog('user 3 social feed', user3Feed)

  // let user2RepostFeed = await audius1.User.getUserRepostFeed(2)
  // deepLog('user 2 repost feed from user 1s account', user2RepostFeed)

  // // case-insensitive user by handle query
  // let usersByHandle1 = await audius1.User.getUsers(100, 0, null, null, 'user3', null)
  // let usersByHandle2 = await audius1.User.getUsers(100, 0, null, null, 'USER3', null)
  // assert.deepEqual(usersByHandle1, usersByHandle2)
}

async function addCreator (audius, handle) {
  let multihash
  try {
    const fileStream = fs.createReadStream(imageFilePath)
    const multihashObj = await audius.creatorNode.uploadImage(fileStream)
    multihash = multihashObj.dirCID
    console.log(`uploaded image with path ${imageFilePath} and multihash ${multihash}`)
  } catch (e) {
    console.log('upload image failed')
    throw new Error(e)
  }

  let creatorArgs = {
    'is_creator': true,
    'name': 'Creator Name' + Math.floor(Math.random() * 1000000),
    'handle': handle,
    'profile_picture': multihash,
    'cover_photo': multihash,
    'bio': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'location': 'San Francisco',
    'creator_node_endpoint': 'http://localhost:4000',
    'is_verified': false
  }

  try {
    console.log('adding creator')
    const creatorId = await audius.User.upgradeToCreator(creatorArgs)
    creatorArgs.user_id = creatorId
    audius.userStateManager.setCurrentUser(creatorArgs)
    console.log(`added creator with id ${creatorId}!`)
    return creatorId
  } catch (e) {
    throw new Error(util.inspect(e, { colors: true, depth: null, showHidden: false, maxArrayLength: null }))
  }
}

async function addTrack (audius) {
  const trackArgs = {
    'title': 'Track title',
    'length': '',
    'cover_art': '',
    'tags': '',
    'genre': 'Heavy beats',
    'mood': 'Dope',
    'credits_splits': '',
    'release_date': '',
    'file_type': '',
    'description': 'hi here here here is an original track description',
    'license': 'MIT BB',
    'isrc': 'hihihi',
    'iswc': 'ihihih',
    'track_segments': []
  }
  try {
    console.error('\nuploading track...\n')
    const fileStream = fs.createReadStream(audioFilePath)
    const trackId = await audius.Track.uploadTrack(fileStream, trackArgs)
    console.error(`\nuploaded track with id ${trackId}!\n`)
    return trackId
  } catch (e) {
    console.error('\ntrack upload failed\n')
    throw new Error(e)
  }
}

async function updateTrack (audius, trackId) {
  let metadata = {
    'track_id': trackId,
    'title': 'Updated title',
    'length': '',
    'cover_art': '',
    'tags': '',
    'genre': 'Heavy beats',
    'mood': 'Dope',
    'credits_splits': '',
    'release_date': '',
    'file_type': '',
    'description': 'here is a track description',
    'license': 'treallicense',
    'isrc': 'hi',
    'iswc': 'mhm',
    'track_segments': []
  }
  try {
    console.error('updating track...')
    await audius.Track.updateTrack(metadata)
    console.error(`updated track with id ${trackId}!`)
    return trackId
  } catch (e) {
    console.error('track update failed')
    throw new Error(e)
  }
}

function timeout (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function deepLog (msg, val, depth = null, showHidden = false) {
  console.log('\n-- ' + msg + ' --\n', util.inspect(val, { colors: true, depth: depth, showHidden: showHidden, maxArrayLength: null }), '\n')
}

// 2 the m00n....and bey0nd
async function testPlaylistLimits (audius, playlistOwnerId) {
  // create tracks to limit (199)
  for (let i = 1; i <= 200; i++) {
    await addTrack(audius, playlistOwnerId)
  }
  await timeout(5000)

  // create playlist with 100 tracks
  console.log(`\ncreating playlist...\n`)
  let playlistId = await audius.Playlist.createPlaylist(playlistOwnerId, 'Test playlist name', false, false, [...Array(101).keys()].slice(1))
  console.log(`\ncreated playlist ${playlistId}\n`)
  await timeout(10000)

  // add 99 tracks to playlist to get to 199 playlist track limit
  for (let i = 101; i < 200; i++) {
    console.log(`\nadding track ${i} to playlist ${playlistId}...\n`)
    await audius.Playlist.addPlaylistTrack(playlistId, i)
    console.log(`\nadded track ${i} to playlist ${playlistId}\n`)
  }
  await timeout(10000)

  // order tracks
  console.log(`\nreordering tracks in playlist ${playlistId}...\n`)
  let ret = await audius.Playlist.orderPlaylistTracks(playlistId, [...Array(200).keys()].slice(1))
  console.log(`\nreordered tracks in playlist ${playlistId}\n`)
  await timeout(10000)

  let playlist = await audius.Playlist.getPlaylists(100, 0, [playlistId])
  deepLog('playlist', playlist)
}

/** Confirm balanceOf checks and transfer ops succeed */
async function testEthContracts (audius, accounts) {
  const ethOwnerWallet = audius.ethWeb3Manager.getWalletAddress()

  await audius.ethContracts.AudiusTokenClient.balanceOf(ethOwnerWallet)
  await audius.ethContracts.AudiusTokenClient.balanceOf(accounts[1])

  await audius.ethContracts.AudiusTokenClient.transfer(accounts[1], 1000)
  await audius.ethContracts.AudiusTokenClient.balanceOf(ethOwnerWallet)
  await audius.ethContracts.AudiusTokenClient.balanceOf(accounts[1])
}
