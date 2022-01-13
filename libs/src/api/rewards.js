const axios = require('axios')
const { Base, Services } = require('./base')
const BN = require('bn.js')
const { RewardsManagerError } = require('../services/solanaWeb3Manager/errors')
const { shuffle } = require('lodash')
const { WAUDIO_DECMIALS } = require('../constants')
const { sampleSize } = require('lodash')
const { decodeHashId } = require('../utils/utils')

const GetAttestationError = Object.freeze({
  CHALLENGE_INCOMPLETE: 'CHALLENGE_INCOMPLETE',
  ALREADY_DISBURSED: 'ALREADY_DISBURSED',
  INVALID_ORACLE: 'INVALID_ORACLE',
  MISSING_CHALLENGES: 'MISSING_CHALLENGES',
  INVALID_INPUT: 'INVALID_INPUT',
  HCAPTCHA: 'HCAPTCHA',
  COGNITO_FLOW: 'COGNITO_FLOW',
  BLOCKED: 'BLOCKED',
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
   *   logger: any
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
   *   instructionsPerTransaction,
   *   logger
   *   }
   * @returns {Promise<GetSubmitAndEvaluateAttestationsReturn>}
   * @memberof Challenge
   */
  async submitAndEvaluate ({
    challengeId, encodedUserId, handle, recipientEthAddress, specifier, oracleEthAddress, amount, quorumSize, AAOEndpoint, instructionsPerTransaction, endpoints = null, logger = console
  }) {
    let phase
    try {
      phase = AttestationPhases.SANITY_CHECKS

      // fail if amount is a decimal
      if ((Number(amount) !== amount) || (amount % 1 !== 0)) {
        throw new Error('Invalid amount')
      }

      // Aggregate

      logger.info(`submitAndEvaluate: aggregating attestations for userId [${decodeHashId(encodedUserId)}], challengeId [${challengeId}]`)
      phase = AttestationPhases.AGGREGATE_ATTESTATIONS
      const { discoveryNodeAttestations, aaoAttestation, error: aggregateError } = await this.aggregateAttestations({
        challengeId, encodedUserId, handle, specifier, oracleEthAddress, amount, quorumSize, AAOEndpoint, endpoints, logger
      })
      if (aggregateError) {
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
        logger
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
            logger
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
        logger
      })

      if (evaluateErrorCode || evaluateError) {
        throw new Error(evaluateErrorCode || evaluateError)
      }

      return { success: true, error: null, phase: null }
    } catch (e) {
      const err = e.message
      logger.error(`submitAndEvaluate: failed for userId: [${decodeHashId(encodedUserId)}] challenge-id [${challengeId}] at phase [${phase}] with err: ${err}`)
      return { success: false, error: err, phase }
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
   *   endpoints = null,
   *   logger
   * }
   * @returns {Promise<AttestationsReturn>}
   * @memberof Rewards
   */
  async aggregateAttestations ({ challengeId, encodedUserId, handle, specifier, oracleEthAddress, amount, quorumSize, AAOEndpoint, endpoints = null, logger = console }) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)

    if (endpoints) {
      endpoints = sampleSize(endpoints, quorumSize)
    } else {
      // If no endpoints array provided, select here
      endpoints = await this.ServiceProvider.getUniquelyOwnedDiscoveryNodes(quorumSize)
    }

    if (endpoints.length < quorumSize) {
      logger.error(`Tried to fetch [${quorumSize}] attestations, but only found [${endpoints.length}] registered nodes.`)

      return {
        discoveryNodeAttestations: null,
        aaoAttestation: null,
        error: AggregateAttestationError.INSUFFICIENT_DISCOVERY_NODE_COUNT
      }
    }

    try {
      const discprovAttestations = endpoints.map(e => this.getChallengeAttestation({ challengeId, encodedUserId, specifier, oracleEthAddress, discoveryProviderEndpoint: e, logger }))
      const AAOAttestation = this.getAAOAttestation({
        challengeId,
        specifier,
        handle,
        amount,
        AAOEndpoint,
        oracleEthAddress
      })

      const res = await Promise.all([...discprovAttestations, AAOAttestation])
      const discoveryNodeAttestationResults = res.slice(0, -1)
      const discoveryNodeAttestations = discoveryNodeAttestationResults.map(r => r.success)
      const discoveryNodeAttestationErrors = discoveryNodeAttestationResults.map(r => r.error)
      const { success: aaoAttestation, error: aaoAttestationError } = res[res.length - 1]

      const error = aaoAttestationError || discoveryNodeAttestationErrors.find(Boolean)
      if (error) {
        return {
          discoveryNodeAttestations: null,
          aaoAttestation: null,
          error
        }
      }

      return {
        discoveryNodeAttestations,
        aaoAttestation,
        error: null
      }
    } catch (e) {
      const err = e.message
      logger.error(`Failed to aggregate attestations for user [${decodeHashId(encodedUserId)}], challenge-id: [${challengeId}] with err: ${err}`)
      return {
        discoveryNodeAttestations: null,
        aaoAttestation: null,
        error: GetAttestationError.UNKNOWN_ERROR
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
      const mappedErr = GetAttestationError[err] || GetAttestationError.UNKNOWN_ERROR
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
      const { result, needs } = response.data

      if (needs) {
        logger.error(`Failed to get AAO attestation: needs ${needs}`)
        const mappedErr = GetAttestationError[needs] || GetAttestationError.UNKNOWN_ERROR
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
        error: GetAttestationError.UNKNOWN_ERROR
      }
    }
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
   * }} {
   *   senderEthAddress: the new sender eth address to add. The delegate wallet.
   *   operatorEthAddress: the unique address of the operator that runs this service
   *   senderEndpoint: the new sender's service endpoint
   *   endpoints: optional endpoints from other nodes. If not provided, nodes are selected from chain.
   *   numAttestations: optional number of attestations to get from other nodes, default 3
   * }
   * @memberof Rewards
   */
  async createSenderPublic ({
    senderEthAddress,
    operatorEthAddress,
    senderEndpoint,
    endpoints,
    numAttestations = 3
  }) {
    if (!endpoints) {
      endpoints = await this.discoveryProvider.serviceSelector.findAll()
    }
    const attestEndpoints = shuffle(
      endpoints
    ).filter(s => s !== senderEndpoint).slice(0, numAttestations)
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
      attestations
    })
    return receipt
  }
}

module.exports = Rewards
module.exports.SubmitAndEvaluateError = SubmitAndEvaluateError
module.exports.AttestationPhases = AttestationPhases
