/* global assert */

import { assertEqualValues, parseTx, parseTxWithResp } from '../utils/parser'
import { getTrackFromFactory, getNetworkIdForContractInstance } from '../utils/getters'
import { eth_signTypedData } from '../utils/util'
import { validateObj } from '../utils/validator'
const signatureSchemas = require('../../signature_schemas/signatureSchemas')

/****** EXTERNAL E2E FUNCTIONS ******/

/** Adds track to blockchain using function input fields,
  *   validates emitted event and track data on-chain
  * @returns {object} with event and track data
  */
export const addTrackAndValidate = async (trackFactory, trackId, walletAddress, trackOwnerId, multihashDigest, multihashHashFn, multihashSize) => {
  // Validate args - TODO
  // generate new track request
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(trackFactory) // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getAddTrackRequestData(chainId, trackFactory.address, trackOwnerId, multihashDigest, multihashHashFn, multihashSize, nonce)
  const sig = await eth_signTypedData(walletAddress, signatureData)
  // Add new track to contract
  let tx = await trackFactory.addTrack(trackOwnerId, multihashDigest, multihashHashFn, multihashSize, nonce, sig)
  // validate event output = transaction input
  let event = parseTxWithResp(tx, { _id: true, _trackOwnerId: true, _multihashDigest: true, _multihashHashFn: true, _multihashSize: true })
  validateObj(event, { eventName: 'NewTrack', trackId, trackOwnerId, multihashDigest, multihashHashFn, multihashSize })
  // retrieve track from contract
  let track = await getTrackFromFactory(trackId, trackFactory)
  validateObj(track, { trackOwnerId, multihashDigest, multihashHashFn, multihashSize })
  return {
    event: event,
    track: track
  }
}

/** Deletes track from blockchain using function input fields,
  *   validates emitted event and track data on-chain
  * @returns {object} with event data
  */
export const deleteTrackAndValidate = async (trackFactory, walletAddress, trackId) => {
  // Validate args - TODO
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(trackFactory) // in testing use the network ID as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getDeleteTrackRequestData(chainId, trackFactory.address, trackId, nonce)
  const sig = await eth_signTypedData(walletAddress, signatureData)
  // call delete track from chain
  let tx = await trackFactory.deleteTrack(trackId, nonce, sig)
  // validate event output = transaction input
  let event = parseTxWithResp(tx, { _trackId: true })
  validateObj(event, { eventName: 'TrackDeleted', trackId })
  // TODO after storage implemented - attemt to retrieve track from chain
  // TODO after storage implemented - validate track does not exist
  return {
    event: event
  }
}

export const updateTrack = async (trackFactory, walletAddress, trackId, trackOwnerId, multihashDigest, multihashHashFn, multihashSize) => {
  // generate update track request
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(trackFactory)
  // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getUpdateTrackRequestData(chainId, trackFactory.address, trackId, trackOwnerId, multihashDigest, multihashHashFn, multihashSize, nonce)
  const sig = await eth_signTypedData(walletAddress, signatureData)
  return trackFactory.updateTrack(trackId, trackOwnerId, multihashDigest, multihashHashFn, multihashSize, nonce, sig)
}

/** Adds trackRepost to blockchain using function input fields, validates emitted event
  * @returns {object} with event data
  */
export const addTrackRepostAndValidate = async (socialFeatureFactory, userAddress, userId, trackId) => {
  // generate new add track repost request
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(socialFeatureFactory) // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getAddTrackRepostRequestData(chainId, socialFeatureFactory.address, userId, trackId, nonce)
  const sig = await eth_signTypedData(userAddress, signatureData)
  // add new trackRepost to chain
  let tx = await socialFeatureFactory.addTrackRepost(userId, trackId, nonce, sig)
  // validate event output = transaction input
  let event = parseTxWithResp(tx, { _userId: true, _trackId: true })
  validateObj(event, { eventName: 'TrackRepostAdded', userId, trackId })
  // validate storage
  let isTrackReposted = await socialFeatureFactory.userRepostedTrack.call(userId, trackId)
  assert.isTrue(isTrackReposted, 'Expect storage to confirm state change')
  return {
    event: event
  }
}

/** deletes trackRepost from blockchain using function input fields, validates emitted event
  * @returns {object} with event data
  */
export const deleteTrackRepostAndValidate = async (socialFeatureFactory, userAddress, userId, trackId) => {
  // generate delete track repost request
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(socialFeatureFactory) // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getDeleteTrackRepostRequestData(chainId, socialFeatureFactory.address, userId, trackId, nonce)
  const sig = await eth_signTypedData(userAddress, signatureData)
  // delete trackRepost from chain
  let tx = await socialFeatureFactory.deleteTrackRepost(userId, trackId, nonce, sig)
  // validate event output = transaction input
  let event = parseTxWithResp(tx, { _userId: true, _trackId: true })
  validateObj(event, { eventName: 'TrackRepostDeleted', userId, trackId })
  // validate storage
  let isTrackReposted = await socialFeatureFactory.userRepostedTrack.call(userId, trackId)
  assert.isFalse(isTrackReposted, 'Expect storage to confirm added track repost')
  return {
    event: event
  }
}

export const addTrackSaveAndValidate = async (userLibraryFactory, userAddress, userId, trackId) => {
  const nonce = signatureSchemas.getNonce()
  // in testing use the network id as chain ID because chain ID is unavailable
  const chainId = getNetworkIdForContractInstance(userLibraryFactory)
  const signatureData = signatureSchemas.generators.getTrackSaveRequestData(chainId, userLibraryFactory.address, userId, trackId, nonce)
  const sig = await eth_signTypedData(userAddress, signatureData)
  let tx = await userLibraryFactory.addTrackSave(userId, trackId, nonce, sig)
  let parsedTrackSave = parseTx(tx)
  let eventInfo = parsedTrackSave.event.args
  assertEqualValues(parsedTrackSave, undefined, { _userId: eventInfo._userId, _trackId: eventInfo._trackId })
}

export const deleteTrackSaveAndValidate = async (userLibraryFactory, userAddress, userId, trackId) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(userLibraryFactory)
  const signatureData = signatureSchemas.generators.getDeleteTrackSaveRequestData(chainId, userLibraryFactory.address, userId, trackId, nonce)
  const sig = await eth_signTypedData(userAddress, signatureData)
  let tx = await userLibraryFactory.deleteTrackSave(userId, trackId, nonce, sig)
  let parsedDeleteTrackSave = parseTx(tx)
  let eventInfo = parsedDeleteTrackSave.event.args
  assertEqualValues(parsedDeleteTrackSave, undefined, { _userId: eventInfo._userId, _trackId: eventInfo._trackId })
}
