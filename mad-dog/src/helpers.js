const moment = require('moment')
const { _ } = require('lodash')
const fs = require('fs-extra')
const path = require('path')
const fetch = require('node-fetch')
const util = require('util')
const streamPipeline = util.promisify(require('stream').pipeline)
const { RandomPicture } = require('random-picture')

const TEMP_IMG_STORAGE_PATH = '/home/ubuntu/audius/audius-protocol/mad-dog/local-storage/tmp-imgs'

const { logger } = require('./logger.js')

const ServiceCommands = require('@audius/service-commands')
const {
  addUser,
  uploadProfileImagesAndAddUser,
  upgradeToCreator,
  getLibsUserInfo,
  getClockValuesFromReplicaSet
} = ServiceCommands
const ContainerLogs = require('@audius/service-commands/src/ContainerLogs')

const TRACK_URLS = [
  'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Gipsy.mp3',
  'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/First+Rain.mp3',
  'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Miracle.mp3',
  'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Ice+Cream.mp3',
  'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Street+Tables+Cafe.mp3',
  'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Cowboy+Tears.mp3',
  'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Happy.mp3'
]

const USER_PIC_PATH = path.resolve('assets/images/profile-pic.jpg')
const MAX_SYNC_TIMEOUT = 300000

/**
 * Adds and upgrades `userCount` users.
 * @param {*} userCount
 * @param {function} executeAll
 * @returns a map of walletIndex => userId
 */
const addAndUpgradeUsers = async (
  userCount,
  executeAll,
  executeOne
) => {
  const addedUserIds = []
  const existingUserIds = []
  const walletIndexToUserIdMap = {}

  await _addUsers({ userCount, executeAll, executeOne, existingUserIds, addedUserIds, walletIndexToUserIdMap })
  await upgradeUsersToCreators(executeAll, executeOne)

  // Map out walletId index => userId
  return walletIndexToUserIdMap
}

const addUsers = async (
  userCount,
  executeAll,
  executeOne
) => {
  const addedUserIds = []
  const existingUserIds = []
  const walletIndexToUserIdMap = {}

  await _addUsers({ userCount, executeAll, executeOne, existingUserIds, addedUserIds, walletIndexToUserIdMap })

  // Map out walletId index => userId
  return walletIndexToUserIdMap
}

const addUsersWithoutProfileImageOnSignUp = async (
  userCount,
  executeAll,
  executeOne
) => {
  const addedUserIds = []
  const existingUserIds = []
  const walletIndexToUserIdMap = {}

  await _addUsers({ userCount, executeAll, executeOne, existingUserIds, addedUserIds, walletIndexToUserIdMap, uploadProfilePic: false })

  // Map out walletId index => userId
  return walletIndexToUserIdMap
}

/**
 * Helper function to add a user. If the wallet index is already used to create a user, add that userId to
 * the walletIndexToUserMap.
 * @param {*} userCount
 * @param {*} executeAll
 * @param {*} executeOne
 * @param {int[]} existingUserIds
 * @param {int[]} addedUserIds
 * @param {Object} walletIndexToUserIdMap
 * @param {boolean} uploadProfilePic flag to upload profile pic on sign up or not
 */
async function _addUsers ({ userCount, executeAll, executeOne, existingUserIds, addedUserIds, walletIndexToUserIdMap, uploadProfilePic = true }) {
  await logOps('Add users', async () => {
    const users = genRandomUsers(userCount)

    await executeAll(async (libs, i) => {
      try {
        // If user already exists, do not recreate user and use existing user
        const existingUser = await getUser({ executeOne, walletIndex: i })
        let userId

        if (existingUser) {
          logger.info(`Found existing user=${existingUser.user_id}`)
          existingUserIds.push(existingUser.user_id)
          userId = existingUser.user_id

        } else {
          const createNewUser = async () => {
            const start = Date.now()
            logger.info(`Creating new user for index ${i}...`)

            const userMetadata = users[i]
            let newUserId

            if (uploadProfilePic) {
              let picPath
              try {
                // get random image from web
                const randomImageFilePath = await getRandomImageFilePath(TEMP_IMG_STORAGE_PATH)
                picPath = randomImageFilePath
              } catch (e) {
                console.log(`[_addUsers] Error fetching random image: ${e.message}`)
                picPath = USER_PIC_PATH
              }
              newUserId = await uploadProfileImagesAndAddUser(libs, userMetadata, picPath)

            } else {
              newUserId = await addUser(libs, userMetadata)
            }

            logger.info(`Created new user=${newUserId} in ${Date.now() - start}ms`)

            addedUserIds.push(newUserId)
            userId = newUserId
          }

          const withTimeout = async (requestPromise, timeoutMs, timeoutMsg) => {
            const timeoutPromise = new Promise((resolve, reject) => {
              setTimeout(() => reject(new Error(timeoutMsg)), timeoutMs)
            })
            return Promise.race([requestPromise, timeoutPromise])
          }

          const createNewUserTimeoutMs = 300000 // 300sec = 5 min
          await withTimeout(createNewUser(), createNewUserTimeoutMs, `Failed to create new user for index ${i} in ${createNewUserTimeoutMs}`)
        }

        await executeOne(i, libs => libs.waitForLatestBlock())

        // add to wallet index to userId mapping
        walletIndexToUserIdMap[i] = userId

        // print userIds that exist and were added
        if (addedUserIds.length) logger.info(`Added users, userIds=${addedUserIds}`)
        if (existingUserIds.length) logger.info(`Existing users, userIds=${existingUserIds}`)
      } catch (e) {
        logger.error('GOT ERR CREATING USER')
        console.error(e) // this prints out the stack trace
        throw e
      }
    })
  })
}

/**
 * Helper function to upgrade a user at a wallet index to a creator if not already.
 * @param {*} executeAll
 * @param {*} executeOne
 * @param {int} numCreatorNodes
 */
async function upgradeUsersToCreators (executeAll, executeOne) {
  await logOps('Upgrade to creator', async () => {
    try {
      await executeAll(async (libs, i) => {
        // Check if existing users are already creators. If so, don't upgrade
        const existingUser = await getUser({ executeOne, walletIndex: i })
        if (!existingUser) throw new Error(`Cannot upgrade nonexistant user with wallet=${libs.walletAddress}`)
        if (existingUser.tracks > 0) {
          logger.info(`User ${existingUser.user_id} is already a creator. Skipping upgrade...`)
          return
        }
        // Upgrade to creator with replica set (empty string as users will be assigned an rset on signup)
        await executeOne(i, l => upgradeToCreator(l, existingUser.creator_node_endpoint))
        logger.info(`Finished upgrading creator for user=${existingUser.user_id}`)

        // Wait until upgrade txn has been indexed
        await executeOne(i, libs => libs.waitForLatestBlock())
      })
    } catch (e) {
      logger.error('GOT ERR UPGRADING USER TO CREATOR')
      console.error(e)
      throw e
    }
  })
}

/**
 * Wraps some work in log statements.
 * @param {*} name
 * @param {*} work
 */
const logOps = async (name, work) => {
  try {
    logger.info(`Starting: [${name}]...`)
    const res = await work()
    logger.info(`Finished: [${name}].`)
    return res
  } catch (e) {
    logger.error(`Error in [${name}]`)
    console.error(e)
    throw e
  }
}

/**
 * Checks to see if user exists with the wallet address as the walletIndex. Returns the user
 * @param {*} executeOne
 * @param {number} walletIndex index of wallet in config.json
 * @returns the found user
 */
const getUser = async ({ executeOne, walletIndex }) => {
  let user
  try {
    // if a user is already created for walletIndex, use that user for test
    user = await executeOne(walletIndex, libsWrapper => {
      return getLibsUserInfo(libsWrapper)
    })
  } catch (e) {
    if (e.message !== 'No users!') {
      logger.error(`Error with getting user with wallet index ${walletIndex}`)
      console.error(e)
      throw e
    }
  }

  return user
}

/**
 * Generates random users.
 * @param {int} count
 */
const genRandomUsers = count => _.range(count).map(x => getRandomUser())

/**
 * Generates a single random user.
 */
const getRandomUser = () => {
  return {
    name: `name_${r6()}`,
    email: `email_${r6()}@audius.co`,
    password: `pass_${r6()}`,
    handle: `handle_${r6()}`,
    bio: `bio_${r6()}`,
    location: `loc_${r6()}`,
    is_creator: false,
    is_verified: false,
    profile_picture: null,
    profile_picture_sizes: null,
    cover_photo: null,
    cover_photo_sizes: null,
    creator_node_endpoint: ''
  }
}

/**
 * Generates a random track.
 */
const getRandomTrackMetadata = userId => {
  return {
    owner_id: userId,
    cover_art: null,
    cover_art_sizes: null,
    title: `title_${r6()}`,
    length: 0,
    cover_art: null,
    tags: '',
    genre: 'SomeGenre',
    mood: 'Dope',
    credits_splits: '',
    create_date: '',
    release_date: '',
    file_type: '',
    description: `description_${r6()}`,
    license: '',
    isrc: '',
    iswc: '',
    track_segments: []
  }
}

/**
 * Randomly selects url from TRACK_URLS, downloads track file from url to temp local storage, & returns its file path
 *
 * @notice this depends on TRACK_URLS pointing to valid urls in S3. Ideally we'd be able to
 *    randomly select any file from the parent folder.
 */
const getRandomTrackFilePath = async localDirPath => {
  if (!fs.existsSync(localDirPath)) {
    fs.mkdirSync(localDirPath)
  }

  const trackURL = _.sample(TRACK_URLS)
  const targetFilePath = path.resolve(localDirPath, `${genRandomString(6)}.mp3`)

  const response = await fetch(trackURL)
  if (!response.ok) {
    throw new Error(`unexpected response ${response.statusText}`)
  }

  try {
    await fs.ensureDir(localDirPath)
    await streamPipeline(response.body, fs.createWriteStream(targetFilePath))

    logger.info(`Wrote track to temp local storage at ${targetFilePath}`)
  } catch (e) {
    const errorMsg = `Error with writing track to path ${localDirPath}`
    logger.error(errorMsg)
    console.error(e)
    throw new Error(`${errorMsg}: ${e.message}`)
  }

  // Return full file path
  return targetFilePath
}

const getRandomImageFilePath = async (localDirPath) => {
  if (!fs.existsSync(localDirPath)) {
    fs.mkdirSync(localDirPath)
  }

  const imageURL = (await RandomPicture()).url // always jpg
  const targetFilePath = path.resolve(localDirPath, `${genRandomString(6)}.jpg`)

  const response = await fetch(imageURL)
  if (!response.ok) {
    throw new Error(`unexpected response ${response.statusText}`)
  }

  try {
    await fs.ensureDir(localDirPath)
    await streamPipeline(response.body, fs.createWriteStream(targetFilePath))

    logger.info(`Wrote image to temp local storage at ${targetFilePath}`)
  } catch (e) {
    const errorMsg = `Error with writing image to path ${localDirPath}`
    logger.error(errorMsg)
    console.error(e)
    throw new Error(`${errorMsg}: ${e.message}`)
  }

  // Return full file path
  return targetFilePath
}

/**
 * Genererates a random string of uppercase + lowercase chars, optionally with numbers.
 * @param {*} length
 * @param {*} withNumbers
 */
const genRandomString = (length, withNumbers = false) => {
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'

  const combined = (lower + upper + (withNumbers ? numbers : '')).split('')
  return _.range(length)
    .map(x => _.sample(combined))
    .join('')
}

const r6 = (withNum = false) => genRandomString(6, withNum)

/** Delay execution for n ms */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const ensureReplicaSetSyncIsConsistent = async ({ i, libs, executeOne }) => {
  let primary, secondary1, secondary2, primaryClockValue, secondary1ClockValue, secondary2ClockValue
  const userId = libs.userId

  // Make sure replica set is updated before monitoring sync status
  await executeOne(i, libsWrapper => libsWrapper.updateUserStateManagerToChainData(userId))

  let synced = false
  const startTime = Date.now()
  while (!synced && Date.now() - startTime <= MAX_SYNC_TIMEOUT) {
    try {
      const replicaSetClockValues = await executeOne(i, libsWrapper => {
        return getClockValuesFromReplicaSet(libsWrapper)
      })

      primary = replicaSetClockValues[0].endpoint
      secondary1 = replicaSetClockValues[1].endpoint
      secondary2 = replicaSetClockValues[2].endpoint
      primaryClockValue = replicaSetClockValues[0].clockValue
      secondary1ClockValue = replicaSetClockValues[1].clockValue
      secondary2ClockValue = replicaSetClockValues[2].clockValue

      logger.info(`Monitoring sync for user=${userId} | (Primary) ${primary}:${primaryClockValue} - (Secondaries) ${secondary1}:${secondary1ClockValue} - ${secondary2}:${secondary2ClockValue}`)

      if (secondary1ClockValue === primaryClockValue && secondary2ClockValue === primaryClockValue) {
        synced = true
        logger.info(`Sync completed for user=${userId}!`)
      }
    } catch (e) {
      const errorMsg = `Failed sync monitoring for user=${userId}`
      logger.error(errorMsg)
      console.error(e)
      throw new Error(`${errorMsg}: ${e.message}`)
    }
    if (!synced) { await delay(1000) }
  }

  if (!synced) {
    const errorMsg = `Max sync monitoring timeout reached for user=${userId}`
    logger.error(errorMsg)
    throw new Error(`${errorMsg}`)
  }
}

/**
 * Handy helper function for executing an operation against
 * an array of libs wrappers in parallel.
 */
const makeExecuteAll = libsArray => async operation => {
  let responses
  let timeOfCall
  try {
    timeOfCall = moment()
    responses = await Promise.all(libsArray.map(operation))
  } catch (e) {
    const endTimeOfCall = moment()
    const errorInfo = {
      error: e,
      start: timeOfCall,
      end: endTimeOfCall
    }

    ContainerLogs.append(errorInfo)
    throw e
  }

  return responses
}

const makeExecuteOne = libsArray => async (index, operation) => {
  if (index > libsArray.length) throw new Error(`Cannot execute operation - index ${index} out of bounds`)

  let response
  let timeOfCall
  try {
    timeOfCall = moment()
    response = await operation(libsArray[index])
  } catch (e) {
    const endTimeOfCall = moment()
    const errorInfo = {
      error: e,
      start: timeOfCall,
      end: endTimeOfCall
    }

    ContainerLogs.append(errorInfo)
    throw e
  }

  return response
}

module.exports = {
  addAndUpgradeUsers,
  addUsers,
  addUsersWithoutProfileImageOnSignUp,
  logOps,
  genRandomUsers,
  getRandomUser,
  getRandomTrackMetadata,
  genRandomString,
  getRandomTrackFilePath,
  delay,
  ensureReplicaSetSyncIsConsistent,
  makeExecuteAll,
  makeExecuteOne,
  r6,
  upgradeUsersToCreators
}
