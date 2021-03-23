const axios = require('axios')
const fs = require('fs')

const AudiusLibs = require('../src/index')
const Util = require('../src/utils')
const CreatorNode = require('../src/services/creatorNode')

const CONTENT_NODE_TYPE = 'content-node'

// PROD
// const ETH_PROVIDER_URL = 'https://eth.audius.co'
// const DISCOVERY_NODE_ENDPOINT = 'https://discoveryprovider.audius.co'
// const USER_METADATA_ENDPOINT = 'https://usermetadata.audius.co/'
// const ETH_REGISTRY_ADDRESS = '0xd976d3b4f4e22a238c1A736b6612D22f17b6f64C'
// const ETH_TOKEN_ADDRESS = '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998'
// const ETH_OWNER_WALLET = '0xC7310a03e930DD659E15305ed7e1F5Df0F0426C5'

// STAGING
const ETH_PROVIDER_ENDPOINT = 'https://eth.staging.audius.co'
const DISCOVERY_NODE_ENDPOINT = 'https://discoveryprovider.staging.audius.co'
const USER_METADATA_ENDPOINT = 'https://usermetadata.staging.audius.co'
const IDENTITY_SERVICE_ENDPOINT = 'https://identityservice.staging.audius.co'
const DATA_CONTRACTS_PROVIDER_ENDPOINT = 'https://poa-gateway.staging.audius.co'
const ETH_REGISTRY_ADDRESS = '0xe39b1cA04fc06c416c4eaBd188Cb1330b8FED781'
const ETH_TOKEN_ADDRESS = '0x74f24429ec3708fc21381e017194A5711E93B751'
const ETH_OWNER_WALLET = '0xcccc7428648c4AdC0ae262D3547584dDAE25c465'
const DATA_CONTRACTS_REGISTRY_ADDRESS = '0x793373aBF96583d5eb71a15d86fFE732CD04D452'
const URSM_BOOTSTRAPPER_PRIVATE_KEY = ''

// NOTE: Migrate URSM first via `node setup.js run user-replica-set-manager up`

// LOCAL
// const ethContractsConfig = require('../eth-contracts/config.json')
// const dataContractsConfig = require('../data-contracts/config.json')
// const ETH_PROVIDER_ENDPOINT = 'http://localhost:8546'
// const DISCOVERY_NODE_ENDPOINT = 'http://localhost:5000'
// const DATA_CONTRACTS_PROVIDER_ENDPOINT = 'http://localhost:8545'
// const USER_METADATA_ENDPOINT = 'http://cn-um_creator-node_1:4099'
// const IDENTITY_SERVICE_ENDPOINT = 'http://localhost:7000'
// const ETH_REGISTRY_ADDRESS = ethContractsConfig.registryAddress
// const ETH_TOKEN_ADDRESS = ethContractsConfig.audiusTokenAddress
// const ETH_OWNER_WALLET = ethContractsConfig.ownerWallet
// const DATA_CONTRACTS_REGISTRY_ADDRESS = dataContractsConfig.registryAddress
// const URSM_BOOTSTRAPPER_PRIVATE_KEY = '17d40644d08b96f827ebe8799981f0e6466cfb4f38033092afbde62c43c609c9' // data; has to be address #9

const NUM_USERS_PER_BATCH_REQUEST = 1
const MAX_SYNC_TIMEOUT = 120000 /* 2 min */

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
      DATA_CONTRACTS_PROVIDER_ENDPOINT,
      URSM_BOOTSTRAPPER_PRIVATE_KEY
    ),
    creatorNodeConfig: AudiusLibs.configCreatorNode(USER_METADATA_ENDPOINT),
    discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(new Set([DISCOVERY_NODE_ENDPOINT])),
    identityServiceConfig: AudiusLibs.configIdentityService(IDENTITY_SERVICE_ENDPOINT),
    isServer: true,
    isDebug: true
  }

  let audiusLibs = new AudiusLibs(audiusLibsConfig)

  try {
    await audiusLibs.init()
  } catch (e) {
    if (e.message.includes('socket hang up')) {
      await Util.wait(500)
      console.log('socket hung up during libs init.. retrying')
      return configureAndInitLibs()
    } else {
      console.error(`Couldn't init libs`, e)
      throw e
    }
  }

  return audiusLibs
}

async function getLatestUserId () {
  return (await axios({
    method: 'get',
    url: '/latest/user',
    baseURL: DISCOVERY_NODE_ENDPOINT
  })).data.data
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
// Creates an array from [start+1, stop] e.g. range(0,500) -> [1,2,3,....,500]
const range = (start, stop, step = 1) => Array.from({ length: ((stop - start) / step + 1) - 1 }, (_, i) => 1 + start + (i * step))

async function getAllUsersWithNoCreatorNodeEndpoint (offset, userIdToWallet, audiusLibs) {
  // TODO: use libs call like
  const subsetUsers = await audiusLibs.discoveryProvider.getUsers(
    NUM_USERS_PER_BATCH_REQUEST /* limit */,
    0 /* offset */,
    range(offset, offset + NUM_USERS_PER_BATCH_REQUEST) /* idsArray */
  )

  subsetUsers
    // Filter to users that do not have a CNE
    .filter(user => !user.creator_node_endpoint)
    // Add userId - wallet mapping
    .forEach(user => {
      userIdToWallet[user.user_id] = user.wallet
    })
}

async function getSPsAndDoHealthCheck (audiusLibs, UMSpId) {
  const audiusInfraSpIds = new Set([1, 2, 3, 4/*, UMSpId] */]) // when UM is registered, exclude it as secondary
  let spIdToEndpointAndCount = {}

  const sps = await audiusLibs.ethContracts.getServiceProviderList(CONTENT_NODE_TYPE)
  sps
    .filter(sp => !audiusInfraSpIds.has(sp.spID))
    .forEach(sp => {
      spIdToEndpointAndCount[sp.spID] = { endpoint: sp.endpoint, selected: 0 }
    })

  // Do health check for all non-Audius SPs
  const healthCheckedSPs = await Promise.all(
    Object.entries(spIdToEndpointAndCount)
      .map(entry => performHealthCheck(entry))
  )

  console.log('SP Health check responses:', healthCheckedSPs)

  // Filter out unhealthy nodes and retrieve id of each healthy node
  const spIds = healthCheckedSPs
    .filter(response => response.status === 200)
    .map(response => parseInt(response.id))

  return { spIdToEndpointAndCount, spIds }
}

const performHealthCheck = async spInfo => {
  const endpoint = spInfo[1].endpoint
  const id = spInfo[0]
  try {
    await axios({
      method: 'get',
      url: '/health_check',
      baseURL: endpoint
    })

    return { id, endpoint, status: 200 }
  } catch (e) {
    if (e.message.includes('socket hang up')) {
      await Util.wait(500)
      console.log('socket hung up during health check.. retrying')
      return performHealthCheck(spInfo)
    } else {
      console.warn(`Could not perform health check for spId=${id},endpoint=${endpoint}:`, e.message)
    }
  }

  return { id, endpoint, status: 500 }
}

const writeDataToFile = (spIdToEndpointAndCount, userIdToRSet, offset) => {
  // Ranges of users that has been processed
  const start = offset
  const end = offset + NUM_USERS_PER_BATCH_REQUEST
  const fileName = `computeRSet_batch_${start}_${end}.txt`

  // Write replica set assignments to file for reference
  let userIdToSecondariesFileContent = `BATCH ${start} to ${end}\n\nMapping <userId - replica secondaries set>\n${JSON.stringify(userIdToRSet, null, 2)}`
  let spToEndpointAndCountFilecContent = `\nMapping <spId - {endpoint, number of times selected as a secondary}>\n${JSON.stringify(spIdToEndpointAndCount, null, 2)}`

  console.log('userId to replica set mapping\n', userIdToRSet)
  console.log('spId to endpoint and num times selected as secondary\n', spIdToEndpointAndCount)

  fs.writeFile(fileName, userIdToSecondariesFileContent, err => {
    if (err) console.error(`Error with writing to file ${fileName}`, err)
  })

  fs.writeFile(`computeRSet_selection_count.txt`, spToEndpointAndCountFilecContent, err => {
    if (err) console.error(`Error with writing to file computeRSet_selection_count.txt`, err)
  })
}

const syncSecondary = async ({ primary, secondary, wallet }) => {
  try {
    await axios({
      baseURL: secondary,
      url: '/sync',
      method: 'post',
      data: {
        wallet: [wallet],
        creator_node_endpoint: primary,
        immediate: false /* whether or not this is a blocking request and handled right away */
      }
    })
  } catch (e) {
    console.error(`Could not sync from primary=${primary} to secondary=${secondary} for wallet=${wallet}`, e)
  }
}

const getClockValue = async ({ id, endpoint, wallet, timeout = 5000 }) => {
  try {
    const clockValue = await CreatorNode.getClockValue(endpoint, wallet, timeout)
    return { clockValue, id, endpoint, wallet }
  } catch (e) {
    console.error(`Could not fetch clock value for wallet=${wallet} from endpoint=${endpoint}`, e.message)
    return { clockValue: null, id, endpoint, wallet }
  }
}

async function syncAcrossSecondariesAndEnsureClockIsSynced (replicaSetSecondarySpIds, spIdToEndpointAndCount, userIdToWallet, userId, UMSpId) {
  await Promise.all(
    replicaSetSecondarySpIds
      .map(spId => {
        return syncSecondary({
          primary: USER_METADATA_ENDPOINT,
          secondary: spIdToEndpointAndCount[spId].endpoint,
          wallet: userIdToWallet[userId]
        })
      })
  )

  // Get UM clock
  let UMClockValue = null
  const maxRetries = 10
  let umClockCheckCount = 0
  while (!UMClockValue && umClockCheckCount++ < maxRetries) {
    UMClockValue = (await getClockValue({
      endpoint: USER_METADATA_ENDPOINT,
      wallet: userIdToWallet[userId],
      id: UMSpId
    })).clockValue

    if (UMClockValue === null) await Util.wait(500)
  }

  if (UMClockValue === null) throw new Error(`Unable to get UM clock value for userId=${userId}`)

  let synced = false
  const startSyncTime = Date.now()
  let clockValuesAcrossSecondaries
  while (!synced && Date.now() - startSyncTime <= MAX_SYNC_TIMEOUT) {
    try {
      // Check that the clock values across secondaries match the clock values on UM
      clockValuesAcrossSecondaries = await Promise.all(
        replicaSetSecondarySpIds
          .map(spId => getClockValue({
            endpoint: spIdToEndpointAndCount[spId].endpoint,
            wallet: userIdToWallet[userId],
            id: spId
          }))
      )

      console.log(`userId=${userId} | UM clock: ${UMClockValue} secondaries=${JSON.stringify(clockValuesAcrossSecondaries.map(value => value.clockValue))} | Time passed: ${Date.now() - startSyncTime}ms`)

      // If secondaries are synced up with UM, exit out of for loop
      if (
        UMClockValue === clockValuesAcrossSecondaries[0].clockValue &&
        UMClockValue === clockValuesAcrossSecondaries[1].clockValue
      ) {
        synced = true
      }
    } catch (e) {
      // If clock check fails, just swallow error and keep checking
      console.error(`Error in checking sync for userId=${userId}`, e, 'Retrying clock check..')
    }

    // Else, keep checking
    if (!synced) { await Util.wait(1000) }
  }

  // If still not synced after the while loop, throw error
  if (!synced) {
    const errorMsg = `Mismatch in clock values for userId=${userId}:\n UM primary clock value=${UMClockValue} | Most recent secondaries clock status ${JSON.stringify(clockValuesAcrossSecondaries)}`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  console.log(`Successful sync for userId=${userId}!`)
}

const setReplicaSet = async ({
  audiusLibs,
  primary,
  secondary1,
  secondary2,
  userId
}) => {
  // Update in new contract
  let tx = await audiusLibs.contracts.UserReplicaSetManagerClient.updateReplicaSet(
    userId,
    primary.spId,
    [secondary1.spId, secondary2.spId]
  )

  //   console.log('tx for updating rset', tx)
  const newCreatorNodeEndpoint = CreatorNode.buildEndpoint(
    primary.endpoint, [secondary1.endpoint, secondary2.endpoint]
  )
  await audiusLibs.User.waitForCreatorNodeEndpointIndexing(userId, newCreatorNodeEndpoint)

  console.log(`Successful contract write for userId=${userId}!`)
}

const run = async () => {
  // Set up libs and eligible SPs to select as secondaries
  let start = Date.now()
  const audiusLibs = await configureAndInitLibs()
  audiusLibs.discoveryProvider.setEndpoint(DISCOVERY_NODE_ENDPOINT) // to use waitForDPIndexing call

  // Get all non-Audius SPs, and create a mapping like:
  //    <spId - {endpoint, number_of_times_selected}>
  const UMSpId = (await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderInfoFromEndpoint(USER_METADATA_ENDPOINT)).spID
  const { spIdToEndpointAndCount, spIds } = await getSPsAndDoHealthCheck(audiusLibs, UMSpId)

  // Get all users that do not have a replica set assigned
  const numOfUsers = await getLatestUserId()
  console.log(`There are ${numOfUsers} users on Audius\n`)

  // Batch DP /users calls
  let offset
  let userIdToWallet = {}
  let userIdsWithNoCreatorNodeEndpoint = []
  let userIdsSuccess = []
  let userIdsFail = []

  // const numUsersToProcess = numOfUsers
  const numUsersToProcess = 1
  for (offset = 0; offset <= 1; offset = offset + NUM_USERS_PER_BATCH_REQUEST) {
    console.log('------------------------------------------------------')
    console.log(`Processing users batch range ${offset + 1} to ${offset + NUM_USERS_PER_BATCH_REQUEST}...`)

    // Get all the users with no creator_node_endpoint
    userIdToWallet = {}
    userIdsWithNoCreatorNodeEndpoint = []
    try {
      await getAllUsersWithNoCreatorNodeEndpoint(offset, userIdToWallet, audiusLibs)
    } catch (e) {
      // For local dev -- if error is this, just retry
      if (e.message.includes('socket hang up')) {
        await Util.wait(500)
        console.log('socket hung up.. retrying')
        offset -= NUM_USERS_PER_BATCH_REQUEST
      } else {
        console.error(`Could not get users`, e)
        throw e
      }
    }

    userIdsWithNoCreatorNodeEndpoint = Object.keys(userIdToWallet)

    if (userIdsWithNoCreatorNodeEndpoint.length === 0) {
      console.log(`No users in batch range ${offset} to ${offset + NUM_USERS_PER_BATCH_REQUEST} need replica sets. Continuing...`)
      continue
    } else {
      console.log(`${userIdsWithNoCreatorNodeEndpoint.length} users have no replica sets`)
    }

    console.log('\nComputing replica sets....')
    let userIdToRSet = {}
    userIdsWithNoCreatorNodeEndpoint.forEach(id => {
      // Randomly select two secondaries from spIds
      let replicaSet = []
      let secondary1Index = Math.floor(Math.random(0) * spIds.length)
      let secondary2Index = -1
      while (secondary2Index === -1 || secondary1Index === secondary2Index) {
        secondary2Index = Math.floor(Math.random(0) * spIds.length)
      }

      replicaSet.push(spIds[secondary1Index])
      replicaSet.push(spIds[secondary2Index])

      userIdToRSet[id] = replicaSet

      // Keep track of number of times the secondary was chosen
      spIdToEndpointAndCount[spIds[secondary1Index]].selected += 1
      spIdToEndpointAndCount[spIds[secondary2Index]].selected += 1
    })

    // Write data to file
    writeDataToFile(spIdToEndpointAndCount, userIdToRSet, offset)

    // Trigger sync for newly selected secondaries
    console.log(`\nSyncing across new secondaries....\n`)
    let userIdToRSetArr = Object.entries(userIdToRSet)

    let i
    for (i = 0; i < userIdsWithNoCreatorNodeEndpoint.length; i++) {
      const userId = parseInt(userIdToRSetArr[i][0])
      const replicaSetSecondarySpIds = userIdToRSetArr[i][1]
      console.log(`\nProcessing userId=${userId} to from primary=${USER_METADATA_ENDPOINT} -> secondaries=${spIdToEndpointAndCount[replicaSetSecondarySpIds[0]].endpoint},${spIdToEndpointAndCount[replicaSetSecondarySpIds[1]].endpoint}`)
      try {
        // Sync UM data to newly selected secondaries
        await syncAcrossSecondariesAndEnsureClockIsSynced(replicaSetSecondarySpIds, spIdToEndpointAndCount, userIdToWallet, userId, UMSpId)

        // If clock values are all synced, write to new contract
        await setReplicaSet({
          audiusLibs,
          primary: { spId: UMSpId, endpoint: USER_METADATA_ENDPOINT },
          secondary1: { spId: replicaSetSecondarySpIds[0], endpoint: spIdToEndpointAndCount[replicaSetSecondarySpIds[0]].endpoint },
          secondary2: { spId: replicaSetSecondarySpIds[1], endpoint: spIdToEndpointAndCount[replicaSetSecondarySpIds[1]].endpoint },
          userId
        })
        userIdsSuccess.push(userId)
      } catch (e) {
        console.error('Error with sync and or contract write', e)
        userIdsFail.push({ userId, error: e.message })
      }
    }
  }

  const end = Date.now() - start
  console.log(`Sucessful upgrades for users=${userIdsSuccess}`)
  console.log(`Failed upgrades for userIds=${JSON.stringify(userIdsFail, null, 2)}`)
  console.log(`\nTime Taken: ${end}ms`)
}

run()
