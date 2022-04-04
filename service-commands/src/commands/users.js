const fs = require('fs')
const config = require('../../config/config')
const User = {}

User.addUser = async (libsWrapper, metadata) => {
  const { error, phase, userId } = await libsWrapper.signUp({ metadata })
  if (error) {
    throw new Error(`Adding user error: ${error} in phase: ${phase}`)
  }

  return userId
}

/**
 * TODO: The third party libraries we use in libs gets buggy when we try to upload photos
 * programically via libs. We should be uploading a photo via signUp() instead of explicitly
 * uploading photos after signup and reassociating the updated metadata. This is the
 * workaround for this issue.
 */
User.uploadProfileImagesAndAddUser = async (libsWrapper, metadata, userPicturePath) => {
  // Sign user up
  const userId = await User.addUser(libsWrapper, metadata)

  // Wait for discovery node to index user
  await libsWrapper.waitForLatestBlock()

  metadata = await User.getUser(libsWrapper, userId)

  // Upload photo for profile picture
  await User.uploadPhotoAndUpdateMetadata(libsWrapper, {
    metadata,
    userId,
    picturePath: userPicturePath
  })

  return userId
}

/**
 * Upload photo for cover photo and profile picture and update the metadata object
 * @param {Object} param
 * @param {Object} param.metadata original metadata object
 * @param {Object} param.libsWrapper libs wrapper in ServiceCommands
 * @param {number} param.userId
 * @param {string} param.picturePath path of picture to upload
 * @param {boolean} param.[updateCoverPhoto=true] flag to update cover_photo_sizes hash
 * @param {boolean} param.[updateProfilePicture=true] flag to update profile_picture_sizes hash
 */
User.uploadPhotoAndUpdateMetadata = async (libsWrapper, {
  metadata,
  userId,
  picturePath,
  updateCoverPhoto = true,
  updateProfilePicture = true
}) => {
  const newMetadata = { ...metadata }
  const userPicFile = fs.createReadStream(picturePath)

  const resp = await libsWrapper.libsInstance.File.uploadImage(
    userPicFile,
    'true', // square, this weirdly has to be a boolean string
    10000 // timeoutMs
  )
  if (updateProfilePicture) newMetadata.profile_picture_sizes = resp.dirCID
  if (updateCoverPhoto) newMetadata.cover_photo_sizes = resp.dirCID

  // Update metadata on content node + chain
  await libsWrapper.updateAndUploadMetadata({ newMetadata, userId })

  return newMetadata
}

User.updateAndUploadMetadata = async (libsWrapper, { newMetadata, userId }) => {
  await libsWrapper.updateAndUploadMetadata({ newMetadata, userId })
}

User.upgradeToCreator = async (libsWrapper, newEndpoint) => {
  await libsWrapper.upgradeToCreator({
    userNode: config.get('user_node'),
    endpoint: newEndpoint
  })
}

User.autoSelectCreatorNodes = async (
  libsWrapper,
  numberOfNodes,
  whitelist,
  blacklist
) => {
  return libsWrapper.autoSelectCreatorNodes({
    numberOfNodes,
    whitelist,
    blacklist
  })
}

User.setCreatorNodeEndpoint = async (libsWrapper, primary) => {
  return libsWrapper.setCreatorNodeEndpoint(primary)
}

User.updateCreator = async (libsWrapper, userId, metadata) => {
  return libsWrapper.updateCreator(userId, metadata)
}

User.getUser = async (libs, userId) => {
  return libs.getUser(userId)
}

User.getUsers = async (libs, userIds) => {
  return libs.getUsers(userIds)
}

User.getUserAccount = async (libs, wallet) => {
  return libs.getUserAccount(wallet)
}

User.getLibsWalletAddress = libs => {
  return libs.getWalletAddress()
}

User.setCurrentUserAndUpdateLibs = async (libs, userAccount) => {
  libs.setCurrentUserAndUpdateLibs(userAccount)
}

User.setCurrentUser = (libs, user) => {
  libs.setCurrentUser(user)
}

User.getLibsUserInfo = async libs => {
  return libs.getLibsUserInfo()
}

User.updateMultihash = async (libsWrapper, userId, multihashDigest) => {
  return libsWrapper.updateMultihash(userId, multihashDigest)
}

User.updateProfilePhoto = async (
  libsWrapper,
  userId,
  profilePhotoMultihashDigest
) => {
  return libsWrapper.updateProfilePhoto(userId, profilePhotoMultihashDigest)
}

User.updateCoverPhoto = async (
  libsWrapper,
  userId,
  coverPhotoMultihashDigest
) => {
  return libsWrapper.updateCoverPhoto(userId, coverPhotoMultihashDigest)
}

User.getContentNodeEndpoints = (libsWrapper, contentNodeEndpointField) => {
  return libsWrapper.getContentNodeEndpoints(contentNodeEndpointField)
}

User.getClockValuesFromReplicaSet = async libsWrapper => {
  return libsWrapper.getClockValuesFromReplicaSet()
}

module.exports = User
