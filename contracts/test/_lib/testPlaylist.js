/* global assert */

import {
  assertEqualValues, parseTx, parseTxWithResp } from '../utils/parser'
import { getNetworkIdForContractInstance } from '../utils/getters'
import { eth_signTypedData } from '../utils/util'
import { validateObj } from '../utils/validator'
import { web3New } from '../utils/web3New'

const signatureSchemas = require('../../signature_schemas/signatureSchemas')
export const addPlaylistAndValidate = async (playlistFactory, expectedPlaylistId, walletAddress, playlistOwnerId, playlistName, isPrivate, isAlbum, trackIds) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)

  // trackIdsHash calculated by hashing encoded trackIds[]

  // required to generate signed/typed signature below
  let trackIdsHash = web3New.utils.soliditySha3(web3New.eth.abi.encodeParameter('uint[]', trackIds))
  const signatureData = signatureSchemas.generators.getCreatePlaylistRequestData(chainId, playlistFactory.address, playlistOwnerId, playlistName, isPrivate, isAlbum, trackIdsHash, nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.createPlaylist(playlistOwnerId, playlistName, isPrivate, isAlbum, trackIds, nonce, signature)

  let parsedCreatePlaylist = parseTx(tx)
  let parsedCreatePlaylistName = tx.logs[1].args._updatedPlaylistName
  let eventInfo = parsedCreatePlaylist.event.args
  let returnedPlaylistId = eventInfo._playlistId
  assert.equal(returnedPlaylistId, expectedPlaylistId, 'Expected playlist id does not match')
  let emittedPlaylistId = eventInfo._playlistId.toNumber()

  assert.equal(emittedPlaylistId, expectedPlaylistId, 'Expected update event playlistId array to match expected')
  let emittedEventPrivacy = eventInfo._isPrivate
  assert.equal(emittedEventPrivacy, isPrivate, 'Expected emitted playlist privacy to equal input')
  let emittedEventPlaylistName = parsedCreatePlaylistName
  assert.equal(playlistName, emittedEventPlaylistName, 'Expected emitted playlist name to equal input')
  let emittedEventIsAlbum = eventInfo._isAlbum
  assert.equal(isAlbum, emittedEventIsAlbum, 'Expected emitted album status to equal input')

  // Assert on track id array
  let emittedTrackIds = eventInfo._trackIds
  for (let i = 0; i < emittedTrackIds.length; i++) {
    let emittedTrackId = emittedTrackIds[i].toNumber()

    assert.equal(emittedTrackId, trackIds[i], 'Expected ordered event trackId to match input')
  }

  // Validate storage playlist contents
  for (let i = 0; i < trackIds; i++) {
    let isTrackInPlaylist = await playlistFactory.isTrackInPlaylist.call(expectedPlaylistId, trackIds[i])
    assert.equal(isTrackInPlaylist, true, 'Expected all tracks to be added to playlist')
  }
}

export const deletePlaylistAndValidate = async (playlistFactory, walletAddress, playlistId) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getDeletePlaylistRequestData(chainId, playlistFactory.address, playlistId, nonce)

  const sig = await eth_signTypedData(walletAddress, signatureData)

  // call delete playlist from chain
  let tx = await playlistFactory.deletePlaylist(playlistId, nonce, sig)

  // validate event output = transaction input
  let event = parseTxWithResp(tx, { _playlistId: true })
  validateObj(event, { eventName: 'PlaylistDeleted', playlistId })

  // TODO - after storage implemented - attempt to retrieve playlist from chain

  // TODO - after storage implemented - validate playlist does not exist

  return {
    event: event
  }
}

export const orderPlaylistTracksAndValidate = async (playlistFactory, walletAddress, playlistId, trackIds) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)

  // trackIdsHash calculated by hashing encoded trackIds[]

  // required to generate signed/typed signature below
  let trackIdsHash = web3New.utils.soliditySha3(web3New.eth.abi.encodeParameter('uint[]', trackIds))
  const signatureData = signatureSchemas.generators.getOrderPlaylistTracksRequestData(chainId, playlistFactory.address, playlistId, trackIdsHash, nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.orderPlaylistTracks(playlistId, trackIds, nonce, signature)

  let parsedOrderPlaylistTracks = parseTx(tx)
  let eventInfo = parsedOrderPlaylistTracks.event.args
  let emittedPlaylistId = eventInfo._playlistId.toNumber()

  assert.equal(emittedPlaylistId, playlistId, 'Expected update event playlistId array to match input')
  let emittedTrackIds = eventInfo._orderedTrackIds
  assert.equal(emittedTrackIds.length, trackIds.length, 'Expected ordered event trackId array to match input')
  for (let i = 0; i < emittedTrackIds.length; i++) {
    let emittedTrackId = emittedTrackIds[i].toNumber()

    assert.equal(emittedTrackId, trackIds[i], 'Expected ordered event trackId to match input')
  }

  return parsedOrderPlaylistTracks
}

export const updatePlaylistPrivacyAndValidate = async (playlistFactory, walletAddress, playlistId, updatedPlaylistPrivacy) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getUpdatePlaylistPrivacyRequestData(chainId, playlistFactory.address, playlistId, updatedPlaylistPrivacy, nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.updatePlaylistPrivacy(playlistId, updatedPlaylistPrivacy, nonce, signature)

  let parsedUpdatePlaylistPrivacy = parseTx(tx)
  let eventInfo = parsedUpdatePlaylistPrivacy.event.args
  let emittedPlaylistId = eventInfo._playlistId.toNumber()

  assert.equal(emittedPlaylistId, playlistId, 'Expected update event playlistId array to match input')
  let emittedEventPrivacy = eventInfo._updatedIsPrivate
  assert.equal(emittedEventPrivacy, updatedPlaylistPrivacy, 'Expected emitted playlist privacy to equal input')

  return parsedUpdatePlaylistPrivacy
}

export const updatePlaylistNameAndValidate = async (playlistFactory, walletAddress, playlistId, updatedPlaylistName) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getUpdatePlaylistNameRequestData(chainId, playlistFactory.address, playlistId, updatedPlaylistName, nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.updatePlaylistName(playlistId, updatedPlaylistName, nonce, signature)

  let parsedUpdatePlaylistName = parseTx(tx)
  let eventInfo = parsedUpdatePlaylistName.event.args
  let emittedPlaylistId = eventInfo._playlistId.toNumber()

  assert.equal(emittedPlaylistId, playlistId, 'Expected update event playlistId array to match input')
  let emittedEventPlaylistName = eventInfo._updatedPlaylistName
  assert.equal(updatedPlaylistName, emittedEventPlaylistName, 'Expected emitted playlist name to equal input')
}

export const updatePlaylistCoverPhotoAndValidate = async (playlistFactory, walletAddress, playlistId, updatedPlaylistImageMultihashDigest) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getUpdatePlaylistCoverPhotoRequestData(chainId, playlistFactory.address, playlistId, updatedPlaylistImageMultihashDigest, nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.updatePlaylistCoverPhoto(playlistId, updatedPlaylistImageMultihashDigest, nonce, signature)

  let parsedUpdatePlaylistCoverPhoto = parseTx(tx)
  let eventInfo = parsedUpdatePlaylistCoverPhoto.event.args
  let emittedImageMultihash = eventInfo._playlistImageMultihashDigest
  assert.equal(emittedImageMultihash, updatedPlaylistImageMultihashDigest, 'Expect emitted image multihash to equal input')
}

export const updatePlaylistUPCAndValidate = async (playlistFactory, walletAddress, playlistId, updatedPlaylistUPC) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getUpdatePlaylistUPCRequestData(chainId, playlistFactory.address, playlistId, updatedPlaylistUPC, nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.updatePlaylistUPC(playlistId, updatedPlaylistUPC, nonce, signature)

  let parseUpdatePlaylistUPC = parseTx(tx)
  let emittedPlaylistUPC = (parseUpdatePlaylistUPC.event.args._playlistUPC)
  let paddedInputUPC = web3New.utils.padRight(updatedPlaylistUPC, 64)
  assert.equal(emittedPlaylistUPC, paddedInputUPC, 'Expect emitted UPC to equal input')
}

export const updatePlaylistDescriptionAndValidate = async (playlistFactory, walletAddress, playlistId, updatedPlaylistDescription) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getUpdatePlaylistDescriptionRequestData(chainId, playlistFactory.address, playlistId, updatedPlaylistDescription, nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.updatePlaylistDescription(playlistId, updatedPlaylistDescription, nonce, signature)

  let parsedUpdatePlaylistDescription = parseTx(tx)
  let eventInfo = parsedUpdatePlaylistDescription.event.args
  let emittedPlaylistDescription = eventInfo._playlistDescription

  assert.equal(emittedPlaylistDescription, updatedPlaylistDescription, 'Expect emitted playlist description to equal input')
}

/** Adds playlistRepost to blockchain using function input fields, validates emitted event
  * @returns {object} with event data
  */
export const addPlaylistRepostAndValidate = async (socialFeatureFactory, userAddress, userId, playlistId) => {
  // generate new add playlist repost request
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(socialFeatureFactory)
  // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getAddPlaylistRepostRequestData(chainId, socialFeatureFactory.address, userId, playlistId, nonce)

  const sig = await eth_signTypedData(userAddress, signatureData)

  // add new playlistRepost to chain
  let tx = await socialFeatureFactory.addPlaylistRepost(userId, playlistId, nonce, sig)

  // validate event output = transaction input
  let event = parseTxWithResp(tx, { _userId: true, _playlistId: true })
  validateObj(event, { eventName: 'PlaylistRepostAdded', userId, playlistId })

  // validate storage
  let isPlaylistReposted = await socialFeatureFactory.userRepostedPlaylist.call(userId, playlistId)
  assert.isTrue(isPlaylistReposted, 'Expect storage to confirm added playlist repost')

  return {
    event: event
  }
}

/** deletes playlistRepost from blockchain using function input fields, validates emitted event
  * @returns {object} with event data
  */
export const deletePlaylistRepostAndValidate = async (socialFeatureFactory, userAddress, userId, playlistId) => {
  // generate delete playlist repost request
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(socialFeatureFactory) // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getDeletePlaylistRepostRequestData(chainId, socialFeatureFactory.address, userId, playlistId, nonce)

  const sig = await eth_signTypedData(userAddress, signatureData)

  // delete playlistRepost from chain
  let tx = await socialFeatureFactory.deletePlaylistRepost(userId, playlistId, nonce, sig)

  // validate event output = transaction input
  let event = parseTxWithResp(tx, { _userId: true, _playlistId: true })
  validateObj(event, { eventName: 'PlaylistRepostDeleted', userId, playlistId })

  // validate storage
  let isPlaylistReposted = await socialFeatureFactory.userRepostedPlaylist.call(userId, playlistId)
  assert.isFalse(isPlaylistReposted, 'Expect storage to confirm deleted playlist repost')

  return {
    event: event
  }
}

export const addPlaylistTrack = async (playlistFactory, walletAddress, playlistId, addedTrackId) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getAddPlaylistTrackRequestData(chainId, playlistFactory.address, playlistId, addedTrackId, nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.addPlaylistTrack(playlistId, addedTrackId, nonce, signature)

  // TODO:  asserts
  let parsedAddPlaylistTrack = parseTx(tx)
  let eventInfo = parsedAddPlaylistTrack.event.args
  let emittedPlaylistId = eventInfo._playlistId.toNumber()

  assert.equal(emittedPlaylistId, playlistId, 'Expected update event playlistId to match input')
  let emittedAddedTrackId = eventInfo._addedTrackId.toNumber()

  assert.equal(emittedAddedTrackId, addedTrackId, 'Expected update event added track id to match input')

  // Validate storage playlist value
  let isTrackInPlaylist = await playlistFactory.isTrackInPlaylist.call(playlistId, addedTrackId)
  assert.isTrue(isTrackInPlaylist, 'Expected newly added tracks to be in playlist')
  return parsedAddPlaylistTrack
}

export const deletePlaylistTrack = async (playlistFactory, walletAddress, playlistId, deletedTrackId, deletedTimestamp) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getDeletePlaylistTrackRequestData(chainId, playlistFactory.address, playlistId, deletedTrackId, deletedTimestamp, nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.deletePlaylistTrack(playlistId, deletedTrackId, deletedTimestamp, nonce, signature)

  let parsedDeletePlaylistTrack = parseTx(tx)
  let eventInfo = parsedDeletePlaylistTrack.event.args
  let emittedPlaylistId = eventInfo._playlistId.toNumber()

  assert.equal(emittedPlaylistId, playlistId, 'Expected update event playlistId to match input')
  let emittedDeletedTrackId = eventInfo._deletedTrackId.toNumber()

  assert.equal(emittedDeletedTrackId, deletedTrackId, 'Expected update event added track id to match input')

  // Validate storage playlist track value
  let isTrackInPlaylist = await playlistFactory.isTrackInPlaylist.call(playlistId, deletedTrackId)
  assert.isFalse(isTrackInPlaylist, 'Expected newly deleted tracks to not be in playlist')

  return parsedDeletePlaylistTrack
}

export const addPlaylistSaveAndValidate = async (userLibraryFactory, userAddress, userId, playlistId) => {
  const nonce = signatureSchemas.getNonce()

  // in testing use the network id as chain ID because chain ID is unavailable
  const chainId = getNetworkIdForContractInstance(userLibraryFactory)
  const signatureData = signatureSchemas.generators.getPlaylistSaveRequestData(chainId, userLibraryFactory.address, userId, playlistId, nonce)

  const sig = await eth_signTypedData(userAddress, signatureData)
  let tx = await userLibraryFactory.addPlaylistSave(userId, playlistId, nonce, sig)
  let parsedPlaylistSave = parseTx(tx)
  let eventInfo = parsedPlaylistSave.event.args

  assertEqualValues(parsedPlaylistSave, undefined, { _userId: eventInfo._userId, _playlistId: eventInfo._playlistId })
}

export const deletePlaylistSaveAndValidate = async (userLibraryFactory, userAddress, userId, playlistId) => {
  const nonce = signatureSchemas.getNonce()

  // in testing use the network id as chain ID because chain ID is unavailable
  const chainId = getNetworkIdForContractInstance(userLibraryFactory)
  const signatureData = signatureSchemas.generators.getDeletePlaylistSaveRequestData(chainId, userLibraryFactory.address, userId, playlistId, nonce)

  const sig = await eth_signTypedData(userAddress, signatureData)
  let tx = await userLibraryFactory.deletePlaylistSave(userId, playlistId, nonce, sig)
  let parsedPlaylistSave = parseTx(tx)
  let eventInfo = parsedPlaylistSave.event.args

  assertEqualValues(parsedPlaylistSave, undefined, { _userId: eventInfo._userId, _playlistId: eventInfo._playlistId })
}
