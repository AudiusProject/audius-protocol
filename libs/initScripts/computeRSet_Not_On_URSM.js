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
  let totalNumUsers = 15000 // staging
  try {
    totalNumUsers = (await axios({
      method: 'get',
      url: '/latest/user',
      baseURL: DISCOVERY_NODE_ENDPOINT
    })).data.data
  } catch (e) {
    totalNumUsers = 15000 // staging
    // totalNumUsers = 130000 // prod
  }
  return totalNumUsers
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
// Creates an array from [start+1, stop] e.g. range(0,500) -> [1,2,3,....,500]
const range = (start, stop, step = 1) => Array.from({ length: ((stop - start) / step + 1) - 1 }, (_, i) => 1 + start + (i * step))

async function getAllUsersWithRSetButNotOnURSM (offset, audiusLibs) {
  let userIdToWalletAndCreatorNodeEndpoint = {}
  try {
    // Get all users with the ids in the range [offset, offset + NUM_USERS_PER_BATCH_REQUEST]
    // e.g. [1,2,3,...500] -> [501,502,....,1000] etc.
    // This is to iterate through every possible user
    const subsetUsers = await audiusLibs.discoveryProvider.getUsers(
      NUM_USERS_PER_BATCH_REQUEST /* limit */,
      0 /* offset */,
      range(offset, offset + NUM_USERS_PER_BATCH_REQUEST) /* idsArray */
    )

    subsetUsers
      // Filter to users that have an rset but not on URSM
      .filter(user => user.creator_node_endpoint && !user.secondary_ids && !user.primary_id) // users with rset not on contract
      // Add userId - wallet mapping
      .forEach(user => {
        userIdToWalletAndCreatorNodeEndpoint[user.user_id] = { wallet: user.wallet, creatorNodeEndpoint: user.creator_node_endpoint }
      })

    return userIdToWalletAndCreatorNodeEndpoint
  } catch (e) {
    // For local dev -- if error is this, just retry
    if (e.message.includes('socket hang up')) {
      await Util.wait(500)
      console.log('socket hung up.. retrying')
      offset -= NUM_USERS_PER_BATCH_REQUEST
      return getAllUsersWithRSetButNotOnURSM(offset, audiusLibs)
    } else {
      console.error(`Could not get users`, e)
      throw e
    }
  }
}

async function getSPs (audiusLibs) {
  let spEndpointToSpIdAndCount = {}
  const sps = await audiusLibs.ethContracts.getServiceProviderList(CONTENT_NODE_TYPE)
  sps
    .forEach(sp => {
      spEndpointToSpIdAndCount[sp.endpoint] = { id: sp.spID, selected: 0 }
    })

  return { spEndpointToSpIdAndCount }
}

const writeDataToFile = (spIdToEndpointAndCount, userIdToRSet, offset) => {
  // Ranges of users that has been processed
  const start = offset
  const end = offset + NUM_USERS_PER_BATCH_REQUEST
  const fileName = `computeRSet_batch_notOnURSM_${start}_${end}.txt`

  // Write replica set assignments to file for reference
  let userIdToSecondariesFileContent = `BATCH ${start} to ${end}\n\nMapping <userId - replica secondaries set>\n${JSON.stringify(userIdToRSet, null, 2)}`
  let spToEndpointAndCountFilecContent = `\nMapping <spId - {endpoint, number of times selected as a secondary}>\n${JSON.stringify(spIdToEndpointAndCount, null, 2)}`

  console.log('userId to replica set mapping\n', userIdToRSet)
  console.log('spId to endpoint and num times selected as secondary\n', spIdToEndpointAndCount)

  fs.writeFile(fileName, userIdToSecondariesFileContent, err => {
    if (err) console.error(`Error with writing to file ${fileName}`, err)
  })

  fs.writeFile(`computeRSet_selection_count_notOnURSM.txt`, spToEndpointAndCountFilecContent, err => {
    if (err) console.error(`Error with writing to file computeRSet_selection_count_notOnURSM.txt`, err)
  })
}

const setReplicaSet = async ({
  audiusLibs,
  primary,
  secondary1,
  secondary2,
  userId
}) => {
  console.log(`\nWriting to URSM....\n`)

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

  // Get all SPs, and create a mapping like:
  //    <spId - {endpoint, number_of_times_selected}>
  const { spEndpointToSpIdAndCount } = await getSPs(audiusLibs)

  // Get total number of users
  const numOfUsers = await getLatestUserId()
  console.log(`There are ${numOfUsers} users on Audius\n`)

  // Batch DP /users calls
  let offset
  let userIdToWalletAndCreatorNodeEndpoint = {}
  let userIdsWithRSetButNotOnURSM = []
  let userIdsSuccess = []
  let userIdsFail = []

  // const numUsersToProcess = numOfUsers
  const numUsersToProcess = 1
  for (offset = 0; offset <= numUsersToProcess; offset = offset + NUM_USERS_PER_BATCH_REQUEST) {
    console.log('------------------------------------------------------')
    console.log(`Processing users batch range ${offset + 1} to ${offset + NUM_USERS_PER_BATCH_REQUEST}...`)

    userIdToWalletAndCreatorNodeEndpoint = await getAllUsersWithRSetButNotOnURSM(offset, audiusLibs)
    userIdsWithRSetButNotOnURSM = Object.keys(userIdToWalletAndCreatorNodeEndpoint)

    if (userIdsWithRSetButNotOnURSM.length === 0) {
      console.log(`No users in batch range ${offset} to ${offset + NUM_USERS_PER_BATCH_REQUEST} need replica sets. Continuing...`)
      continue
    } else {
      console.log(`${userIdsWithRSetButNotOnURSM.length} users in this batch have no replica sets`)
    }

    console.log('\nMapping replica sets to their spIds....')
    let userIdToRSet = {}
    userIdsWithRSetButNotOnURSM.forEach(id => {
      // Should be a size of 3 [primary, secondary1, secondary2]
      const replicaSetEndpoints = CreatorNode.getEndpoints(userIdToWalletAndCreatorNodeEndpoint[id].creatorNodeEndpoint)

      userIdToRSet[id] = {
        primary: { spId: spEndpointToSpIdAndCount[replicaSetEndpoints[0]].id, endpoint: replicaSetEndpoints[0] },
        secondary1: { spId: spEndpointToSpIdAndCount[replicaSetEndpoints[1]].id, endpoint: replicaSetEndpoints[1] },
        secondary2: { spId: spEndpointToSpIdAndCount[replicaSetEndpoints[2]].id, endpoint: replicaSetEndpoints[2] }
      }

      // Keep track of number of times the replica set was chosen (analytics)
      spEndpointToSpIdAndCount[replicaSetEndpoints[0]].selected += 1
      spEndpointToSpIdAndCount[replicaSetEndpoints[1]].selected += 1
      spEndpointToSpIdAndCount[replicaSetEndpoints[2]].selected += 1
    })

    // Write data to file
    writeDataToFile(spEndpointToSpIdAndCount, userIdToRSet, offset)

    let i
    for (i = 0; i < userIdsWithRSetButNotOnURSM.length; i++) {
      const userId = parseInt(userIdsWithRSetButNotOnURSM[i])
      const replicaSetSecondarySpIds = userIdToRSet[userId]
      console.log(`\nProcessing userId=${userId} to from primary=${USER_METADATA_ENDPOINT} -> secondaries=${spEndpointToSpIdAndCount[replicaSetSecondarySpIds[0]].endpoint},${spEndpointToSpIdAndCount[replicaSetSecondarySpIds[1]].endpoint}`)
      try {
        // Write to new contract
        await setReplicaSet({
          audiusLibs,
          primary: { spId: replicaSetSecondarySpIds.primary.spId, endpoint: replicaSetSecondarySpIds.primary.endpoint },
          secondary1: { spId: replicaSetSecondarySpIds.secondary1.spId, endpoint: replicaSetSecondarySpIds.secondary1.endpoint },
          secondary2: { spId: replicaSetSecondarySpIds.secondary2.spId, endpoint: replicaSetSecondarySpIds.secondary2.endpoint },
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
