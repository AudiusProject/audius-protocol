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
  upgradeToCreator,
  autoSelectCreatorNodes,
  getLibsUserInfo,
  getUserAccount,
  getLibsWalletAddress,
  setCurrentUser
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

const makeCreatorNodeEndpointString = selectedCNodesObj => {
  if (!selectedCNodesObj || !selectedCNodesObj.primary) return ''
  const endpointArr = [
    selectedCNodesObj.primary,
    ...selectedCNodesObj.secondaries
  ]
  return endpointArr.join(',')
}

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

  await logOps('Add users', async () => {
    const users = genRandomUsers(userCount)
    await executeAll(async (libs, i) => {
      // If user already exists, do not recreate user and use existing user
      const existingUser = await getUser({ executeOne, walletIndex: i })
      let userId
      if (existingUser) {
        existingUserIds.push(existingUser.user_id)
        userId = existingUser.user_id
        logger.info(`Found existing user: ${userId}`)
      } else {
        const userMetadata = users[i]
        const newUserId = await addUser(libs, userMetadata, USER_PIC_PATH)
        addedUserIds.push(newUserId)
        userId = newUserId
        logger.info(`Created new user: ${userId}`)

        // Wait 1 indexing cycle to get all proper and expected user metadata, as the starter metadata
        // does not contain all necessary fields (blocknumber, track_blocknumber, ...)
        await waitForIndexing()
        const userWalletAddress = getLibsWalletAddress(libs)
        const userAccount = await getUserAccount(libs, userWalletAddress)
        setCurrentUser(libs, userAccount)
      }

      // add to wallet index to userId mapping
      walletIndexToUserIdMap[i] = userId
    })
    // print userIds that exist and were added
    logger.info(`Added users, userIds=${addedUserIds}`)
    logger.info(`Existing users, userIds=${existingUserIds}`)
    await waitForIndexing()
  })

  await logOps('Upgrade to creator', async () => {
    try {
      await executeAll(async (libs, i) => {
        // Check if existing users are already creators. If so, don't upgrade
        const existingUser = await getUser({ executeOne, walletIndex: i })

        // Autoselect replica set from valid nodes on-chain
        if (!existingUser || !existingUser.creator_node_endpoint) {
          const selectedCNodes = await executeOne(i, libsWrapper =>
            autoSelectCreatorNodes(libsWrapper, numCreatorNodes)
          )
          const { primary, secondaries } = selectedCNodes
          if (!primary || !secondaries) {
            throw new Error(`Could not properly select cnodes. primary=${primary} | secondaries=${secondaries}`)
          }
          const endpointString = makeCreatorNodeEndpointString(selectedCNodes)
          logger.info(`Upgrading creator wallet index ${i} with ${endpointString} endpoints`)
          // Upgrade to creator with replica set
          await executeOne(i, l => upgradeToCreator(l, endpointString))
          logger.info(`Finished upgrading creator wallet index ${i}`)

        } else {
          logger.info(`User ${existingUser.user_id} is already a creator. Skipping upgrade...`)
        }
      })
    } catch (e) {
      logger.error('GOT ERR UPGRADING USER TO CREATOR')
      logger.error(e.message)
      throw e
    }
    await waitForIndexing()
  })
  // Map out walletId index => userId
  return walletIndexToUserIdMap
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
