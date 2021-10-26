const axios = require('axios')
const { Base, Services } = require('./base')
const BN = require('bn.js')
const { RewardsManagerError } = require('../services/solanaWeb3Manager/errors')

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

/// Combined error type for `SubmitAndEvaluate`
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
const WRAPPED_AUDIO_PRECISION = 10 ** 9

/**
 * @typedef {import("../services/solanaWeb3Manager/rewards.js").AttestationMeta} AttestationMeta
 */

class Challenge extends Base {
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
   *   AAOEndpoint: string
   * }} {
   *   challengeId,
   *   encodedUserId,
   *   handle,
   *   recipientEthAddress,
   *   specifier,
   *   oracleEthAddress,
   *   amount,
   *   quorumSize,
   *   AAOEndpoint
   *   }
   * @returns {Promise<GetSubmitAndEvaluateAttestationsReturn>}
   * @memberof Challenge
   */
  async submitAndEvaluate ({
    challengeId, encodedUserId, handle, recipientEthAddress, specifier, oracleEthAddress, amount, quorumSize, AAOEndpoint
  }) {
    let phase
    try {
      phase = AttestationPhases.SANITY_CHECKS

      // fail if amount is a decimal
      if ((Number(amount) !== amount) || (amount % 1 !== 0)) {
        throw new Error('Invalid amount')
      }

      phase = AttestationPhases.AGGREGATE_ATTESTATIONS
      const { discoveryNodeAttestations, aaoAttestation, error: aggregateError } = await this.aggregateAttestations({
        challengeId, encodedUserId, handle, specifier, oracleEthAddress, amount, quorumSize, AAOEndpoint
      })

      if (aggregateError) {
        throw new Error(aggregateError)
      }

      const fullTokenAmount = new BN(amount * WRAPPED_AUDIO_PRECISION)

      phase = AttestationPhases.SUBMIT_ATTESTATIONS
      const { errorCode: submitErrorCode } = await this.solanaWeb3Manager.submitChallengeAttestations({
        attestations: discoveryNodeAttestations,
        oracleAttestation: aaoAttestation,
        challengeId,
        specifier,
        recipientEthAddress,
        tokenAmount: fullTokenAmount
      })

      if (submitErrorCode) {
        throw new Error(submitErrorCode)
      }

      phase = AttestationPhases.EVALUATE_ATTESTATIONS
      const { errorCode: evaluateErrorCode } = await this.solanaWeb3Manager.evaluateChallengeAttestations({
        challengeId,
        specifier,
        recipientEthAddress,
        oracleEthAddress,
        tokenAmount: fullTokenAmount
      })

      if (evaluateErrorCode) {
        throw new Error(evaluateErrorCode)
      }

      return { success: true, error: null }
    } catch (e) {
      const err = e.message
      console.log(`Failed to submit and evaluate attestations at phase ${phase}: ${err}`)
      return { success: false, error: err }
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
   * }} {
   *   challengeId,
   *   encodedUserId,
   *   handle,
   *   specifier,
   *   oracleEthAddress,
   *   amount,
   *   quorumSize,
   *   AAOEndpoint,
   *   endpoints = null
   * }
   * @returns {Promise<AttestationsReturn>}
   * @memberof Challenge
   */
  async aggregateAttestations ({ challengeId, encodedUserId, handle, specifier, oracleEthAddress, amount, quorumSize, AAOEndpoint, endpoints = null }) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)

    // If no endpoints array provided, select here
    if (!endpoints) {
      endpoints = await this.discoveryProvider.serviceSelector.findAll()
    }
    if (endpoints.length < quorumSize) {
      console.error(`Tried to fetch [${quorumSize}] attestations, but only found [${endpoints.length}] registered nodes.`)

      return {
        discoveryNodeAttestations: null,
        aaoAttestation: null,
        error: AggregateAttestationError.INSUFFICIENT_DISCOVERY_NODE_COUNT
      }
    }

    try {
      const discprovAttestations = endpoints.map(e => this.getChallengeAttestation({ challengeId, encodedUserId, specifier, oracleEthAddress, discoveryProviderEndpoint: e }))
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
      console.error(`Failed to aggregate attestations: ${err}`)
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
   * }} {
   *   challengeId,
   *   encodedUserId,
   *   specifier,
   *   oracleEthAddress,
   *   discoveryProviderEndpoint
   * }
   * @returns {Promise<GetAttestationReturn>}
   * @memberof Challenge
   */
  async getChallengeAttestation ({ challengeId, encodedUserId, specifier, oracleEthAddress, discoveryProviderEndpoint }) {
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
      console.log(`Failed to get challenge attestation from ${discoveryProviderEndpoint}: ${err}`)
      const mappedErr = GetAttestationError[err] || GetAttestationError.UNKNOWN_ERROR
      return {
        success: null,
        error: mappedErr
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
   * }} {
   *   challengeId,
   *   specifier,
   *   handle,
   *   amount,
   *   AAOEndpoint,
   *   oracleEthAddress
   * }
   * @returns {Promise<GetAAOAttestationReturn>}
   * @memberof Challenge
   */
  async getAAOAttestation ({ challengeId, specifier, handle, amount, AAOEndpoint, oracleEthAddress }) {
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
        console.log(`Failed to get AAO attestation: needs ${needs}`)
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
      console.log(`Failed to get AAO attestation: ${err}`)
      return {
        success: null,
        error: GetAttestationError.UNKNOWN_ERROR
      }
    }
  }
}

module.exports = Challenge
module.exports.SubmitAndEvaluateError = SubmitAndEvaluateError
