// Given: A new user is on Audius
// When: they sign up
// Then: the new user should be assigned a replica set
// And then: metadata blob should exist in all 3 cnodes
// And then: disc prov has indexed the user with
// is_creator = false
// creator_node_endpoints = cn1, cn2, cn3 (any order)
// clock values in all 3 cnodes are the same (primary = secondary1, secondary2)

const ServiceCommands = require('@audius/service-commands')
const {
  getClockValuesFromReplicaSet,
  getUser
} = ServiceCommands
const {
  addUsersWithoutProfileImageOnSignUp
} = require('../helpers.js')

const assignReplicaSetAndSyncOnSignUp = async ({
  numUsers,
  numCreatorNodes,
  executeAll,
  executeOne
}) => {
  const walletIndexToUserIdMap = await addUsersWithoutProfileImageOnSignUp(
    numUsers /* 1 */,
    numCreatorNodes /* 3 */,
    executeAll,
    executeOne
  )

  // Should only be 1 value in map bc numUsers = 1
  const [walletIndex, userId] = Object.entries(walletIndexToUserIdMap)[0]

  // Check that is_creator = false, and that a replica set is assigned
  const user = await executeOne(walletIndex, libsWrapper => {
    return getUser(libsWrapper, userId)
  })

  if (user.is_creator) {
    return {
      error: 'New user should not be a creator immediately after sign-up.'
    }
  }

  if (!user.creator_node_endpoint) {
    return {
      error: 'New user should have been assigned a replica set.'
    }
  }

  if (user.cover_photo_sizes || user.profile_picture_sizes) {
    return {
      error: `New user should not have updated cover or profile picture:\nCover photo: ${user.cover_photo_sizes}\nProfile photo: ${user.profile_picture_sizes}`
    }
  }

  // Check that the clock values across replica set are equal
  const resp = await executeOne(walletIndex, libsWrapper => {
    return getClockValuesFromReplicaSet(libsWrapper)
  })

  const primaryClockValue = resp[0].clockValue
  const secondary1ClockValue = resp[1].clockValue
  const secondary2ClockValue = resp[2].clockValue

  if (primaryClockValue !== secondary1ClockValue || primaryClockValue !== secondary2ClockValue) {
    return {
      error: `Clock values are out of sync:\nPrimary: ${primaryClockValue}\nSecondary 1:${secondary1ClockValue}\nSecondary 2:${secondary2ClockValue}`
    }
  }

  // TODO: should check if metadata multihash exists on /ipfs/<metadata_multihash> .. but the backup is to stream from
  // ipfs so this test is not representative of whether the file exists on the cnode
}

module.exports = {
  assignReplicaSetAndSyncOnSignUp
}
