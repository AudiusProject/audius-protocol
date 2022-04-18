const util = require('util')
const exec = util.promisify(require('child_process').exec)
const ServiceCommands = require('@audius/service-commands')
const { getUser } = ServiceCommands

const { addAndUpgradeUsers } = require('../helpers.js')
const { logger } = require('../logger.js')

// Note that these paths are relative to ../solana-programs/anchor/audius-data/
const OWNER_KEYPAIR_PATH = '~/.config/solana/id.json'
const ADMIN_KEYPAIR_PATH = 'adminKeypair.json'
const ADMIN_STORAGE_KEYPAIR_PATH = 'adminStorageKeypair.json'
const USER_SOL_KEYPAIR_PATH = (userId) => `userKeypair_${userId}.json`

const USER_REPLICA_SET = 'USER_REPLICA_SET'

// TODO: These 2 functions are mostly copied from libs, so import them once they're exposed via service-commands
//  https://github.com/AudiusProject/audius-protocol/blob/f9da30a226bbb37a5b7049c13c4ccb29746d85ea/libs/initScripts/helpers/utils.js#L19-L28
const execParseOutput = async (cmd) => {
  const { stdout } = await exec(cmd)
  return JSON.parse(stdout)
}
const getDataContractAccounts = async () => {
  return execParseOutput('docker exec audius_ganache_cli cat contracts-ganache-accounts.json')
}

const getEthPrivKeyFromPub = async (ethPubKey) => {
  const { addresses: ethAcctMapping } = await getDataContractAccounts()
  const ethAcctFromMapping = ethAcctMapping[ethPubKey]
  const { secretKey: { data: ethPrivKey } } = ethAcctFromMapping
  return ethPrivKey
}

/**
 * Given a user's CN endpoints of the form "http://cn1_...,http://cn2_...,http://cn3_...",
 * returns replica set of the form of "1,2,3" for audius-data CLI to use
 */
const parseReplicaSetFromEndpoints = (endpoints) => {
  let replicaSets = ''
  for (const endpoint of endpoints.split(',')) {
    const cNode = endpoint.substring('http://cn'.length)
    const cNodeNum = cNode.split('_')[0]
    replicaSets = `${replicaSets},${cNodeNum}`
  }
  return replicaSets.substring(1)
}

const initAdmin = async () => {
  logger.info('Initializing Solana admin account...')
  try {
    // TODO: Use libs once it's ready instead of executing a script
    const { stdout: initAdminOutput, stderr } = await exec(
      `cd ../solana-programs/anchor/audius-data/ && \
      yarn run ts-node cli/main.ts -f initAdmin \
      -k ${OWNER_KEYPAIR_PATH}`
    )
    logger.info(`[initAdmin] Output: ${initAdminOutput}`)
    if (stderr) logger.warn(`[initAdmin] Error output: ${stderr}`)

    // TODO: Parse tx and verify that its instruction was called "initAdmin" and had the correct params
  } catch (e) {
    logger.warn(`[initAdmin] Failed with error: ${e.message}`)
    throw new Error(e)
  }
}

const initCNode = async (
  cNodeId,
  inittedCNodeIds
) => {
  logger.info(`Initializing Solana Content Node account for ${cNodeId}...`)
  try {
    // TODO: Use libs once it's ready instead of executing a script
    const { stdout: initCNodeOutput, stderr } = await exec(
      `cd ../solana-programs/anchor/audius-data/ && \
      yarn run ts-node cli/main.ts -f initContentNode \
      -k ${OWNER_KEYPAIR_PATH} \
      --admin-keypair $PWD/${ADMIN_KEYPAIR_PATH} \
      --admin-storage-keypair $PWD/${ADMIN_STORAGE_KEYPAIR_PATH} \
      --cn-sp-id ${cNodeId}`
    )
    logger.info(`[initCNode] Output: ${initCNodeOutput}`)
    if (stderr) logger.warn(`[initCNode] Error output: ${stderr}`)

    // TODO: Parse tx and verify that its instruction was called "initContentNode" and had the correct params

    inittedCNodeIds[cNodeId] = true
  } catch (e) {
    logger.warn(`[initCNode] Failed with error: ${e.message}`)
    throw new Error(e)
  }
}

const initUser = async (
  userId,
  userEthWallet,
  inittedUserInfo
) => {
  logger.info(`Initializing Solana user ${userId}...`)
  try {
    // TODO: Use libs once it's ready instead of executing a script
    const { stdout: initUserOutput, stderr } = await exec(
      `cd ../solana-programs/anchor/audius-data/ && \
      yarn run ts-node cli/main.ts -f initUser \
      -k ${OWNER_KEYPAIR_PATH} \
      --admin-keypair $PWD/${ADMIN_KEYPAIR_PATH} \
      --admin-storage-keypair $PWD/${ADMIN_STORAGE_KEYPAIR_PATH} \
      --user-replica-set ${inittedUserInfo[userId][USER_REPLICA_SET]} \
      --user-id ${userId} \
      -e ${userEthWallet}`
    )

    logger.info(`[initUser] Output: ${initUserOutput}`)
    if (stderr) logger.warn(`[initUser] Error output: ${stderr}`)

    // initUser only outputs "userAcct=" on the first run for each user
    if (!initUserOutput.includes('userAcct=')) {
      throw new Error(`[initUser] User ${userId} was already initted (or an error occurred during init -- check output above). Verify that you're not running this test a second time without increasing the offset.`)
    }

    // TODO: Parse tx and verify that its instruction was called "initUser" and had the correct params
  } catch (e) {
    logger.warn(`[initUser] Failed with error: ${e.message}.`)
    throw new Error(e)
  }
}

const generateSolanaKeypair = async (userId) => {
  try {
  // TODO: Can do this with anchor.web3.Keypair.generate() if we want to install anchor dep in mad dog
  const { stdout: solKeygenOutput, stderr } = await exec(
    `cd ../solana-programs/anchor/audius-data/ && \
    solana-keygen new --no-bip39-passphrase --force -o $PWD/${USER_SOL_KEYPAIR_PATH(userId)}`
  )
  logger.info(`[generateSolanaKeypair] solana-keygen output: ${solKeygenOutput}`)
  if (stderr) logger.warn(`[generateSolanaKeypair] Error output: ${stderr}`)
  } catch (e) {
    logger.warn(`[generateSolanaKeypair] Failed with error: ${e.message}`)
    throw new Error(e)
  }
}

const initUserSolPubkey = async (userId, userEthWallet, userEthPrivKey) => {
  logger.info(`Initting user Solana public key for user ${userId}...`)
  try {
    // TODO: Use libs once it's ready instead of executing a script
    const { stdout: initUserSolPubKeyOutput, stderr } = await exec(
      `cd ../solana-programs/anchor/audius-data/ && \
      yarn run ts-node cli/main.ts -f initUserSolPubKey \
      -k ${OWNER_KEYPAIR_PATH} \
      --user-solana-keypair $PWD/${USER_SOL_KEYPAIR_PATH(userId)} \
      --admin-storage-keypair $PWD/${ADMIN_STORAGE_KEYPAIR_PATH} \
      --user-storage-pubkey ${userEthWallet} \
      --eth-private-key ${userEthPrivKey}`
    )
    logger.info(`[initUserSolPubkey] Output: ${initUserSolPubKeyOutput}`)
    if (stderr) logger.warn(`[initUserSolPubkey] Error output: ${stderr}`)

    // TODO: Parse tx and verify that its instruction was called "initUserSol" and had the correct params
  } catch (e) {
    logger.warn(`[initUserSolPubkey] Failed with error: ${e.message}`)
    throw new Error(e)
  }
}

const upgradeUsersToSol = async (
  numUsers,
  executeOne,
  walletIndexToUserIdMap,
  inittedCNodeIds,
  inittedUserInfo
) => {
  for (let numUser = 0; numUser < numUsers; numUser++) {
    const userId = walletIndexToUserIdMap[numUser]
    const user = await executeOne(numUser, libs => getUser(libs, userId))
    const {
      wallet: userEthWallet,
      creator_node_endpoint: cNodeEndpoints
    } = user
    const userEthPrivKey = await getEthPrivKeyFromPub(userEthWallet)

    // Solana accounts for each CN in the user's replica set must be initialized
    const userReplicaSet = parseReplicaSetFromEndpoints(cNodeEndpoints)
    for (const cNodeId of userReplicaSet.split(',')) {
      if (!inittedCNodeIds[cNodeId]) {
        await initCNode(cNodeId, inittedCNodeIds)
      }
    }
    inittedUserInfo[userId] = {
      ...(inittedUserInfo[userId] || {}),
      [USER_REPLICA_SET]: userReplicaSet
    }

    await initUser(userId, userEthWallet, inittedUserInfo)
    await generateSolanaKeypair(userId)
    await initUserSolPubkey(userId, userEthWallet, userEthPrivKey)

    // TODO: Parse account and tx for user init from solana and assert against it (better to do wait for getTransactionWithData to be exposed via libs rather than invoke the Python scripts via another exec, right?)
    // How would the assertions here differ from the asserts in audius-data?
  }
}

module.exports = poaSolMigrationTests = async ({
  executeAll,
  executeOne,
  numUsers,
  numCreatorNodes
}) => {
  try {
    // Initialize the users we'll need for the tests
    let walletIndexToUserIdMap
    try {
      walletIndexToUserIdMap = await addAndUpgradeUsers(
        numUsers,
        executeAll,
        executeOne
      )
    } catch (e) {
      return { error: `Issue with creating and upgrading users: ${e.message}` }
    }

    const inittedCNodeIds = {}
    const inittedUserInfo = {}

    // Run the tests
    await initAdmin()
    await upgradeUsersToSol(
      numUsers,
      executeOne,
      walletIndexToUserIdMap,
      inittedCNodeIds,
      inittedUserInfo
    )
  } catch (e) {
    return { error: `POA to SOL migration test encountered an error: ${e.message}` }
  }
}
