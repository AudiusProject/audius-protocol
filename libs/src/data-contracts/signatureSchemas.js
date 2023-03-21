/**
 * This file includes schemas for use in EIP-712 compliant signature generation and
 * signature validation, generator functions for generating data
 * in the form needed by eth_personalSign / eth-sig-util's signTypedData functions,
 * generators for contract signing domains, and a helper function for generating
 * cryptographically secure nonces in nodejs or in the browser.
 * modeled off: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
 */

const domains = {}

function getDomainData (contractName, signatureVersion, chainId, contractAddress) {
  return {
    name: contractName,
    version: signatureVersion,
    chainId: chainId,
    verifyingContract: contractAddress
  }
}

domains.getSocialFeatureFactoryDomain = function (chainId, contractAddress) {
  return getDomainData('Social Feature Factory', '1', chainId, contractAddress)
}

domains.getUserFactoryDomain = function (chainId, contractAddress) {
  return getDomainData('User Factory', '1', chainId, contractAddress)
}

domains.getTrackFactoryDomain = function (chainId, contractAddress) {
  return getDomainData('Track Factory', '1', chainId, contractAddress)
}

domains.getPlaylistFactoryDomain = function (chainId, contractAddress) {
  return getDomainData('Playlist Factory', '1', chainId, contractAddress)
}

domains.getUserLibraryFactoryDomain = function (chainId, contractAddress) {
  return getDomainData('User Library Factory', '1', chainId, contractAddress)
}

domains.getIPLDBlacklistFactoryDomain = function (chainId, contractAddress) {
  return getDomainData('IPLD Blacklist Factory', '1', chainId, contractAddress)
}

domains.getUserReplicaSetManagerDomain = function (chainId, contractAddress) {
  return getDomainData('User Replica Set Manager', '1', chainId, contractAddress)
}

domains.getEntityManagerDomain = function (chainId, contractAddress) {
  return getDomainData("Entity Manager", "1", chainId, contractAddress)
}

const schemas = {}

/* contract signing domain */
schemas.domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
]

/* user factory requests */
schemas.addUserRequest = [
  { name: 'handle', type: 'bytes16' },
  { name: 'nonce', type: 'bytes32' }
]

/* rather than having a schema type for every update op, we have a type for each unique
 * structure */
schemas.updateUserBytes32 = [
  { name: 'userId', type: 'uint' },
  { name: 'newValue', type: 'bytes32' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.updateUserString = [
  { name: 'userId', type: 'uint' },
  { name: 'newValue', type: 'string' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.updateUserBool = [
  { name: 'userId', type: 'uint' },
  { name: 'newValue', type: 'bool' },
  { name: 'nonce', type: 'bytes32' }
]

/* track factory requests */
schemas.addTrackRequest = [
  { name: 'trackOwnerId', type: 'uint' },
  { name: 'multihashDigest', type: 'bytes32' },
  { name: 'multihashHashFn', type: 'uint8' },
  { name: 'multihashSize', type: 'uint8' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.updateTrackRequest = [
  { name: 'trackId', type: 'uint' },
  { name: 'trackOwnerId', type: 'uint' },
  { name: 'multihashDigest', type: 'bytes32' },
  { name: 'multihashHashFn', type: 'uint8' },
  { name: 'multihashSize', type: 'uint8' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.deleteTrackRequest = [
  { name: 'trackId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

/* social features */
schemas.addTrackRepostRequest = [
  { name: 'userId', type: 'uint' },
  { name: 'trackId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.deleteTrackRepostRequest = schemas.addTrackRepostRequest

schemas.addPlaylistRepostRequest = [
  { name: 'userId', type: 'uint' },
  { name: 'playlistId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.deletePlaylistRepostRequest = schemas.addPlaylistRepostRequest

schemas.userFollowRequest = [
  { name: 'followerUserId', type: 'uint' },
  { name: 'followeeUserId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.deleteUserFollowRequest = schemas.userFollowRequest

schemas.createPlaylistRequest = [
  { name: 'playlistOwnerId', type: 'uint' },
  { name: 'playlistName', type: 'string' },
  { name: 'isPrivate', type: 'bool' },
  { name: 'isAlbum', type: 'bool' },
  { name: 'trackIdsHash', type: 'bytes32' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.deletePlaylistRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.addPlaylistTrackRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'addedTrackId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.deletePlaylistTrackRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'deletedTrackId', type: 'uint' },
  { name: 'deletedTrackTimestamp', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.orderPlaylistTracksRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'trackIdsHash', type: 'bytes32' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.updatePlaylistPrivacyRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'updatedPlaylistPrivacy', type: 'bool' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.updatePlaylistNameRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'updatedPlaylistName', type: 'string' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.updatePlaylistCoverPhotoRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'playlistImageMultihashDigest', type: 'bytes32' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.updatePlaylistDescriptionRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'playlistDescription', type: 'string' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.updatePlaylistUPCRequest = [
  { name: 'playlistId', type: 'uint' },
  { name: 'playlistUPC', type: 'bytes32' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.trackSaveRequest = [
  { name: 'userId', type: 'uint' },
  { name: 'trackId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.deleteTrackSaveRequest = schemas.trackSaveRequest

schemas.playlistSaveRequest = [
  { name: 'userId', type: 'uint' },
  { name: 'playlistId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.deletePlaylistSaveRequest = schemas.playlistSaveRequest

schemas.addIPLDBlacklist = [
  { name: 'multihashDigest', type: 'bytes32' },
  { name: 'nonce', type: 'bytes32' }
]

// User replica set manager schemas
schemas.proposeAddOrUpdateContentNode = [
  { name: 'cnodeSpId', type: 'uint' },
  { name: 'cnodeDelegateOwnerWallet', type: 'address' },
  { name: 'cnodeOwnerWallet', type: 'address' },
  { name: 'proposerSpId', type: 'uint' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.updateReplicaSet = [
  { name: 'userId', type: 'uint' },
  { name: 'primaryId', type: 'uint' },
  { name: 'secondaryIdsHash', type: 'bytes32' },
  { name: 'oldPrimaryId', type: 'uint' },
  { name: 'oldSecondaryIdsHash', type: 'bytes32' },
  { name: 'nonce', type: 'bytes32' }
]

schemas.manageUser = [
  { name: 'userId', type: 'uint' },
  { name: 'action', type: 'string' },
  { name: 'metadata', type: 'string'},
  { name: 'nonce', type: 'bytes32'}
]

schemas.manageEntity = [
  { name: 'userId', type: 'uint'},
  { name: 'entityType', type: 'string'},
  { name: 'entityId', type: 'uint'},
  { name: 'action', type: 'string'},
  { name: 'metadata', type: 'string'},
  { name: 'nonce', type: 'bytes32'},
]

const generators = {}

function getRequestData (domainDataFn, chainId, contractAddress, messageTypeName, messageSchema, message) {
  const domainData = domainDataFn(chainId, contractAddress)
  const types = {
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
generators.getAddUserRequestData = function (chainId, contractAddress, handle, nonce) {
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

function _getUpdateUserRequestData (chainId, contractAddress, messageTypeName, schema, userId, newValue, nonce) {
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

generators.getUpdateUserMultihashRequestData = function (chainId, contractAddress, userId, newValue, nonce) {
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

generators.getUpdateUserNameRequestData = function (chainId, contractAddress, userId, newValue, nonce) {
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

generators.getUpdateUserLocationRequestData = function (chainId, contractAddress, userId, newValue, nonce) {
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

generators.getUpdateUserProfilePhotoRequestData = function (chainId, contractAddress, userId, newValue, nonce) {
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

generators.getUpdateUserCoverPhotoRequestData = function (chainId, contractAddress, userId, newValue, nonce) {
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

generators.getUpdateUserBioRequestData = function (chainId, contractAddress, userId, newValue, nonce) {
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

generators.getUpdateUserCreatorNodeRequestData = function (chainId, contractAddress, userId, newValue, nonce) {
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

generators.getUpdateUserCreatorRequestData = function (chainId, contractAddress, userId, newValue, nonce) {
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

generators.getUpdateUserVerifiedRequestData = function (chainId, contractAddress, userId, newValue, nonce) {
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
generators.getAddTrackRequestData = function (chainId, contractAddress, trackOwnerId, multihashDigest, multihashHashFn, multihashSize, nonce) {
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

generators.getUpdateTrackRequestData = function (chainId, contractAddress, trackId, trackOwnerId, multihashDigest, multihashHashFn, multihashSize, nonce) {
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

generators.getDeleteTrackRequestData = function (chainId, contractAddress, trackId, nonce) {
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
generators.getAddTrackRepostRequestData = function (chainId, contractAddress, userId, trackId, nonce) {
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

generators.getDeleteTrackRepostRequestData = function (chainId, contractAddress, userId, trackId, nonce) {
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

generators.getAddPlaylistRepostRequestData = function (chainId, contractAddress, userId, playlistId, nonce) {
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

generators.getDeletePlaylistRepostRequestData = function (chainId, contractAddress, userId, playlistId, nonce) {
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

generators.getUserFollowRequestData = function (chainId, contractAddress, followerUserId, followeeUserId, nonce) {
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

generators.getDeleteUserFollowRequestData = function (chainId, contractAddress, followerUserId, followeeUserId, nonce) {
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

generators.getTrackSaveRequestData = function (chainId, contractAddress, userId, trackId, nonce) {
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

generators.getDeleteTrackSaveRequestData = function (chainId, contractAddress, userId, trackId, nonce) {
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

generators.getPlaylistSaveRequestData = function (chainId, contractAddress, userId, playlistId, nonce) {
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

generators.getDeletePlaylistSaveRequestData = function (chainId, contractAddress, userId, playlistId, nonce) {
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
generators.getCreatePlaylistRequestData = function (chainId, contractAddress, playlistOwnerId, playlistName, isPrivate, isAlbum, trackIdsHash, nonce) {
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

generators.getDeletePlaylistRequestData = function (chainId, contractAddress, playlistId, nonce) {
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

generators.getAddPlaylistTrackRequestData = function (chainId, contractAddress, playlistId, addedTrackId, nonce) {
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

generators.getDeletePlaylistTrackRequestData = function (chainId, contractAddress, playlistId, deletedTrackId, deletedTrackTimestamp, nonce) {
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

generators.getOrderPlaylistTracksRequestData = function (chainId, contractAddress, playlistId, trackIdsHash, nonce) {
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

generators.getUpdatePlaylistNameRequestData = function (chainId, contractAddress, playlistId, updatedPlaylistName, nonce) {
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

generators.getUpdatePlaylistPrivacyRequestData = function (chainId, contractAddress, playlistId, updatedPlaylistPrivacy, nonce) {
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

generators.getUpdatePlaylistCoverPhotoRequestData = function (chainId, contractAddress, playlistId, playlistImageMultihashDigest, nonce) {
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
    message)
}

generators.getUpdatePlaylistUPCRequestData = function (chainId, contractAddress, playlistId, playlistUPC, nonce) {
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
    message)
}

generators.getUpdatePlaylistDescriptionRequestData = function (chainId, contractAddress, playlistId, playlistDescription, nonce) {
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
    message)
}

generators.addIPLDToBlacklistRequestData = function (chainId, contractAddress, multihashDigest, nonce) {
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
generators.getProposeAddOrUpdateContentNodeRequestData = function (
  chainId,
  contractAddress,
  cnodeSpId,
  cnodeDelegateOwnerWallet,
  cnodeOwnerWallet,
  proposerSpId,
  nonce
) {
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

generators.getUpdateReplicaSetRequestData = function (
  chainId,
  contractAddress,
  userId,
  primaryId,
  secondaryIdsHash,
  oldPrimaryId,
  oldSecondaryIdsHash,
  nonce
) {
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

generators.getManageUserData = function (
  chainId,
  contractAddress,
  userId,
  action,
  metadata,
  nonce
) {
  const message = {
    userId,
    action,
    metadata,
    nonce,
  }
  return getRequestData(
    domains.getEntityManagerDomain,
    chainId,
    contractAddress,
    'ManageUser',
    schemas.manageUser,
    message
  )
}

generators.getManageEntityData = function(
  chainId,
  contractAddress,
  userId,
  entityType,
  entityId,
  action,
  metadata,
  nonce
) {
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

/** Return a secure random hex string of nChar length in a browser-compatible way
 *  Taken from https://stackoverflow.com/questions/37378237/how-to-generate-a-random-token-of-32-bit-in-javascript
 */
function browserRandomHash (nChar) {
  // convert number of characters to number of bytes
  var nBytes = Math.ceil(nChar = (+nChar || 8) / 2)

  // create a typed array of that many bytes
  var u = new Uint8Array(nBytes)

  // populate it wit crypto-random values
  window.crypto.getRandomValues(u)

  // convert it to an Array of Strings (e.g. '01', 'AF', ..)
  var zpad = function (str) {
    return '00'.slice(str.length) + str
  }
  var a = Array.prototype.map.call(u, function (x) {
    return zpad(x.toString(16))
  })

  // Array of String to String
  var str = a.join('').toLowerCase()
  // and snip off the excess digit if we want an odd number
  if (nChar % 2) str = str.slice(1)

  // return what we made
  return str
}

// We need to detect whether the nodejs crypto module is available to determine how to
// generate secure random numbers below
let nodeCrypto
try {
  nodeCrypto = require('crypto')
} catch (e) {
  nodeCrypto = null
}

function getNonce () {
  // detect whether we are in browser or in nodejs, and use the correct csprng
  if (typeof window === 'undefined' || window === null) {
    return '0x' + nodeCrypto.randomBytes(32).toString('hex')
  } else {
    return '0x' + browserRandomHash(64)
  }
}

module.exports = { domains, schemas, generators, getNonce }
