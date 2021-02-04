/* global assert */

import { userMetadata } from '../utils/constants'
import { parseTxWithAssertsAndResp, parseTxWithResp } from '../utils/parser'
import { getUserFromFactory, getNetworkIdForContractInstance } from '../utils/getters'
import { toStr, eth_signTypedData } from '../utils/util'
import { validateObj } from '../utils/validator'
import { web3New } from '../utils/web3New'

const signatureSchemas = require('../../signature_schemas/signatureSchemas')

/** UserReplicaSetManager functions */
export const addOrUpdateCreatorNode = async (userReplicaSetManager, cnodeId, cnodeDelegateOwnerWallet, proposerId, proposerWallet) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(userReplicaSetManager)
  let signatureData = signatureSchemas.generators.getAddOrUpdateCreatorNodeRequestData(
    chainId,
    userReplicaSetManager.address,
    cnodeId,
    cnodeDelegateOwnerWallet,
    proposerId,
    nonce)
  // Sign with proposerWallet
  let sig = await eth_signTypedData(proposerWallet, signatureData)
  let tx = await userReplicaSetManager.addOrUpdateCreatorNode(cnodeId, cnodeDelegateOwnerWallet, proposerId, nonce, sig)
  parseTxWithAssertsAndResp(
    tx,
    'AddOrUpdateCreatorNode',
    { _cnodeSpId: cnodeId, _cnodeDelegateOwnerWallet: cnodeDelegateOwnerWallet, _proposerSpId: proposerId }
  )
  return tx
}

export const updateReplicaSet = async (userReplicaSetManager, userId, primary, secondaries, oldPrimary, oldSecondaries, senderAcct) => {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(userReplicaSetManager)
  let secondariesHash = web3New.utils.soliditySha3(web3New.eth.abi.encodeParameter('uint[]', secondaries.map(x => x.toNumber())))
  let oldSecondariesHash = web3New.utils.soliditySha3(web3New.eth.abi.encodeParameter('uint[]', oldSecondaries.map(x => x.toNumber())))
  let signatureData = signatureSchemas.generators.getUpdateReplicaSetRequestData(
    chainId,
    userReplicaSetManager.address,
    userId,
    primary,
    secondariesHash,
    oldPrimary,
    oldSecondariesHash,
    nonce
  )
  // Sign with senderAcct
  let sig = await eth_signTypedData(senderAcct, signatureData)
  let tx = await userReplicaSetManager.updateReplicaSet(userId, primary, secondaries, oldPrimary, oldSecondaries, nonce, sig)
  parseTxWithAssertsAndResp(tx, 'UpdateReplicaSet', { _userId: userId, _primaryId: primary, _secondaryIds: secondaries })
  return tx
}

/** Adds user to blockchain using function input fields,
  *   validates emitted event and user data on-chain
  * @returns {object} with event and user data
  */
export const addUserAndValidate = async (userFactory, userId, userWallet, multihashDigest, handle, isCreator) => {
  // Validate args - TODO
  assert.isTrue(userFactory !== undefined, 'userFactory arg cannot be undefined')

  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(userFactory) // in testing use the network id as chain ID because chain ID is unavailable
  let signatureData = signatureSchemas.generators.getAddUserRequestData(chainId, userFactory.address, handle, nonce)

  let sig = await eth_signTypedData(userWallet, signatureData)
  let tx = await userFactory.addUser(userWallet, handle, nonce, sig)
  parseTxWithAssertsAndResp(tx, 'AddUser', { _userId: userId })
  signatureData = signatureSchemas.generators.getUpdateUserMultihashRequestData(chainId, userFactory.address, userId, multihashDigest, nonce)

  sig = await eth_signTypedData(userWallet, signatureData)
  let metadataTx = await userFactory.updateMultihash(userId, multihashDigest, nonce, sig)
  parseTxWithAssertsAndResp(metadataTx, 'UpdateMultihash', { _userId: userId, _multihashDigest: multihashDigest })
  signatureData = signatureSchemas.generators.getUpdateUserNameRequestData(chainId, userFactory.address, userId, userMetadata.name, nonce)

  sig = await eth_signTypedData(userWallet, signatureData)
  let nameTx = await userFactory.updateName(userId, userMetadata.name, nonce, sig)
  parseTxWithAssertsAndResp(nameTx, 'UpdateName', { _userId: userId, _name: userMetadata.name })
  signatureData = signatureSchemas.generators.getUpdateUserLocationRequestData(chainId, userFactory.address, userId, userMetadata.location, nonce)

  sig = await eth_signTypedData(userWallet, signatureData)
  let locationTx = await userFactory.updateLocation(userId, userMetadata.location, nonce, sig)
  parseTxWithAssertsAndResp(locationTx, 'UpdateLocation', { _userId: userId, _location: userMetadata.location })
  signatureData = signatureSchemas.generators.getUpdateUserBioRequestData(chainId, userFactory.address, userId, userMetadata.bio, nonce)

  sig = await eth_signTypedData(userWallet, signatureData)
  let bioTx = await userFactory.updateBio(userId, userMetadata.bio, nonce, sig)
  parseTxWithAssertsAndResp(bioTx, 'UpdateBio', { _userId: userId, _bio: userMetadata.bio })
  signatureData = signatureSchemas.generators.getUpdateUserProfilePhotoRequestData(chainId, userFactory.address, userId, userMetadata.profilePhotoDigest, nonce)

  sig = await eth_signTypedData(userWallet, signatureData)
  let profilePhotoTx = await userFactory.updateProfilePhoto(userId, userMetadata.profilePhotoDigest, nonce, sig)
  parseTxWithAssertsAndResp(profilePhotoTx, 'UpdateProfilePhoto', { _userId: userId, _profilePhotoDigest: userMetadata.profilePhotoDigest })
  signatureData = signatureSchemas.generators.getUpdateUserCoverPhotoRequestData(chainId, userFactory.address, userId, userMetadata.coverPhotoDigest, nonce)

  sig = await eth_signTypedData(userWallet, signatureData)
  let coverPhotoTx = await userFactory.updateCoverPhoto(userId, userMetadata.coverPhotoDigest, nonce, sig)
  parseTxWithAssertsAndResp(coverPhotoTx, 'UpdateCoverPhoto', { _userId: userId, _coverPhotoDigest: userMetadata.coverPhotoDigest })
  signatureData = signatureSchemas.generators.getUpdateUserCreatorRequestData(chainId, userFactory.address, userId, isCreator, nonce)

  sig = await eth_signTypedData(userWallet, signatureData)
  let isCreatorTx = await userFactory.updateIsCreator(userId, isCreator, nonce, sig)
  parseTxWithAssertsAndResp(isCreatorTx, 'UpdateIsCreator', { _userId: userId, _isCreator: isCreator })
  const newCnode = 'http://localhost:4387'
  signatureData = signatureSchemas.generators.getUpdateUserCreatorNodeRequestData(chainId, userFactory.address, userId, newCnode, nonce)

  sig = await eth_signTypedData(userWallet, signatureData)
  let creatorNodeEndpointTx = await userFactory.updateCreatorNodeEndpoint(userId, newCnode, nonce, sig)
  parseTxWithAssertsAndResp(creatorNodeEndpointTx, 'UpdateCreatorNodeEndpoint', { _userId: userId, _creatorNodeEndpoint: newCnode })

  // retrieve user from contract
  let user = await getUserFromFactory(userId, userFactory)

  // validate retrieved user fields = transaction input
  validateObj(user, { wallet: userWallet, handle: toStr(handle) })
}

export const updateUserNameAndValidate = async function (userFactory, userId, userWallet) {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(userFactory) // in testing use the network id as chain ID because chain ID is unavailable
  let signatureData = signatureSchemas.generators.getUpdateUserNameRequestData(chainId, userFactory.address, userId, userMetadata.name, nonce)

  let sig = await eth_signTypedData(userWallet, signatureData)
  let nameTx = await userFactory.updateName(userId, userMetadata.name, nonce, sig)

  parseTxWithAssertsAndResp(nameTx, 'UpdateName', { _userId: userId, _name: userMetadata.name })
}

/** @notice this function is only callable from verifier address defined at UserFactory construction */
export const markUserVerifiedAndValidate = async function (userFactory, verifierWallet, userId, verified) {
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(userFactory) // in testing use the network id as chain ID because chain ID is unavailable
  let signatureData = signatureSchemas.generators.getUpdateUserVerifiedRequestData(chainId, userFactory.address, userId, verified, nonce)

  let sig = await eth_signTypedData(verifierWallet, signatureData)
  let verifiedTx = await userFactory.updateIsVerified(userId, verified, nonce, sig)

  return parseTxWithAssertsAndResp(verifiedTx, 'UpdateIsVerified', { _userId: userId, _isVerified: verified })
}

/** Adds UserFollow to blockchain using function input fields, validates emitted event
  * @returns {object} with event data
  */
export const addUserFollowAndValidate = async (socialFeatureFactory, userWallet, followerUserId, followeeUserId) => {
  // Validate args - TODO
  // generate user follow request
  const nonce = signatureSchemas.getNonce()
  const chainId = getNetworkIdForContractInstance(socialFeatureFactory) // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getUserFollowRequestData(chainId, socialFeatureFactory.address, followerUserId, followeeUserId, nonce)

  const sig = await eth_signTypedData(userWallet, signatureData)
  // add new UserFollow to chain
  let tx = await socialFeatureFactory.addUserFollow(followerUserId, followeeUserId, nonce, sig)

  // validate event output = transaction input
  let event = parseTxWithResp(tx, { _followerUserId: true, _followeeUserId: true })
  validateObj(event, { eventName: 'UserFollowAdded', followerUserId, followeeUserId })
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
  const chainId = getNetworkIdForContractInstance(socialFeatureFactory) // in testing use the network id as chain ID because chain ID is unavailable
  const signatureData = signatureSchemas.generators.getDeleteUserFollowRequestData(chainId, socialFeatureFactory.address, followerUserId, followeeUserId, nonce)

  const sig = await eth_signTypedData(userWallet, signatureData)
  // delete UserFollow from chain
  let tx = await socialFeatureFactory.deleteUserFollow(followerUserId, followeeUserId, nonce, sig)

  // validate event output = transaction input
  let event = parseTxWithResp(tx, { _followerUserId: true, _followeeUserId: true })
  validateObj(event, { eventName: 'UserFollowDeleted', followerUserId, followeeUserId })
  return {
    event: event
  }
}
