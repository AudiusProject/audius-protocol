const { _ } = require('lodash')
const fs = require('fs-extra')
const path = require('path')
const fetch = require('node-fetch')
const assert = require('assert')
const util = require('util')
const streamPipeline = util.promisify(require('stream').pipeline)

const AudiusLibs = require('@audius/libs')
const CreatorNode = require('@audius/libs/src/services/creatorNode')

const ethContractsConfig = require('../../libs/eth-contracts/config.json')
const dataContractsConfig = require('../../libs/data-contracts/config.json')
const ETH_PROVIDER_ENDPOINT = 'http://localhost:8546'
const DISCOVERY_NODE_ENDPOINT = 'http://audius-disc-prov_web-server_1:5000'
const DATA_CONTRACTS_PROVIDER_ENDPOINT = 'http://localhost:8545'
const USER_METADATA_ENDPOINT = 'http://cn-um_creator-node_1:4099'
const IDENTITY_SERVICE_ENDPOINT = 'http://localhost:7000'
const ETH_REGISTRY_ADDRESS = ethContractsConfig.registryAddress
const ETH_TOKEN_ADDRESS = ethContractsConfig.audiusTokenAddress
const ETH_OWNER_WALLET = ethContractsConfig.ownerWallet
const DATA_CONTRACTS_REGISTRY_ADDRESS = dataContractsConfig.registryAddress
const TRACK_URLS = [
  'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Gipsy.mp3',
  'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/First+Rain.mp3',
  'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Miracle.mp3',
  'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Ice+Cream.mp3',
  'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Street+Tables+Cafe.mp3',
  'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Cowboy+Tears.mp3',
  'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Happy.mp3'
]

const explicitPrimary = 'http://cn1_creator-node_1:4000'
let userMetadata = {}
let trackMetadata = {}
let trackPath = ''

let AudiusLibsInstance

// =~*=~*=~*=~*=~*=~*=~*=~*=~*=~* START UTIL =~*=~*=~*=~*=~*=~*=~*=~*=~*=~*

/**
 * Waits input ms
 * @param {number} milliseconds
 * @returns
 */
const wait = async milliseconds => {
  console.log(`Waiting ${milliseconds}ms...`)
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

/**
 * Genererates a random string of uppercase + lowercase chars, optionally with numbers.
 * @param {number} length
 * @param {boolean} withNumbers
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

    console.info(`Wrote track to temp local storage at ${targetFilePath}`)
  } catch (e) {
    const errorMsg = `Error with writing track to path ${localDirPath}`
    console.error(errorMsg, e)
    throw new Error(`${errorMsg}: ${e.message}`)
  }

  // Return full file path
  return targetFilePath
}

// =~*=~*=~*=~*=~*=~*=~*=~*=~*=~* END UTIL =~*=~*=~*=~*=~*=~*=~*=~*=~*=~*
const configureAndInitLibs = async () => {
  const audiusLibsConfig = {
    ethWeb3Config: AudiusLibs.configEthWeb3(
      ETH_TOKEN_ADDRESS,
      ETH_REGISTRY_ADDRESS,
      ETH_PROVIDER_ENDPOINT,
      ETH_OWNER_WALLET
    ),
    web3Config: AudiusLibs.configInternalWeb3(
      DATA_CONTRACTS_REGISTRY_ADDRESS,
      DATA_CONTRACTS_PROVIDER_ENDPOINT
    ),
    creatorNodeConfig: AudiusLibs.configCreatorNode(USER_METADATA_ENDPOINT),
    discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(new Set([DISCOVERY_NODE_ENDPOINT])),
    identityServiceConfig: AudiusLibs.configIdentityService(IDENTITY_SERVICE_ENDPOINT),
    isServer: true,
    isDebug: true
  }

  const audiusLibs = new AudiusLibs(audiusLibsConfig)

  try {
    await audiusLibs.init()
  } catch (e) {
    console.error('Couldn\'t init libs', e)
    throw e
  }

  // Clears local storage in case there is any pre-existing user state
  audiusLibs.userStateManager.clearUser()

  AudiusLibsInstance = audiusLibs

  return audiusLibs
}

async function createUser () {
  userMetadata = getRandomUser()
  console.log('Creating user with metadata:\n', userMetadata)
  const { email, password, profilePictureFile, coverPhotoFile } = userMetadata
  const signUpResp = await AudiusLibsInstance.Account.signUp(
    email, password, userMetadata/*, profilePictureFile, coverPhotoFile */
  )

  wait(5000) // wait 5 sec indexing

  // Option 1: Modify user state in userStateManager and then call this
  // todo: need to update is_creator flag
  // await AudiusLibsInstance.Account.updateCreatorNodeEndpoint(explicitPrimary)

  // Option 2: c&p updateCreatorNodeEndpoint code and slightly modify it
  console.log(`Updating replica set with primary ${explicitPrimary}...`)
  let user = { ...AudiusLibsInstance.userStateManager.getCurrentUser() }
  await AudiusLibsInstance.creatorNode.setEndpoint(explicitPrimary)
  const newCreatorNodeEndpoint = CreatorNode.buildEndpoint(
    explicitPrimary, 
    CreatorNode.getSecondaries(user.creator_node_endpoint)
  )
  user.creator_node_endpoint = newCreatorNodeEndpoint
  await AudiusLibsInstance.User.updateCreator(user.user_id, user)

  wait(30000) // wait 30 sec indexing and sync(?)

  return signUpResp
}

async function uploadTrack (userId) {
  trackMetadata = getRandomTrackMetadata(userId)
  console.log(`Uploading track for ${userId} with metadata:\n`, trackMetadata)
  trackPath = await getRandomTrackFilePath(path.resolve('./'))
  const trackFile = fs.createReadStream(trackPath)
  const { trackId, error } = await AudiusLibsInstance.Track.uploadTrack(
    trackFile,
    null /* image */,
    trackMetadata,
    () => {} /* on progress */
  )

  // Once uploaded, remove the track file
  await fs.remove(path.resolve(trackPath))

  wait(5000) // wait 5s for indexing

  return { trackMetadata, trackId, error }
}

const checkUserState = async ({userId, expectedUserMetadata, trackId, expectedTrackMetadata}) => {
  await wait(5000) // Wait 1 indexing cycle

  let indexedUser
  try {
    indexedUser = (await AudiusLibsInstance.discoveryProvider.getUsers(1, 0, [userId]))[0]
  } catch (e) {
    throw new Error(`userId=${userId} not indexed by Discovery Node.`)
  }

  assert(CreatorNode.getPrimary(indexedUser.creator_node_endpoint) === explicitPrimary)
  assert(expectedUserMetadata.handle === indexedUser.handle)
  assert(expectedUserMetadata.profile_picture_sizes === indexedUser.profile_picture_sizes)
  assert(expectedUserMetadata.cover_photo_sizes === indexedUser.cover_photo_sizes)
  assert(indexedUser.track_count === 1)
  
  let indexedTrack
  try {
    indexedTrack = (await AudiusLibsInstance.discoveryProvider.getTracks(1, 0, [trackId]))[0]
  } catch (e) {
    throw new Error(`userId=${userId}'s track with trackId=${trackId} not indexed by Discovery Node.`)
  }

  assert(expectedTrackMetadata.owner_id === indexedTrack.owner_id)
  assert(expectedTrackMetadata.title === indexedTrack.title)
}

const run = async () => {
  try {
    await configureAndInitLibs()

    const signUpResp = await createUser()
    if (signUpResp.error) {
      throw new Error(`Could not create user. Failed at phase ${signUpResp.phase}\n`, signUpResp.error)
    }
  
    const uploadResp = await uploadTrack(signUpResp.userId)
    if (uploadResp.error) {
      throw new Error('Could not upload track: ', uploadResp.error)
    }
  
    await checkUserState({
      userId: signUpResp.userId,
      expectedUserMetadata: userMetadata,
      expectedTrackMetadata: trackMetadata,
      trackId: uploadResp.trackId
    })

    console.log(`Successfully created user=${signUpResp.userId} and uploaded trackId=${uploadResp.trackId}`)
    process.exit()
  } catch (e) {
    console.error('Could not create and upload track:\n', e)
    process.exit(1)
  }
}

run()


/**
 *  shortterm: env *  var to turn off rehydrate
 * longterm: spin up CN, call rehydrate until ipfs fails, then optimize why fails
 */