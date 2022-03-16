const { SubmitAndEvaluateError } = require('../../api/rewards')
const { decodeHashId } = require('../../utils/utils')

// `BaseRewardsReporter` is intended to be subclassed, and provides
// "reporting" functionality to RewardsAttester (i.e. posts to Slack if something notable happens)
class BaseRewardsReporter {
  async reportSuccess ({ userId, challengeId, amount }) {}

  async reportRetry ({ userId, challengeId, amount, error, phase }) {}

  async reportFailure ({ userId, challengeId, amount, error, phase }) {}

  async reportAAORejection ({ userId, challengeId, amount, error, reason }) {}
}

const MAX_DISBURSED_CACHE_SIZE = 100
const SOLANA_EST_SEC_PER_SLOT = 0.5
const POA_SEC_PER_BLOCK = 5

/**
 * Class to encapsulate logic for calculating disbursement delay thresholds.
 * Periodically polls Solana to get slot production rate.
 * Caches old values (`allowedStalenessSec`) for current POA block & Solana slot to reduce RPC
 * overhead.
 *
 * Exposes `getPOABlockThreshold` and `getSolanaSlotThreshold`
 *
 * @class ThresholdCalculator
 */
class AttestationDelayCalculator {
  constructor ({ libs, runBehindSec, allowedStalenessSec, solanaPollingInterval = 30, logger = console }) {
    this.libs = libs
    this.solanaSecPerSlot = SOLANA_EST_SEC_PER_SLOT
    this.solanaSlot = null
    this.runBehindSec = runBehindSec
    this.lastSolanaThreshold = null
    this.lastPOAThreshold = null
    this.allowedStalenessSec = allowedStalenessSec
    this.solanaPollingInterval = solanaPollingInterval
    this.logger = logger
    this.intervalHandle = null
  }

  async start () {
    // Begin Solana slot rate polling
    let oldSlot = await this.libs.solanaWeb3Manager.getSlot()
    this.intervalHandle = setInterval(async () => {
      const newSlot = await this.libs.solanaWeb3Manager.getSlot()
      const diff = this.solanaPollingInterval / (newSlot - oldSlot)
      this.solanaSecPerSlot = diff
      this.logger.info(`Setting Solana seconds per slot to ${diff}`)
      oldSlot = newSlot
    }, this.solanaPollingInterval * 1000)
  }

  stop () {
    clearInterval(this.intervalHandle)
  }

  async getPOABlockThreshold () {
    // Use cached value if possible
    if (this.lastPOAThreshold &&
       (Date.now() - this.lastPOAThreshold.time) / 1000 < this.allowedStalenessSec) {
      return this.lastPOAThreshold.threshold
    }
    const currentBlock = await this.libs.web3Manager.getWeb3().eth.getBlockNumber()
    let threshold = currentBlock - this.runBehindSec / POA_SEC_PER_BLOCK
    this.lastPOAThreshold = {
      threshold,
      time: Date.now()
    }
    return threshold
  }

  async getSolanaSlotThreshold () {
    // Use cached value if possible
    if (this.lastSolanaThreshold &&
       (Date.now() - this.lastSolanaThreshold.time) / 1000 < this.allowedStalenessSec) {
      return this.lastSolanaThreshold.threshold
    }
    const currentSlot = await this.libs.solanaWeb3Manager.getSlot()
    let threshold = currentSlot - this.runBehindSec / this.solanaSecPerSlot
    this.lastSolanaThreshold = {
      threshold,
      time: Date.now()
    }
    return threshold
  }
}

/**
 * `RewardsAttester` is responsible for repeatedly attesting for completed rewards.
 *
 * **Implementation**
 *
 * `RewardsAttester` attempts to attest for `parallelization` rewards in parallel.
 * It won't move onto the next batch of rewards until every reward in that batch has
 * either succeeded or failed attestation. It retries errors that might be due to DN
 * timing issues, and skips AAO errors and some Solana program errors.
 *
 * Internally, state is tracked with two variables: `offset` and `startingBlock`.
 * `startingBlock` represents which block it start requesting attestations from, while `offset` determines
 * where within those results we offset. AAO rejected rewards
 * are never cleared from the DN rewards queue, so we have to move past them either with `offset` or `startingBlock`.
 * `RewardsAttester` accepts callbacks (`updateValues`) for a client to persist these values periodically.
 *
 * RewardsAttester will fetch a single large list of undisbursed rewards (`undisbursedQueue`), and
 * process that entire list before fetching new undisbursed rewards. It also maintains a list of
 * recently processed rewards, and filters those out when re-fetching new undisbursed rewards.
 */
class RewardsAttester {
  /**
   * Creates an instance of RewardsAttester.
   * @param {{
   *    libs
   *    startingBlock: number
   *    offset: number
   *    parallelization: number
   *    logger?: any
   *    quorumSize: number
   *    aaoEndpoint: string
   *    aaoAddress: string
   *    updateValues: function
   *    getStartingBlockOverride: function
   *    maxRetries: number
   *    reporter: BaseRewardsReporter
   *    challengeIdsDenyList: Array<string>
   *    endpoints?: Array<string>
   *    runBehindSec?: number
   *    isSolanaChallenge?: (string) => boolean
   *    feePayerOverride?: string
   *    maxAggregationAttempts?: number
   * }} {
   *    libs,
   *    startingBlock,
   *    offset,
   *    parallelization,
   *    logger,
   *    quorumSize,
   *    aaoEndpoint,
   *    aaoAddress,
   *    updateValues = ({ startingBlock, offset, successCount }) => {},
   *    getStartingBlockOverride = () => null,
   *    maxRetries = 3,
   *    reporter,
   *    challengeIdsDenyList,
   *    endpoints,
   *    runBehindSec
   *    isSolanaChallenge
   *    feePayerOverride
   *    maxAggregationAttempts
   *  }
   * @memberof RewardsAttester
   */
  constructor ({
    libs,
    startingBlock,
    offset,
    parallelization,
    logger = console,
    quorumSize,
    aaoEndpoint,
    aaoAddress,
    updateValues = () => {},
    getStartingBlockOverride = () => null,
    maxRetries = 5,
    reporter,
    challengeIdsDenyList = [],
    endpoints = [],
    runBehindSec = 0,
    isSolanaChallenge = (challengeId) => true,
    feePayerOverride = null,
    maxAggregationAttempts = 20
  }) {
    this.libs = libs
    this.logger = logger
    this.parallelization = parallelization
    this.startingBlock = startingBlock
    this.offset = offset
    this.quorumSize = quorumSize
    this.aaoEndpoint = aaoEndpoint
    this.aaoAddress = aaoAddress
    this.reporter = reporter || new BaseRewardsReporter()
    this.endpoints = endpoints
    this.endpointPool = new Set(endpoints)
    this.maxRetries = maxRetries
    this.maxAggregationAttempts = maxAggregationAttempts
    this.updateValues = updateValues
    this.challengeIdsDenyList = new Set(...challengeIdsDenyList)
    // Stores a queue of undisbursed challenges
    this.undisbursedQueue = []
    // Stores a set of identifiers representing
    // recently disbursed challenges.
    // Stored as an array to make it simpler to prune
    // old entries
    this.recentlyDisbursedQueue = []
    // How long wait wait before retrying
    this.cooldownMsec = 2000
    // How much we increase the cooldown between attempts:
    // coolDown = min(cooldownMsec * backoffExponent ^ retryCount, maxCooldownMsec)
    this.backoffExponent = 1.8
    // Maximum time to wait before retrying
    this.maxCooldownMsec = 15000
    // Maximum number of retries before moving on
    this.maxRetries = maxRetries
    // Get override starting block for manually setting indexing start
    this.getStartingBlockOverride = getStartingBlockOverride
    this.feePayerOverride = feePayerOverride

    // Calculate delay
    this.delayCalculator = new AttestationDelayCalculator({
      libs,
      runBehindSec,
      logger,
      allowedStalenessSec: 5
    })
    this.isSolanaChallenge = isSolanaChallenge

    this._performSingleAttestation = this._performSingleAttestation.bind(this)
    this._disbursementToKey = this._disbursementToKey.bind(this)
    this._shouldStop = false
  }

  /**
   * Begin attestation loop. Entry point for identity attestations
   *
   * @memberof RewardsAttester
   */
  async start () {
    this.logger.info(`Starting attester with:
      quorum size: ${this.quorumSize}, \
      parallelization: ${this.parallelization} \
      AAO endpoint: ${this.aaoEndpoint} \
      AAO address: ${this.aaoAddress} \
      endpoints: ${this.endpoints}
    `)

    // If a list of endpoints was not specified,
    // set the pool to the entire list of discovery providers.
    // This overrides any configured whitelist for the service selector.
    if (this.endpointPool.size === 0) {
      const pool = await this.libs.discoveryProvider.serviceSelector.getServices()
      this.endpointPool = new Set(pool)
    }
    await this._selectDiscoveryNodes()
    await this.delayCalculator.start()

    while (!this._shouldStop) {
      try {
        await this._awaitFeePayerBalance()
        await this._checkForStartingBlockOverride()

        // Refill queue if necessary, returning early if error
        const { error } = await this._refillQueueIfNecessary()
        if (error) {
          this.logger.error(`Got error trying to refill challenges: [${error}]`)
          throw new Error(error)
        }

        // If queue is still empty, sleep and return
        if (!this.undisbursedQueue.length) {
          this.logger.info(`No undisbursed challenges. Sleeping...`)
          await this._delay(1000)
          continue
        }

        // Get undisbursed rewards
        let toAttest = this.undisbursedQueue.splice(0, this.parallelization)

        // Attest for batch in parallel
        const { highestBlock, offset, results, successCount } = await this._attestInParallel(toAttest)

        // Set state
        this.startingBlock = highestBlock ? highestBlock - 1 : this.startingBlock
        this.offset = offset
        this.logger.info(`Updating values: startingBlock: ${this.startingBlock}, offset: ${this.offset}`)

        // Set the recently disbursed set
        this._addRecentlyDisbursed(results)

        // run the `updateValues` callback
        await this.updateValues({ startingBlock: this.startingBlock, offset: this.offset, successCount })
      } catch (e) {
        this.logger.error(`Got error: ${e}, sleeping`)
        await this._delay(1000)
      }
    }

    this._shouldStop = false
  }

  async stop () {
    this._shouldStop = true
    this.delayCalculator.stop()
  }

  /**
   * Called from the client to attest challenges
   * @param {any[]} challenges
   * @returns
   */
  async processChallenges (challenges) {
    await this._selectDiscoveryNodes()
    let toProcess = [...challenges]
    while (toProcess.length) {
      try {
        this.logger.info(`Processing ${toProcess.length} challenges`)
        let toAttest = toProcess.splice(0, this.parallelization)
        const { accumulatedErrors: errors } = await this._attestInParallel(toAttest)
        if (errors && errors.length) {
          this.logger.error(`Got errors in processChallenges: ${JSON.stringify(errors)}`)
          return { errors }
        }
      } catch (e) {
        this.logger.error(`Got error: ${e}, sleeping`)
        await this._delay(1000)
      }
    }
    return {}
  }

  /**
   * Updates attester config
   *
   * @param {{
   *  aaoEndpoint: string,
   *  aaoAddress: string,
   *  endpoints: Array<string>,
   *  challengeIdsDenyList: Array<string>
   *  parallelization: number
   * }} { aaoEndpoint, aaoAddress, endpoints, challengeIdsDenyList, parallelization }
   * @memberof RewardsAttester
   */
  updateConfig ({ aaoEndpoint, aaoAddress, endpoints, challengeIdsDenyList, parallelization }) {
    this.logger.info(`Updating attester with config aaoEndpoint: ${aaoEndpoint}, aaoAddress: ${aaoAddress}, endpoints: ${endpoints}, challengeIdsDenyList: ${challengeIdsDenyList}, parallelization: ${parallelization}`)
    this.aaoEndpoint = aaoEndpoint || this.aaoEndpoint
    this.aaoAddress = aaoAddress || this.aaoAddress
    this.endpoints = endpoints || this.endpoints
    this.challengeIdsDenyList = challengeIdsDenyList ? new Set(...challengeIdsDenyList) : this.challengeIdsDenyList
    this.parallelization = parallelization || this.parallelization
  }

  /**
   * Sleeps until the feePayer has a usable Sol balance.
   *
   * @memberof RewardsAttester
   */
  async _awaitFeePayerBalance () {
    const getHasBalance = async () => this.libs.solanaWeb3Manager.hasBalance({ publicKey: this.libs.solanaWeb3Manager.feePayerKey })
    while (!(await getHasBalance())) {
      this.logger.warn('No usable balance. Waiting...')
      await this._delay(2000)
    }
  }

  /**
   * Returns the override feePayer if set, otherwise a random fee payer from among the list of existing fee payers.
   *
   * @memberof RewardsAttester
   */
  _getFeePayer () {
    if (this.feePayerOverride) {
      return this.feePayerOverride
    }
    const feePayerKeypairs = this.libs.solanaWeb3Manager.solanaWeb3Config.feePayerKeypairs
    if (feePayerKeypairs && feePayerKeypairs.length) {
      const randomFeePayerIndex = Math.floor(Math.random() * feePayerKeypairs.length)
      return feePayerKeypairs[randomFeePayerIndex].publicKey
    }
    return null
  }

  /**
   * Escape hatch for manually setting starting block.
   *
   * @memberof RewardsAttester
   */
  async _checkForStartingBlockOverride () {
    const override = await this.getStartingBlockOverride()
    // Careful with 0...
    if (override === null || override === undefined) return
    this.logger.info(`Setting starting block override: ${override}, emptying recent disbursed queue`)
    this.startingBlock = override
    this.offset = 0
    this.recentlyDisbursedQueue = []
    this.undisbursedQueue = []
  }

  /**
   * Main method to attest for a bucket of challenges in parallel.
   *
   * Algorithm:
   * - Gets `this.parallelization` undisbursed challenges from the queue, refilling it from DN if necessary.
   * - Call `_performSingleAttestation` on those in parallel.
   * - For challenges that failed, either keep retrying or discard them, depending on the error.
   * - Set offset and startingBlock
   *
   * @memberof RewardsAttester
   */
  async _attestInParallel (toAttest) {
    this.logger.info(`Attesting in parallel with startingBlock: ${this.startingBlock}, offset: ${this.offset}, parallelization: ${this.parallelization}`)
    // Get the highest block number, ignoring Solana based challenges (i.e. listens) which have a significantly higher
    // slot and throw off this calculation.
    // TODO: [AUD-1217] we should handle this in a less hacky way, possibly by
    // attesting for Solana + POA challenges separately.
    const poaAttestations = toAttest.filter(({ challengeId }) => !this.isSolanaChallenge(challengeId))
    const highestBlock = poaAttestations.length ? Math.max(...poaAttestations.map(e => e.completedBlocknumber)) : null

    // Attempt to attest in a single sweep
    const results = await Promise.all(toAttest.map(this._performSingleAttestation))

    // "Process" the results of attestation into noRetry and needsRetry errors,
    // as well as a flag that indicates whether we should reselect.
    let { successful, noRetry, needsRetry, shouldReselect } = this._processResponses(results, false)
    let successCount = successful.length
    let accumulatedErrors = noRetry

    // Increment offset by the # of errors we're not retrying that have the max block #.
    //
    // Note: any successfully completed rewards will eventually be flushed from the
    // disbursable queue on DN, but ignored rewards will stay stuck in that list, so we
    // have to move past them with offset if they're not already moved past with `startingBlock`.
    let offset = 0
    offset += noRetry.filter(({ completedBlocknumber }) => completedBlocknumber === highestBlock).length

    // Retry loop
    let retryCount = 0
    while (needsRetry.length && retryCount < this.maxRetries) {
      await this._backoff(retryCount++)
      if (shouldReselect) {
        await this._selectDiscoveryNodes()
      }
      const res = await Promise.all(needsRetry.map(this._performSingleAttestation))
      ;({ successful, needsRetry, noRetry, shouldReselect } = this._processResponses(res, retryCount === this.maxRetries))
      accumulatedErrors = [...accumulatedErrors, ...noRetry]

      offset += noRetry.filter(({ completedBlocknumber }) => completedBlocknumber === highestBlock).length
      successCount += successful.length
    }

    if (retryCount === this.maxRetries) {
      this.logger.error(`Gave up with ${retryCount} retries`)
      accumulatedErrors = [...accumulatedErrors, ...needsRetry]
    }

    return {
      accumulatedErrors,
      highestBlock,
      offset,
      results,
      successCount
    }
  }

  /**
   * @typedef {Object} AttestationResponse
   * @property {string} challengeId
   * @property {string} userId
   * @property {string} specifier
   * @property {number} amount
   * @property {string} handle
   * @property {string} wallet
   * @property {number} completedBlocknumber
   * @property {string?} error
   * @property {string?} phase
   */

  /**
   * Attempts to attest for a single challenge.
   *
   * @param {{
   *     challengeId: string,
   *     userId: string,
   *     specifier: string,
   *     amount: number,
   *     handle: string,
   *     wallet: string,
   *     completedBlocknumber: number
   * }} {
   *     challengeId,
   *     userId,
   *     specifier,
   *     amount,
   *     handle,
   *     wallet,
   *     completedBlocknumber,
   *   }
   * @return {Promise<AttestationResponse>}
   * @memberof RewardsAttester
   */
  async _performSingleAttestation ({
    challengeId,
    userId,
    specifier,
    amount,
    handle,
    wallet,
    completedBlocknumber
  }) {
    this.logger.info(`Attempting to attest for userId [${decodeHashId(userId)}], challengeId: [${challengeId}], quorum size: [${this.quorumSize}]}`)

    const { success, error, phase } = await this.libs.Rewards.submitAndEvaluate({
      challengeId,
      encodedUserId: userId,
      handle,
      recipientEthAddress: wallet,
      specifier,
      oracleEthAddress: this.aaoAddress,
      amount,
      quorumSize: this.quorumSize,
      AAOEndpoint: this.aaoEndpoint,
      endpoints: this.endpoints,
      logger: this.logger,
      feePayerOverride: this._getFeePayer(),
      maxAggregationAttempts: this.maxAggregationAttempts
    })

    if (success) {
      this.logger.info(`Successfully attestested for challenge [${challengeId}] for user [${decodeHashId(userId)}], amount [${amount}]!`)
      return {
        challengeId,
        userId,
        specifier,
        amount,
        handle,
        wallet,
        completedBlocknumber
      }
    }

    // Handle error path
    this.logger.error(`Failed to attest for challenge [${challengeId}] for user [${decodeHashId(userId)}], amount [${amount}], oracle: [${this.aaoAddress}] at phase: [${phase}] with error [${error}]`)

    return {
      challengeId,
      userId,
      specifier,
      amount,
      handle,
      wallet,
      completedBlocknumber,
      error,
      phase
    }
  }

  async _selectDiscoveryNodes () {
    this.logger.info(`Selecting discovery nodes`, { endpointPool: this.endpointPool })
    const endpoints = await this.libs.discoveryProvider.serviceSelector.findAll({
      verbose: true,
      whitelist: this.endpointPool.size > 0 ? this.endpointPool : null
    })
    this.endpoints = await this.libs.Rewards.ServiceProvider.getUniquelyOwnedDiscoveryNodes(this.quorumSize, Array.from(endpoints))
    this.logger.info(`Selected new discovery nodes: [${this.endpoints}]`)
  }

  /**
   * Fetches new undisbursed rewards and inserts them into the undisbursedQueue
   * if the queue is currently empty.
   *
   * @memberof RewardsAttester
   */
  async _refillQueueIfNecessary () {
    if (this.undisbursedQueue.length) return {}

    this.logger.info(`Refilling queue with startingBlock: ${this.startingBlock}, offset: ${this.offset}, recently disbursed: ${JSON.stringify(this.recentlyDisbursedQueue)}`)
    const { success: disbursable, error } = await this.libs.Rewards.getUndisbursedChallenges({ offset: this.offset, completedBlockNumber: this.startingBlock, logger: this.logger })

    if (error) {
      return { error }
    }

    if (disbursable.length) {
      this.logger.info(`Got challenges: ${disbursable.map(({ challenge_id, user_id, specifier }) => (`${challenge_id}-${user_id}-${specifier}`))}`) // eslint-disable-line
    }

    // Map to camelCase, and filter out
    // any challenges in the denylist or recently disbursed set
    this.undisbursedQueue = disbursable
      .map(({
        challenge_id, // eslint-disable-line
        user_id, // eslint-disable-line
        specifier,
        amount,
        handle,
        wallet,
        completed_blocknumber // eslint-disable-line
      }) => ({
        challengeId: challenge_id,
        userId: user_id,
        specifier,
        amount,
        handle,
        wallet,
        completedBlocknumber: completed_blocknumber
      }))
      .filter(d => !(this.challengeIdsDenyList.has(d.challengeId) || (new Set(this.recentlyDisbursedQueue)).has(this._disbursementToKey(d))))

    // Filter out recently disbursed challenges
    if (this.undisbursedQueue.length) {
      this.undisbursedQueue = await this._filterRecentlyCompleted(this.undisbursedQueue)
    }

    this.logger.info(`Got ${disbursable.length} undisbursed challenges${this.undisbursedQueue.length !== disbursable.length ? `, filtered out [${disbursable.length - this.undisbursedQueue.length}] challenges.` : '.'}`)
    return {}
  }

  /**
   * Processes responses from `_performSingleAttestation`,
   * bucketing errors into those that need retry and those that should be skipped.
   *
   * @param {Array<AttestationResponse>} responses
   * @return {{
   *    successful: Array<AttestationResponse>,
   *    noRetry: Array<AttestationResponse>,
   *    needsRetry: Array<AttestationResponse>,
   *    shouldReslect: boolean
   * }}
   * @memberof RewardsAttester
   */

  _processResponses (responses, isFinalAttempt) {
    const errors = SubmitAndEvaluateError
    const AAO_ERRORS = new Set([errors.HCAPTCHA, errors.COGNITO_FLOW, errors.BLOCKED, errors.OTHER])
    // Account for errors from DN aggregation + Solana program
    // CHALLENGE_INCOMPLETE and MISSING_CHALLENGES are already handled in the `submitAndEvaluate` flow -
    // safe to assume those won't work if we see them at this point.
    const NEEDS_RESELECT_ERRORS = new Set([errors.INSUFFICIENT_DISCOVERY_NODE_COUNT, errors.CHALLENGE_INCOMPLETE, errors.MISSING_CHALLENGES])
    const ALREADY_COMPLETE_ERRORS = new Set([errors.ALREADY_DISBURSED, errors.ALREADY_SENT])

    const noRetry = []
    const successful = []
    // Filter our successful responses
    let allErrors = responses.filter((res) => {
      if (!res.error) {
        successful.push(res)
        this.reporter.reportSuccess({ userId: decodeHashId(res.userId), challengeId: res.challengeId, amount: res.amount, specifier: res.specifier })
        return false
      }
      return true
    })

    // Filter out responses that are already disbursed
    const stillIncomplete = allErrors.filter(({ error }) => !ALREADY_COMPLETE_ERRORS.has(error))

    // Filter to errors needing retry
    const needsRetry = stillIncomplete.filter((res) => {
      const report = { userId: decodeHashId(res.userId), challengeId: res.challengeId, amount: res.amount, error: res.error, phase: res.phase, specifier: res.specifier }
      const isAAOError = AAO_ERRORS.has(res.error)
      // Filter out and handle unretryable AAO errors
      if (isAAOError) {
        noRetry.push(res)
        const errorType = {
          [errors.HCAPTCHA]: 'hcaptcha',
          [errors.COGNITO_FLOW]: 'cognito',
          [errors.BLOCKED]: 'blocked',
          [errors.OTHER]: 'other'
        }[res.error]
        report.reason = errorType
        this.reporter.reportAAORejection(report)
      } else if (isFinalAttempt) {
        // Final attempt at retries
        this.reporter.reportFailure(report)
      } else {
        // Otherwise, retry it
        this.reporter.reportRetry(report)
      }
      return !isAAOError && !isFinalAttempt
    })

    if (needsRetry.length) {
      this.logger.info(`Handling errors: ${JSON.stringify(needsRetry.map(({ error, phase }) => ({ error, phase })))}`)
    }

    // Reselect if necessary
    const shouldReselect = needsRetry.some(({ error }) => NEEDS_RESELECT_ERRORS.has(error))

    return {
      successful,
      noRetry,
      needsRetry,
      shouldReselect
    }
  }

  _disbursementToKey ({ challengeId, userId, specifier }) {
    return `${challengeId}_${userId}_${specifier}`
  }

  async _backoff (retryCount) {
    const backoff = Math.min(this.cooldownMsec * Math.pow(this.backoffExponent, retryCount), this.maxCooldownMsec)
    this.logger.info(`Waiting [${backoff}] msec`)
    return this._delay(backoff)
  }

  async _delay (waitTime) {
    return new Promise(resolve => setTimeout(resolve, waitTime))
  }

  async _addRecentlyDisbursed (challenges) {
    const ids = challenges.map(this._disbursementToKey)
    this.recentlyDisbursedQueue.push(...ids)
    if (this.recentlyDisbursedQueue.length > MAX_DISBURSED_CACHE_SIZE) {
      this.recentlyDisbursedQueue.splice(0, this.recentlyDisbursedQueue.length - MAX_DISBURSED_CACHE_SIZE)
    }
  }

  async _filterRecentlyCompleted (challenges) {
    const [poaThreshold, solanaThreshold] = await Promise.all([
      this.delayCalculator.getPOABlockThreshold(),
      this.delayCalculator.getSolanaSlotThreshold()
    ])

    this.logger.info(`Filtering with POA threshold: ${poaThreshold}, Solana threshold: ${solanaThreshold}`)
    const res = challenges.filter(c => (
      c.completedBlocknumber <= (this.isSolanaChallenge(c.challengeId) ? solanaThreshold : poaThreshold)
    ))
    if (res.length < challenges.length) {
      this.logger.info(`Filtered out ${challenges.length - res.length} recent challenges`)
    }
    return res
  }
}

module.exports = RewardsAttester
module.exports.AttestationDelayCalculator = AttestationDelayCalculator
