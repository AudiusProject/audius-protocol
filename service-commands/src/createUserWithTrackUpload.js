const { _ } = require('lodash')
const fs = require('fs')
const path = require('path')
const AudiusLibs = require('@audius/libs')
const CreatorNode = require('@audius/libs/src/services/creatorNode')
const { Services } = require('@audius/libs/src/api/base')
const { getRandomTrackMetadata, getRandomTrackFilePath } = require('@audius/service-commands/scripts/util')

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
const URSM_BOOTSTRAPPER_PRIVATE_KEY = '' // 9

const explicitPrimary = 'http://cn1_creator-node_1:4000'

let AudiusLibsInstance

/**
 * Waits input ms
 * @param {number} milliseconds
 * @returns
 */
const wait = async milliseconds => {
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

async function createUser () {
  const randomUserMetadata = getRandomUser()
  console.log('User metadata:', randomUserMetadata)
  const { email, password, profilePictureFile, coverPhotoFile } = randomUserMetadata
  const signUpResp = await signUp({
    email,
    password,
    metadata: randomUserMetadata,
    profilePictureFile,
    coverPhotoFile
  })

  return signUpResp
}

async function uploadTrack (userId) {
  const trackPath = await getRandomTrackFilePath(path.resolve('./'))
  const trackFile = fs.createReadStream(trackPath)

  const { trackId, error } = await AudiusLibsInstance.Track.uploadTrack(
    trackFile,
    null /* image */,
    getRandomTrackMetadata(userId),
    () => {} /* on progress */
  )

  return { trackId, error }
}

const assignExplicitPrimaryAndRandomSecondaries = async () => {
  const user = AudiusLibsInstance.userStateManager.getCurrentUser()
  if (!user) { throw new Error('No current user') }

  const newMetadata = { ...user }

  // Randomly select 2 secondaries
  // NOTE: there must be at least 3 CNs up, not including the explicitPrimary for this to work
  const { secondaries } = await AudiusLibsInstance.ServiceProvider.autoSelectCreatorNodes({
    performSyncCheck: false,
    blacklist: new Set([explicitPrimary]) // do not include primary into rset
  })

  // Explicitly set the primary as param input
  const newContentNodeEndpoints = CreatorNode.buildEndpoint(explicitPrimary, secondaries)
  await AudiusLibsInstance.creatorNode.setEndpoint(explicitPrimary)

  // Update metadata of new creator_node_endpoint
  newMetadata.creator_node_endpoint = newContentNodeEndpoints

  // Update metadata in CN and on chain of newly assigned replica set
  await AudiusLibsInstance.User.updateAndUploadMetadata({
    newMetadata,
    userId: newMetadata.user_id
  })
}

const configureAndInitLibs = async () => {
  const audiusLibsConfig = {
    ethWeb3Config: AudiusLibs.configEthWeb3(
      ETH_TOKEN_ADDRESS,
      ETH_REGISTRY_ADDRESS,
      ETH_PROVIDER_ENDPOINT

    ),

    // make dis external
    web3Config: AudiusLibs.configInternalWeb3(
      DATA_CONTRACTS_REGISTRY_ADDRESS,
      DATA_CONTRACTS_PROVIDER_ENDPOINT
      // URSM_BOOTSTRAPPER_PRIVATE_KEY // my key or THE ursm KEY
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
    if (e.message.includes('socket hang up')) {
      await wait(500)
      console.log('socket hung up during libs init.. retrying')
      return configureAndInitLibs()
    } else {
      console.error('Couldn\'t init libs', e)
      throw e
    }
  }

  AudiusLibsInstance = audiusLibs

  return audiusLibs
}

const signUp = async ({
  email,
  password,
  metadata,
  profilePictureFile = null,
  coverPhotoFile = null,
  hasWallet = false,
  host = null
}) => {
  const phases = {
    ADD_REPLICA_SET: 'ADD_REPLICA_SET',
    CREATE_USER_RECORD: 'CREATE_USER_RECORD',
    HEDGEHOG_SIGNUP: 'HEDGEHOG_SIGNUP',
    UPLOAD_PROFILE_IMAGES: 'UPLOAD_PROFILE_IMAGES', // do we want this too?
    ADD_USER: 'ADD_USER'
  }
  let phase = ''
  let userId

  try {
    AudiusLibsInstance.User.REQUIRES(Services.CREATOR_NODE, Services.IDENTITY_SERVICE)

    if (AudiusLibsInstance.web3Manager.web3IsExternal()) {
      phase = phases.CREATE_USER_RECORD
      await AudiusLibsInstance.identityService.createUserRecord(email, AudiusLibsInstance.web3Manager.getWalletAddress())
    } else {
      AudiusLibsInstance.User.REQUIRES(Services.HEDGEHOG)
      // If an owner wallet already exists, don't try to recreate it
      if (!hasWallet) {
        phase = phases.HEDGEHOG_SIGNUP
        const ownerWallet = await AudiusLibsInstance.hedgehog.signUp(email, password)
        await AudiusLibsInstance.web3Manager.setOwnerWallet(ownerWallet)
        await AudiusLibsInstance.Account.generateRecoveryLink({ handle: metadata.handle, host })
      }
    }

    // Add user to chain
    phase = phases.ADD_USER
    userId = await AudiusLibsInstance.User.addUser(metadata)

    // Assign replica set to user, updates creator_node_endpoint on chain, and then update metadata object on content node + chain (in AudiusLibsInstance order)
    phase = phases.ADD_REPLICA_SET
    metadata = await assignExplicitPrimaryAndRandomSecondaries({ userId })

    // TODO: Write to URSM contract (after deploy)
    return { userId, error: false }
  } catch (e) {
    return { error: e.message, phase }
  }
}

const run = async () => {
  await configureAndInitLibs()

  const signUpResp = await createUser()
  if (signUpResp.error) {
    console.error(`Could not create user. Failed at phase ${signUpResp.phase}\n`, signUpResp.error)
    return
  }

  const uploadResp = await uploadTrack(signUpResp.userId)
  if (uploadResp.error) {
    console.error('Could not upload track: ', uploadResp.error)
    return
  }

  console.log(`Successfully created user=${signUpResp.userId} and uploaded trackId=${uploadResp.trackId}`)
}

run()
