const axios = require('axios')
const fs = require('fs')

const AudiusLibs = require('../src/index')
const Web3 = require('../src/web3')

const CONTENT_NODE_TYPE = 'content-node'

// PROD
// const ETH_PROVIDER_URL = 'https://eth.audius.co'
// const DISCOVERY_NODE_ENDPOINT = 'https://discoveryprovider.audius.co'
// const ETH_REGISTRY_ADDRESS = '0xd976d3b4f4e22a238c1A736b6612D22f17b6f64C'
// const ETH_TOKEN_ADDRESS = '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998'
// const ETH_OWNER_WALLET = '0xC7310a03e930DD659E15305ed7e1F5Df0F0426C5'

// STAGING
// const ETH_PROVIDER_URL = 'https://eth.staging.audius.co'
// const DISCOVERY_NODE_ENDPOINT = 'https://discoveryprovider.staging.audius.co'
// const ETH_REGISTRY_ADDRESS = '0xe39b1cA04fc06c416c4eaBd188Cb1330b8FED781'
// const ETH_TOKEN_ADDRESS = '0x74f24429ec3708fc21381e017194A5711E93B751'
// const ETH_OWNER_WALLET = '0xcccc7428648c4AdC0ae262D3547584dDAE25c465'

// LOCAL
const ethContractsConfig = require('../eth-contracts/config.json')
const dataContractsConfig = require('../data-contracts/config.json')
const ETH_PROVIDER_ENDPOINT = 'http://localhost:8546'
const DISCOVERY_NODE_ENDPOINT = 'http://localhost:5000'
const DATA_CONTRACTS_PROVIDER_ENDPOINT = 'http://localhost:8545'
const ETH_REGISTRY_ADDRESS = ethContractsConfig.registryAddress
const ETH_TOKEN_ADDRESS = ethContractsConfig.audiusTokenAddress
const ETH_OWNER_WALLET = ethContractsConfig.ownerWallet
const DATA_CONTRACTS_REGISTRY_ADDRESS = dataContractsConfig.registryAddress
const URSM_WALLET = dataContractsConfig.allWallets[9] // 9th index as according to URSM logic in local.js

const USER_METADATA_ENDPOINT = 'https://usermetadata.audius.co/'
const NUM_USERS_PER_BATCH_REQUEST = 500
const NUM_USERS_PER_SYNC_BATCH_RQUEST = 2

const configureAndInitLibs = async () => {
  const dataWeb3 = new Web3(new Web3.providers.HttpProvider(DATA_CONTRACTS_PROVIDER_ENDPOINT))

  const audiusLibsConfig = {
    ethWeb3Config: AudiusLibs.configEthWeb3(
      ETH_TOKEN_ADDRESS,
      ETH_REGISTRY_ADDRESS,
      ETH_PROVIDER_ENDPOINT,
      ETH_OWNER_WALLET
    ),
    web3Config: AudiusLibs.configExternalWeb3(
      DATA_CONTRACTS_REGISTRY_ADDRESS,
      dataWeb3,
      null /* networkId */,
      URSM_WALLET
    ),
    creatorNodeConfig: AudiusLibs.configCreatorNode(USER_METADATA_ENDPOINT),
    isServer: true
  }

  let audiusLibs = new AudiusLibs(audiusLibsConfig)

  try {
    await audiusLibs.init()
    // console.log('here are the keys', Object.keys(audiusLibs), audiusLibs.creatorNode)

    // console.log('the curr user???', audiusLibs.userStateManager.getCurrentUser())
  } catch (e) {
    console.error(`Couldn't init libs`, e)
    throw e
  }

  return audiusLibs
}

const performHealthCheck = async spInfo => {
  const endpoint = spInfo.endpoint
  const id = spInfo.id
  try {
    await axios({
      method: 'get',
      url: '/health_check',
      baseURL: endpoint
    })

    return { id, endpoint, status: 200 }
  } catch (e) {
    console.warn(`Could not perform health check for spId=${id},endpoint=${endpoint}:`, e.message)
  }

  return { id, endpoint, status: 500 }
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

let start
const run = async () => {
  // Set up libs
  start = Date.now()
  const audiusLibs = await configureAndInitLibs()

  // Get all users that do not have a replica set assigned
  const numOfUsers = (await axios({
    method: 'get',
    url: '/latest/user',
    baseURL: DISCOVERY_NODE_ENDPOINT
  })).data.data

  console.log(`There are ${numOfUsers} users on Audius\n`)

  // Batch DP /users calls
  let userIdToWallet = {}
  let i
  for (i = 0; i <= numOfUsers; i = i + NUM_USERS_PER_BATCH_REQUEST) {
    console.log(`Processing users batch range ${i} to ${i + NUM_USERS_PER_BATCH_REQUEST}...`)
    const subsetUsers = (await axios({
      method: 'get',
      url: '/users',
      baseURL: DISCOVERY_NODE_ENDPOINT,
      params: { limit: NUM_USERS_PER_BATCH_REQUEST, offset: i }
    })).data.data

    subsetUsers
    // Filter to users that do not have a CNE
      .filter(user => !user.creator_node_endpoint)
      .forEach(user => {
      // Add userId - wallet mapping
        userIdToWallet[user.user_id] = user.wallet
      })
  }

  let userIds = Object.keys(userIdToWallet)
  console.log(`\n${userIds.length} users have no replica sets\nThis is ${userIds.length * 100 / numOfUsers}% of user base`)

  // Get all healthy, non-Audius SPs
  // const audiusInfraSpIdsArr = [1, 2, 3, 4/*, umID*/] // TODO: uncomment later
  const audiusInfraSpIdsArr = []
  const audiusInfraSpIds = new Set(audiusInfraSpIdsArr) // when UM is registered, exclude it as secondary
  let spIdToEndpoint = {}
  const sps = await audiusLibs.ethContracts.getServiceProviderList(CONTENT_NODE_TYPE)
  sps
    .filter(sp => !audiusInfraSpIds.has(sp.spID))
    .forEach(sp => {
      spIdToEndpoint[sp.spID] = sp.endpoint
    })
    // .map(sp => { return { id: sp.spID, endpoint: sp.endpoint } })

  console.log('spIds', spIdToEndpoint)
  const spEndpoints = Object.values(spIdToEndpoint)
  const spIds = Object.keys(spIdToEndpoint)

  const healthCheckedNodes = await Promise.all(
    spEndpoints.map(endpoint => performHealthCheck(endpoint))
  )

  console.log('Health check responses:', healthCheckedNodes)

  let spToNumTimesSelected = {}
  spIds.forEach(node => {
    spToNumTimesSelected[node.id] = 0
  })

  spIds = healthCheckedNodes
    .filter(node => node.status === 200)
    .map(node => node.id)

  // Compute secondaries for users while keeping UM as primary for the new replica set
  const UMSpId = (await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderInfoFromEndpoint(USER_METADATA_ENDPOINT)).spID
  console.log('\nComputing replica sets....')
  let userIdToRSet = {}
  userIds.forEach(id => {
    // Randomly select two secondaries from spIds
    let replicaSet = [UMSpId]
    let secondary1Index = Math.floor(Math.random(0) * spIds.length)
    let secondary2Index = -1
    while (secondary2Index === -1 || secondary1Index === secondary2Index) {
      secondary2Index = Math.floor(Math.random(0) * spIds.length)
    }

    replicaSet.push(spIds[secondary1Index])
    replicaSet.push(spIds[secondary2Index])

    userIdToRSet[id] = replicaSet

    // Keep track of number of times the secondary was chosen
    spToNumTimesSelected[spIds[secondary1Index]] += 1
    spToNumTimesSelected[spIds[secondary2Index]] += 1
  })

  // Print out user-to-rset mapping
  console.log('<userIds - replica sets>:\n', userIdToRSet)
  // Print out all healthy, non-Audius SPs to # of times they were assigned as secondaries
  console.log('<service providers - number of times selected as secondary>:\n', spToNumTimesSelected, '\n')

  // // Write data to file
  // fs.writeFile('computeRSet_Data.txt', `Time Taken ${end}ms\n<userIds - replica sets>:\n` + JSON.stringify(userIdToRSet), err => {
  //   if (err) console.error(`Error with writing <userIds - replica sets> data:`, err)
  //   else console.log('Saved <userIds - replica sets> data')
  // })
  // fs.appendFile('computeRSet_Data.txt', '<service providers - number of times selected as secondary>:\n' + JSON.stringify(spToNumTimesSelected), err => {
  //   if (err) console.error(`Error with writing <service providers - number of times selected as secondary> data:`, err)
  //   else console.log('Saved <service providers - number of times selected as secondary> data')
  // })

  // Trigger sync for newly selected secondaries
  // TODO: consider sync size
  console.log(`\nSyncing across new secondaries....`)
  let userIdToRSetArr = Object.entries(userIdToRSet)
  for (i = 0; i < userIds.length; i++) {
    console.log(`Processing userId=${userIdToRSetArr[i][0]}`)

    const userId = userIdToRSetArr[i][0]
    const replicaSet = userIdToRSetArr[i][1]

    await syncSecondary({
      primary: replicaSet[0],
      secondary: replicaSet[1],
      wallet: userIdToWallet[userId]
    })
  }

  const end = Date.now() - start
  console.log(`\nTime Taken: ${end}ms`)
}

//   for (i = 0; i < userIds.length; i = i + NUM_USERS_PER_SYNC_BATCH_RQUEST) {
//     console.log(`Processing sync batch range ${i} to ${i + NUM_USERS_PER_BATCH_REQUEST}...`)

//     // Get [userId, [replica set of sps]]
//     let subset = userIdToRSetArr.slice(i, i + NUM_USERS_PER_SYNC_BATCH_RQUEST)

//     // sync secondary (index 1,2)
//       // get md json, create file off of it, upload
//       // call associateCreator with the useriD, md file uuid, block number
//         // this will call /audius_user --> creates an audius user + triggers sync

//     // check clock values
//   }
// }

run()
