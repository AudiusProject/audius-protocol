const axios = require('axios')
const {Base, Services} = require('./base')
const {sampleSize} = require('lodash')

const GetAttestationError = Object.freeze({
  CHALLENGE_INCOMPLETE: "CHALLENGE_INCOMPLETE",
  ALREADY_DISBURSED:  "ALREADY_DISBURSED",
  INVALID_ORACLE: "INVALID_ORACLE",
  MISSING_CHALLENGES: "MISSING_CHALLENGES",
  INVALID_INPUT: "INVALID_INPUT",
  UNKNOWN_ERROR: "UNKNOWN_ERROR"
})

const AAO_REQUEST_TIMEOUT_MS = 15 * 1000

class Challenge extends Base {
  constructor(...args) {
    super(...args)
  }

  // TODO: add good return type
  // TODO: this needs to work for multi discprovs
  // Returns { owner_wallet: string, attestation: string }
  async getChallengeAttestation({challengeId, encodedUserId, specifier, oracleAddress, discoveryProviderEndpoint}) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    try {
      const res = await this.discoveryProvider.getChallengeAttestation(
        challengeId,
        encodedUserId,
        specifier,
        oracleAddress,
        discoveryProviderEndpoint
      )
      return {success: res, error: null}
    } catch (e) {
      const err = e.message
      console.log(err)
      const mappedErr = GetAttestationError[err] ?? GetAttestationError.UNKNOWN_ERROR
      return {
        success: null,
        error: mappedErr
      }
    }
  }

  // Will return {
  //   discoveryNode: []
  //   aao: []
  // }

  // TODO: need to handle if a single discprov doesn't attest
  // TODO: need to filter out services below a certain version
  async aggregateAttestations({challengeId, encodedUserId, handle, specifier, oracleAddress, amount, quorumSize, AAOEndpoint, allowList=[]}) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    // TODO: this should probably be passed in, would be horrible to reselect on every single one
    let endpoints = await this.discoveryProvider.serviceSelector.findAll()
    endpoints = (() => {
      if (!allowList.length) return endpoints
      const s = new Set(allowList)
      return endpoints.filter(e => s.has(e))
    })()
    endpoints = sampleSize(endpoints, quorumSize)
    const discprovAttestations = endpoints.map(e => this.getChallengeAttestation({challengeId, encodedUserId, specifier, oracleAddress, discoveryProviderEndpoint: e}))
    const AAOAttestation = this.getAAOAttestation({
      challengeId,
      specifier,
      handle,
      amount,
      AAOEndpoint
    })
    // DP attestations are the form of: { attestation: string, owner_wallet: string}
    // AAO attestation in the form of { result: string }
    const res = await Promise.all([...discprovAttestations, AAOAttestation])
  }

  async getAAOAttestation({challengeId, specifier, handle, amount, AAOEndpoint}) {
    // TODO: need to do error handling
    const data = {
      challengeId,
      challengeSpecifier: specifier,
      amount,
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
    const res = await axios(request)
    // TODO: this either returns a signature or 'false', not great.
    // need to figure out what it should return
    return res.data
  }
}

// TODO: need to add retries

// // Gets a single attestation from a single discprov
// function getAttestation(discoveryProvider, userId, challengeId, specifier, endpoint) {}

// function getAAOAttestion() ...

// // This should live just in the API layer
// // Calls getAttestation a bunch of times, hits bot oracle, returns them all
// function aggregateAttestations(userId, challengeId, specifier) {}

// // calls aggregateAttestions, submits, handles different error cases
// function aggregateAndSubmit(userId, challengeId, specifier) {}

// // Calls DP to get undisbursed challenges past startingBlock
// function getUndisbursedChallenges(startingBlock) {}

module.exports = Challenge