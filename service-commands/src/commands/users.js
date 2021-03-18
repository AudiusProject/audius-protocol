const { exec } = require('child_process')
const moment = require('moment')

const config = require('../../config/config')
const fs = require('fs')
const ContainerLogs = require('../ContainerLogs')

let User = {}

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
    'true' // square, this weirdly has to be a boolean string
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

/**
 * Depending on the method call, return the appropriate endpoint to be later destructured
 * for the container name.
 * @param {Object} libs the wrapper libs instance
 * @param {*} endpoint an optional endpoint override
 * @returns
 */
const determineContainerEndpoint = (libs, { methodName }) => {
  // TODO: make this uh smarter lol
  let endpoints = []
  switch (methodName) {
    case 'addUser':
      endpoints = endpoints.concat(['http://cn1_creator-node_1', 'http://cn2_creator-node_1', 'http://cn2_creator-node_1'])
      endpoints.push('http://audius-identity-service_identity-service_1')
      break
    case 'uploadProfileImagesAndAddUser':
    case 'uploadPhotoAndUpdateMetadata':
    case 'upgradeToCreator':
      if (libs.creatorNode && libs.creatorNode.creatorNodeEndpoint) {
        endpoints.push(libs.creatorNode.creatorNodeEndpoint)
      } else {
        endpoints = endpoints.concat(['http://cn1_creator-node_1', 'http://cn2_creator-node_1', 'http://cn2_creator-node_1'])
      }
      break
    case 'autoSelectCreatorNodes':
      endpoints = ['http://cn1_creator-node_1', 'http://cn2_creator-node_1', 'http://cn2_creator-node_1']
      break
    case 'getUser':
    case 'getUsers':
    case 'getUserAccount':
    case 'getLibsUserInfo':
      endpoints.push('http://audius-disc-prov_web-server_1')
      break
    default:
  }

  return endpoints
}

const generateDockerLogCommand = (endpoint, { start, end }) => {
  return new Promise((resolve, reject) => {
    const containerName = (new URL(endpoint)).hostname
    const proc = exec(
      `docker logs ${containerName} --since ${start.format('YYYY-MM-DDTHH:mm:ss[.]SSSS')} --until ${end.format('YYYY-MM-DDTHH:mm:ss[.]SSSS')}`,
      { maxBuffer: 1024 * 1024 }
    )
    let output = ''
    let stdout = ''
    let stderr = ''

    // Stream the stdout
    proc.stdout.on('data', data => {
      stdout += data
    })

    // Stream the stderr
    proc.stderr.on('data', data => {
      stderr += data
    })

    proc.on('close', exitCode => {
      if (stdout) {
        output += 'stdout:\n' + stdout
      }

      if (stderr) {
        output += '\nstderr:\n' + stderr
      }
      resolve({ containerName, stdout: output })
    })
  })
}

/**
 * Retrieves the docker logs from the domain name stripped of the endpoint and records
 * the log into ContainerLogs.logs
 *
 * @param {string} endpoints endpoint of which the libs action was performed on
 * @param {number} timeOfCall ms of when the call was approximately made
 * @param {Object} metadata metadata giving more info on call context
 * @param {string} metadata.fn the libs function called
 * @param {string} metadata.userId the user on which the libs fn was called on
 * @param {string} metadata.error the in code error the libs fn threw
 */

// todo: need to dedupe....
const recordContainerLogs = async (endpoints, metadata) => {
  try {
    // Get domain name from endpoint -> domain name (if not localhost) = name of container
    if (endpoints.length > 0) {
      // ({ hostname: containerName } = new URL(endpoint))
      const { start, end } = metadata
      const responses = await Promise.all(
        endpoints.map(endpoint => generateDockerLogCommand(endpoint, { start, end }))
      )

      responses.forEach(resp => {
        ContainerLogs.append({
          containerName: resp.containerName || '',
          stdout: resp.stdout || '',
          metadata
        })
      })
    } else {
      console.warn(`recordContainerLogs - No container provided. metadata=${JSON.stringify(metadata)}`)
    }
  } catch (e) {
    if (e.stderr) {
      console.error(`recordContainerLogs - Issue with logging container with endpoint ${endpoints}:`, e.stderr)
    } else {
      console.error('recordContainerLogs - err:', e)
    }
  }
}

const wrapFn = function (methodName, fn) {
  return async function () {
    let timeOfCall
    let resp
    try {
      timeOfCall = moment()// .format('YYYY-MM-DDTHH:mm:ss[.]SSSS')
      resp = await fn.apply(null, arguments)
    } catch (e) {
      const endTimeOfCall = moment()// .format('YYYY-MM-DDTHH:mm:ss[.]SSSS')
      const libs = arguments[0] // should be libs
      const metadata = {
        methodName,
        userId: libs.userId,
        error: e,
        start: timeOfCall,
        end: endTimeOfCall
      }
      const endpoints = determineContainerEndpoint(libs, { methodName })
      await recordContainerLogs(endpoints, metadata)
      throw e
    }

    return resp
  }
}

const UserCopy = { ...User }
Object.keys(User).forEach(method => {
  UserCopy[method] = wrapFn(method, User[method])
})
User = UserCopy
module.exports = User
