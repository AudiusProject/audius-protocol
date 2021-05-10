const assert = require('assert')
let helpers = require('./helpers')
let Utils = require('../src/utils')

let audiusInstance = helpers.audiusInstance
let playlistOwnerId

// First created playlist
let playlistId = 1

// Initial tracks
let playlistTracks = []

// Initial playlist configuration
let initialPlaylistName = 'Test playlist name'
let initialIsPrivate = false

before(async function () {
  await audiusInstance.init()
  playlistOwnerId = (await audiusInstance.contracts.UserFactoryClient.addUser('playlistH')).userId

  const cid = helpers.constants.trackMetadataCID // test metadata stored in DHT
  const trackMultihashDecoded = Utils.decodeMultihash(cid)
  playlistTracks.push((await audiusInstance.contracts.TrackFactoryClient.addTrack(
    playlistOwnerId,
    trackMultihashDecoded.digest,
    trackMultihashDecoded.hashFn,
    trackMultihashDecoded.size
  )).trackId)
  playlistTracks.push((await audiusInstance.contracts.TrackFactoryClient.addTrack(
    playlistOwnerId,
    trackMultihashDecoded.digest,
    trackMultihashDecoded.hashFn,
    trackMultihashDecoded.size
  )).trackId)
})

// TODO: Add validation to the below test cases, currently they just perform chain operations.

it('should create playlist', async function () {
  const playlistId = await audiusInstance.contracts.PlaylistFactoryClient.createPlaylist(
    playlistOwnerId,
    initialPlaylistName,
    initialIsPrivate,
    false,
    playlistTracks)
})

it('should create album', async function () {
  const playlistId = await audiusInstance.contracts.PlaylistFactoryClient.createPlaylist(
    playlistOwnerId,
    initialPlaylistName,
    initialIsPrivate,
    true,
    playlistTracks)
})

it('should create and delete playlist', async function () {
  // create playlist
  const { playlistId } = await audiusInstance.contracts.PlaylistFactoryClient.createPlaylist(
    playlistOwnerId,
    initialPlaylistName,
    initialIsPrivate,
    false,
    playlistTracks)

  // delete playlist + validate
  const { playlistId: deletedPlaylistId } = await audiusInstance.contracts.PlaylistFactoryClient.deletePlaylist(playlistId)
  assert.strictEqual(playlistId, deletedPlaylistId)
})

it('should add tracks to an existing playlist', async function () {
  const cid = helpers.constants.trackMetadataCID // test metadata stored in DHT
  const trackMultihashDecoded = Utils.decodeMultihash(cid)

  // Add a new track
  const { trackId } = await audiusInstance.contracts.TrackFactoryClient.addTrack(
    playlistOwnerId,
    trackMultihashDecoded.digest,
    trackMultihashDecoded.hashFn,
    trackMultihashDecoded.size
  )
  const track = await audiusInstance.contracts.TrackFactoryClient.getTrack(trackId)
  assert.strictEqual(track.multihashDigest, trackMultihashDecoded.digest)

  const addPlaylistTrackTx = await audiusInstance.contracts.PlaylistFactoryClient.addPlaylistTrack(
    playlistId,
    trackId)
})

it('should delete track from an existing playlist', async function () {
  const cid = helpers.constants.trackMetadataCID // test metadata stored in DHT
  const trackMultihashDecoded = Utils.decodeMultihash(cid)

  // Add a new track
  const { trackId } = await audiusInstance.contracts.TrackFactoryClient.addTrack(
    playlistOwnerId,
    trackMultihashDecoded.digest,
    trackMultihashDecoded.hashFn,
    trackMultihashDecoded.size
  )
  const track = await audiusInstance.contracts.TrackFactoryClient.getTrack(trackId)
  assert.strictEqual(track.multihashDigest, trackMultihashDecoded.digest)

  const addPlaylistTrackTx = await audiusInstance.contracts.PlaylistFactoryClient.addPlaylistTrack(
    playlistId,
    trackId)

  const deletedTimestamp = 1552008725
  // Delete the newly added track from the playlist
  const deletedPlaylistTrackTx = await audiusInstance.contracts.PlaylistFactoryClient.deletePlaylistTrack(
    playlistId,
    trackId,
    deletedTimestamp)
})

it('should reorder tracks in an existing playlist', async function () {
  playlistTracks.push(playlistTracks.shift()) // put first element at end
  const orderTracksTx = await audiusInstance.contracts.PlaylistFactoryClient.orderPlaylistTracks(
    playlistId,
    playlistTracks)
})

it('should update playlist privacy', async function () {
  const updatedPrivacy = false
  const updatePlaylistPrivacyTx = await audiusInstance.contracts.PlaylistFactoryClient.updatePlaylistPrivacy(
    playlistId,
    updatedPrivacy)
})

it('should update playlist name', async function () {
  const updatedPlaylistName = 'Here is my updated playlist name'
  const updatePlaylistNameTx = await audiusInstance.contracts.PlaylistFactoryClient.updatePlaylistName(
    playlistId,
    updatedPlaylistName)
})

it('should update playlist cover photo', async function () {
  const cid = helpers.constants.trackMetadataCID // test metadata stored in DHT
  const trackMultihashDecoded = Utils.decodeMultihash(cid)
  const testPhotoDigest = trackMultihashDecoded.digest
  const updatePlaylistCoverPhotoTx = await audiusInstance.contracts.PlaylistFactoryClient.updatePlaylistCoverPhoto(
    playlistId,
    testPhotoDigest)
})

it('should update playlist description', async function () {
  const description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis'
  const updatePlaylistDescriptionTx = await audiusInstance.contracts.PlaylistFactoryClient.updatePlaylistDescription(
    playlistId,
    description)
})

it('should update playlist UPC', async function () {
  const newUPC = '928152343234'
  const updatePlaylistUPC = await audiusInstance.contracts.PlaylistFactoryClient.updatePlaylistUPC(playlistId, newUPC)
})
