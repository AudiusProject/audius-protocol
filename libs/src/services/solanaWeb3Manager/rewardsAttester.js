const { sampleSize } = require('lodash')
const { SubmitAndEvaluateError } = require('../../api/rewards')
const { decodeHashId } = require('../../utils/utils')

// `BaseRewardsReporter` is intended to be subclassed, and provides
// "reporting" functionality to RewardsAttester (i.e. posts to Slack if something notable happens)
class BaseRewardsReporter {
  async reportSuccess ({ userId, challengeId, amount }) {}

  async reportFailure ({ userId, challengeId, amount, error, phase }) {}

  async reportAAORejection ({ userId, challengeId, amount, error }) {}
}

const SOLANA_BASED_CHALLENGE_IDS = new Set(['listen-streak'])

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
   *    logger: any
   *    quorumSize: number
   *    aaoEndpoint: string
   *    aaoAddress: string
   *    updateValues: function
   *    maxRetries: number
   *    reporter: BaseRewardsReporter
   *    challengeIdsDenyList: Array<string>
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
   *    maxRetries = 3,
   *    reporter,
   *    challengeIdsDenyList
   *  }
   * @memberof RewardsAttester
   */
  constructor ({ libs, startingBlock, offset, parallelization, logger, quorumSize, aaoEndpoint, aaoAddress, updateValues = () => {}, maxRetries = 5, reporter, challengeIdsDenyList }) {
    this.libs = libs
    this.logger = logger
    this.parallelization = parallelization
    this.startingBlock = startingBlock
    this.offset = offset
    this.quorumSize = quorumSize
    this.aaoEndpoint = aaoEndpoint
    this.aaoAddress = aaoAddress
    this.reporter = reporter || new BaseRewardsReporter()
    this.endpoints = []
    this.maxRetries = maxRetries
    this.updateValues = updateValues
    this.challengeIdsDenyList = new Set(...challengeIdsDenyList)
    // Stores a queue of undisbursed challenges
    this.undisbursedQueue = []
    // Stores a set of identifiers representing
    // recently disbursed challenges.
    this.recentlyDisbursedSet = new Set()
    // How long wait wait before retrying
    this.cooldownMsec = 2000
    // How much we increase the cooldown between attempts:
    // coolDown = min(cooldownMsec * backoffExponent ^ retryCount, maxCooldownMsec)
    this.backoffExponent = 1.8
    // Maximum time to wait before retrying
    this.maxCooldownMsec = 15000
    // Maximum number of retries before moving on
    this.maxRetries = maxRetries

    this._performSingleAttestation = this._performSingleAttestation.bind(this)
    this._disbursementToKey = this._disbursementToKey.bind(this)
  }

  /**
   * Begin attestation loop.
   *
   * @memberof RewardsAttester
   */
  async start () {
    this.logger.info(`Starting attester with:
      quorum size: ${this.quorumSize}, \
      parallelization: ${this.parallelization} \
      AAO endpoint: ${this.aaoEndpoint} \
      AAO address: ${this.aaoAddress}
    `)
    await this._selectDiscoveryNodes()

    while (true) {
      try {
        await this._awaitFeePayerBalance()
        await this._attestInParallel()
      } catch (e) {
        this.logger.error(`Got error: ${e}, sleeping`)
        await this._delay(1000)
      }
    }
  }

  /**
   * Sleeps until the feePayer has a usable Sol balance.
   *
   * @memberof RewardsAttester
   */
  async _awaitFeePayerBalance () {
    const getHasBalance = async () => this.libs.solanaWeb3Manager.hasBalance({ publicKey: this.libs.solanaWeb3Manager.feePayerKey })
    while (!(await getHasBalance())) {
      this.logger.warning('No usable balance. Waiting...')
      await this._delay(2000)
    }
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
  async _attestInParallel () {
    this.logger.info(`Attesting in parallel with startingBlock: ${this.startingBlock}, offset: ${this.offset}, parallelization: ${this.parallelization}`)

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
      return
    }

    // Get undisbursed rewards
    let toAttest = this.undisbursedQueue.splice(0, this.parallelization)
    // Get the highest block number, ignoring Solana based challenges (i.e. listens) which have a significantly higher
    // slot and throw off this calculation.
    // TODO: [AUD-1217] we should handle this in a less hacky way, possibly by
    // attesting for Solana + POA challenges separately.
    const poaAttestations = toAttest.filter(({ challengeId }) => !SOLANA_BASED_CHALLENGE_IDS.has(challengeId))
    const highestBlock = poaAttestations.length ? Math.max(...poaAttestations.map(e => e.completedBlocknumber)) : null

    // Attempt to attest in a single sweep
    const results = await Promise.all(toAttest.map(this._performSingleAttestation))

    // "Process" the results of attestation into noRetry and needsRetry errors,
    // as well as a flag that indicates whether we should reselect.
    let { successful, noRetry, needsRetry, shouldReselect } = await this._processResponses(results)
    let successCount = successful.length

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
      ;({ successful, needsRetry, noRetry, shouldReselect } = await this._processResponses(res))

      offset += noRetry.filter(({ completedBlocknumber }) => completedBlocknumber === highestBlock).length
      successCount += successful.length
    }

    if (retryCount === this.maxRetries) {
      this.logger.error(`Gave up with ${retryCount} retries`)
    }

    // Set startingBlock and offset
    this.startingBlock = highestBlock ? highestBlock - 1 : this.startingBlock
    this.offset = offset
    this.logger.info(`Updating values: startingBlock: ${this.startingBlock}, offset: ${this.offset}`)

    // Set the recently disbursed set
    this.recentlyDisbursedSet = new Set(results.map(this._disbursementToKey))

    // run the `updateValues` callback
    await this.updateValues({ startingBlock: this.startingBlock, offset: this.offset, successCount })
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
   *     instructionsPerTransaction?: number
   * }} {
   *     challengeId,
   *     userId,
   *     specifier,
   *     amount,
   *     handle,
   *     wallet,
   *     completedBlocknumber,
   *     instructionsPerTransaction
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
    completedBlocknumber,
    instructionsPerTransaction
  }) {
    this.logger.info(`Attempting to attest for userId [${decodeHashId(userId)}], challengeId: [${challengeId}], quorum size: [${this.quorumSize}] ${instructionsPerTransaction ? '[with single attestation flow!]' : ''}`)
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
      instructionsPerTransaction,
      logger: this.logger
    })

    if (success) {
      this.logger.info(`Successfully attestested for challenge [${challengeId}] for user [${decodeHashId(userId)}], amount [${amount}]!`)
      await this.reporter.reportSuccess({ userId, challengeId, amount })
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
    await this.reporter.reportFailure({
      phase,
      error,
      amount,
      userId,
      challengeId
    })

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
    this.logger.info(`Selecting discovery nodes`)
    const endpoints = await this.libs.discoveryProvider.serviceSelector.findAll()
    this.endpoints = sampleSize(endpoints, this.quorumSize)
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

    this.logger.info(`Refilling queue, recently disbursed: ${JSON.stringify(this.recentlyDisbursedSet)}`)
    const { success: disbursable, error } = await this.libs.Rewards.getUndisbursedChallenges({ offset: this.offset, completedBlockNumber: this.startingBlock, logger: this.logger })

    if (error) {
      return { error }
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
      .filter(d => !(this.challengeIdsDenyList.has(d.challengeId) || this.recentlyDisbursedSet.has(this._disbursementToKey(d))))

    this.logger.info(`Got ${disbursable.length} undisbursed challenges${this.undisbursedQueue.length !== disbursable.length ? `, filtered out [${disbursable.length - this.undisbursedQueue.length}] recently disbursed challenges.` : '.'}`)
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
  async _processResponses (responses) {
    const errors = SubmitAndEvaluateError
    const AAO_ERRORS = new Set([errors.HCAPTCHA, errors.COGNITO_FLOW, errors.BLOCKED])
    const NEEDS_RESELECT_ERRORS = new Set([errors.INSUFFICIENT_DISCOVERY_NODE_COUNT, errors.CHALLENGE_INCOMPLETE])
    // Account for errors from DN aggregation + Solana program
    const NO_RETRY_ERRORS = new Set([errors.ALREADY_DISBURSED, errors.ALREADY_SENT])

    const noRetry = []
    const successful = []
    // Filter down to errors needing retry
    let needsRetry = (responses
      // Filter our successful responses
      .filter((res) => {
        if (!res.error) {
          successful.push(res)
          return false
        }
        return true
      })
      // Filter out responses that are already disbursed
      .filter(({ error }) => !NO_RETRY_ERRORS.has(error))
      // Handle any AAO errors - report them and then exclude them from result set
      .filter((res) => {
        const isAAO = AAO_ERRORS.has(res.error)
        if (isAAO) {
          this.reporter.reportAAORejection({ userId: res.userId, challengeId: res.challengeId, amount: res.amount, error: res.error })
          noRetry.push(res)
        }
        return !isAAO
      })
    )

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

  _disbursementToKey ({ challengeId, userId }) {
    return `${challengeId}_${userId}`
  }

  async _backoff (retryCount) {
    const backoff = Math.min(this.cooldownMsec * Math.pow(this.backoffExponent, retryCount), this.maxCooldownMsec)
    this.logger.info(`Waiting [${backoff}] msec`)
    return this._delay(backoff)
  }

  async _delay (waitTime) {
    return new Promise(resolve => setTimeout(resolve, waitTime))
  }
}

module.exports = RewardsAttester
