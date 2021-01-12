const { _ } = require('lodash')
const fs = require('fs-extra')
const path = require('path')
const fetch = require('node-fetch')
const util = require('util')
const streamPipeline = util.promisify(require('stream').pipeline)

const { logger } = require('./logger.js')

const ServiceCommands = require('@audius/service-commands')
const {
  addUser,
  uploadProfileImagesAndAddUser,
  updateIsCreatorFlagToTrue,
  getLibsUserInfo,
  getUserAccount,
  getLibsWalletAddress,
  setCurrentUserAndUpdateLibs
} = ServiceCommands

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

/**
 * Adds and upgrades `userCount` users.
 * @param {*} userCount
 * @param {function} executeAll
 * @returns a map of walletIndex => userId
 */
const addAndUpgradeUsers = async (
  userCount,
  numCreatorNodes,
  executeAll,
  executeOne
) => {
  const addedUserIds = []
  const existingUserIds = []
  const walletIndexToUserIdMap = {}

  await _addUsers({ userCount, executeAll, executeOne, existingUserIds, addedUserIds, walletIndexToUserIdMap })
  await _upgradeToCreator(executeAll, executeOne, numCreatorNodes)

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
          logger.info(`Found existing user: ${existingUser.user_id}`)
          existingUserIds.push(existingUser.user_id)
          userId = existingUser.user_id
        } else {
          logger.info('Creating new user...')
          const userMetadata = users[i]
          let newUserId
          if (uploadProfilePic) {
            newUserId = await uploadProfileImagesAndAddUser(libs, userMetadata, USER_PIC_PATH)
          } else {
            newUserId = await addUser(libs, userMetadata)
          }
          logger.info(`Created new user: ${newUserId}`)
          addedUserIds.push(newUserId)
          userId = newUserId

          // Wait 1 indexing cycle to get all proper and expected user metadata, as the starter metadata
          // does not contain all necessary fields (blocknumber, track_blocknumber, ...)
          await waitForIndexing()
          const userWalletAddress = getLibsWalletAddress(libs)
          const userAccount = await getUserAccount(libs, userWalletAddress)
          setCurrentUserAndUpdateLibs(libs, userAccount) // might not need this anymore bc refactored signup flow

          // add to wallet index to userId mapping
          walletIndexToUserIdMap[i] = userId

          // print userIds that exist and were added
          logger.info(`Added users, userIds=${addedUserIds}`)
          logger.info(`Existing users, userIds=${existingUserIds}`)
          await waitForIndexing()
        }
      } catch (e) {
        logger.error('GOT ERR CREATING USER')
        logger.error(e.message)
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
async function _upgradeToCreator (executeAll, executeOne) {
  await logOps('Upgrade to creator', async () => {
    try {
      await executeAll(async (libs, i) => {
        // Check if existing users are already creators. If so, don't upgrade
        const existingUser = await getUser({ executeOne, walletIndex: i })
        if (!existingUser) throw new Error(`Cannot upgrade nonexistant user with walletIndex ${i}`)
        if (existingUser.tracks > 0) {
          logger.info(`User ${existingUser.user_id} is already a creator. Skipping upgrade...`)
          return
        }
        // Upgrade to creator with replica set
        const endpointString = existingUser.creator_node_endpoint
        logger.info(`Upgrading creator wallet index ${i} with ${endpointString} endpoints`)
        await executeOne(i, l => updateIsCreatorFlagToTrue(l, endpointString))
        logger.info(`Finished upgrading creator wallet index ${i}`)
      })
    } catch (e) {
      logger.error('GOT ERR UPGRADING USER TO CREATOR')
      logger.error(e.message)
      throw e
    }
    await waitForIndexing()
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
    logger.error(`Error in [${name}], [${e.message}]`)
    throw e
  }
}

/**
 * Checks to see if user exists at wallet index. Returns the user
 * @param {*} executeOne
 * @param {*} walletIndex
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
      throw new Error(
        `Error with getting user with wallet index ${walletIndex}: ${e.message}`
      )
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
    const error = `Error with writing track to path ${localDirPath}: ${e.message}`
    logger.error(error)
    throw new Error(error)
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

/** Wrapper for custom delay time */
const waitForIndexing = async (waitTime = 5000) => {
  logger.info(`Pausing ${waitTime}ms for discprov indexing...`)
  await delay(waitTime)
}

/**
 * Handy helper function for executing an operation against
 * an array of libs wrappers in parallel.
 */
const makeExecuteAll = libsArray => async operation => {
  return Promise.all(libsArray.map(operation))
}

const makeExecuteOne = libsArray => async (index, operation) => {
  return operation(libsArray[index])
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
  waitForIndexing,
  makeExecuteAll,
  makeExecuteOne
}
