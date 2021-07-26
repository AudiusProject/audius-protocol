const {Base, Services} = require('./base')

const GetAttestationError = Object.freeze({
  CHALLENGE_INCOMPLETE: "CHALLENGE_INCOMPLETE",
  ALREADY_DISBURSED:  "ALREADY_DISBURSED",
  INVALID_ORACLE: "INVALID_ORACLE",
  MISSING_CHALLENGES: "MISSING_CHALLENGES",
  INVALID_INPUT: "INVALID_INPUT",
  UNKNOWN_ERROR: "UNKNOWN_ERROR"
})

class Challenge extends Base {
  constructor(...args) {
    super(...args)
  }

  // TODO: add good return type
  // TODO: this needs to work for multi discprovs
  // Returns { owner_wallet: string, attestation: string }
  /**
   * Returns an attestation from a single discovery provider for a user.
   *
   * @param {string} challengeId
   * @param {string} encodedUserId
   * @param {string} specifier
   * @param {string} oracleAddress
   * @param {string} discoveryProviderEndpoint
   * @returns
   * @memberof Challenge
   */
  async getChallengeAttestation(challengeId, encodedUserId, specifier, oracleAddress, discoveryProviderEndpoint) {
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
}

module.exports = Challenge