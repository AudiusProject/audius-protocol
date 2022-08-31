/**
 * This file includes schemas for use in EIP-712 compliant signature generation and
 * signature validation, generator functions for generating data
 * in the form needed by eth_personalSign / eth-sig-util's signTypedData functions,
 * generators for contract signing domains, and a helper function for generating
 * cryptographically secure nonces in nodejs or in the browser.
 * modeled off: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
 */

import type {
  MessageTypeProperty,
  MessageTypes,
  TypedMessage
} from '@metamask/eth-sig-util'

type DomainFn = (
  chainId: number,
  contactAddress: string
) => TypedMessage<MessageTypes>['domain']

function getDomainData(
  contractName: string,
  signatureVersion: string,
  chainId: number,
  contractAddress: string
): TypedMessage<MessageTypes>['domain'] {
  return {
    name: contractName,
    version: signatureVersion,
    chainId: chainId,
    verifyingContract: contractAddress
  }
}

const getSocialFeatureFactoryDomain: DomainFn = (chainId, contractAddress) => {
  return getDomainData('Social Feature Factory', '1', chainId, contractAddress)
}

const getUserFactoryDomain: DomainFn = (chainId, contractAddress) => {
  return getDomainData('User Factory', '1', chainId, contractAddress)
}

const getTrackFactoryDomain: DomainFn = (chainId, contractAddress) => {
  return getDomainData('Track Factory', '1', chainId, contractAddress)
}

const getPlaylistFactoryDomain: DomainFn = (chainId, contractAddress) => {
  return getDomainData('Playlist Factory', '1', chainId, contractAddress)
}

const getUserLibraryFactoryDomain: DomainFn = (chainId, contractAddress) => {
  return getDomainData('User Library Factory', '1', chainId, contractAddress)
}

const getIPLDBlacklistFactoryDomain: DomainFn = (chainId, contractAddress) => {
  return getDomainData('IPLD Blacklist Factory', '1', chainId, contractAddress)
}

const getUserReplicaSetManagerDomain: DomainFn = (chainId, contractAddress) => {
  return getDomainData(
    'User Replica Set Manager',
    '1',
    chainId,
    contractAddress
  )
}

const getEntityManagerDomain: DomainFn = (chainId, contractAddress) => {
  return getDomainData('Entity Manager', '1', chainId, contractAddress)
}

export const domains = {
  getSocialFeatureFactoryDomain,
  getUserFactoryDomain,
  getTrackFactoryDomain,
  getPlaylistFactoryDomain,
  getUserLibraryFactoryDomain,
  getIPLDBlacklistFactoryDomain,
  getUserReplicaSetManagerDomain,
  getEntityManagerDomain
}

/* contract signing domain */
const domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
]

/* user factory requests */
const addUserRequest = [
  { name: 'handle', type: 'bytes16' },
  { name: 'nonce', type: 'bytes32' }
]

/* rather than having a schema type for every update op, we have a type for each unique
 * structure */
const updateUserBytes32 = [
  { name: 'userId', type: 'uint' },
  { name: 'newValue', type: 'bytes32' },
  { name: 'nonce', type: 'bytes32' }
]

const updateUserString = [
  { name: 'userId', type: 'uint' },
  { name: 'newValue', type: 'string' },
  { name: 'nonce', type: 'bytes32' }
]

const updateUserBool = [
  { name: 'userId', type: 'uint' },
  { name: 'newValue', type: 'bool' },
  { name: 'nonce', type: 'bytes32' }
]

/* track factory requests */
const addTrackRequest = [
  { name: 'trackOwnerId', type: 'uint' },
  { name: 'multihashDigest', type: 'bytes32' },
  { name: 'multihashHashFn', type: 'uint8' },
  { name: 'multihashSize', type: 'uint8' },
  { name: 'nonce', type: 'bytes32' }
]

const updateTrackRequest = [
  { name: 'trackId', type: 'uint' },
  { name: 'trackOwnerId', type: 'uint' },
  { name: 'multihashDigest', type: 'bytes32' },
  { name: 'multihashHashFn', type: 'uint8' },
  { name: 'multihashSize', type: 'uint8' },
  { name: 'nonce', type: 'bytes32' }
]

const deleteTrackRequest = [
  { name: 'trackId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

/* social features */
const addTrackRepostRequest = [
  { name: 'userId', type: 'uint' },
  { name: 'trackId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

const deleteTrackRepostRequest = addTrackRepostRequest

const addPlaylistRepostRequest = [
  { name: 'userId', type: 'uint' },
  { name: 'playlistId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

const deletePlaylistRepostRequest = addPlaylistRepostRequest

const userFollowRequest = [
  { name: 'followerUserId', type: 'uint' },
  { name: 'followeeUserId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

const deleteUserFollowRequest = userFollowRequest

const createPlaylistRequest = [
  { name: 'playlistOwnerId', type: 'uint' },
  { name: 'playlistName', type: 'string' },
  { name: 'isPrivate', type: 'bool' },
  { name: 'isAlbum', type: 'bool' },
  { name: 'trackIdsHash', type: 'bytes32' },
  { name: 'nonce', type: 'bytes32' }
]

const deletePlaylistRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

const addPlaylistTrackRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'addedTrackId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

const deletePlaylistTrackRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'deletedTrackId', type: 'uint' },
  { name: 'deletedTrackTimestamp', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

const orderPlaylistTracksRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'trackIdsHash', type: 'bytes32' },
  { name: 'nonce', type: 'bytes32' }
]

const updatePlaylistPrivacyRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'updatedPlaylistPrivacy', type: 'bool' },
  { name: 'nonce', type: 'bytes32' }
]

const updatePlaylistNameRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'updatedPlaylistName', type: 'string' },
  { name: 'nonce', type: 'bytes32' }
]

const updatePlaylistCoverPhotoRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'playlistImageMultihashDigest', type: 'bytes32' },
  { name: 'nonce', type: 'bytes32' }
]

const updatePlaylistDescriptionRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'playlistDescription', type: 'string' },
  { name: 'nonce', type: 'bytes32' }
]

const updatePlaylistUPCRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'playlistUPC', type: 'bytes32' },
  { name: 'nonce', type: 'bytes32' }
]

const trackSaveRequest = [
  { name: 'userId', type: 'uint' },
  { name: 'trackId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

const deleteTrackSaveRequest = trackSaveRequest

const playlistSaveRequest = [
  { name: 'userId', type: 'uint' },
  { name: 'playlistId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

const deletePlaylistSaveRequest = playlistSaveRequest

const addIPLDBlacklist = [
  { name: 'multihashDigest', type: 'bytes32' },
  { name: 'nonce', type: 'bytes32' }
]

// User replica set manager schemas
const proposeAddOrUpdateContentNode = [
  { name: 'cnodeSpId', type: 'uint' },
  { name: 'cnodeDelegateOwnerWallet', type: 'address' },
  { name: 'cnodeOwnerWallet', type: 'address' },
  { name: 'proposerSpId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

const updateReplicaSet = [
  { name: 'userId', type: 'uint' },
  { name: 'primaryId', type: 'uint' },
  { name: 'secondaryIdsHash', type: 'bytes32' },
  { name: 'oldPrimaryId', type: 'uint' },
  { name: 'oldSecondaryIdsHash', type: 'bytes32' },
  { name: 'nonce', type: 'bytes32' }
]

const manageEntity = [
  { name: 'userId', type: 'uint' },
  { name: 'entityType', type: 'string' },
  { name: 'entityId', type: 'uint' },
  { name: 'action', type: 'string' },
  { name: 'metadata', type: 'string' },
  { name: 'nonce', type: 'bytes32' }
]

export const schemas = {
  domain,
  addUserRequest,
  updateUserBytes32,
  updateUserString,
  updateUserBool,
  addTrackRequest,
  updateTrackRequest,
  deleteTrackRequest,
  addTrackRepostRequest,
  deleteTrackRepostRequest,
  addPlaylistRepostRequest,
  deletePlaylistRepostRequest,
  userFollowRequest,
  deleteUserFollowRequest,
  createPlaylistRequest,
  deletePlaylistRequest,
  addPlaylistTrackRequest,
  deletePlaylistTrackRequest,
  orderPlaylistTracksRequest,
  updatePlaylistPrivacyRequest,
  updatePlaylistNameRequest,
  updatePlaylistCoverPhotoRequest,
  updatePlaylistDescriptionRequest,
  updatePlaylistUPCRequest,
  trackSaveRequest,
  deleteTrackSaveRequest,
  playlistSaveRequest,
  deletePlaylistSaveRequest,
  addIPLDBlacklist,
  proposeAddOrUpdateContentNode,
  updateReplicaSet,
  manageEntity
}

type MessageSchema = MessageTypeProperty[]

function getRequestData(
  domainDataFn: DomainFn,
  chainId: number,
  contractAddress: string,
  messageTypeName: string,
  messageSchema: MessageSchema,
  message: TypedMessage<MessageTypes>['message']
): TypedMessage<MessageTypes> {
  const domainData = domainDataFn(chainId, contractAddress)
  const types: MessageTypes = {
    EIP712Domain: schemas.domain
  }
  types[messageTypeName] = messageSchema
  return {
    types: types,
    domain: domainData,
    primaryType: messageTypeName,
    message: message
  }
}

/* User Factory Generators */
const getAddUserRequestData = (
  chainId: number,
  contractAddress: string,
  handle: string,
  nonce: string
) => {
  const message = {
    handle: handle,
    nonce: nonce
  }
  return getRequestData(
    domains.getUserFactoryDomain,
    chainId,
    contractAddress,
    'AddUserRequest',
    schemas.addUserRequest,
    message
  )
}

function _getUpdateUserRequestData(
  chainId: number,
  contractAddress: string,
  messageTypeName: string,
  schema: MessageSchema,
  userId: number,
  newValue: unknown,
  nonce: string
) {
  const message = {
    userId: userId,
    newValue: newValue,
    nonce: nonce
  }
  return getRequestData(
    domains.getUserFactoryDomain,
    chainId,
    contractAddress,
    messageTypeName,
    schema,
    message
  )
}

export type UserUpdateRequestFn = (
  chainId: number,
  contactAddress: string,
  userId: number,
  newValue: unknown,
  nonce: string
) => TypedMessage<MessageTypes>

const getUpdateUserMultihashRequestData: UserUpdateRequestFn = (
  chainId,
  contractAddress,
  userId,
  newValue,
  nonce
) => {
  return _getUpdateUserRequestData(
    chainId,
    contractAddress,
    'UpdateUserMultihashRequest',
    schemas.updateUserBytes32,
    userId,
    newValue,
    nonce
  )
}

const getUpdateUserNameRequestData: UserUpdateRequestFn = (
  chainId,
  contractAddress,
  userId,
  newValue,
  nonce
) => {
  return _getUpdateUserRequestData(
    chainId,
    contractAddress,
    'UpdateUserNameRequest',
    schemas.updateUserBytes32,
    userId,
    newValue,
    nonce
  )
}

const getUpdateUserLocationRequestData: UserUpdateRequestFn = (
  chainId,
  contractAddress,
  userId,
  newValue,
  nonce
) => {
  return _getUpdateUserRequestData(
    chainId,
    contractAddress,
    'UpdateUserLocationRequest',
    schemas.updateUserBytes32,
    userId,
    newValue,
    nonce
  )
}

const getUpdateUserProfilePhotoRequestData: UserUpdateRequestFn = (
  chainId,
  contractAddress,
  userId,
  newValue,
  nonce
) => {
  return _getUpdateUserRequestData(
    chainId,
    contractAddress,
    'UpdateUserProfilePhotoRequest',
    schemas.updateUserBytes32,
    userId,
    newValue,
    nonce
  )
}

const getUpdateUserCoverPhotoRequestData: UserUpdateRequestFn = (
  chainId,
  contractAddress,
  userId,
  newValue,
  nonce
) => {
  return _getUpdateUserRequestData(
    chainId,
    contractAddress,
    'UpdateUserCoverPhotoRequest',
    schemas.updateUserBytes32,
    userId,
    newValue,
    nonce
  )
}

const getUpdateUserBioRequestData: UserUpdateRequestFn = (
  chainId,
  contractAddress,
  userId,
  newValue,
  nonce
) => {
  return _getUpdateUserRequestData(
    chainId,
    contractAddress,
    'UpdateUserBioRequest',
    schemas.updateUserString,
    userId,
    newValue,
    nonce
  )
}

const getUpdateUserCreatorNodeRequestData: UserUpdateRequestFn = (
  chainId,
  contractAddress,
  userId,
  newValue,
  nonce
) => {
  return _getUpdateUserRequestData(
    chainId,
    contractAddress,
    'UpdateUserCreatorNodeRequest',
    schemas.updateUserString,
    userId,
    newValue,
    nonce
  )
}

const getUpdateUserCreatorRequestData: UserUpdateRequestFn = (
  chainId,
  contractAddress,
  userId,
  newValue,
  nonce
) => {
  return _getUpdateUserRequestData(
    chainId,
    contractAddress,
    'UpdateUserCreatorRequest',
    schemas.updateUserBool,
    userId,
    newValue,
    nonce
  )
}

const getUpdateUserVerifiedRequestData: UserUpdateRequestFn = (
  chainId,
  contractAddress,
  userId,
  newValue,
  nonce
) => {
  return _getUpdateUserRequestData(
    chainId,
    contractAddress,
    'UpdateUserVerifiedRequest',
    schemas.updateUserBool,
    userId,
    newValue,
    nonce
  )
}

/* Track Factory Generators */
const getAddTrackRequestData = (
  chainId: number,
  contractAddress: string,
  trackOwnerId: number,
  multihashDigest: string,
  multihashHashFn: number,
  multihashSize: number,
  nonce: string
) => {
  const message = {
    trackOwnerId: trackOwnerId,
    multihashDigest: multihashDigest,
    multihashHashFn: multihashHashFn,
    multihashSize: multihashSize,
    nonce: nonce
  }
  return getRequestData(
    domains.getTrackFactoryDomain,
    chainId,
    contractAddress,
    'AddTrackRequest',
    schemas.addTrackRequest,
    message
  )
}

const getUpdateTrackRequestData = (
  chainId: number,
  contractAddress: string,
  trackId: number,
  trackOwnerId: number,
  multihashDigest: string,
  multihashHashFn: number,
  multihashSize: number,
  nonce: string
) => {
  const message = {
    trackId: trackId,
    trackOwnerId: trackOwnerId,
    multihashDigest: multihashDigest,
    multihashHashFn: multihashHashFn,
    multihashSize: multihashSize,
    nonce: nonce
  }
  return getRequestData(
    domains.getTrackFactoryDomain,
    chainId,
    contractAddress,
    'UpdateTrackRequest',
    schemas.updateTrackRequest,
    message
  )
}

const getDeleteTrackRequestData = (
  chainId: number,
  contractAddress: string,
  trackId: number,
  nonce: string
) => {
  const message = {
    trackId: trackId,
    nonce: nonce
  }
  return getRequestData(
    domains.getTrackFactoryDomain,
    chainId,
    contractAddress,
    'DeleteTrackRequest',
    schemas.deleteTrackRequest,
    message
  )
}

/* Social Feature Factory Generators */
const getAddTrackRepostRequestData = (
  chainId: number,
  contractAddress: string,
  userId: number,
  trackId: number,
  nonce: string
) => {
  const message = {
    userId: userId,
    trackId: trackId,
    nonce: nonce
  }
  return getRequestData(
    domains.getSocialFeatureFactoryDomain,
    chainId,
    contractAddress,
    'AddTrackRepostRequest',
    schemas.addTrackRepostRequest,
    message
  )
}

const getDeleteTrackRepostRequestData = (
  chainId: number,
  contractAddress: string,
  userId: number,
  trackId: number,
  nonce: string
) => {
  const message = {
    userId: userId,
    trackId: trackId,
    nonce: nonce
  }
  return getRequestData(
    domains.getSocialFeatureFactoryDomain,
    chainId,
    contractAddress,
    'DeleteTrackRepostRequest',
    schemas.deleteTrackRepostRequest,
    message
  )
}

const getAddPlaylistRepostRequestData = (
  chainId: number,
  contractAddress: string,
  userId: number,
  playlistId: number,
  nonce: string
) => {
  const message = {
    userId: userId,
    playlistId: playlistId,
    nonce: nonce
  }
  return getRequestData(
    domains.getSocialFeatureFactoryDomain,
    chainId,
    contractAddress,
    'AddPlaylistRepostRequest',
    schemas.addPlaylistRepostRequest,
    message
  )
}

const getDeletePlaylistRepostRequestData = (
  chainId: number,
  contractAddress: string,
  userId: number,
  playlistId: number,
  nonce: string
) => {
  const message = {
    userId: userId,
    playlistId: playlistId,
    nonce: nonce
  }
  return getRequestData(
    domains.getSocialFeatureFactoryDomain,
    chainId,
    contractAddress,
    'DeletePlaylistRepostRequest',
    schemas.deletePlaylistRepostRequest,
    message
  )
}

const getUserFollowRequestData = (
  chainId: number,
  contractAddress: string,
  followerUserId: number,
  followeeUserId: number,
  nonce: string
) => {
  const message = {
    followerUserId: followerUserId,
    followeeUserId: followeeUserId,
    nonce: nonce
  }
  return getRequestData(
    domains.getSocialFeatureFactoryDomain,
    chainId,
    contractAddress,
    'UserFollowRequest',
    schemas.userFollowRequest,
    message
  )
}

const getDeleteUserFollowRequestData = (
  chainId: number,
  contractAddress: string,
  followerUserId: number,
  followeeUserId: number,
  nonce: string
) => {
  const message = {
    followerUserId: followerUserId,
    followeeUserId: followeeUserId,
    nonce: nonce
  }
  return getRequestData(
    domains.getSocialFeatureFactoryDomain,
    chainId,
    contractAddress,
    'DeleteUserFollowRequest',
    schemas.deleteUserFollowRequest,
    message
  )
}

const getTrackSaveRequestData = (
  chainId: number,
  contractAddress: string,
  userId: number,
  trackId: number,
  nonce: string
) => {
  const message = {
    userId: userId,
    trackId: trackId,
    nonce: nonce
  }

  return getRequestData(
    domains.getUserLibraryFactoryDomain,
    chainId,
    contractAddress,
    'TrackSaveRequest',
    schemas.trackSaveRequest,
    message
  )
}

const getDeleteTrackSaveRequestData = (
  chainId: number,
  contractAddress: string,
  userId: number,
  trackId: number,
  nonce: string
) => {
  const message = {
    userId: userId,
    trackId: trackId,
    nonce: nonce
  }

  return getRequestData(
    domains.getUserLibraryFactoryDomain,
    chainId,
    contractAddress,
    'DeleteTrackSaveRequest',
    schemas.deleteTrackSaveRequest,
    message
  )
}

const getPlaylistSaveRequestData = (
  chainId: number,
  contractAddress: string,
  userId: number,
  playlistId: number,
  nonce: string
) => {
  const message = {
    userId: userId,
    playlistId: playlistId,
    nonce: nonce
  }

  return getRequestData(
    domains.getUserLibraryFactoryDomain,
    chainId,
    contractAddress,
    'PlaylistSaveRequest',
    schemas.playlistSaveRequest,
    message
  )
}

const getDeletePlaylistSaveRequestData = (
  chainId: number,
  contractAddress: string,
  userId: number,
  playlistId: number,
  nonce: string
) => {
  const message = {
    userId: userId,
    playlistId: playlistId,
    nonce: nonce
  }

  return getRequestData(
    domains.getUserLibraryFactoryDomain,
    chainId,
    contractAddress,
    'DeletePlaylistSaveRequest',
    schemas.deletePlaylistSaveRequest,
    message
  )
}

/* Playlist Factory Generators */

/* NOTE: Ensure the value for trackIds hash is generated using the following snippet prior to calling this generator function:
 * web3New.utils.soliditySha3(web3New.eth.abi.encodeParameter('uint[]', trackIds))
 */
const getCreatePlaylistRequestData = (
  chainId: number,
  contractAddress: string,
  playlistOwnerId: number,
  playlistName: string,
  isPrivate: boolean,
  isAlbum: boolean,
  trackIdsHash: string | null,
  nonce: string
) => {
  const message = {
    playlistOwnerId: playlistOwnerId,
    playlistName: playlistName,
    isPrivate: isPrivate,
    isAlbum: isAlbum,
    trackIdsHash: trackIdsHash,
    nonce: nonce
  }

  return getRequestData(
    domains.getPlaylistFactoryDomain,
    chainId,
    contractAddress,
    'CreatePlaylistRequest',
    schemas.createPlaylistRequest,
    message
  )
}

const getDeletePlaylistRequestData = (
  chainId: number,
  contractAddress: string,
  playlistId: number,
  nonce: string
) => {
  const message = {
    playlistId: playlistId,
    nonce: nonce
  }
  return getRequestData(
    domains.getPlaylistFactoryDomain,
    chainId,
    contractAddress,
    'DeletePlaylistRequest',
    schemas.deletePlaylistRequest,
    message
  )
}

const getAddPlaylistTrackRequestData = (
  chainId: number,
  contractAddress: string,
  playlistId: number,
  addedTrackId: number,
  nonce: string
) => {
  const message = {
    playlistId: playlistId,
    addedTrackId: addedTrackId,
    nonce: nonce
  }

  return getRequestData(
    domains.getPlaylistFactoryDomain,
    chainId,
    contractAddress,
    'AddPlaylistTrackRequest',
    schemas.addPlaylistTrackRequest,
    message
  )
}

const getDeletePlaylistTrackRequestData = (
  chainId: number,
  contractAddress: string,
  playlistId: number,
  deletedTrackId: number,
  deletedTrackTimestamp: number,
  nonce: string
) => {
  const message = {
    playlistId: playlistId,
    deletedTrackId: deletedTrackId,
    deletedTrackTimestamp: deletedTrackTimestamp,
    nonce: nonce
  }

  return getRequestData(
    domains.getPlaylistFactoryDomain,
    chainId,
    contractAddress,
    'DeletePlaylistTrackRequest',
    schemas.deletePlaylistTrackRequest,
    message
  )
}

const getOrderPlaylistTracksRequestData = (
  chainId: number,
  contractAddress: string,
  playlistId: number,
  trackIdsHash: string | null,
  nonce: string
) => {
  const message = {
    playlistId: playlistId,
    trackIdsHash: trackIdsHash,
    nonce: nonce
  }

  return getRequestData(
    domains.getPlaylistFactoryDomain,
    chainId,
    contractAddress,
    'OrderPlaylistTracksRequest',
    schemas.orderPlaylistTracksRequest,
    message
  )
}

const getUpdatePlaylistNameRequestData = (
  chainId: number,
  contractAddress: string,
  playlistId: number,
  updatedPlaylistName: string,
  nonce: string
) => {
  const message = {
    playlistId: playlistId,
    updatedPlaylistName: updatedPlaylistName,
    nonce: nonce
  }

  return getRequestData(
    domains.getPlaylistFactoryDomain,
    chainId,
    contractAddress,
    'UpdatePlaylistNameRequest',
    schemas.updatePlaylistNameRequest,
    message
  )
}

const getUpdatePlaylistPrivacyRequestData = (
  chainId: number,
  contractAddress: string,
  playlistId: number,
  updatedPlaylistPrivacy: boolean,
  nonce: string
) => {
  const message = {
    playlistId: playlistId,
    updatedPlaylistPrivacy: updatedPlaylistPrivacy,
    nonce: nonce
  }

  return getRequestData(
    domains.getPlaylistFactoryDomain,
    chainId,
    contractAddress,
    'UpdatePlaylistPrivacyRequest',
    schemas.updatePlaylistPrivacyRequest,
    message
  )
}

const getUpdatePlaylistCoverPhotoRequestData = (
  chainId: number,
  contractAddress: string,
  playlistId: number,
  playlistImageMultihashDigest: string,
  nonce: string
) => {
  const message = {
    playlistId: playlistId,
    playlistImageMultihashDigest: playlistImageMultihashDigest,
    nonce: nonce
  }

  return getRequestData(
    domains.getPlaylistFactoryDomain,
    chainId,
    contractAddress,
    'UpdatePlaylistCoverPhotoRequest',
    schemas.updatePlaylistCoverPhotoRequest,
    message
  )
}

const getUpdatePlaylistUPCRequestData = (
  chainId: number,
  contractAddress: string,
  playlistId: number,
  playlistUPC: string,
  nonce: string
) => {
  const message = {
    playlistId: playlistId,
    playlistUPC: playlistUPC,
    nonce: nonce
  }

  return getRequestData(
    domains.getPlaylistFactoryDomain,
    chainId,
    contractAddress,
    'UpdatePlaylistUPCRequest',
    schemas.updatePlaylistUPCRequest,
    message
  )
}

const getUpdatePlaylistDescriptionRequestData = (
  chainId: number,
  contractAddress: string,
  playlistId: number,
  playlistDescription: string,
  nonce: string
) => {
  const message = {
    playlistId: playlistId,
    playlistDescription: playlistDescription,
    nonce: nonce
  }

  return getRequestData(
    domains.getPlaylistFactoryDomain,
    chainId,
    contractAddress,
    'UpdatePlaylistDescriptionRequest',
    schemas.updatePlaylistDescriptionRequest,
    message
  )
}

const addIPLDToBlacklistRequestData = (
  chainId: number,
  contractAddress: string,
  multihashDigest: string,
  nonce: string
) => {
  const message = {
    multihashDigest: multihashDigest,
    nonce: nonce
  }
  return getRequestData(
    domains.getIPLDBlacklistFactoryDomain,
    chainId,
    contractAddress,
    'AddIPLDToBlacklistRequest',
    schemas.addIPLDBlacklist,
    message
  )
}

/* User Replica Set Manager Generators */
const getProposeAddOrUpdateContentNodeRequestData = (
  chainId: number,
  contractAddress: string,
  cnodeSpId: number,
  cnodeDelegateOwnerWallet: string,
  cnodeOwnerWallet: string,
  proposerSpId: number,
  nonce: string
) => {
  const message = {
    cnodeSpId,
    cnodeDelegateOwnerWallet,
    cnodeOwnerWallet,
    proposerSpId,
    nonce
  }
  return getRequestData(
    domains.getUserReplicaSetManagerDomain,
    chainId,
    contractAddress,
    'ProposeAddOrUpdateContentNode',
    schemas.proposeAddOrUpdateContentNode,
    message
  )
}

const getUpdateReplicaSetRequestData = (
  chainId: number,
  contractAddress: string,
  userId: number,
  primaryId: number,
  secondaryIdsHash: string | null,
  oldPrimaryId: number,
  oldSecondaryIdsHash: string | null,
  nonce: string
) => {
  const message = {
    userId,
    primaryId,
    secondaryIdsHash,
    oldPrimaryId,
    oldSecondaryIdsHash,
    nonce
  }
  return getRequestData(
    domains.getUserReplicaSetManagerDomain,
    chainId,
    contractAddress,
    'UpdateReplicaSet',
    schemas.updateReplicaSet,
    message
  )
}

const getManageEntityData = (
  chainId: number,
  contractAddress: string,
  userId: number,
  entityType: string,
  entityId: number,
  action: string,
  metadata: string,
  nonce: string
) => {
  const message = {
    userId,
    entityType,
    entityId,
    action,
    metadata,
    nonce
  }
  return getRequestData(
    domains.getEntityManagerDomain,
    chainId,
    contractAddress,
    'ManageEntity',
    schemas.manageEntity,
    message
  )
}

export const generators = {
  getUpdateUserMultihashRequestData,
  getAddUserRequestData,
  getUpdateUserNameRequestData,
  getUpdateUserLocationRequestData,
  getUpdateUserProfilePhotoRequestData,
  getUpdateUserCoverPhotoRequestData,
  getUpdateUserBioRequestData,
  getUpdateUserCreatorNodeRequestData,
  getUpdateUserCreatorRequestData,
  getUpdateUserVerifiedRequestData,
  getAddTrackRequestData,
  getUpdateTrackRequestData,
  getDeleteTrackRequestData,
  getAddTrackRepostRequestData,
  getDeleteTrackRepostRequestData,
  getAddPlaylistRepostRequestData,
  getDeletePlaylistRepostRequestData,
  getUserFollowRequestData,
  getDeleteUserFollowRequestData,
  getTrackSaveRequestData,
  getDeleteTrackSaveRequestData,
  getPlaylistSaveRequestData,
  getDeletePlaylistSaveRequestData,
  getCreatePlaylistRequestData,
  getDeletePlaylistRequestData,
  getAddPlaylistTrackRequestData,
  getDeletePlaylistTrackRequestData,
  getOrderPlaylistTracksRequestData,
  getUpdatePlaylistNameRequestData,
  getUpdatePlaylistPrivacyRequestData,
  getUpdatePlaylistCoverPhotoRequestData,
  getUpdatePlaylistUPCRequestData,
  getUpdatePlaylistDescriptionRequestData,
  addIPLDToBlacklistRequestData,
  getProposeAddOrUpdateContentNodeRequestData,
  getUpdateReplicaSetRequestData,
  getManageEntityData
}

type NodeCrypto = { randomBytes: (size: number) => Buffer }

/** Return a secure random hex string of nChar length in a browser-compatible way
 *  Taken from https://stackoverflow.com/questions/37378237/how-to-generate-a-random-token-of-32-bit-in-javascript
 */
function browserRandomHash(nChar: number) {
  // convert number of characters to number of bytes
  const nBytes = Math.ceil((nChar = (+nChar || 8) / 2))

  // create a typed array of that many bytes
  const u = new Uint8Array(nBytes)

  // populate it wit crypto-random values
  window.crypto.getRandomValues(u)

  // convert it to an Array of Strings (e.g. '01', 'AF', ..)
  const zpad = function (str: string) {
    return '00'.slice(str.length) + str
  }
  const a = Array.prototype.map.call(u, function (x) {
    return zpad(x.toString(16))
  })

  // Array of String to String
  let str = a.join('').toLowerCase()
  // and snip off the excess digit if we want an odd number
  if (nChar % 2) str = str.slice(1)

  // return what we made
  return str
}

// We need to detect whether the nodejs crypto module is available to determine how to
// generate secure random numbers below
let nodeCrypto: NodeCrypto | null

try {
  nodeCrypto = require('crypto')
} catch (e) {
  nodeCrypto = null
}

export function getNonce() {
  // detect whether we are in browser or in nodejs, and use the correct csprng
  if (typeof window === 'undefined' || window === null) {
    return '0x' + (nodeCrypto as NodeCrypto).randomBytes(32).toString('hex')
  } else {
    return '0x' + browserRandomHash(64)
  }
}
