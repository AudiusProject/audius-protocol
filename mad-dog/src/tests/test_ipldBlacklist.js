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
  getUser,
  Utils
} = ServiceCommands
const path = require('path')
const fs = require('fs-extra')
const {
  addAndUpgradeUsers,
  getRandomTrackMetadata,
  getRandomTrackFilePath,
  genRandomString
} = require('../helpers.js')
const ipfs = require('../ipfsClient')
const { logger } = require('../logger.js')

const TEMP_STORAGE_PATH = path.resolve('./local-storage/tmp/')

const BLACKLISTER_INDEX = 0 // blacklister wallet address = 0th libs instance (see index.js)
const CREATOR_INDEX = 1

const IpldBlacklistTest = {}

// TEST NEW TRACK FLOW -- METADATA
IpldBlacklistTest.newTrackMetadata = async ({
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

    await executeOne(BLACKLISTER_INDEX, libs => libs.waitForLatestIPLDBlock())

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

  await executeOne(CREATOR_INDEX, libs => libs.waitForLatestBlock())

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
IpldBlacklistTest.updateTrackMetadata = async ({
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

    await executeOne(CREATOR_INDEX, libs => libs.waitForLatestBlock())

    // generate and add cid to be blacklisted as ipld blacklist txn
    const blacklistedCID = await addContentToIpfs({
      someData: 'data' + genRandomString(8)
    })
    const trackMultihashDecoded = Utils.decodeMultihash(blacklistedCID)
    logger.info(`Adding CID ${blacklistedCID} to the IPLD Blacklist!`)
    const ipldTxReceipt = await executeOne(BLACKLISTER_INDEX, libsWrapper => {
      return addIPLDToBlacklist(libsWrapper, trackMultihashDecoded.digest)
    })

    await executeOne(BLACKLISTER_INDEX, libs => libs.waitForLatestIPLDBlock())

    // update track with blacklisted cid
    await executeOne(CREATOR_INDEX, libsWrapper => {
      return updateTrackOnChain(libsWrapper, trackId, userId, {
        digest: trackMultihashDecoded.digest,
        hashFn: trackMultihashDecoded.hashFn,
        size: trackMultihashDecoded.size
      })
    })

    await executeOne(CREATOR_INDEX, libs => libs.waitForLatestBlock())

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
IpldBlacklistTest.newTrackCoverPhoto = async ({
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

    await executeOne(BLACKLISTER_INDEX, libs => libs.waitForLatestIPLDBlock())

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

  await executeOne(CREATOR_INDEX, libs => libs.waitForLatestBlock())

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
IpldBlacklistTest.updateTrackCoverPhoto = async ({
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

    await executeOne(CREATOR_INDEX, libs => libs.waitForLatestBlock())

    // generate and add cid to be blacklisted as ipld blacklist txn
    blacklistedCID = await addContentToIpfs({
      someData: 'data' + genRandomString(8)
    })
    const trackMultihashDecoded = Utils.decodeMultihash(blacklistedCID)
    logger.info(`Adding CID ${blacklistedCID} to the IPLD Blacklist!`)
    const ipldTxReceipt = await executeOne(BLACKLISTER_INDEX, libsWrapper => {
      return addIPLDToBlacklist(libsWrapper, trackMultihashDecoded.digest)
    })

    await executeOne(BLACKLISTER_INDEX, libs => libs.waitForLatestIPLDBlock())

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

    await executeOne(CREATOR_INDEX, libs => libs.waitForLatestBlock())
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
IpldBlacklistTest.updateUserMetadata = async ({
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

    await executeOne(BLACKLISTER_INDEX, libs => libs.waitForLatestIPLDBlock())

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

    await executeOne(CREATOR_INDEX, libs => libs.waitForLatestBlock())

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
IpldBlacklistTest.updateUserProfilePhoto = async ({
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

    await executeOne(BLACKLISTER_INDEX, libs => libs.waitForLatestIPLDBlock())

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

    await executeOne(CREATOR_INDEX, libs => libs.waitForLatestBlock())

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
IpldBlacklistTest.updateUserCoverPhoto = async ({
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

    await executeOne(BLACKLISTER_INDEX, libs => libs.waitForLatestIPLDBlock())

    // Update user with blacklisted metadata
    const updateUserMetadataTxReceipt = await executeOne(CREATOR_INDEX, libsWrapper => {
      return updateCoverPhoto(
        libsWrapper,
        userId,
        trackMultihashDecoded.digest
      )
    })

    await executeOne(CREATOR_INDEX, libs => libs.waitForLatestBlock())

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
IpldBlacklistTest.updatePlaylistCoverPhoto = async ({
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

    const { playlistId } = await executeOne(CREATOR_INDEX, libsWrapper => {
      return createPlaylist(
        libsWrapper,
        userId,
        randomPlaylistName,
        false,
        false,
        []
      )
    })

    await executeOne(CREATOR_INDEX, libs => libs.waitForLatestBlock())

    // generate random CID to blacklist and add to blacklist
    const blacklistedCID = await addContentToIpfs({
      randomData: 'data' + randomPlaylistName
    })
    const trackMultihashDecoded = Utils.decodeMultihash(blacklistedCID)
    logger.info(`Adding CID ${blacklistedCID} to the IPLD Blacklist!`)
    const ipldTxReceipt = await executeOne(BLACKLISTER_INDEX, libsWrapper => {
      return addIPLDToBlacklist(libsWrapper, trackMultihashDecoded.digest)
    })

    await executeOne(BLACKLISTER_INDEX, libs => libs.waitForLatestIPLDBlock())

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

    await executeOne(CREATOR_INDEX, libs => libs.waitForLatestBlock())

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

// SAD PATH -- IPLD BLACKLIST HAS NO HITS

// TEST UPDATE PLAYLIST COVER PHOTO FLOW
IpldBlacklistTest.updatePlaylistCoverPhotoNoMatch = async ({
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
    const { playlistId } = await executeOne(CREATOR_INDEX, libsWrapper => {
      return createPlaylist(
        libsWrapper,
        userId,
        randomPlaylistName,
        false,
        false,
        []
      )
    })

    await executeOne(CREATOR_INDEX, libs => libs.waitForLatestBlock())

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

    await executeOne(BLACKLISTER_INDEX, libs => libs.waitForLatestIPLDBlock())

    // update playlist with not-blacklisted CID for cover photo
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

    await executeOne(CREATOR_INDEX, libs => libs.waitForLatestBlock())

    // query playlist and check that new cover photo not indexed
    const playlists = await executeOne(CREATOR_INDEX, libsWrapper => {
      return getPlaylists(libsWrapper, 1, 0, [playlistId], userId, false)
    })

    const playlist = playlists[0]
    if (playlist.playlist_image_sizes_multihash !== cid) {
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

// Get the userId that is a creator with wallet index 1
async function getCreatorId ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes
}) {
  const walletIndexToUserIdMap = await addAndUpgradeUsers(
    numUsers,
    executeAll,
    executeOne
  )

  return walletIndexToUserIdMap[CREATOR_INDEX]
}

/**
 * Add content to ipfs to generate random CID
 * @param {object} contentObject content in object form to add to ipfs
 */
async function addContentToIpfs (contentObject) {
  let buffer
  try {
    buffer = Buffer.from(JSON.stringify(contentObject))
  } catch (e) {
    const errorMsg = `Could not stringify content ${contentObject}`
    logger.error(errorMsg)
    console.error(e)
    throw new Error(`${errorMsg}: ${e.message}`)
  }

  // add metadata object to ipfs to get CID
  let ipfsResp
  try {
    ipfsResp = await ipfs.add(buffer, {
      pin: false
    })
  } catch (e) {
    const errorMsg = 'Could not add content to IPFS'
    logger.error(errorMsg)
    console.error(e)
    throw new Error(`${errorMsg}: ${e.message}`)
  }

  // return CID
  return ipfsResp[0].hash
}

module.exports = IpldBlacklistTest
