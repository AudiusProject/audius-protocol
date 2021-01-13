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

// TODO: we shouldn't need to upload the photo prior to signup as this is not
// representative of our actual flow. But since the third party libs gets confused
// uploading a photo via code, have to do this work around.
User.uploadProfileImagesAndAddUser = async (libsWrapper, metadata, userPicturePath) => {
  // Sign user up
  const userId = await User.addUser(libsWrapper, metadata)

  // Wait for disc prov to index user
  await waitForIndexing()
  metadata = await User.getUser(libsWrapper, userId)

  // Upload images to that primary (will inherently sync)
  const userPicFile = fs.createReadStream(userPicturePath)
  const resp = await libsWrapper.libsInstance.File.uploadImage(
    userPicFile,
    'true' // square, this weirdly has to be a boolean string
  )
  metadata.profile_picture_sizes = resp.dirCID
  metadata.cover_photo_sizes = resp.dirCID

  // Update metadata on content node + chain
  libsWrapper.updateAndUploadMetadata({ newMetadata: metadata, userId })

  return userId
}

User.updateIsCreatorFlagToTrue = async (libsWrapper, endpoint) => {
  await libsWrapper.updateIsCreatorFlagToTrue({
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

/** Delay execution for n ms */
function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Wrapper for custom delay time */
async function waitForIndexing (waitTime = 5000) {
  console.info(`Pausing ${waitTime}ms for discprov indexing...`)
  await delay(waitTime)
}

module.exports = User
