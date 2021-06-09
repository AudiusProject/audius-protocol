const axios = require('axios')
const fs = require('fs')

const AudiusLibs = require('../src/index')
const Util = require('../src/utils')
const CreatorNode = require('../src/services/creatorNode')

const CONTENT_NODE_TYPE = 'content-node'

// PROD
const ETH_PROVIDER_ENDPOINT = 'https://eth.audius.co'
const DISCOVERY_NODE_ENDPOINT = 'https://discoveryprovider2.audius.co'
const USER_METADATA_ENDPOINT = 'https://usermetadata.audius.co'
const IDENTITY_SERVICE_ENDPOINT = 'https://identityservice.audius.co'
const DATA_CONTRACTS_PROVIDER_ENDPOINT = 'https://poa-gateway.audius.co'
const ETH_REGISTRY_ADDRESS = '0xd976d3b4f4e22a238c1A736b6612D22f17b6f64C'
const ETH_TOKEN_ADDRESS = '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998'
const ETH_OWNER_WALLET = '0xC7310a03e930DD659E15305ed7e1F5Df0F0426C5'
const DATA_CONTRACTS_REGISTRY_ADDRESS = '0xC611C82150b56E6e4Ec5973AcAbA8835Dd0d75A2'

// STAGING
// const ETH_PROVIDER_ENDPOINT = 'https://eth.staging.audius.co'
// const DISCOVERY_NODE_ENDPOINT = 'https://discoveryprovider.staging.audius.co'
// const USER_METADATA_ENDPOINT = 'https://usermetadata.staging.audius.co'
// const IDENTITY_SERVICE_ENDPOINT = 'https://identityservice.staging.audius.co'
// const DATA_CONTRACTS_PROVIDER_ENDPOINT = 'https://poa-gateway.staging.audius.co'
// const ETH_REGISTRY_ADDRESS = '0xe39b1cA04fc06c416c4eaBd188Cb1330b8FED781'
// const ETH_TOKEN_ADDRESS = '0x74f24429ec3708fc21381e017194A5711E93B751'
// const ETH_OWNER_WALLET = '0xcccc7428648c4AdC0ae262D3547584dDAE25c465'
// const DATA_CONTRACTS_REGISTRY_ADDRESS = '0x793373aBF96583d5eb71a15d86fFE732CD04D452'

const getEnv = env => {
  const value = process.env[env]
  if (typeof value === 'undefined') {
    console.log(`${env} has not been set.`)
    return null
  }
  return value
}

// export URSM_BOOTSTRAPPER_PRIVATE_KEY=
const URSM_BOOTSTRAPPER_PRIVATE_KEY = getEnv('URSM_BOOTSTRAPPER_PRIVATE_KEY')

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

// const NUM_USERS_PER_BATCH_REQUEST = 500
const NUM_USERS_PER_BATCH_REQUEST = 10
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

// async function getAllUsersWithNoCreatorNodeEndpoint (offset, userIdToWallet, audiusLibs) {
//   // TODO: use libs call like
//   let usersRange = range(offset, offset + NUM_USERS_PER_BATCH_REQUEST)
//   const subsetUsers = await audiusLibs.discoveryProvider.getUsers(
//     NUM_USERS_PER_BATCH_REQUEST /* limit */,
//     0 /* offset */,
//     usersRange /* idsArray */
//   )
//   subsetUsers
//     // Filter to users that do not have a CNE
//     .filter(user => !user.creator_node_endpoint) // users with no rset
//     // .filter(user => user.creator_node_endpoint && !user.secondary_ids && !user.primary_id) // users with rset not on contract
//     // Add userId - wallet mapping
//     .forEach(user => {
//       userIdToWallet[user.user_id] = user.wallet
//     })
// }

// FOR CREATOR_NODE_ENDPOINT BUG FIX: To only account for users who have state on UM
async function getAllUsersWithNoCreatorNodeEndpoint (offset, userIdToWallet, audiusLibs) {
  let usersRange = [
    186935,
    186624,
    185598,
    185538,
    184240,
    184238,
    183610,
    182873,
    182708,
    182419,
    87486
  ]
  const subsetUsers = await audiusLibs.discoveryProvider.getUsers(
    100 /* limit */,
    0 /* offset */,
    usersRange /* idsArray */
  )

  subsetUsers
    // Add userId - wallet mapping
    .forEach(user => {
      userIdToWallet[user.user_id] = user.wallet
    })
}

async function getSPsAndDoHealthCheck (audiusLibs, UMSpId) {
  // TODO: update with actual sp ids of audius CNs
  // const audiusInfraSpIds = new Set([1, 2, 3, 4/*, UMSpId] */]) // when UM is registered, exclude it as secondary

  // Following nodes have been excluded due to flakiness
  // Exclude modulational
  // Exclude https://creatornode.audius4.prod-us-west-2.staked.cloud
  // Excluded https://content-a.mainnet.audius.radar.tech, 24
  // Excluded https://creatornode.audius6.prod-us-west-2.staked.cloud, 19
  // Excluded https://creatornode.audius.prod-us-west-2.staked.cloud, 7
  // Excluded https://creatornode.audius5.prod-us-west-2.staked.cloud, 16
  // Excluded https://audius-content-3.figment.io, 9
  const audiusInfraSpIds = new Set([
    UMSpId, 1, 2, 3, 17, 15, 16, 12, 18, 19, 24, 7, 9
  ]) // when UM is registered, exclude it as secondary
  let spIdToEndpointAndCount = {}

  const sps = await audiusLibs.ethContracts.getServiceProviderList(CONTENT_NODE_TYPE)
  // console.log('---')
  // console.log(sps)
  // console.log('---')
  sps
    .filter(sp => !audiusInfraSpIds.has(parseInt(sp.spID)))
    .forEach(sp => {
      spIdToEndpointAndCount[sp.spID] = { endpoint: sp.endpoint, selected: 0 }
    })

  // console.log(sps)
  // console.log('---')

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

  console.log(spIds)
  // throw new Error('fake')
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

const syncSecondary = async ({ primary, secondary, wallet, userId }) => {
  let retries = 5
  while (retries > 0) {
    try {
      await axios({
        baseURL: secondary,
        url: '/sync',
        method: 'post',
        data: {
          wallet: [wallet],
          creator_node_endpoint: primary,
          immediate: true /* whether or not this is a blocking request and handled right away */
        }
      })
      break
    } catch (e) {
      console.error(`userId=${userId} | Could not sync from primary=${primary} to secondary=${secondary} for wallet=${wallet}`, e)
    }
    retries--
    await Util.wait(500)
    console.error(`userId=${userId} | Retrying sync primary=${primary} to secondary=${secondary} for wallet=${wallet}`)
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
          wallet: userIdToWallet[userId],
          userId: userId
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

      console.log(`userId=${userId} secondaryIds=${replicaSetSecondarySpIds} | UM clock: ${UMClockValue} secondaryClockValues=${JSON.stringify(clockValuesAcrossSecondaries.map(value => value.clockValue))} | Time passed: ${Date.now() - startSyncTime}ms`)

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

  console.log(`userId=${userId} | Successful sync`)
}

const setReplicaSet = async ({
  audiusLibs,
  primary,
  secondary1,
  secondary2,
  userId
}) => {
  // console.log('test')
  // console.log(primary)
  // console.log(secondary1)
  // console.log(secondary2)
  // console.log(userId)
  // Update in new contract
  let tx = await audiusLibs.contracts.UserReplicaSetManagerClient.updateReplicaSet(
    userId,
    primary.spId,
    [secondary1.spId, secondary2.spId]
  )

  console.dir(tx, { depth: 5 })
  const newCreatorNodeEndpoint = CreatorNode.buildEndpoint(
    primary.endpoint, [secondary1.endpoint, secondary2.endpoint]
  )
  await audiusLibs.User.waitForCreatorNodeEndpointIndexing(userId, newCreatorNodeEndpoint)

  console.log(`userId=${userId} | Successful contract write | primaryId=${primary.spId}, secondaries=${secondary1.spId},${secondary2.spId}`)
}

const updateSingleUser = async (
  userId,
  primaryId,
  secondaryIds
) => {
  const audiusLibs = await configureAndInitLibs()
  let tx = await audiusLibs.contracts.UserReplicaSetManagerClient.updateReplicaSet(
    userId,
    primaryId,
    secondaryIds
  )
  console.dir(tx, { depth: 5 })
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

  if (!spIds || spIds.length == 0 || UMSpId == 0) {
    throw new Error(`spIDS found: ${spIds}, UMSpId ${UMSpId}`)
  }

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
  const numUsersToProcess = 190000
  // TODO: uncomment this for actual calculation
  // for (offset = 160000; offset < numUsersToProcess; offset = offset + NUM_USERS_PER_BATCH_REQUEST) {
  let done = false
  while (!done) {
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
    console.log(`length spIds=${spIds.length}`)
    let userIdToRSet = {}
    userIdsWithNoCreatorNodeEndpoint.forEach(id => {
      // Randomly select two secondaries from spIds
      let replicaSet = []
      let secondary1Index = Math.floor(Math.random() * spIds.length)
      // console.log(`user=${id} - Found secondary1Index as ${secondary1Index}`)
      let secondary2Index = -1
      while (secondary2Index === -1 || secondary1Index === secondary2Index) {
        secondary2Index = Math.floor(Math.random() * spIds.length)
      }

      replicaSet.push(spIds[secondary1Index])
      replicaSet.push(spIds[secondary2Index])

      userIdToRSet[id] = replicaSet

      // Keep track of number of times the secondary was chosen
      spIdToEndpointAndCount[spIds[secondary1Index]].selected += 1
      spIdToEndpointAndCount[spIds[secondary2Index]].selected += 1
    })

    // Write data to file
    // writeDataToFile(spIdToEndpointAndCount, userIdToRSet, offset)

    // Trigger sync for newly selected secondaries
    console.log(`\nSyncing across new secondaries....\n`)
    let userIdToRSetArr = Object.entries(userIdToRSet)

    let sliceLength = 5
    let i
    for (i = 0; i < userIdsWithNoCreatorNodeEndpoint.length; i += sliceLength) {
      const range = userIdsWithNoCreatorNodeEndpoint.slice(i, i + sliceLength)
      console.log(range)
      await Promise.all(range.map(async userId => {
        const replicaSetSecondarySpIds = userIdToRSet[userId]
        console.log(`Processing ${userId}, secondaryIDS: ${replicaSetSecondarySpIds}`)
        console.log(
          `\nProcessing userId=${userId} to from primary=${USER_METADATA_ENDPOINT} -> secondaries=${spIdToEndpointAndCount[replicaSetSecondarySpIds[0]].endpoint},${spIdToEndpointAndCount[replicaSetSecondarySpIds[1]].endpoint}`
        )

        try {
          // Sync UM data to newly selected secondaries
          await syncAcrossSecondariesAndEnsureClockIsSynced(
            replicaSetSecondarySpIds,
            spIdToEndpointAndCount,
            userIdToWallet,
            userId,
            UMSpId
          )
          // If clock values are all synced, write to new contract
          await setReplicaSet({
            audiusLibs,
            primary: { spId: UMSpId, endpoint: USER_METADATA_ENDPOINT },
            secondary1: { spId: replicaSetSecondarySpIds[0], endpoint: spIdToEndpointAndCount[replicaSetSecondarySpIds[0]].endpoint },
            secondary2: { spId: replicaSetSecondarySpIds[1], endpoint: spIdToEndpointAndCount[replicaSetSecondarySpIds[1]].endpoint },
            userId: parseInt(userId)
          })
          userIdsSuccess.push(userId)
        } catch (e) {
          console.error('Error with sync and or contract write', e)
          userIdsFail.push({ userId, error: e.message })
        }

        done = true
      }))
      console.log(`Finished processing ${i}, ${i + sliceLength}`)
    }
  }

  const end = Date.now() - start
  console.log(`Sucessful upgrades for ${userIdsSuccess.length} users=${userIdsSuccess}`)
  console.log(`Failed upgrades for ${userIdsFail.length} userIds=${JSON.stringify(userIdsFail, null, 2)}`)
  console.log(`\nTime Taken: ${end}ms`)
}

/*

// Update in new contract
userId=10720 | UM clock: -1 secondaries=[17,17] | Time passed: 57717ms
Processing 10720, primaryId:4, secondaryIDS: 5,3

"wallet": "0xb7aa6a4dd7c91f39127e609ee2a16b9ff340a2af"
*/

let args = process.argv
let commandToRun = args[2]
switch (commandToRun) {
  case 'run':
    run()
    break
  case 'update-user-replica-set':
    // node computeRSet_UM_Users.js update-user-replica-set userId=18 primaryId=27 secondaryIds=21,17
    const userIdStr = args[3]
    const primaryReplicaIdStr = args[4]
    const secondaryReplicaIdStr = args[5]
    const userId = parseInt(userIdStr.split('=')[1])
    const primaryReplicaId = parseInt(primaryReplicaIdStr.split('=')[1])
    let secondaryReplicaIds = (secondaryReplicaIdStr.split('=')[1])
    secondaryReplicaIds = secondaryReplicaIds.split(',').map(x => parseInt(x))
    console.log(`Received userId: ${userId}`)
    console.log(`Received primaryReplicaId: ${primaryReplicaId}`)
    console.log(`Received secondaryReplicaIds: ${secondaryReplicaIds}`)
    updateSingleUser(
      userId,
      primaryReplicaId,
      secondaryReplicaIds
    )
    break
  default:
    break
}

// run()
