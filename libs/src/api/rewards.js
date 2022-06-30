const axios = require('axios')
const { sampleSize } = require('lodash')

const { Base, Services } = require('./base')
const BN = require('bn.js')
const { RewardsManagerError } = require('../services/solanaWeb3Manager/errors')
const { WAUDIO_DECMIALS } = require('../constants')
const { Utils } = require('../utils/utils')

const { decodeHashId } = Utils

const GetAttestationError = Object.freeze({
  CHALLENGE_INCOMPLETE: 'CHALLENGE_INCOMPLETE',
  ALREADY_DISBURSED: 'ALREADY_DISBURSED',
  INVALID_ORACLE: 'INVALID_ORACLE',
  MISSING_CHALLENGES: 'MISSING_CHALLENGES',
  INVALID_INPUT: 'INVALID_INPUT',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  HCAPTCHA: 'HCAPTCHA',
  COGNITO_FLOW: 'COGNITO_FLOW',
  DISCOVERY_NODE_ATTESTATION_ERROR: 'DISCOVERY_NODE_ATTESTATION_ERROR',
  DISCOVERY_NODE_UNKNOWN_RESPONSE: 'DISCOVERY_NODE_UNKNOWN_RESPONSE',
  AAO_ATTESTATION_ERROR: 'AAO_ATTESTATION_ERROR',
  AAO_ATTESTATION_REJECTION: 'AAO_ATTESTATION_REJECTION',
  AAO_ATTESTATION_UNKNOWN_RESPONSE: 'AAO_ATTESTATION_UNKNOWN_RESPONSE',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
})

const AggregateAttestationError = Object.freeze(
  {
    INSUFFICIENT_DISCOVERY_NODE_COUNT: 'INSUFFICIENT_DISCOVERY_NODE_COUNT',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  }
)

const GetSenderAttestationError = Object.freeze({
  REQUEST_FOR_ATTESTATION_FAILED: 'REQUEST_FOR_ATTESTATION_FAILED'
})

/**
 * Combined error type for `SubmitAndEvaluate`
 */
const SubmitAndEvaluateError = Object.freeze({
  ...GetAttestationError,
  ...AggregateAttestationError,
  ...RewardsManagerError
})

const AttestationPhases = Object.freeze({
  SANITY_CHECKS: 'SANITY_CHECKS',
  AGGREGATE_ATTESTATIONS: 'AGGREGATE_ATTESTATIONS',
  SUBMIT_ATTESTATIONS: 'SUBMIT_ATTESTATIONS',
  EVALUATE_ATTESTATIONS: 'EVALUATE_ATTESTATIONS'
})

const AAO_REQUEST_TIMEOUT_MS = 15 * 1000
const WRAPPED_AUDIO_PRECISION = 10 ** WAUDIO_DECMIALS

/**
 * @typedef {import("../services/solanaWeb3Manager/rewards.js").AttestationMeta} AttestationMeta
 */

class Rewards extends Base {
  constructor (ServiceProvider, ...args) {
    super(...args)
    this.ServiceProvider = ServiceProvider
  }

  /**
   *
   * Top level method to aggregate attestations, submit them to RewardsManager, and evalute the result.
   *
   * @typedef {Object} GetSubmitAndEvaluateAttestationsReturn
   * @property {Boolean} success
   * @property {GetAttestationError} error
   *
   * @param {{
   *   challengeId: string,
   *   encodedUserId: string,
   *   handle: string,
   *   recipientEthAddress: string,
   *   specifier: string,
   *   oracleEthAddress: string,
   *   amount: number,
   *   quorumSize: number,
   *   AAOEndpoint: string,
   *   endpoints: Array<string>,
   *   instructionsPerTransaction?: number,
   *   maxAggregationAttempts?: number
   *   logger: any
   *   feePayerOverride: string | null
   * }} {
   *   challengeId,
   *   encodedUserId,
   *   handle,
   *   recipientEthAddress,
   *   specifier,
   *   oracleEthAddress,
   *   amount,
   *   quorumSize,
   *   AAOEndpoint,
   *   endpoints,
   *   maxAggregationAttempts,
   *   instructionsPerTransaction,
   *   logger,
   *   feePayerOverride
   * }
   * @returns {Promise<GetSubmitAndEvaluateAttestationsReturn>}
   * @memberof Challenge
   */
  async submitAndEvaluate ({
    challengeId, encodedUserId, handle, recipientEthAddress, specifier, oracleEthAddress, amount, quorumSize, AAOEndpoint, instructionsPerTransaction, maxAggregationAttempts = 20, endpoints = null, logger = console, feePayerOverride = null
  }) {
    let phase
    let nodesToReselect = null
    try {
      phase = AttestationPhases.SANITY_CHECKS

      // fail if amount is a decimal
      if ((Number(amount) !== amount) || (amount % 1 !== 0)) {
        throw new Error('Invalid amount')
      }

      // Aggregate

      logger.info(`submitAndEvaluate: aggregating attestations for userId [${decodeHashId(encodedUserId)}], challengeId [${challengeId}]`)
      phase = AttestationPhases.AGGREGATE_ATTESTATIONS
      const { discoveryNodeAttestations, aaoAttestation, error: aggregateError, erroringNodes } = await this.aggregateAttestations({
        challengeId, encodedUserId, handle, specifier, oracleEthAddress, amount, quorumSize, AAOEndpoint, endpoints, logger, maxAttempts: maxAggregationAttempts
      })
      if (aggregateError) {
        nodesToReselect = erroringNodes
        throw new Error(aggregateError)
      }

      // Submit

      logger.info(`submitAndEvaluate: submitting for challenge [${challengeId}], userId: [${decodeHashId(encodedUserId)}] with [${discoveryNodeAttestations.length}] DN and [${aaoAttestation ? 1 : 0}] oracle attestations.`)
      const fullTokenAmount = new BN(amount * WRAPPED_AUDIO_PRECISION)
      phase = AttestationPhases.SUBMIT_ATTESTATIONS
      const { errorCode: submitErrorCode, error: submitError } = await this.solanaWeb3Manager.submitChallengeAttestations({
        attestations: discoveryNodeAttestations,
        oracleAttestation: aaoAttestation,
        challengeId,
        specifier,
        recipientEthAddress,
        tokenAmount: fullTokenAmount,
        instructionsPerTransaction,
        logger,
        feePayerOverride
      })

      // In the case of an unparseable error,
      // we'll only have the error, not the code.
      if (submitErrorCode || submitError) {
        const shouldRetryInSeperateTransactions = (
          submitErrorCode === RewardsManagerError.REPEATED_SENDERS ||
          submitErrorCode === RewardsManagerError.SIGN_COLLISION ||
          submitErrorCode === RewardsManagerError.OPERATOR_COLLISION
        )
        // If we have sender collisions, we should
        // submit one attestation per transaction and try to get
        // into a good state.
        // TODO: in the case this retry fails, we still proceed
        // to evaluate phase and will error there (not ideal)
        if (shouldRetryInSeperateTransactions) {
          logger.warn(`submitAndEvaluate: saw repeat senders for userId [${decodeHashId(encodedUserId)}] challengeId: [${challengeId}] with err: ${submitErrorCode}, breaking up into individual transactions`)
          await this.solanaWeb3Manager.submitChallengeAttestations({
            attestations: discoveryNodeAttestations,
            oracleAttestation: aaoAttestation,
            challengeId,
            specifier,
            recipientEthAddress,
            tokenAmount: fullTokenAmount,
            instructionsPerTransaction: 2, // SECP + Attestation
            logger,
            feePayerOverride
          })
        } else {
          throw new Error(submitErrorCode || submitError)
        }
      }

      // Evaluate

      logger.info(`submitAndEvaluate: evaluating for challenge [${challengeId}], userId: [${decodeHashId(encodedUserId)}]`)
      phase = AttestationPhases.EVALUATE_ATTESTATIONS
      const { errorCode: evaluateErrorCode, error: evaluateError } = await this.solanaWeb3Manager.evaluateChallengeAttestations({
        challengeId,
        specifier,
        recipientEthAddress,
        oracleEthAddress,
        tokenAmount: fullTokenAmount,
        logger,
        feePayerOverride
      })

      if (evaluateErrorCode || evaluateError) {
        throw new Error(evaluateErrorCode || evaluateError)
      }

      return { success: true, error: null, phase: null, nodesToReselect: null }
    } catch (e) {
      const err = e.message
      const log = (err === GetAttestationError.COGNITO_FLOW || err === GetAttestationError.HCAPTCHA) ? logger.info : logger.error
      log(`submitAndEvaluate: failed for userId: [${decodeHashId(encodedUserId)}] challenge-id [${challengeId}] at phase [${phase}] with err: ${err}`)
      return { success: false, error: err, phase, nodesToReselect }
    }
  }

  /**
   *
   * Aggregates attestations from Discovery Nodes and AAO.
   *
   * @typedef {Object} AttestationsReturn
   * @property {Array<AttestationMeta>} discoveryNodeAttestations
   * @property {AttestationMeta} aaoAttestation
   * @property {GetAttestationError} error
   *
   * @param {{
   *   challengeId: string,
   *   encodedUserId: string,
   *   handle: string,
   *   specifier: string,
   *   oracleEthAddress: string,
   *   amount: number,
   *   quorumSize: number,
   *   AAOEndpoint: string,
   *   maxAttempts: number
   *   endpoints = null
   *   logger: any
   * }} {
   *   challengeId,
   *   encodedUserId,
   *   handle,
   *   specifier,
   *   oracleEthAddress,
   *   amount,
   *   quorumSize,
   *   AAOEndpoint,
   *   maxAttempts
   *   endpoints = null,
   *   logger
   * }
   * @returns {Promise<AttestationsReturn>}
   * @memberof Rewards
   */
  async aggregateAttestations ({ challengeId, encodedUserId, handle, specifier, oracleEthAddress, amount, quorumSize, AAOEndpoint, maxAttempts, endpoints = null, logger = console }) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)

    if (endpoints) {
      endpoints = sampleSize(endpoints, quorumSize)
    } else {
      // If no endpoints array provided, select here
      endpoints = await this.ServiceProvider.getUniquelyOwnedDiscoveryNodes({ quorumSize })
    }

    if (endpoints.length < quorumSize) {
      logger.error(`Tried to fetch [${quorumSize}] attestations, but only found [${endpoints.length}] registered nodes.`)

      return {
        discoveryNodeAttestations: null,
        aaoAttestation: null,
        error: AggregateAttestationError.INSUFFICIENT_DISCOVERY_NODE_COUNT,
        erroringNodes: null
      }
    }

    // First attempt AAO

    let aaoAttestation = null

    try {
      const { success, error: aaoAttestationError } = await this.getAAOAttestation({
        challengeId,
        specifier,
        handle,
        amount,
        AAOEndpoint,
        oracleEthAddress
      })

      if (aaoAttestationError) {
        return {
          discoveryNodeAttestations: null,
          aaoAttestation: null,
          error: aaoAttestationError,
          erroringNodes: null
        }
      }
      aaoAttestation = success
    } catch (e) {
      const err = e.message
      logger.error(`Failed to aggregate attestations for user [${decodeHashId(encodedUserId)}], challenge-id: [${challengeId}] with err: ${err}`)
      return {
        discoveryNodeAttestations: null,
        aaoAttestation: null,
        error: GetAttestationError.AAO_ATTESTATION_ERROR,
        erroringNodes: null
      }
    }

    // Then attempt DNs

    try {
      const discoveryNodeAttestationResults = await this._getDiscoveryAttestationsWithRetries({
        endpoints,
        challengeId,
        encodedUserId,
        specifier,
        oracleEthAddress,
        logger,
        maxAttempts
      })

      const discoveryNodeSuccesses = discoveryNodeAttestationResults.map(r => r.success)
      const discoveryNodeErrors = discoveryNodeAttestationResults.map(r => r.error)
      const error = discoveryNodeErrors.find(Boolean)
      if (error) {
        // Propagate out the specific nodes that errored
        const erroringNodes = discoveryNodeAttestationResults.filter(r => r.error).map(r => r.endpoint)
        return {
          discoveryNodeAttestations: null,
          aaoAttestation: null,
          error,
          erroringNodes
        }
      }

      return {
        discoveryNodeAttestations: discoveryNodeSuccesses,
        aaoAttestation,
        error: null,
        erroringNodes: null
      }
    } catch (e) {
      const err = e.message
      logger.error(`Failed to aggregate attestations for user [${decodeHashId(encodedUserId)}], challenge-id: [${challengeId}] with err: ${err}`)
      return {
        discoveryNodeAttestations: null,
        aaoAttestation: null,
        error: GetAttestationError.DISCOVERY_NODE_ATTESTATION_ERROR,
        erroringNodes: null
      }
    }
  }

  /**
   *
   * Retrieves a Discovery Node attestation for a given userId.
   *
   * @typedef {Object} GetAttestationReturn
   * @property {AttestationMeta} success
   * @property {GetAttestationError} error
   *
   * @param {{
   *   challengeId: string,
   *   encodedUserId: string,
   *   specifier: string,
   *   oracleEthAddress: string,
   *   discoveryProviderEndpoint: string
   *   logger: any
   * }} {
   *   challengeId,
   *   encodedUserId,
   *   specifier,
   *   oracleEthAddress,
   *   discoveryProviderEndpoint
   *   logger
   * }
   * @returns {Promise<GetAttestationReturn>}
   * @memberof Challenge
   */
  async getChallengeAttestation ({ challengeId, encodedUserId, specifier, oracleEthAddress, discoveryProviderEndpoint, logger = console }) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    try {
      const res = await this.discoveryProvider.getChallengeAttestation(
        challengeId,
        encodedUserId,
        specifier,
        oracleEthAddress,
        discoveryProviderEndpoint
      )

      const meta = {
        ethAddress: res.owner_wallet,
        signature: res.attestation
      }

      return { success: meta, error: null }
    } catch (e) {
      const err = e.message
      logger.error(`Failed to get challenge attestation for userId [${decodeHashId(encodedUserId)}] challengeId [${challengeId}]from ${discoveryProviderEndpoint} with ${err}`)
      const mappedErr = GetAttestationError[err] || GetAttestationError.DISCOVERY_NODE_UNKNOWN_RESPONSE
      return {
        success: null,
        error: mappedErr
      }
    }
  }

  async getUndisbursedChallenges ({ limit, offset, completedBlockNumber, encodedUserId, logger = console } = { logger: console }) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    try {
      const res = await this.discoveryProvider.getUndisbursedChallenges(
        limit,
        offset,
        completedBlockNumber,
        encodedUserId
      )
      return { success: res, error: null }
    } catch (e) {
      const error = e.message
      logger.error(`Failed to get undisbursed challenges with error: ${error}`)
      return {
        success: null,
        error
      }
    }
  }

  /**
   *
   * Retrieves an AAO attestation for a given user handle.
   *
   * @typedef {Object} GetAAOAttestationReturn
   * @property {AttestationMeta} success
   * @property {GetAttestationError} error
   *
   * @param {{
   *   challengeId: string,
   *   specifier: string,
   *   handle: string,
   *   amount: number,
   *   AAOEndpoint: string,
   *   oracleEthAddress: string
   *   logger: any
   * }} {
   *   challengeId,
   *   specifier,
   *   handle,
   *   amount,
   *   AAOEndpoint,
   *   oracleEthAddress,
   *   logger
   * }
   * @returns {Promise<GetAAOAttestationReturn>}
   * @memberof Challenge
   */
  async getAAOAttestation ({ challengeId, specifier, handle, amount, AAOEndpoint, oracleEthAddress, logger = console }) {
    const data = {
      challengeId,
      challengeSpecifier: specifier,
      amount
    }
    const request = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      url: `${AAOEndpoint}/attestation/${handle}`,
      timeout: AAO_REQUEST_TIMEOUT_MS,
      data
    }

    try {
      const response = await axios(request)
      // if attestation is successful, 'result' represents a signature
      // otherwise, 'result' is false
      // - there may or may not be a value for `needs` if the attestation fails
      // - depending on whether the user can take an action to attempt remediation
      const { result, needs } = response.data

      if (!result) {
        logger.error(`Failed to get AAO attestation${needs ? `: needs ${needs}` : ''}`)
        const mappedErr = needs
          ? GetAttestationError[needs] || GetAttestationError.AAO_ATTESTATION_UNKNOWN_RESPONSE
          : GetAttestationError.AAO_ATTESTATION_REJECTION
        return {
          success: null,
          error: mappedErr
        }
      }

      return {
        success: {
          signature: result,
          ethAddress: oracleEthAddress
        },
        error: null
      }
    } catch (e) {
      const err = e.message
      logger.error(`Failed to get AAO attestation: ${err}`)
      return {
        success: null,
        error: GetAttestationError.AAO_ATTESTATION_ERROR
      }
    }
  }

  async _getDiscoveryAttestationsWithRetries ({
    endpoints,
    challengeId,
    encodedUserId,
    specifier,
    oracleEthAddress,
    logger,
    maxAttempts
  }) {
    let retryCount = 0
    let unrecoverableError = false
    const completedAttestations = []
    let needsAttestations = endpoints

    do {
      logger.info(`Aggregating attestations with retries challenge: ${challengeId}, userId: ${encodedUserId}, endpoints: ${needsAttestations}, attempt ${retryCount}`)
      if (retryCount > 0) {
        await (new Promise(resolve => setTimeout(resolve, 2000)))
      }

      const attestations = await Promise.all(needsAttestations.map(async endpoint => {
        const res = await this.getChallengeAttestation({
          challengeId,
          encodedUserId,
          specifier,
          oracleEthAddress,
          discoveryProviderEndpoint: endpoint,
          logger
        })
        return { endpoint, res }
      }))

      needsAttestations = []
      attestations.forEach(a => {
        // If it's a retryable error
        const isRetryable = a.res.error === GetAttestationError.CHALLENGE_INCOMPLETE ||
          a.res.error === GetAttestationError.MISSING_CHALLENGES

        if (isRetryable) {
          needsAttestations.push(a.endpoint)
          logger.info(`Node ${a.endpoint} challenge still incomplete for challenge [${challengeId}], userId: ${encodedUserId}`)
          // If final attempt, make sure we return the result
          if (retryCount === maxAttempts) {
            completedAttestations.push({ ...a.res, endpoint: a.endpoint })
          }
        } else {
          completedAttestations.push({ ...a.res, endpoint: a.endpoint })
          if (a.res.error) {
            unrecoverableError = true
          }
        }
      })

      retryCount++
    }
    while (needsAttestations.length && retryCount <= maxAttempts)

    if (needsAttestations.length || unrecoverableError) {
      logger.info(`Failed to aggregate attestations for challenge [${challengeId}], userId: [${decodeHashId(encodedUserId)}]`)
    } else {
      logger.info(`Successfully aggregated attestations for challenge [${challengeId}], userId: [${decodeHashId(encodedUserId)}]`)
    }
    return completedAttestations
  }

  /**
   *
   * Creates a new discovery node sender for rewards. A sender may
   * attest in user challenge completion to issue rewards.
   *
   * This method queries other discovery nodes asking for attestation of
   * a given new senderEthAddress (delegate wallet) and operatorEthAddress (owner wallet).
   * Those attestations are bundled
   *
   * @param {{
   *   senderEthAddress: string
   *   operatorEthAddress: string
   *   senderEndpoint: string
   *   endpoints?: string[]
   *   numAttestations?: number
   *   feePayerOverride?: string
   * }} {
   *   senderEthAddress: the new sender eth address to add. The delegate wallet.
   *   operatorEthAddress: the unique address of the operator that runs this service
   *   senderEndpoint: the new sender's service endpoint
   *   endpoints: optional endpoints from other nodes. If not provided, nodes are selected from chain.
   *   numAttestations: optional number of attestations to get from other nodes, default 3
   *   feePayerOverride: optional override feepayer
   * }
   * @memberof Rewards
   */
  async createSenderPublic ({
    senderEthAddress,
    operatorEthAddress,
    senderEndpoint,
    endpoints,
    numAttestations = 3,
    feePayerOverride
  }) {
    let attestEndpoints
    if (endpoints) {
      attestEndpoints = sampleSize(endpoints, numAttestations)
    } else {
      attestEndpoints = await this.ServiceProvider.getUniquelyOwnedDiscoveryNodes({quorumSize: numAttestations, useWhitelist: false, filter: async (node) => {
        const isRegistered = await this.solanaWeb3Manager.getIsDiscoveryNodeRegistered(node.delegateOwnerWallet)
        return isRegistered
      }})
    }

    if (attestEndpoints.length < numAttestations) {
      throw new Error(`Not enough other nodes found, need ${numAttestations}, found ${attestEndpoints.length}`)
    }

    let error = null
    const attestations = await Promise.all(attestEndpoints.map(async attestEndpoint => {
      try {
        const res = await this.discoveryProvider.getCreateSenderAttestation(
          senderEthAddress,
          attestEndpoint
        )
        return {
          ethAddress: res.owner_wallet,
          signature: res.attestation
        }
      } catch (e) {
        console.error(e)
        error = true
      }
    }))
    if (error) {
      console.error(`Failed to get attestations from other nodes ${attestEndpoints}`)
      return {
        success: null,
        error: GetSenderAttestationError.REQUEST_FOR_ATTESTATION_FAILED
      }
    }

    // Register the server as a sender on the rewards manager
    const receipt = await this.solanaWeb3Manager.createSender({
      senderEthAddress,
      operatorEthAddress,
      attestations,
      feePayerOverride
    })
    return receipt
  }

  /**
   * Logs results of an attestation to identity.
   *
   * @param {{
   *  status: string,
   *  userId: string,
   *  challengeId: string,
   *  amount: number,
   *  source: string
   *  specifier: string
   *  error?: string,
   *  phase?: string,
   *  reason?: string
   * }} { status, userId, challengeId, amount, error, phase, specifier, reason }
   * @memberof IdentityService
   */
  async sendAttestationResult ({ status, userId, challengeId, amount, error, phase, source, specifier, reason }) {
    await this.identityService.sendAttestationResult({
      status,
      userId,
      challengeId,
      amount,
      error,
      phase,
      source,
      specifier,
      reason
    })
  }
}

module.exports = Rewards
module.exports.SubmitAndEvaluateError = SubmitAndEvaluateError
module.exports.AttestationPhases = AttestationPhases
