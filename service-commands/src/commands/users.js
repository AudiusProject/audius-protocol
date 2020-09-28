const config = require('../../config/config')
const fs = require('fs')

const addUser = async (libsWrapper, metadata, userPicturePath) => {
  const userPicFile = fs.createReadStream(userPicturePath)
  const resp = await libsWrapper.libsInstance.File.uploadImage(
    userPicFile,
    'true' // square, this weirdly has to be a boolean string
  )
  metadata.profile_picture_sizes = resp.dirCID
  metadata.cover_photo_sizes = resp.dirCID

  const { error, phase, userId } = await libsWrapper.signUp({ metadata })

  if (error) {
    throw new Error(`Adding user error: ${error} in phase: ${phase}`)
  }

  return userId
}

const upgradeToCreator = async (libsWrapper, endpoint) => {
  await libsWrapper.upgradeToCreator({
    endpoint,
    userNode: config.get('user_node')
  })
}

const autoSelectCreatorNodes = async (
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

const getUser = async (libs, userId) => {
  return libs.getUser(userId)
}

const getLibsUserInfo = async libs => {
  return libs.getLibsUserInfo()
}

const updateMultihash = async (libsWrapper, userId, multihashDigest) => {
  return libsWrapper.updateMultihash(userId, multihashDigest)
}

const updateProfilePhoto = async (
  libsWrapper,
  userId,
  profilePhotoMultihashDigest
) => {
  return libsWrapper.updateProfilePhoto(userId, profilePhotoMultihashDigest)
}

const updateCoverPhoto = async (
  libsWrapper,
  userId,
  coverPhotoMultihashDigest
) => {
  return libsWrapper.updateCoverPhoto(userId, coverPhotoMultihashDigest)
}

module.exports = {
  addUser,
  upgradeToCreator,
  getUser,
  autoSelectCreatorNodes,
  getLibsUserInfo,
  updateMultihash,
  updateProfilePhoto,
  updateCoverPhoto
}
