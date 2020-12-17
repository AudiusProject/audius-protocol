const config = require('../../config/config')
const fs = require('fs')

const User = {}

User.addUser = async (libsWrapper, metadata) => {
  const { error, phase, userId } = await libsWrapper.signUp({ metadata })
  if (error) {
    throw new Error(`Adding user error: ${error} in phase: ${phase}`)
  }
  return userId
}

User.uploadProfileImagesAndAddUser = async (libsWrapper, metadata, userPicturePath) => {
  const userPicFile = fs.createReadStream(userPicturePath)
  const resp = await libsWrapper.libsInstance.File.uploadImage(
    userPicFile,
    'true' // square, this weirdly has to be a boolean string
  )
  metadata.profile_picture_sizes = resp.dirCID
  metadata.cover_photo_sizes = resp.dirCID

  return User.addUser(libsWrapper, metadata)
}

User.upgradeToCreator = async (libsWrapper, endpoint) => {
  await libsWrapper.upgradeToCreator({
    endpoint,
    userNode: config.get('user_node')
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

User.getUser = async (libs, userId) => {
  return libs.getUser(userId)
}

User.getUserAccount = async (libs, wallet) => {
  return libs.getUserAccount(wallet)
}

User.getLibsWalletAddress = libs => {
  return libs.getWalletAddress()
}

User.setCurrentUser = async (libs, userAccount) => {
  libs.setCurrentUser(userAccount)
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
