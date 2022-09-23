const axios = require('axios')
const _ = require('lodash')
const { libs } = require('@audius/sdk')
const LibsUtils = libs.Utils

const { logger } = require('../logging')
const { generateTimestampAndSignature } = require('../apiSigning')
const { parseCNodeResponse } = require('../apiHelpers')

const NumSignaturesRequired = 3

/**
 * Allow for several seconds for the request for signature response, as
 *    the route makes multiple web requests internally
 */
const RequestForSignatureTimeoutMs = 30000 /** 30sec */

/**
 * This Service is responsible for registering this node on the UserReplicaSetManager L2 contract (URSM)
 *
 * @notice Service is backwards compatible, and will work before and after URSM contract deployment
 */
class URSMRegistrationManager {
  constructor(nodeConfig, audiusLibs) {
    this.nodeConfig = nodeConfig
    this.audiusLibs = audiusLibs

    this.delegateOwnerWallet = nodeConfig.get('delegateOwnerWallet')
    this.delegatePrivateKey = nodeConfig.get('delegatePrivateKey')
    this.spOwnerWallet = nodeConfig.get('spOwnerWallet')
    this.oldDelegateOwnerWallet = this.nodeConfig.get('oldDelegateOwnerWallet')
    this.oldDelegatePrivateKey = this.nodeConfig.get('oldDelegatePrivateKey')

    if (
      !this.audiusLibs ||
      !this.delegateOwnerWallet ||
      !this.delegatePrivateKey ||
      !this.oldDelegateOwnerWallet ||
      !this.oldDelegatePrivateKey ||
      !this.spOwnerWallet
    ) {
      throw new Error(
        'URSMRegistrationManager cannot start due to missing required configs'
      )
    }
  }

  logInfo(msg) {
    logger.info(`URSMRegistrationManager || ${msg}`)
  }

  logError(msg) {
    logger.error(`URSMRegistrationManager ERROR || ${msg}`)
  }

  /**
   * Registers node on UserReplicaSetManager contract (URSM)
   *
   * Steps:
   *  1. Fetch node record from L1 ServiceProviderFactory for spID
   *    a. Short-circuit if no L1 record found
   *  2. Fetch node record from L2 UserReplicaSetManager for spID
   *    a. Short-circuit if L2 record for node already matches L1 record (i.e. delegateOwnerWallets match)
   *  3. Fetch list of all nodes registered on URSM, in order to submit requests for proposal
   *    a. Randomize list to minimize bias + de-dupe by ownerWallet to meet on-chain uniqueness constraint
   *  4. Request signatures from all registered nodes, in batches of 3, until 3 successful signatures received
   *    a. Error if all available nodes contacted without 3 successful signatures
   *  5. Submit registration transaction to URSM with signatures
   */
  async run() {
    this.logInfo('Beginning URSM registration process')

    /**
     * (Backwards-compatibility) Short circuit if L2 URSM contract not yet deployed
     */
    if (!this.audiusLibs.contracts.UserReplicaSetManagerClient) {
      throw new Error(
        'URSMRegistration cannot run until UserReplicaSetManager contract is deployed'
      )
    }

    const spID = this.nodeConfig.get('spID')
    if (!spID) {
      throw new Error('URSMRegistration cannot run without spID config')
    }

    /**
     * 1. Fetch node record from L1 ServiceProviderFactory for spID
     */
    const spRecordFromSPFactory =
      await this.audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo(
        'content-node',
        spID
      )
    let {
      owner: ownerWalletFromSPFactory,
      delegateOwnerWallet: delegateOwnerWalletFromSPFactory,
      endpoint: endpointFromSPFactory
    } = spRecordFromSPFactory
    delegateOwnerWalletFromSPFactory =
      delegateOwnerWalletFromSPFactory.toLowerCase()

    /**
     * 1-a. Short-circuit if no L1 record found
     */
    if (
      LibsUtils.isZeroAddress(ownerWalletFromSPFactory) ||
      LibsUtils.isZeroAddress(delegateOwnerWalletFromSPFactory) ||
      !endpointFromSPFactory
    ) {
      throw new Error('Failed to find valid L1 record for node')
    }

    /**
     * 2. Fetch node record from L2 UserReplicaSetManager for spID
     */
    const delegateOwnerWalletFromURSM = (
      await this.audiusLibs.contracts.UserReplicaSetManagerClient.getContentNodeWallets(
        spID
      )
    ).delegateOwnerWallet.toLowerCase()

    /**
     * 2-a. Short-circuit if L2 record for node already matches L1 record (i.e. delegateOwnerWallets match)
     */
    if (this.oldDelegateOwnerWallet === delegateOwnerWalletFromURSM) {
      // Update config
      this.nodeConfig.set('isRegisteredOnURSM', true)

      this.logInfo(
        `Node already registered on URSM with same delegateOwnerWallet`
      )
      return
    }

    // New node registration is disabled
    throw new Error('Something went wrong if we got here')
  }

  /**
   * Given endpoint of a content node, submits request for signature
   * @param {string} nodeEndpoint
   */
  async _submitRequestForSignature(nodeEndpoint, spID) {
    const { timestamp, signature } = generateTimestampAndSignature(
      { spID },
      this.delegatePrivateKey
    )

    const RFPResp = await axios({
      baseURL: nodeEndpoint,
      url: '/ursm_request_for_signature',
      method: 'get',
      timeout: RequestForSignatureTimeoutMs,
      params: {
        spID,
        timestamp,
        signature
      }
    })
    const { responseData } = parseCNodeResponse(RFPResp, [
      'spID',
      'nonce',
      'sig'
    ])

    return {
      spID: responseData.spID,
      nonce: responseData.nonce,
      sig: responseData.sig
    }
  }
}

module.exports = URSMRegistrationManager
