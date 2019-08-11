/* global web3 */
/** Library of useful test functions for testing audius smart contracts
  * Shared among test suites in audius_contracts repository to maximize code reuse
  *
  * Before adding any new functions, please adhere to the existing JSDoc formatting
  *
  * Function naming conventions
  * 1) get_ , ie getUserFromFactory: invokes contract function and returns formatted output
  * 2) parse_, ie parseTx: returns formatted input
  */
const signatureSchemas = require('../../signature_schemas/signatureSchemas')

/** ensures use of pre-configured web3 if provided */
let web3New
if (typeof web3 === 'undefined') {
  web3New = require('web3')
} else {
  web3New = web3
}

import * as util from 'util'
import * as bs58 from 'bs58'

export const userStorageKey = web3New.utils.utf8ToHex('UserStorage')
export const userFactoryKey = web3New.utils.utf8ToHex('UserFactory')
export const trackStorageKey = web3New.utils.utf8ToHex('TrackStorage')
export const trackFactoryKey = web3New.utils.utf8ToHex('TrackFactory')
export const discoveryProviderStorageKey = web3New.utils.utf8ToHex('DiscoveryProviderStorage')
export const discoveryProviderFactoryKey = web3New.utils.utf8ToHex('DiscoveryProviderFactory')
export const playlistStorageKey = web3New.utils.utf8ToHex('PlaylistStorage')
export const playlistFactoryKey = web3New.utils.utf8ToHex('PlaylistFactory')
export const socialFeatureFactoryKey = web3New.utils.utf8ToHex('SocialFeatureFactory')
export const socialFeatureStorageKey = web3New.utils.utf8ToHex('SocialFeatureStorage')
export const ipldBlacklistFactorykey = web3New.utils.utf8ToHex('IPLDBlacklistFactory')
export const userLibraryFactoryKey = web3New.utils.utf8ToHex('UserLibraryFactory')
export const testStorageKey = web3New.utils.utf8ToHex('TestStorage')
export const testContractKey = web3New.utils.utf8ToHex('TestContract')

/** Constant string values */
export const strings = {
  first: web3New.utils.utf8ToHex('first'),
  second: web3New.utils.utf8ToHex('second'),
  third: web3New.utils.utf8ToHex('third'),
  test: web3New.utils.utf8ToHex('test')
}

export const testMultihash = {
  digest1: '0x697066735f6b6579000100000000000000000000000000000000000000000000',
  digest2: '0x697066735f6b6579000100000000000000000000000000000000000000000001',
  digest3: '0x697066735f6b6579000100000000000000000000000000000000000000000003',
  hashFn: 0,
  size: 8
}

export const userHandle1 = web3New.utils.utf8ToHex('userHandle1')
export const userHandle2 = web3New.utils.utf8ToHex('userHandle2_')
export const userHandleBad = web3New.utils.utf8ToHex('handleBoi!')
export const userHandleUC = web3New.utils.utf8ToHex('USER')
export const userHandleLC = web3New.utils.utf8ToHex('user')
export const userHandleMC = web3New.utils.utf8ToHex('User')

export const isCreatorFalse = false
export const isCreatorTrue = true

export const userMetadata = {
  name: web3New.utils.padRight(web3New.utils.utf8ToHex('Firstname Lastname'), 64),
  location: web3New.utils.padRight(web3New.utils.utf8ToHex('San Francisco'), 64),
  bio: "I'm A VERY INTERESTING PERSON!!!",
  coverPhotoDigest: '0x1a5a5d47bfca6be2872d8076920683a3ae112b455a7a444be5ebb84471b16c4e',
  profilePhotoDigest: '0x1a5a5d47bfca6be2872d8076920683a3ae112b455a7a444be5ebb84471b16c4e'
}

/** hex to utf8
  * @param {string} arg - Raw hex-encoded string returned from contract code
  * @returns {string} utf8 converted string value
  */
export const toStr = (arg) => {
  return web3New.utils.hexToUtf8(arg)
}

/****** TX RECEIPT PARSERS ******/

/** Returns formatted transaction receipt object with event and arg info
  * @param {object} txReceipt - transaction receipt object
  * @returns {object} w/event + args array from txReceipt
  */
export const parseTx = (txReceipt) => {
  if (!txReceipt.logs.length >= 1) {
    throw new Error('Invalid txReceipt length')
  }

  if (!(txReceipt.logs[0].hasOwnProperty('event'))) {
    throw new Error('Missing event log in tx receipt')
  }

  return {
    'event': {
      'name': txReceipt.logs[0].event,
      'args': txReceipt.logs[0].args
    }
  }
}

export const parseAddUserTx = (txReceipt, userId) => {
  const tx = parseTx(txReceipt)

  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_userId')) { throw new Error('Missing _userId') }
  assert.equal(tx.event.name, 'AddUser', 'Expected same event name')
  assert.equal(tx.event.args._userId.toNumber(), userId, 'Expected same user id')

  return {
    'eventName': tx.event.name,
    'userId': tx.event.args._userId.toNumber()
  }
}

export const parseUpdateMultihashTx = (txReceipt, userId, multihashDigest) => {
  const tx = parseTx(txReceipt)

  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_userId')) { throw new Error('Missing _userId') }
  if (!tx.event.args.hasOwnProperty('_multihashDigest')) { throw new Error('Missing _multihashDigest') }
  assert.equal(tx.event.name, 'UpdateMultihash', 'Expected same event name')
  assert.equal(tx.event.args._userId.toNumber(), userId, 'Expected same user id')
  assert.equal(tx.event.args._multihashDigest, multihashDigest, 'Expected same multihashDigest')

  return {
    'eventName': tx.event.name,
    'userId': tx.event.args._userId.toNumber(),
    'multihashDigest': tx.event.args._multihashDigest
  }
}

export const parseUpdateNameTx = (txReceipt, userId, name) => {
  const tx = parseTx(txReceipt)

  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_userId')) { throw new Error('Missing _userId') }
  if (!tx.event.args.hasOwnProperty('_name')) { throw new Error('Missing _name') }
  assert.equal(tx.event.name, 'UpdateName', 'Expected same event name')
  assert.equal(tx.event.args._userId.toNumber(), userId, 'Expected same user id')
  assert.equal(tx.event.args._name, name, 'Expected same name')

  return {
    'eventName': tx.event.name,
    'userId': tx.event.args._userId.toNumber(),
    'name': web3New.utils.toUtf8(tx.event.args._name)
  }
}

export const parseUpdateLocationTx = (txReceipt, userId, location) => {
  const tx = parseTx(txReceipt)

  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_userId')) { throw new Error('Missing _userId') }
  if (!tx.event.args.hasOwnProperty('_location')) { throw new Error('Missing _location') }
  assert.equal(tx.event.name, 'UpdateLocation', 'Expected same event name')
  assert.equal(tx.event.args._userId.toNumber(), userId, 'Expected same user id')
  assert.equal(tx.event.args._location, location, 'Expected same location')

  return {
    'eventName': tx.event.name,
    'userId': tx.event.args._userId.toNumber(),
    'location': tx.event.args._location
  }
}

export const parseUpdateBioTx = (txReceipt, userId, bio) => {
  const tx = parseTx(txReceipt)

  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_userId')) { throw new Error('Missing _userId') }
  if (!tx.event.args.hasOwnProperty('_bio')) { throw new Error('Missing _bio') }
  assert.equal(tx.event.name, 'UpdateBio', 'Expected same event name')
  assert.equal(tx.event.args._userId.toNumber(), userId, 'Expected same user id')
  assert.equal(tx.event.args._bio, bio, 'Expected same bio')

  return {
    'eventName': tx.event.name,
    'userId': tx.event.args._userId.toNumber(),
    'bio': tx.event.args._bio
  }
}

export const parseUpdateProfilePhotoTx = (txReceipt, userId, profilePhotoDigest) => {
  const tx = parseTx(txReceipt)

  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_userId')) { throw new Error('Missing _userId') }
  if (!tx.event.args.hasOwnProperty('_profilePhotoDigest')) { throw new Error('Missing _profilePhotoDigest') }
  assert.equal(tx.event.name, 'UpdateProfilePhoto', 'Expected same event name')
  assert.equal(tx.event.args._userId.toNumber(), userId, 'Expected same user id')
  assert.equal(tx.event.args._profilePhotoDigest, profilePhotoDigest, 'Expected same profilePhotoDigest')

  return {
    'eventName': tx.event.name,
    'userId': tx.event.args._userId.toNumber(),
    'profilePhotoDigest': tx.event.args._profilePhotoDigest
  }
}

export const parseUpdateCoverPhotoTx = (txReceipt, userId, coverPhotoDigest) => {
  const tx = parseTx(txReceipt)

  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_userId')) { throw new Error('Missing _userId') }
  if (!tx.event.args.hasOwnProperty('_coverPhotoDigest')) { throw new Error('Missing _coverPhotoDigest') }
  assert.equal(tx.event.name, 'UpdateCoverPhoto', 'Expected same event name')
  assert.equal(tx.event.args._userId.toNumber(), userId, 'Expected same user id')
  assert.equal(tx.event.args._coverPhotoDigest, coverPhotoDigest, 'Expected same coverPhotoDigest')

  return {
    'eventName': tx.event.name,
    'userId': tx.event.args._userId.toNumber(),
    'coverPhotoDigest': tx.event.args._coverPhotoDigest
  }
}

export const parseUpdateIsCreatorTx = (txReceipt, userId, isCreator) => {
  const tx = parseTx(txReceipt)

  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_userId')) { throw new Error('Missing _userId') }
  if (!tx.event.args.hasOwnProperty('_isCreator')) { throw new Error('Missing _isCreator') }
  assert.equal(tx.event.name, 'UpdateIsCreator', 'Expected same event name')
  assert.equal(tx.event.args._userId.toNumber(), userId, 'Expected same user id')
  assert.equal(tx.event.args._isCreator, isCreator, 'Expected same isCreator')

  return {
    'eventName': tx.event.name,
    'userId': tx.event.args._userId.toNumber(),
    'isCreator': tx.event.args._isCreator
  }
}

export const parseUpdateVerifiedTx = (txReceipt, userId, isVerified) => {
  const tx = parseTx(txReceipt)

  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_userId')) { throw new Error('Missing _userId') }
  if (!tx.event.args.hasOwnProperty('_isVerified')) { throw new Error('Missing _isVerified') }
  assert.equal(tx.event.name, 'UpdateIsVerified', 'Expected same event name')
  assert.equal(tx.event.args._userId.toNumber(), userId, 'Expected same user id')
  assert.equal(tx.event.args._isVerified, isVerified, 'Expected same isVerified')

  return {
    'eventName': tx.event.name,
    'userId': tx.event.args._userId.toNumber(),
    'isVerified': tx.event.args._isVerified
  }
}

export const parseUpdateCreatorNodeEndpointTx = (txReceipt, userId, creatorNodeEndpoint) => {
  const tx = parseTx(txReceipt)

  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_userId')) { throw new Error('Missing _userId') }
  if (!tx.event.args.hasOwnProperty('_creatorNodeEndpoint')) { throw new Error('Missing _creatorNodeEndpoint') }
  assert.equal(tx.event.name, 'UpdateCreatorNodeEndpoint', 'Expected same event name')
  assert.equal(tx.event.args._userId.toNumber(), userId, 'Expected same user id')
  assert.equal(tx.event.args._creatorNodeEndpoint, creatorNodeEndpoint, 'Expected same creatorNodeEndpoint')

  return {
    'eventName': tx.event.name,
    'userId': tx.event.args._userId.toNumber(),
    'creatorNodeEndpoint': tx.event.args._creatorNodeEndpoint
  }
}

/** Returns formatted event params from AddTrack transaction receipt
  * @param {object} txReceipt - transaction receipt object
  * @returns {object} with eventName, trackId, trackOwnerId,
  *   multihashDigest, multihashHashFn, multihashSize
  */
export const parseAddTrackTx = (txReceipt) => {
  const tx = parseTx(txReceipt)
  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_id')) { throw new Error('Missing _id') }
  if (!tx.event.args.hasOwnProperty('_trackOwnerId')) { throw new Error('Missing _trackOwnerId') }
  if (!tx.event.args.hasOwnProperty('_multihashDigest')) { throw new Error('Missing _multihashDigest') }
  if (!tx.event.args.hasOwnProperty('_multihashHashFn')) { throw new Error('Missing _multihashHashFn') }
  if (!tx.event.args.hasOwnProperty('_multihashSize')) { throw new Error('Missing _multihashSize') }
  return {
    'eventName': tx.event.name,
    'trackId': tx.event.args._id.toNumber(),
    'trackOwnerId': tx.event.args._trackOwnerId.toNumber(),
    'multihashDigest': tx.event.args._multihashDigest,
    'multihashHashFn': tx.event.args._multihashHashFn,
    'multihashSize': tx.event.args._multihashSize
  }
}

/** Returns formatted event params from DeleteTrack transaction receipt
  * @param {object} txReceipt = transaction receipt object
  * @returns {object} with eventName, trackId
  */
export const parseDeleteTrackTx = (txReceipt) => {
  const tx = parseTx(txReceipt)
  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_trackId')) { throw new Error('Missing _trackId') }
  return {
    'eventName': tx.event.name,
    'trackId': tx.event.args._trackId.toNumber(),
  }
}

/** Returns formatted event params from DeletePlaylist transaction receipt
  * @param {object} txReceipt = transaction receipt object
  * @returns {object} with eventName, playlistId
  */
export const parseDeletePlaylistTx = (txReceipt) => {
  const tx = parseTx(txReceipt)
  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_playlistId')) { throw new Error('Missing _playlistId') }
  return {
    'eventName': tx.event.name,
    'playlistId': tx.event.args._playlistId.toNumber(),
  }
}

/** Returns formatted event params from addTrackRepost() transaction receipt
  * @param {object} txReceipt - transaction receipt object
  * @returns {object} with eventName, userId, trackId
  */
export const parseAddTrackRepostTx = (txReceipt) => {
  const tx = parseTx(txReceipt)
  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_userId')) { throw new Error('Missing _userId') }
  if (!tx.event.args.hasOwnProperty('_trackId')) { throw new Error('Missing _trackId') }
  return {
    'eventName': tx.event.name,
    'userId': tx.event.args._userId.toNumber(),
    'trackId': tx.event.args._trackId.toNumber(),
  }
}

/** Returns formatted event params from deleteTrackRepost() transaction receipt
  * @param {object} txReceipt - transaction receipt object
  * @returns {object} with eventName, userId, trackId
  */
export const parseDeleteTrackRepostTx = (txReceipt) => {
  const tx = parseTx(txReceipt)
  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_userId')) { throw new Error('Missing _userId') }
  if (!tx.event.args.hasOwnProperty('_trackId')) { throw new Error('Missing _trackId') }
  return {
    'eventName': tx.event.name,
    'userId': tx.event.args._userId.toNumber(),
    'trackId': tx.event.args._trackId.toNumber(),
  }
}

/** Returns formatted event params from addPlaylistRepost() transaction receipt
  * @param {object} txReceipt - transaction receipt object
  * @returns {object} with eventName, userId, playlistId
  */
export const parseAddPlaylistRepostTx = (txReceipt) => {
  const tx = parseTx(txReceipt)
  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_userId')) { throw new Error('Missing _userId') }
  if (!tx.event.args.hasOwnProperty('_playlistId')) { throw new Error('Missing _playlistId') }
  return {
    'eventName': tx.event.name,
    'userId': tx.event.args._userId.toNumber(),
    'playlistId': tx.event.args._playlistId.toNumber(),
  }
}

/** Returns formatted event params from deletePlaylistRepost() transaction receipt
  * @param {object} txReceipt - transaction receipt object
  * @returns {object} with eventName, userId, playlistId
  */
export const parseDeletePlaylistRepostTx = (txReceipt) => {
  const tx = parseTx(txReceipt)
  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_userId')) { throw new Error('Missing _userId') }
  if (!tx.event.args.hasOwnProperty('_playlistId')) { throw new Error('Missing _playlistId') }
  return {
    'eventName': tx.event.name,
    'userId': tx.event.args._userId.toNumber(),
    'playlistId': tx.event.args._playlistId.toNumber(),
  }
}

/** Returns formatted event params from AddUserFollow transaction receipt
  * @param {object} txReceipt - transaction receipt object
  * @returns {object} with eventName, followerUserId, followeeUserId
  */
export const parseAddUserFollowTx = (txReceipt) => {
  const tx = parseTx(txReceipt)
  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_followerUserId')) { throw new Error('Missing _followerUserId') }
  if (!tx.event.args.hasOwnProperty('_followeeUserId')) { throw new Error('Missing _followeeUserId') }
  return {
    'eventName': tx.event.name,
    'followerUserId': tx.event.args._followerUserId.toNumber(),
    'followeeUserId': tx.event.args._followeeUserId.toNumber(),
  }
}

/** Returns formatted event params from DeleteUserFollow transaction receipt
  * @param {object} txReceipt - transaction receipt object
  * @returns {object} with eventName, followerUserId, followeeUserId
  */
export const parseDeleteUserFollowTx = (txReceipt) => {
  const tx = parseTx(txReceipt)
  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_followerUserId')) { throw new Error('Missing _followerUserId') }
  if (!tx.event.args.hasOwnProperty('_followeeUserId')) { throw new Error('Missing _followeeUserId') }
  return {
    'eventName': tx.event.name,
    'followerUserId': tx.event.args._followerUserId.toNumber(),
    'followeeUserId': tx.event.args._followeeUserId.toNumber(),
  }
}

/** Returns formatted event params from DiscoveryProvider.register() transaction receipt
  * @param {object} txReceipt - transaction receipt object
  * @returns {object} with eventName, discprovId, discprovWallet, discprovEndpoint
  */
export const parseDiscprovRegisterTx = (tx) => {
  tx = parseTx(tx)
  if (!tx.event.hasOwnProperty('args')) { throw new Error('Missing args property') }
  if (!tx.event.args.hasOwnProperty('_id')) { throw new Error('Missing _id') }
  if (!tx.event.args.hasOwnProperty('_wallet')) { throw new Error('Missing _wallet') }
  if (!tx.event.args.hasOwnProperty('_endpoint')) { throw new Error('Missing _endpoint') }
  return {
    'eventName': tx.event.name,
    'discprovId': tx.event.args._id.toNumber(),
    'discprovWallet': tx.event.args._wallet,
    'discprovEndpoint': tx.event.args._endpoint
  }
}

/****** FACTORY GETTERS ******/

/** Retrieves user from factory contract
  * @param {number} userId
  * @param {object} userFactory, deployed UserFactory truffle contract
  * @returns {object} dictionary with wallet, multihashDigest
  */
export const getUserFromFactory = async (userId, userFactory) => {
  let user = await userFactory.getUser.call(userId)
  return {
    wallet: user[0],
    handle: toStr(user[1])
  }
}

/** Retrieves track from factory contract
  * @param {number} trackId
  * @param {object} trackFactory, deployed TrackFactory truffle contract
  * @returns {object} dictionary with userId, multihashDigest, multihashHashFn, multihashSize
  */
export const getTrackFromFactory = async (trackId, trackFactory) => {
  let track = await trackFactory.getTrack.call(trackId)
  return {
    trackOwnerId: track[0],
    multihashDigest: track[1],
    multihashHashFn: track[2],
    multihashSize: track[3]
  }
}

/** Retrieves discovery provider from DiscoveryProviderFactory contract
  * @param {number} discprovId
  * @param {object} discprovFactory, deployed DiscoveryProvider truffle contract
  * @returns {object} dictionary with wallet address, discprov endpoint
  */
export const getDiscprovFromFactory = async (discprovId, discprovFactory) => {
  let discprov = await discprovFactory.getDiscoveryProvider.call(discprovId)
  return {
    wallet: discprov[0],
    endpoint: discprov[1]
  }
}

/****** EVENT VALIDATORS ******/

/** Checks all fields of AddTrack event against function inputs */
export const validateAddTrackEvent = (event, eventName, trackId, trackOwnerId, multihashDigest, multihashHashFn, multihashSize) => {
  assert.equal(event.eventName, eventName, 'Expected same event name')
  assert.equal(event.trackId, trackId, 'Expected same track id')
  assert.equal(event.trackOwnerId, trackOwnerId, 'Expected same track user id')
  assert.equal(event.multihashDigest, multihashDigest, 'Expected same multihash digest')
  assert.equal(event.multihashHashFn, multihashHashFn, 'Expected same multihash hash function')
  assert.equal(event.multihashSize, multihashSize, 'Expected same multihash size')
}

/** Checks all fields of DeleteTrack event against function inputs */
export const validateDeleteTrackEvent = (event, eventName, trackId) => {
  assert.equal(event.eventName, eventName, 'Expected same event name')
  assert.equal(event.trackId, trackId, 'Expected same track id')
}

/** Checks all fields of DeletePlaylist event against function inputs */
export const validateDeletePlaylistEvent = (event, eventName, playlistId) => {
  assert.equal(event.eventName, eventName, 'Expected same event name')
  assert.equal(event.playlistId, playlistId, 'Expected same playlistId')
}

/** Checks all fields of TrackRepostAdded event against function inputs */
export const validateAddTrackRepostEvent = (event, eventName, userId, trackId) => {
  assert.equal(event.eventName, eventName, 'Expected same event name')
  assert.equal(event.userId, userId, 'Expected same user id')
  assert.equal(event.trackId, trackId, 'Expected same track id')
}

/** Checks all fields of TrackRepostDeleted event against function inputs */
export const validateDeleteTrackRepostEvent = (event, eventName, userId, trackId) => {
  assert.equal(event.eventName, eventName, 'Expected same event name')
  assert.equal(event.userId, userId, 'Expected same user id')
  assert.equal(event.trackId, trackId, 'Expected same track id')
}

/** Checks all fields of PlaylistRepostAdded event against function inputs */
export const validateAddPlaylistRepostEvent = (event, eventName, userId, playlistId) => {
  assert.equal(event.eventName, eventName, 'Expected same event name')
  assert.equal(event.userId, userId, 'Expected same user id')
  assert.equal(event.playlistId, playlistId, 'Expected same playlist id')
}

/** Checks all fields of PlaylistRepostDeleted event against function inputs */
export const validateDeletePlaylistRepostEvent = (event, eventName, userId, playlistId) => {
  assert.equal(event.eventName, eventName, 'Expected same event name')
  assert.equal(event.userId, userId, 'Expected same user id')
  assert.equal(event.playlistId, playlistId, 'Expected same playlist id')
}

/** Checks all fields of AddUserFollow event against function inputs */
export const validateAddUserFollowEvent = (event, eventName, followerUserId, followeeUserId) => {
  assert.equal(event.eventName, eventName, 'Expected same event name')
  assert.equal(event.followerUserId, followerUserId, 'Expected same followerUserId')
  assert.equal(event.followeeUserId, followeeUserId, 'Expected same followeeUserId')
}

/** Checks all fields of DeleteUserFollow event against function inputs */
export const validateDeleteUserFollowEvent = (event, eventName, followerUserId, followeeUserId) => {
  assert.equal(event.eventName, eventName, 'Expected same event name')
  assert.equal(event.followerUserId, followerUserId, 'Expected same followerUserId')
  assert.equal(event.followeeUserId, followeeUserId, 'Expected same followeeUserId')
}

/** Checks all fields of user retrieved from UserFactory contract against function inputs */
export const validateUser = (user, wallet, multihashDigest, handle) => {
  assert.equal(user.wallet, wallet, 'Expected same user wallet')
  assert.equal(user.handle, toStr(handle), 'Expected same handle')
}

/** Checks all fields of track retrieved from TrackFactory contract against function inputs */
export const validateTrack = (track, trackOwnerId, multihashDigest, multihashHashFn, multihashSize) => {
  assert.equal(track.trackOwnerId, trackOwnerId, 'Expected same track trackOwnerId')
  assert.equal(track.multihashDigest, multihashDigest, 'Expected same multihash digest')
  assert.equal(track.multihashHashFn, multihashHashFn, 'Expected same multihash hash function')
  assert.equal(track.multihashSize, multihashSize, 'Expected same multihash size')
}

/****** EXTERNAL E2E FUNCTIONS ******/

/** Adds user to blockchain using function input fields,
  *   validates emitted event and user data on-chain
  * @returns {object} with event and user data
  */
export const addUserAndValidate = async (userFactory,
  userId,
  userWallet,
  multihashDigest,
  handle,
  isCreator
  ) => {
  // Validate args - TODO
  assert.isTrue(userFactory !== undefined,
    'userFactory arg cannot be undefined')

  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(userFactory)  // in testing use the network id as chain ID because chain ID is unavailable

  let signatureData = signatureSchemas.generators.getAddUserRequestData(chainId, userFactory.address, handle, nonce)
  let sig = await eth_signTypedData(userWallet, signatureData)
  let tx = await userFactory.addUser(userWallet, handle, nonce, sig)
  parseAddUserTx(tx, userId)

  signatureData = signatureSchemas.generators.getUpdateUserMultihashRequestData(chainId, userFactory.address, userId, multihashDigest, nonce)
  sig = await eth_signTypedData(userWallet, signatureData)
  let metadataTx = await userFactory.updateMultihash(userId, multihashDigest, nonce, sig)
  parseUpdateMultihashTx(metadataTx, userId, multihashDigest)

  signatureData = signatureSchemas.generators.getUpdateUserNameRequestData(chainId, userFactory.address, userId, userMetadata.name, nonce)
  sig = await eth_signTypedData(userWallet, signatureData)
  let nameTx = await userFactory.updateName(userId, userMetadata.name, nonce, sig)
  parseUpdateNameTx(nameTx, userId, userMetadata.name)

  signatureData = signatureSchemas.generators.getUpdateUserLocationRequestData(chainId, userFactory.address, userId, userMetadata.location, nonce)
  sig = await eth_signTypedData(userWallet, signatureData)
  let locationTx = await userFactory.updateLocation(userId, userMetadata.location, nonce, sig)
  parseUpdateLocationTx(locationTx, userId, userMetadata.location)

  signatureData = signatureSchemas.generators.getUpdateUserBioRequestData(chainId, userFactory.address, userId, userMetadata.bio, nonce)
  sig = await eth_signTypedData(userWallet, signatureData)
  let bioTx = await userFactory.updateBio(userId, userMetadata.bio, nonce, sig)
  parseUpdateBioTx(bioTx, userId, userMetadata.bio)

  signatureData = signatureSchemas.generators.getUpdateUserProfilePhotoRequestData(chainId, userFactory.address, userId, userMetadata.profilePhotoDigest, nonce)
  sig = await eth_signTypedData(userWallet, signatureData)
  let profilePhotoTx = await userFactory.updateProfilePhoto(userId, userMetadata.profilePhotoDigest, nonce, sig)
  parseUpdateProfilePhotoTx(profilePhotoTx, userId, userMetadata.profilePhotoDigest)

  signatureData = signatureSchemas.generators.getUpdateUserCoverPhotoRequestData(chainId, userFactory.address, userId, userMetadata.coverPhotoDigest, nonce)
  sig = await eth_signTypedData(userWallet, signatureData)
  let coverPhotoTx = await userFactory.updateCoverPhoto(userId, userMetadata.coverPhotoDigest, nonce, sig)
  parseUpdateCoverPhotoTx(coverPhotoTx, userId, userMetadata.coverPhotoDigest)

  signatureData = signatureSchemas.generators.getUpdateUserCreatorRequestData(chainId, userFactory.address, userId, isCreator, nonce)
  sig = await eth_signTypedData(userWallet, signatureData)
  let isCreatorTx = await userFactory.updateIsCreator(userId, isCreator, nonce, sig)
  parseUpdateIsCreatorTx(isCreatorTx, userId, isCreator)

  const newCnode = 'http://localhost:4387'
  signatureData = signatureSchemas.generators.getUpdateUserCreatorNodeRequestData(chainId, userFactory.address, userId, newCnode, nonce)
  sig = await eth_signTypedData(userWallet, signatureData)
  let creatorNodeEndpointTx = await userFactory.updateCreatorNodeEndpoint(userId, newCnode, nonce, sig)
  parseUpdateCreatorNodeEndpointTx(creatorNodeEndpointTx, userId, newCnode)

  // retrieve user from contract
  let user = await getUserFromFactory(userId, userFactory)

  // validate retrieved user fields = transaction input
  validateUser(user, userWallet, multihashDigest, handle)
}

export const updateUserNameAndValidate = async function (userFactory, userId, userWallet) {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(userFactory)  // in testing use the network id as chain ID because chain ID is unavailable
  let signatureData = signatureSchemas.generators.getUpdateUserNameRequestData(chainId, userFactory.address, userId, userMetadata.name, nonce)
  let sig = await eth_signTypedData(userWallet, signatureData)
  let nameTx = await userFactory.updateName(userId, userMetadata.name, nonce, sig)
  parseUpdateNameTx(nameTx, userId, userMetadata.name)
}

/** @notice this function is only callable from verifier address defined at UserFactory construction */
export const markUserVerifiedAndValidate = async function (userFactory, verifierWallet, userId, verified) {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(userFactory)  // in testing use the network id as chain ID because chain ID is unavailable
  let signatureData = signatureSchemas.generators.getUpdateUserVerifiedRequestData(chainId, userFactory.address, userId, verified, nonce)
  let sig = await eth_signTypedData(verifierWallet, signatureData)

  let verifiedTx = await userFactory.updateIsVerified(userId, verified, nonce, sig)
  return parseUpdateVerifiedTx(verifiedTx, userId, verified)
}

/** Adds track to blockchain using function input fields,
  *   validates emitted event and track data on-chain
  * @returns {object} with event and track data
  */
export const addTrackAndValidate = async (trackFactory, trackId, walletAddress, trackOwnerId, multihashDigest, multihashHashFn, multihashSize) => {
  // Validate args - TODO

  // generate new track request
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(trackFactory)  // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getAddTrackRequestData(
    chainId,
    trackFactory.address,
    trackOwnerId,
    multihashDigest,
    multihashHashFn,
    multihashSize,
    nonce
  )
  const sig = await eth_signTypedData(walletAddress, signatureData)

  // Add new track to contract
  let tx = await trackFactory.addTrack(trackOwnerId, multihashDigest, multihashHashFn, multihashSize, nonce, sig)

  // validate event output = transaction input
  let event = parseAddTrackTx(tx)
  validateAddTrackEvent(event, 'NewTrack', trackId, trackOwnerId, multihashDigest, multihashHashFn, multihashSize)

  // retrieve track from contract
  let track = await getTrackFromFactory(trackId, trackFactory)

  // validate retrieved track fields = transaction input
  validateTrack(track, trackOwnerId, multihashDigest, multihashHashFn, multihashSize)

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
  const signatureData = signatureSchemas.generators.getDeleteTrackRequestData(
    chainId,
    trackFactory.address,
    trackId,
    nonce
  )
  const sig = await eth_signTypedData(walletAddress, signatureData)

  // call delete track from chain
  let tx = await trackFactory.deleteTrack(trackId, nonce, sig)

  // validate event output = transaction input
  let event = parseDeleteTrackTx(tx)
  validateDeleteTrackEvent(event, 'TrackDeleted', trackId)

  // TODO after storage implemented - attemt to retrieve track from chain

  // TODO after storage implemented - validate track does not exist

  return {
    event: event
  }
}

export const addPlaylistAndValidate = async (playlistFactory, expectedPlaylistId, walletAddress, playlistOwnerId, playlistName, isPrivate, isAlbum, trackIds) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)

  // trackIdsHash calculated by hashing encoded trackIds[]
  // required to generate signed/typed signature below
  let trackIdsHash = web3New.utils.soliditySha3(web3New.eth.abi.encodeParameter('uint[]', trackIds))

  const signatureData = signatureSchemas.generators.getCreatePlaylistRequestData(
    chainId,
    playlistFactory.address,
    playlistOwnerId,
    playlistName,
    isPrivate,
    isAlbum,
    trackIdsHash,
    nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)

  let tx = await playlistFactory.createPlaylist(
    playlistOwnerId,
    playlistName,
    isPrivate,
    isAlbum,
    trackIds,
    nonce,
    signature)

  let parsedCreatePlaylist = parseTx(tx)
  let parsedCreatePlaylistName = tx.logs[1].args._updatedPlaylistName
  let eventInfo = parsedCreatePlaylist.event.args
  let returnedPlaylistId = eventInfo._playlistId
  assert.equal(returnedPlaylistId, expectedPlaylistId, 'Expected playlist id does not match')

  let emittedPlaylistId = eventInfo._playlistId.toNumber()
  assert.equal(
    emittedPlaylistId,
    expectedPlaylistId,
    'Expected update event playlistId array to match expected')

  let emittedEventPrivacy = eventInfo._isPrivate
  assert.equal(
    emittedEventPrivacy,
    isPrivate,
    'Expected emitted playlist privacy to equal input')

  let emittedEventPlaylistName = parsedCreatePlaylistName
  assert.equal(
    playlistName,
    emittedEventPlaylistName,
    'Expected emitted playlist name to equal input')

  let emittedEventIsAlbum = eventInfo._isAlbum
  assert.equal(
    isAlbum,
    emittedEventIsAlbum,
    'Expected emitted album status to equal input')

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
  const signatureData = signatureSchemas.generators.getDeletePlaylistRequestData(
    chainId,
    playlistFactory.address,
    playlistId,
    nonce
  )
  const sig = await eth_signTypedData(walletAddress, signatureData)

  // call delete playlist from chain
  let tx = await playlistFactory.deletePlaylist(playlistId, nonce, sig)

  // validate event output = transaction input
  let event = parseDeletePlaylistTx(tx)
  validateDeletePlaylistEvent(event, 'PlaylistDeleted', playlistId)

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

  const signatureData = signatureSchemas.generators.getOrderPlaylistTracksRequestData(
    chainId,
    playlistFactory.address,
    playlistId,
    trackIdsHash,
    nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)

  let tx = await playlistFactory.orderPlaylistTracks(
    playlistId,
    trackIds,
    nonce,
    signature)

  let parsedOrderPlaylistTracks = parseTx(tx)
  let eventInfo = parsedOrderPlaylistTracks.event.args

  let emittedPlaylistId = eventInfo._playlistId.toNumber()
  assert.equal(
    emittedPlaylistId,
    playlistId,
    'Expected update event playlistId array to match input')

  let emittedTrackIds = eventInfo._orderedTrackIds

  assert.equal(
    emittedTrackIds.length,
    trackIds.length,
    'Expected ordered event trackId array to match input')

  for (let i = 0; i < emittedTrackIds.length; i++) {
    let emittedTrackId = emittedTrackIds[i].toNumber()
    assert.equal(emittedTrackId, trackIds[i], 'Expected ordered event trackId to match input')
  }

  return parsedOrderPlaylistTracks
}

export const updatePlaylistPrivacyAndValidate = async (playlistFactory, walletAddress, playlistId, updatedPlaylistPrivacy) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getUpdatePlaylistPrivacyRequestData(
    chainId,
    playlistFactory.address,
    playlistId,
    updatedPlaylistPrivacy,
    nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.updatePlaylistPrivacy(
    playlistId,
    updatedPlaylistPrivacy,
    nonce,
    signature)

  let parsedUpdatePlaylistPrivacy = parseTx(tx)
  let eventInfo = parsedUpdatePlaylistPrivacy.event.args
  let emittedPlaylistId = eventInfo._playlistId.toNumber()
  assert.equal(
    emittedPlaylistId,
    playlistId,
    'Expected update event playlistId array to match input')

  let emittedEventPrivacy = eventInfo._updatedIsPrivate

  assert.equal(
    emittedEventPrivacy,
    updatedPlaylistPrivacy,
    'Expected emitted playlist privacy to equal input')

  return parsedUpdatePlaylistPrivacy
}

export const updatePlaylistNameAndValidate = async (playlistFactory, walletAddress, playlistId, updatedPlaylistName) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getUpdatePlaylistNameRequestData(
    chainId,
    playlistFactory.address,
    playlistId,
    updatedPlaylistName,
    nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.updatePlaylistName(
    playlistId,
    updatedPlaylistName,
    nonce,
    signature)
  let parsedUpdatePlaylistName = parseTx(tx)
  let eventInfo = parsedUpdatePlaylistName.event.args
  let emittedPlaylistId = eventInfo._playlistId.toNumber()
  assert.equal(
    emittedPlaylistId,
    playlistId,
    'Expected update event playlistId array to match input')
  let emittedEventPlaylistName = eventInfo._updatedPlaylistName
  assert.equal(
    updatedPlaylistName,
    emittedEventPlaylistName,
    'Expected emitted playlist name to equal input')
}

export const updatePlaylistCoverPhotoAndValidate = async (playlistFactory, walletAddress, playlistId, updatedPlaylistImageMultihashDigest) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getUpdatePlaylistCoverPhotoRequestData(
    chainId,
    playlistFactory.address,
    playlistId,
    updatedPlaylistImageMultihashDigest,
    nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.updatePlaylistCoverPhoto(
    playlistId,
    updatedPlaylistImageMultihashDigest,
    nonce,
    signature)

  let parsedUpdatePlaylistCoverPhoto = parseTx(tx)
  let eventInfo = parsedUpdatePlaylistCoverPhoto.event.args
  let emittedImageMultihash = eventInfo._playlistImageMultihashDigest
  assert.equal(
    emittedImageMultihash,
    updatedPlaylistImageMultihashDigest,
    'Expect emitted image multihash to equal input')
}

export const updatePlaylistUPCAndValidate = async (playlistFactory, walletAddress, playlistId, updatedPlaylistUPC) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getUpdatePlaylistUPCRequestData(
    chainId,
    playlistFactory.address,
    playlistId,
    updatedPlaylistUPC,
    nonce)
  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.updatePlaylistUPC(
    playlistId,
    updatedPlaylistUPC,
    nonce,
    signature)

  let parseUpdatePlaylistUPC = parseTx(tx)
  let emittedPlaylistUPC = (parseUpdatePlaylistUPC.event.args._playlistUPC)
  let paddedInputUPC = web3New.utils.padRight(updatedPlaylistUPC, 64)
  assert.equal(
    emittedPlaylistUPC,
    paddedInputUPC,
    'Expect emitted UPC to equal input')
}

export const updatePlaylistDescriptionAndValidate = async (playlistFactory, walletAddress, playlistId, updatedPlaylistDescription) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getUpdatePlaylistDescriptionRequestData(
    chainId,
    playlistFactory.address,
    playlistId,
    updatedPlaylistDescription,
    nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.updatePlaylistDescription(
    playlistId,
    updatedPlaylistDescription,
    nonce,
    signature)

  let parsedUpdatePlaylistDescription = parseTx(tx)
  let eventInfo = parsedUpdatePlaylistDescription.event.args
  let emittedPlaylistDescription = eventInfo._playlistDescription
  assert.equal(
    emittedPlaylistDescription,
    updatedPlaylistDescription,
    'Expect emitted playlist description to equal input')
}

export const addPlaylistTrack = async (playlistFactory, walletAddress, playlistId, addedTrackId) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getAddPlaylistTrackRequestData(
    chainId,
    playlistFactory.address,
    playlistId,
    addedTrackId,
    nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)

  let tx = await playlistFactory.addPlaylistTrack(
    playlistId,
    addedTrackId,
    nonce,
    signature)

  // TODO:  asserts
  let parsedAddPlaylistTrack = parseTx(tx)
  let eventInfo = parsedAddPlaylistTrack.event.args
  let emittedPlaylistId = eventInfo._playlistId.toNumber()
  assert.equal(
    emittedPlaylistId,
    playlistId,
    'Expected update event playlistId to match input')

  let emittedAddedTrackId = eventInfo._addedTrackId.toNumber()
  assert.equal(
    emittedAddedTrackId,
    addedTrackId,
    'Expected update event added track id to match input')

  // Validate storage playlist value
  let isTrackInPlaylist = await playlistFactory.isTrackInPlaylist.call(playlistId, addedTrackId)
  assert.isTrue(isTrackInPlaylist, 'Expected newly added tracks to be in playlist')

  return parsedAddPlaylistTrack
}

export const deletePlaylistTrack = async (playlistFactory, walletAddress, playlistId, deletedTrackId, deletedTimestamp) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(playlistFactory)
  const signatureData = signatureSchemas.generators.getDeletePlaylistTrackRequestData(
    chainId,
    playlistFactory.address,
    playlistId,
    deletedTrackId,
    deletedTimestamp,
    nonce)

  const signature = await eth_signTypedData(walletAddress, signatureData)
  let tx = await playlistFactory.deletePlaylistTrack(
    playlistId,
    deletedTrackId,
    deletedTimestamp,
    nonce,
    signature)

  let parsedDeletePlaylistTrack = parseTx(tx)
  let eventInfo = parsedDeletePlaylistTrack.event.args
  let emittedPlaylistId = eventInfo._playlistId.toNumber()
  assert.equal(
    emittedPlaylistId,
    playlistId,
    'Expected update event playlistId to match input')
  let emittedDeletedTrackId = eventInfo._deletedTrackId.toNumber()
  assert.equal(
    emittedDeletedTrackId,
    deletedTrackId,
    'Expected update event added track id to match input')

  // Validate storage playlist track value
  let isTrackInPlaylist = await playlistFactory.isTrackInPlaylist.call(playlistId, deletedTrackId)
  assert.isFalse(isTrackInPlaylist, 'Expected newly deleted tracks to not be in playlist')
  return parsedDeletePlaylistTrack
}

export const updateTrack = async (trackFactory, walletAddress, trackId, trackOwnerId, multihashDigest, multihashHashFn, multihashSize) => {
  // generate update track request
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(trackFactory)
  //in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getUpdateTrackRequestData(
    chainId,
    trackFactory.address,
    trackId,
    trackOwnerId,
    multihashDigest,
    multihashHashFn,
    multihashSize,
    nonce
  )
  const sig = await eth_signTypedData(walletAddress, signatureData)

  return await trackFactory.updateTrack(
    trackId,
    trackOwnerId,
    multihashDigest,
    multihashHashFn,
    multihashSize,
    nonce,
    sig
  )
}

/** Promisifies the signTypedData function */
export const eth_signTypedData = (userAddress, signatureData) => {
  return new Promise(function(resolve, reject) {
    // fix per https://github.com/ethereum/web3.js/issues/1119
    // truffle uses an outdated version of web3
    web3New.providers.HttpProvider.prototype.sendAsync = web3New.providers.HttpProvider.prototype.send
    web3New.currentProvider.sendAsync({
      method: 'eth_signTypedData',
      params: [userAddress, signatureData],
      from: userAddress
    }, function (err, result) {
      if (err) {
        reject(err)
      } else if (result.error) {
        reject(result.error)
      } else {
        resolve(result.result)
      }
    })
  })
}


/** Get network id for contract instance - very truffle-specific and may not work in other
 * instances
 */
export const getNetworkIdForContractInstance = (contract) => {
  return contract.constructor.network_id
}

/** Adds trackRepost to blockchain using function input fields, validates emitted event
  * @returns {object} with event data
  */
export const addTrackRepostAndValidate = async (socialFeatureFactory, userAddress, userId, trackId) => {
  // generate new add track repost request
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(socialFeatureFactory)  // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getAddTrackRepostRequestData(chainId, socialFeatureFactory.address, userId, trackId, nonce)
  const sig = await eth_signTypedData(userAddress, signatureData)

  // add new trackRepost to chain
  let tx = await socialFeatureFactory.addTrackRepost(userId, trackId, nonce, sig)

  // validate event output = transaction input
  let event = parseAddTrackRepostTx(tx)
  validateAddTrackRepostEvent(event, 'TrackRepostAdded', userId, trackId)

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
  const chainId = getNetworkIdForContractInstance(socialFeatureFactory)  // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getDeleteTrackRepostRequestData(chainId, socialFeatureFactory.address, userId, trackId, nonce)
  const sig = await eth_signTypedData(userAddress, signatureData)

  // delete trackRepost from chain
  let tx = await socialFeatureFactory.deleteTrackRepost(userId, trackId, nonce, sig)

  // validate event output = transaction input
  let event = parseDeleteTrackRepostTx(tx)
  validateDeleteTrackRepostEvent(event, 'TrackRepostDeleted', userId, trackId)

  // validate storage
  let isTrackReposted = await socialFeatureFactory.userRepostedTrack.call(userId, trackId)
  assert.isFalse(isTrackReposted, 'Expect storage to confirm added track repost')

  return {
    event: event
  }
}

/** Adds playlistRepost to blockchain using function input fields, validates emitted event
  * @returns {object} with event data
  */
export const addPlaylistRepostAndValidate = async (socialFeatureFactory, userAddress, userId, playlistId) => {
  // generate new add playlist repost request
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(socialFeatureFactory)  // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getAddPlaylistRepostRequestData(chainId, socialFeatureFactory.address, userId, playlistId, nonce)
  const sig = await eth_signTypedData(userAddress, signatureData)

  // add new playlistRepost to chain
  let tx = await socialFeatureFactory.addPlaylistRepost(userId, playlistId, nonce, sig)

  // validate event output = transaction input
  let event = parseAddPlaylistRepostTx(tx)
  validateAddPlaylistRepostEvent(event, 'PlaylistRepostAdded', userId, playlistId)

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
  const chainId = getNetworkIdForContractInstance(socialFeatureFactory)  // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getDeletePlaylistRepostRequestData(chainId, socialFeatureFactory.address, userId, playlistId, nonce)
  const sig = await eth_signTypedData(userAddress, signatureData)

  // delete playlistRepost from chain
  let tx = await socialFeatureFactory.deletePlaylistRepost(userId, playlistId, nonce, sig)

  // validate event output = transaction input
  let event = parseDeletePlaylistRepostTx(tx)
  validateDeletePlaylistRepostEvent(event, 'PlaylistRepostDeleted', userId, playlistId)

  // validate storage
  let isPlaylistReposted = await socialFeatureFactory.userRepostedPlaylist.call(userId, playlistId)
  assert.isFalse(isPlaylistReposted, 'Expect storage to confirm deleted playlist repost')

  return {
    event: event
  }
}

/** Adds UserFollow to blockchain using function input fields, validates emitted event
  * @returns {object} with event data
  */
export const addUserFollowAndValidate = async (socialFeatureFactory, userWallet, followerUserId, followeeUserId) => {
  // Validate args - TODO

  // generate user follow request
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(socialFeatureFactory)  // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getUserFollowRequestData(chainId, socialFeatureFactory.address, followerUserId, followeeUserId, nonce)
  const sig = await eth_signTypedData(userWallet, signatureData)

  // add new UserFollow to chain
  let tx = await socialFeatureFactory.addUserFollow(followerUserId, followeeUserId, nonce, sig)

  // validate event output = transaction input
  let event = parseAddUserFollowTx(tx)
  validateAddUserFollowEvent(event, 'UserFollowAdded', followerUserId, followeeUserId)

  return {
    event: event
  }
}

/** Deletes UserFollow from blockchain using function input fields, validates emitted event
  * @returns {object} with event data
  */
export const deleteUserFollowAndValidate = async (socialFeatureFactory, userWallet, followerUserId, followeeUserId) => {
  // Validate args - TODO

  // generate delete user follow request
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(socialFeatureFactory)  // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getDeleteUserFollowRequestData(chainId, socialFeatureFactory.address, followerUserId, followeeUserId, nonce)
  const sig = await eth_signTypedData(userWallet, signatureData)

  // delete UserFollow from chain
  let tx = await socialFeatureFactory.deleteUserFollow(followerUserId, followeeUserId, nonce, sig)

  // validate event output = transaction input
  let event = parseDeleteUserFollowTx(tx)
  validateDeleteUserFollowEvent(event, 'UserFollowDeleted', followerUserId, followeeUserId)

  return {
    event: event
  }
}

export const addPlaylistSaveAndValidate = async (userLibraryFactory, userAddress, userId, playlistId) => {
  const nonce = signatureSchemas.getNonce()
  // in testing use the network id as chain ID because chain ID is unavailable
  const chainId = getNetworkIdForContractInstance(userLibraryFactory)
  const signatureData = signatureSchemas.generators.getPlaylistSaveRequestData(
    chainId,
    userLibraryFactory.address,
    userId,
    playlistId,
    nonce)
  const sig = await eth_signTypedData(userAddress, signatureData)
  let tx = await userLibraryFactory.addPlaylistSave(
    userId,
    playlistId,
    nonce,
    sig)

  let parsedPlaylistSave = parseTx(tx)
  let eventInfo = parsedPlaylistSave.event.args
  let emittedUserId = eventInfo._userId
  let emittedPlaylistId = eventInfo._playlistId
  assert.equal(userId, emittedUserId, 'Expected emitted user id to match input')
  assert.equal(playlistId, emittedPlaylistId, 'Expected emitted playlist id to match input')
}

export const deletePlaylistSaveAndValidate = async (userLibraryFactory, userAddress, userId, playlistId) => {
  const nonce = signatureSchemas.getNonce()
  // in testing use the network id as chain ID because chain ID is unavailable
  const chainId = getNetworkIdForContractInstance(userLibraryFactory)
  const signatureData = signatureSchemas.generators.getDeletePlaylistSaveRequestData(
    chainId,
    userLibraryFactory.address,
    userId,
    playlistId,
    nonce)
  const sig = await eth_signTypedData(userAddress, signatureData)
  let tx = await userLibraryFactory.deletePlaylistSave(
    userId,
    playlistId,
    nonce,
    sig)

  let parsedPlaylistSave = parseTx(tx)
  let eventInfo = parsedPlaylistSave.event.args
  let emittedUserId = eventInfo._userId
  let emittedPlaylistId = eventInfo._playlistId
  assert.equal(userId, emittedUserId, 'Expected emitted user id to match input')
  assert.equal(playlistId, emittedPlaylistId, 'Expected emitted playlist id to match input')
}

export const addTrackSaveAndValidate = async (userLibraryFactory, userAddress, userId, trackId) => {
  const nonce = signatureSchemas.getNonce()
  // in testing use the network id as chain ID because chain ID is unavailable
  const chainId = getNetworkIdForContractInstance(userLibraryFactory)
  const signatureData = signatureSchemas.generators.getTrackSaveRequestData(
    chainId,
    userLibraryFactory.address,
    userId,
    trackId,
    nonce)
  const sig = await eth_signTypedData(userAddress, signatureData)

  let tx = await userLibraryFactory.addTrackSave(
    userId,
    trackId,
    nonce,
    sig)

  let parsedTrackSave = parseTx(tx)
  let eventInfo = parsedTrackSave.event.args
  let emittedUserId = eventInfo._userId
  let emittedTrackId = eventInfo._trackId
  assert.equal(userId, emittedUserId, 'Expected emitted user id to match input')
  assert.equal(trackId, emittedTrackId, 'Expected emitted track id to match input')
}

export const deleteTrackSaveAndValidate = async (userLibraryFactory, userAddress, userId, trackId) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(userLibraryFactory)
  const signatureData = signatureSchemas.generators.getDeleteTrackSaveRequestData(
    chainId,
    userLibraryFactory.address,
    userId,
    trackId,
    nonce)
  const sig = await eth_signTypedData(userAddress, signatureData)

  let tx = await userLibraryFactory.deleteTrackSave(
    userId,
    trackId,
    nonce,
    sig)

  let parsedDeleteTrackSave = parseTx(tx)
  let eventInfo = parsedDeleteTrackSave.event.args
  let emittedUserId = eventInfo._userId
  let emittedTrackId = eventInfo._trackId
  assert.equal(userId, emittedUserId, 'Expected emitted user id to match input')
  assert.equal(trackId, emittedTrackId, 'Expected emitted track id to match input')
}

/** Validate that event output matches inputs */
export const validateDiscprovRegisterEvent = (tx, id, wallet, endpoint) => {
  let event = parseDiscprovRegisterTx(tx)

  // validate all event details
  assert.equal(event.eventName, 'NewDiscoveryProvider', 'Expected same event name')
  assert.equal(event.discprovId, id, 'Expected same discprov id')
  assert.equal(event.discprovWallet, wallet, 'Expected same discprov wallet address')
  assert.equal(event.discprovEndpoint, endpoint, 'Expected same discprov endpoint')

  return event
}

/** Validate that discprov fields matches inputs */
export const validateRegisteredDiscprov = (discprov, wallet, endpoint) => {
  assert.equal(discprov.wallet, wallet, 'Expected same discprov wallet address')
  assert.equal(discprov.endpoint, endpoint, 'Expected same discprov endpoint')
}

/** Remove contract from registry and confirm contract instance is dead */
export const unregisterContractAndValidate = async (registry, contractRegistryKey, contractInstanceAddress) => {
  await registry.removeContract(contractRegistryKey)
  await assertNoContractExists(contractInstanceAddress)
}

/** Customizable console.log wrapper */
export const deepLog = (msg, val, depth = null, showHidden = false) => {
  console.log('\n-- ' + msg + ' --\n', util.inspect(val, { colors: true, depth: depth, showHidden: showHidden }), '\n')
}

/** Returns decoded multihash with digest, hash function, and digest size
 *  IPFS Uses alphanumeric base58 encoded 46byte hash which cannot be stored by default in solidity bytes32 field
 *  https://github.com/multiformats/multihash + https://github.com/saurfang/ipfs-multihash-on-solidity
 *  @param {string} - encoded multihash - 46byte long base58-encoded string
 *  @returns {object} with:
 *    digest - 32byte long hex string
 *    hashFn - 1byte int indicating hash function used
 *    size - 1byte int indicating size of digest
 */
export const decodeMultihash = (multihash) => {
  let base16multihash = bs58.decode(multihash)
  return {
    digest: `0x${base16multihash.slice(2).toString('hex')}`,
    hashFn: base16multihash[0],
    size: base16multihash[1]
  }
}

/** Returns encoded multihash given component object
 *  @param {string, string, string} - digest, hash function, size
 *  @returns {string} - base58-encoded 46byte string
 */
export const encodeMultihash = (digest, hashFn, size) => {
  let hashBytes = Buffer.from(digest.slice(2), 'hex')
  let multiHashBytes = Buffer.from(new ArrayBuffer(2 + hashBytes.length))
  multiHashBytes[0] = hashFn
  multiHashBytes[1] = size
  multiHashBytes.set(hashBytes, 2)
  return bs58.encode(multiHashBytes)
}

/** Asserts that no contract exists at the given address.
 *  @param {string} - address to check
 */
export const assertNoContractExists = async (contractAddress) => {
  const contractCode = await web3New.eth.getCode(contractAddress)
  assert(
    contractCode === '0x0' || contractCode === '0x', // geth returns 0 as '0x', ganache returns it as '0'. This supports both.
    'Expected no contract at given address')
}
