const ServiceCommands = require('@audius/service-commands')
const {
  addIPLDToBlacklist,
  updateTrackOnChain,
  addTrackToChain,
  uploadTrack,
  getTrackMetadata,
  updateMultihash,
  updateCoverPhoto,
  updateProfilePhoto,
  createPlaylist,
  updatePlaylistCoverPhoto,
  getPlaylists,
  Utils
} = ServiceCommands
const path = require('path')
const fs = require('fs-extra')
const {
  addAndUpgradeUsers,
  getRandomTrackMetadata,
  getRandomTrackFilePath,
  waitForIndexing,
  genRandomString
} = require('../helpers.js')
const ipfs = require('../ipfsClient')
const { getUser } = require('@audius/service-commands/src/commands/users')
const { logger } = require('../logger.js')
const TEMP_STORAGE_PATH = path.resolve('./local-storage/tmp/')

const BLACKLISTER_INDEX = 0 // blacklister wallet address = 0th libs instance (see index.js)
const CREATOR_INDEX = 1
const IPLD_CYCLE = 60000 // ms
let walletIndexToUserIdMap

// Get the userId that is a creator with wallet index 1
const getCreatorId = async ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes
}) => {
  if (!walletIndexToUserIdMap) {
    walletIndexToUserIdMap = await addAndUpgradeUsers(
      numUsers,
      numCreatorNodes,
      executeAll,
      executeOne
    )
  }

  return walletIndexToUserIdMap[CREATOR_INDEX]
}

/**
 * Add content to ipfs to generate random CID
 * @param {object} contentObject content in object form to add to ipfs
 */
const addContentToIpfs = async contentObject => {
  let buffer
  try {
    buffer = Buffer.from(JSON.stringify(contentObject))
  } catch (e) {
    throw new Error(
      `Could not stringify content ${contentObject}: ${e.message}`
    )
  }

  // add metadata object to ipfs to get CID
  let ipfsResp
  try {
    ipfsResp = await ipfs.add(buffer, {
      pin: false
    })
  } catch (e) {
    throw new Error(`Could not add content to IPFS: ${e.message}`)
  }

  // return CID
  return ipfsResp[0].hash
}

// TEST NEW TRACK FLOW -- METADATA
const ipldBlacklistTestNewTrackMetadata = async ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes
}) => {
  let trackTxReceipt
  try {
    const userId = await getCreatorId({
      numUsers,
      executeAll,
      executeOne,
      numCreatorNodes
    })

    // generate and add cid to be blacklisted as ipld blacklist txn
    const blacklistedCID = await addContentToIpfs({
      someData: 'data' + genRandomString(8)
    })
    const trackMultihashDecoded = Utils.decodeMultihash(blacklistedCID)

    logger.info(`Adding CID ${blacklistedCID} to the IPLD Blacklist!`)
    const ipldTxReceipt = await executeOne(BLACKLISTER_INDEX, libsWrapper => {
      return addIPLDToBlacklist(libsWrapper, trackMultihashDecoded.digest)
    })

    // wait for ipld indexing cycle
    await waitForIndexing(IPLD_CYCLE)

    // add track with blacklisted cid
    trackTxReceipt = await executeOne(CREATOR_INDEX, libsWrapper => {
      return addTrackToChain(libsWrapper, userId, {
        digest: trackMultihashDecoded.digest,
        hashFn: trackMultihashDecoded.hashFn,
        size: trackMultihashDecoded.size
      })
    })
  } catch (e) {
    return {
      error: `Error with IPLD Blacklist test for new track with blacklisted metadata CID: ${e.message}`
    }
  }

  // wait for track indexing cycle
  await waitForIndexing()

  // check that dp indexing doesnt occur for this track
  try {
    await executeOne(CREATOR_INDEX, libsWrapper => {
      return getTrackMetadata(libsWrapper, trackTxReceipt.trackId)
    })

    return {
      error:
        'New track with blacklisted metadata CID should not have been indexed.'
    }
  } catch (e) {
    if (e.message !== 'No tracks returned.') {
      return { error: `Error with querying for track: ${e.message}` }
    }
  }
}

// TEST UPDATE TRACK FLOW -- METADATA
const ipldBlacklistTestUpdateTrackMetadata = async ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes
}) => {
  try {
    const userId = await getCreatorId({
      numUsers,
      executeAll,
      executeOne,
      numCreatorNodes
    })

    // create and upload track
    const track = getRandomTrackMetadata(userId)
    const randomTrackFilePath = await getRandomTrackFilePath(TEMP_STORAGE_PATH)

    const trackId = await executeOne(CREATOR_INDEX, libsWrapper => {
      return uploadTrack(libsWrapper, track, randomTrackFilePath)
    })

    // keep track of original metadata CID
    let uploadedTrack = await executeOne(CREATOR_INDEX, libsWrapper => {
      return getTrackMetadata(libsWrapper, trackId)
    })
    const originalMetadataCID = uploadedTrack.metadata_multihash

    // wait for track indexing cycle
    await waitForIndexing()

    // generate and add cid to be blacklisted as ipld blacklist txn
    const blacklistedCID = await addContentToIpfs({
      someData: 'data' + genRandomString(8)
    })
    const trackMultihashDecoded = Utils.decodeMultihash(blacklistedCID)
    logger.info(`Adding CID ${blacklistedCID} to the IPLD Blacklist!`)
    const ipldTxReceipt = await executeOne(BLACKLISTER_INDEX, libsWrapper => {
      return addIPLDToBlacklist(libsWrapper, trackMultihashDecoded.digest)
    })

    // wait an ipld indexing cycle
    await waitForIndexing(IPLD_CYCLE) // 60 sec

    // update track with blacklisted cid
    await executeOne(CREATOR_INDEX, libsWrapper => {
      return updateTrackOnChain(libsWrapper, trackId, userId, {
        digest: trackMultihashDecoded.digest,
        hashFn: trackMultihashDecoded.hashFn,
        size: trackMultihashDecoded.size
      })
    })

    // wait for track indexing cycle
    await waitForIndexing()

    // ensure that the track has original metadata cid
    uploadedTrack = await executeOne(CREATOR_INDEX, libsWrapper => {
      return getTrackMetadata(libsWrapper, trackId)
    })

    if (originalMetadataCID !== uploadedTrack.metadata_multihash) {
      return {
        error: 'Update track with blacklisted metadata CID should not have been indexed.'
      }
    }
  } catch (e) {
    let error = e
    if (e.message) {
      error = e.message
    }

    return {
      error: `Error with IPLD Blacklist test for update track with blacklisted metadata CID: ${error}`
    }
  } finally {
    await fs.remove(TEMP_STORAGE_PATH)
  }
}

// TEST NEW TRACK FLOW -- COVER PHOTO CID
const ipldBlacklistTestNewTrackCoverPhoto = async ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes
}) => {
  let trackTxReceipt
  try {
    const userId = await getCreatorId({
      numUsers,
      executeAll,
      executeOne,
      numCreatorNodes
    })

    // generate and add cid to be blacklisted as ipld blacklist txn
    const blacklistedCID = await addContentToIpfs({
      someData: 'data' + genRandomString(8)
    })
    const trackMultihashDecoded = Utils.decodeMultihash(blacklistedCID)
    logger.info(`Adding CID ${blacklistedCID} to the IPLD Blacklist!`)
    const ipldTxReceipt = await executeOne(BLACKLISTER_INDEX, libsWrapper => {
      return addIPLDToBlacklist(libsWrapper, trackMultihashDecoded.digest)
    })

    // wait an ipld indexing cycle
    await waitForIndexing(IPLD_CYCLE) // 60 sec

    // generate metadata object with CID constant for cover photo
    const metadataObject = getRandomTrackMetadata(userId)
    metadataObject.cover_art = blacklistedCID

    // add metadata object to ipfs to get metadata CID
    const metadataCID = await addContentToIpfs(metadataObject)

    // upload track with metadata CID
    const metadataCIDDecoded = Utils.decodeMultihash(metadataCID)
    trackTxReceipt = await executeOne(CREATOR_INDEX, libsWrapper => {
      return addTrackToChain(libsWrapper, userId, {
        digest: metadataCIDDecoded.digest,
        hashFn: metadataCIDDecoded.hashFn,
        size: metadataCIDDecoded.size
      })
    })
  } catch (e) {
    return {
      error: `Error with IPLD Blacklist test for new track with blacklisted cover photo: ${e.message}`
    }
  }

  // wait for track indexing cycle to occur
  await waitForIndexing()

  // check that indexing did not occur
  try {
    await executeOne(CREATOR_INDEX, libsWrapper => {
      return getTrackMetadata(libsWrapper, trackTxReceipt.trackId)
    })

    return {
      error:
        'New track with blacklisted cover photo should not have been indexed.'
    }
  } catch (e) {
    if (e.message !== 'No tracks returned.') {
      return { error: `Error with querying for track: ${e.message}` }
    }
  }
}

// TEST UPDATE TRACK FLOW -- COVER PHOTO CID
const ipldBlacklistTestUpdateTrackCoverPhoto = async ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes
}) => {
  let trackId
  let blacklistedCID
  try {
    const userId = await getCreatorId({
      numUsers,
      executeAll,
      executeOne,
      numCreatorNodes
    })

    // create and upload track
    const track = getRandomTrackMetadata(userId)
    const randomTrackFilePath = await getRandomTrackFilePath(TEMP_STORAGE_PATH)
    trackId = await executeOne(CREATOR_INDEX, libsWrapper => {
      return uploadTrack(libsWrapper, track, randomTrackFilePath)
    })

    // wait one indexing cycle
    await waitForIndexing()

    // generate and add cid to be blacklisted as ipld blacklist txn
    blacklistedCID = await addContentToIpfs({
      someData: 'data' + genRandomString(8)
    })
    const trackMultihashDecoded = Utils.decodeMultihash(blacklistedCID)
    logger.info(`Adding CID ${blacklistedCID} to the IPLD Blacklist!`)
    const ipldTxReceipt = await executeOne(BLACKLISTER_INDEX, libsWrapper => {
      return addIPLDToBlacklist(libsWrapper, trackMultihashDecoded.digest)
    })

    // wait an ipld indexing cycle
    await waitForIndexing(IPLD_CYCLE) // 60 sec

    // generate metadata object with blacklisted CID for cover photo
    const metadataObject = getRandomTrackMetadata(userId)
    metadataObject.cover_art = blacklistedCID
    const metadataCID = await addContentToIpfs(metadataObject)
    const metadataCIDDecoded = Utils.decodeMultihash(metadataCID)

    // update track with blacklisted cover photo cid
    await executeOne(CREATOR_INDEX, libsWrapper => {
      return updateTrackOnChain(libsWrapper, trackId, userId, {
        digest: metadataCIDDecoded.digest,
        hashFn: metadataCIDDecoded.hashFn,
        size: metadataCIDDecoded.size
      })
    })

    // wait for track indexing cycle
    await waitForIndexing()
  } catch (e) {
    let error = e
    if (e.message) {
      error = e.message
    }
    return {
      error: `Error with IPLD Blacklist test for update track cover photo: ${error}`
    }
  }

  // check that indexing did not occur
  try {
    const track = await executeOne(CREATOR_INDEX, libsWrapper => {
      return getTrackMetadata(libsWrapper, trackId)
    })

    if (
      track.cover_art === blacklistedCID ||
      track.cover_art_sizes === blacklistedCID
    ) {
      return {
        error:
          'Update track with blacklisted cover photo should not have been indexed.'
      }
    }
  } catch (e) {
    return {
      error: `Error with getting track metadata: ${e.message}`
    }
  } finally {
    await fs.remove(TEMP_STORAGE_PATH)
  }
}

// TEST UPDATE USER METADATA CID FLOW
const ipldBlacklistTestUpdateUserMetadataCID = async ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes
}) => {
  try {
    const userId = await getCreatorId({
      numUsers,
      executeAll,
      executeOne,
      numCreatorNodes
    })

    // generate and add cid to be blacklisted as ipld blacklist txn
    const blacklistedCID = await addContentToIpfs({
      someData: 'data' + genRandomString(8)
    })
    const trackMultihashDecoded = Utils.decodeMultihash(blacklistedCID)
    logger.info(`Adding CID ${blacklistedCID} to the IPLD Blacklist!`)
    const ipldTxReceipt = await executeOne(BLACKLISTER_INDEX, libsWrapper => {
      return addIPLDToBlacklist(libsWrapper, trackMultihashDecoded.digest)
    })

    // wait an ipld indexing cycle
    await waitForIndexing(IPLD_CYCLE)

    // Update user with blacklisted metadata
    const updateUserMetadataTxReceipt = await executeOne(
      CREATOR_INDEX,
      libsWrapper => {
        return updateMultihash(
          libsWrapper,
          userId,
          trackMultihashDecoded.digest
        )
      }
    )

    // wait for user indexing cycle
    await waitForIndexing()

    // check that user does not have updated blacklisted metadata
    const user = await executeOne(CREATOR_INDEX, libsWrapper => {
      return getUser(libsWrapper, userId)
    })

    // if metadata cid update occurred, return error
    if (user.metadata_multihash === blacklistedCID) {
      return {
        error:
          'Update user with blacklisted metadata CID should not have been indexed.'
      }
    }
  } catch (e) {
    return {
      error: `Error with IPLD Blacklist test for update user metadata CID: ${e.message}`
    }
  }
}

// TEST UPDATE USER PROFILE PHOTO FLOW
const ipldBlacklistTestUpdateUserProfilePhoto = async ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes
}) => {
  try {
    const userId = await getCreatorId({
      numUsers,
      executeAll,
      executeOne,
      numCreatorNodes
    })

    // Add blacklisted metadata to ipld blacklist
    const blacklistedCID = await addContentToIpfs({
      someData: 'data' + genRandomString(8)
    })
    const trackMultihashDecoded = Utils.decodeMultihash(blacklistedCID)
    logger.info(`Adding CID ${blacklistedCID} to the IPLD Blacklist!`)
    const ipldTxReceipt = await executeOne(BLACKLISTER_INDEX, libsWrapper => {
      return addIPLDToBlacklist(libsWrapper, trackMultihashDecoded.digest)
    })

    // wait an ipld indexing cycle
    await waitForIndexing(IPLD_CYCLE)

    // Update user with blacklisted metadata
    const updateUserMetadataTxReceipt = await executeOne(
      CREATOR_INDEX,
      libsWrapper => {
        return updateProfilePhoto(
          libsWrapper,
          userId,
          trackMultihashDecoded.digest
        )
      }
    )

    // wait for user indexing cycle
    await waitForIndexing()

    // check that user does not have updated blacklisted metadata
    const user = await executeOne(CREATOR_INDEX, libsWrapper => {
      return getUser(libsWrapper, userId)
    })

    // if metadata cid update occurred, return error
    if (user.profile_picture === blacklistedCID) {
      return {
        error:
          'Update user with blacklisted metadata CID should not have been indexed.'
      }
    }
  } catch (e) {
    return {
      error: `Error with IPLD Blacklist test for update user profile photo: ${e.message}`
    }
  }
}

// TEST UPDATE USER COVER PHOTO FLOW
const ipldBlacklistTestUpdateUserCoverPhoto = async ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes
}) => {
  try {
    const userId = await getCreatorId({
      numUsers,
      executeAll,
      executeOne,
      numCreatorNodes
    })

    // Add blacklisted metadata to ipld blacklist
    const blacklistedCID = await addContentToIpfs({
      someData: 'data' + genRandomString(8)
    })
    const trackMultihashDecoded = Utils.decodeMultihash(blacklistedCID)
    logger.info(`Adding CID ${blacklistedCID} to the IPLD Blacklist!`)
    const ipldTxReceipt = await executeOne(BLACKLISTER_INDEX, libsWrapper => {
      return addIPLDToBlacklist(libsWrapper, trackMultihashDecoded.digest)
    })

    // wait an ipld indexing cycle
    await waitForIndexing(IPLD_CYCLE)

    // Update user with blacklisted metadata
    const updateUserMetadataTxReceipt = await executeOne(
      CREATOR_INDEX,
      libsWrapper => {
        return updateCoverPhoto(
          libsWrapper,
          userId,
          trackMultihashDecoded.digest
        )
      }
    )

    // wait for user indexing cycle
    await waitForIndexing()

    // check that user does not have updated blacklisted metadata
    const user = await executeOne(CREATOR_INDEX, libsWrapper => {
      return getUser(libsWrapper, userId)
    })

    // if metadata cid update occurred, return error
    if (user.cover_photo === blacklistedCID) {
      return {
        error:
          'Update user with blacklisted metadata CID should not have been indexed.'
      }
    }
  } catch (e) {
    return {
      error: `Error with IPLD Blacklist test for update user cover photo: ${e.message}`
    }
  }
}

// TEST UPDATE PLAYLIST COVER PHOTO FLOW
const ipldBlacklistTestUpdatePlaylistCoverPhoto = async ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes
}) => {
  try {
    const userId = await getCreatorId({
      numUsers,
      executeAll,
      executeOne,
      numCreatorNodes
    })

    // create playlist under userId
    const randomPlaylistName = genRandomString(8)

    const playlistId = await executeOne(CREATOR_INDEX, libsWrapper => {
      return createPlaylist(
        libsWrapper,
        userId,
        randomPlaylistName,
        false,
        false,
        []
      )
    })

    // wait for indexing cycle (5s)
    await waitForIndexing()

    // generate random CID to blacklist and add to blacklist
    const blacklistedCID = await addContentToIpfs({
      randomData: 'data' + randomPlaylistName
    })
    const trackMultihashDecoded = Utils.decodeMultihash(blacklistedCID)
    logger.info(`Adding CID ${blacklistedCID} to the IPLD Blacklist!`)
    const ipldTxReceipt = await executeOne(BLACKLISTER_INDEX, libsWrapper => {
      return addIPLDToBlacklist(libsWrapper, trackMultihashDecoded.digest)
    })

    // wait for indexing cycle (60s)
    await waitForIndexing(IPLD_CYCLE)

    // update playlist with blacklisted CID cover photo
    const updatePlaylistTxReceipt = await executeOne(
      CREATOR_INDEX,
      libsWrapper => {
        return updatePlaylistCoverPhoto(
          libsWrapper,
          playlistId,
          trackMultihashDecoded.digest
        )
      }
    )

    // wait for indexing cycle (5s)
    await waitForIndexing()

    // query playlist and check that new cover photo not indexed
    const playlists = await executeOne(CREATOR_INDEX, libsWrapper => {
      return getPlaylists(libsWrapper, 1, 0, [playlistId], userId, false)
    })

    const playlist = playlists[0]

    if (
      playlist.playlist_image_multihash === blacklistedCID ||
      playlist.playlist_image_sizes_multihash === blacklistedCID
    ) {
      return {
        error:
          'Playlist update with blacklisted cover photo CID should not have been indexed.'
      }
    }
  } catch (e) {
    return {
      error: `Error with IPLD Blacklist test for update playlist cover photo: ${e.message}`
    }
  }
}

// TODO: add more
// SAD PATH -- IPLD BLACKLIST HAS NO HITS

// TEST UPDATE PLAYLIST COVER PHOTO FLOW
const ipldBlacklistTestUpdatePlaylistCoverPhotoNoMatch = async ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes
}) => {
  try {
    const userId = await getCreatorId({
      numUsers,
      executeAll,
      executeOne,
      numCreatorNodes
    })

    // create playlist under userId
    const randomPlaylistName = 'playlist_' + genRandomString(8)
    const playlistId = await executeOne(CREATOR_INDEX, libsWrapper => {
      return createPlaylist(
        libsWrapper,
        userId,
        randomPlaylistName,
        false,
        false,
        []
      )
    })

    // wait for indexing cycle (5s)
    await waitForIndexing()

    // generate random CID to blacklist and add to blacklist
    const randomCID = await addContentToIpfs({
      randomData: 'random' + randomPlaylistName
    })
    const randomCIDDecoded = Utils.decodeMultihash(randomCID)
    logger.info(`Adding CID ${randomCID} to the IPLD Blacklist!`)
    const ipldTxReceipt = await executeOne(BLACKLISTER_INDEX, libsWrapper => {
      return addIPLDToBlacklist(libsWrapper, randomCIDDecoded.digest)
    })

    // generate actual CID to use as update cover photo
    const cid = await addContentToIpfs({
      randomData: 'actual' + randomPlaylistName
    })

    const trackMultihashDecoded = Utils.decodeMultihash(cid)

    // wait for indexing cycle (60s)
    await waitForIndexing(IPLD_CYCLE)

    // update playlist with blacklisted CID cover photo
    const updatePlaylistTxReceipt = await executeOne(
      CREATOR_INDEX,
      libsWrapper => {
        return updatePlaylistCoverPhoto(
          libsWrapper,
          playlistId,
          trackMultihashDecoded.digest
        )
      }
    )

    // wait for indexing cycle (5s)
    await waitForIndexing()

    // query playlist and check that new cover photo not indexed
    const playlists = await executeOne(CREATOR_INDEX, libsWrapper => {
      return getPlaylists(libsWrapper, 1, 0, [playlistId], userId, false)
    })

    const playlist = playlists[0]
    if (playlist.playlist_image_multihash !== cid) {
      return {
        error:
          'Playlist update with blacklisted cover photo CID should have been indexed.'
      }
    }
  } catch (e) {
    return {
      error: `Error with IPLD Blacklist test for update playlist cover photo: ${e.message}`
    }
  }
}

module.exports = {
  ipldBlacklistTestNewTrackMetadata,
  ipldBlacklistTestUpdateTrackMetadata,
  ipldBlacklistTestNewTrackCoverPhoto,
  ipldBlacklistTestUpdateTrackCoverPhoto,
  ipldBlacklistTestUpdateUserMetadataCID,
  ipldBlacklistTestUpdateUserProfilePhoto,
  ipldBlacklistTestUpdateUserCoverPhoto,
  ipldBlacklistTestUpdatePlaylistCoverPhoto
  // ipldBlacklistTestUpdatePlaylistCoverPhotoNoMatch test is a bit outdated - needs to actually upload an image causes incorrect failure
}
