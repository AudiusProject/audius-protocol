const { logger } = require('../logging')
const { REMOTE_VARS, getRemoteVar } = require('../remoteConfig')
const models = require('../models')
const { RewardsAttester } = require('@audius/libs')
const { RewardsReporter } = require('./rewardsReporter')
const config = require('../config.js')

const REDIS_ATTEST_HEALTH_KEY = 'last-attestation-time'
const REDIS_ATTEST_START_BLOCK_OVERRIDE_KEY = 'attestation-start-block-override'

const getRemoteConfig = async (optimizely) => {
  // Fetch the challengeDenyList, used to filter out
  // arbitrary challenges by their challengeId
  const challengeIdsDenyList = (
    (getRemoteVar(optimizely, REMOTE_VARS.CHALLENGE_IDS_DENY_LIST) || '')
      .split(',')
  )

  const endpointsString = getRemoteVar(optimizely, REMOTE_VARS.REWARDS_ATTESTATION_ENDPOINTS)
  const endpoints = endpointsString && endpointsString.length ? endpointsString.split(',') : []

  const aaoEndpoint = getRemoteVar(
    optimizely, REMOTE_VARS.ORACLE_ENDPOINT
  ) || config.get('aaoEndpoint')
  const aaoAddress = getRemoteVar(
    optimizely, REMOTE_VARS.ORACLE_ETH_ADDRESS
  ) || config.get('aaoAddress')

  const runBehindSec = getRemoteVar(optimizely, REMOTE_VARS.ATTESTER_DELAY_SEC) || 0

  const parallelization = getRemoteVar(optimizely, REMOTE_VARS.ATTESTER_PARALLELIZATION) || 2

  return {
    challengeIdsDenyList,
    endpoints,
    aaoEndpoint,
    aaoAddress,
    runBehindSec,
    parallelization
  }
}

const setupRewardsAttester = async (libs, optimizely, redisClient) => {
  // Make a more greppable child logger
  const childLogger = logger.child({ 'service': 'RewardsAttester' })

  const { challengeIdsDenyList, endpoints, aaoEndpoint, aaoAddress, runBehindSec, parallelization } = await getRemoteConfig(optimizely)

  // Fetch the last saved offset and startingBLock from the DB,
  // or create them if necessary.
  let initialVals = await models.RewardAttesterValues.findOne()
  if (!initialVals) {
    initialVals = models.RewardAttesterValues.build()
    initialVals.startingBlock = 0
    initialVals.offset = 0
    await initialVals.save()
  }

  const rewardsReporter = new RewardsReporter({
    successSlackUrl: config.get('successAudioReporterSlackUrl'),
    errorSlackUrl: config.get('errorAudioReporterSlackUrl'),
    childLogger,
    source: 'Identity'
  })

  // Init the RewardsAttester
  const attester = new RewardsAttester({
    libs,
    logger: childLogger,
    parallelization,
    quorumSize: config.get('rewardsQuorumSize'),
    aaoEndpoint,
    aaoAddress,
    startingBlock: initialVals.startingBlock,
    offset: initialVals.offset,
    challengeIdsDenyList,
    reporter: rewardsReporter,
    endpoints,
    isSolanaChallenge: (challengeId) => challengeId === 'listen-streak',
    runBehindSec,
    updateValues: async ({ startingBlock, offset, successCount }) => {
      childLogger.info(`Persisting offset: ${offset}, startingBlock: ${startingBlock}`)

      await models.RewardAttesterValues.update({
        startingBlock,
        offset
      }, { where: {} })

      // If we succeeded in attesting for at least a single reward,
      // store in Redis so we can healthcheck it.
      if (successCount > 0) {
        await redisClient.set(REDIS_ATTEST_HEALTH_KEY, Date.now())
      }
    },
    getStartingBlockOverride: async () => {
      // Retrieve a starting block override from redis (that is set externally, CLI, or otherwise)
      // return that starting block so that the rewards attester changes its
      // starting block, and then delete the value from redis as to stop re-reading it
      const startBlock = await redisClient.get(REDIS_ATTEST_START_BLOCK_OVERRIDE_KEY)
      if (startBlock === undefined || startBlock === null) {
        return null
      }

      const parsedStartBlock = parseInt(startBlock, 10)
      // Regardless if we were able to parse the start block override, clear it now
      // so that subsequent runs don't pick it up again.
      await redisClient.del(REDIS_ATTEST_START_BLOCK_OVERRIDE_KEY)

      if (
        parsedStartBlock !== undefined &&
        parsedStartBlock !== null &&
        !isNaN(parsedStartBlock)
      ) {
        return parsedStartBlock
      }
      // In the case of failing to parse from redis, just return null
      return null
    }
  })

  // Periodically check for new config and update the rewards attester
  setInterval(async () => {
    const { challengeIdsDenyList, endpoints, aaoEndpoint, aaoAddress, runBehindSec, parallelization } = await getRemoteConfig(optimizely)
    logger.info(`Pulled rewards attester remote config: endpoints ${endpoints}, aao ${aaoEndpoint} (${aaoAddress}), denyList: ${challengeIdsDenyList}, run behind: ${runBehindSec},  parallelization: ${parallelization}`)
    attester.updateConfig({ challengeIdsDenyList, endpoints, aaoEndpoint, aaoAddress, parallelization })
  }, 10000)

  attester.start()
  return attester
}

module.exports = { setupRewardsAttester }
module.exports.REDIS_ATTEST_HEALTH_KEY = REDIS_ATTEST_HEALTH_KEY
