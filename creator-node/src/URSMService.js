const axios = require('axios')
const _ = require('lodash')
const { Utils: LibsUtils } = require('@audius/libs')

const { logger } = require('./logging')
const { parseCNodeResponse } = require('./apiHelpers')
const { generateTimestampAndSignature } = require('./apiSigning')
const { response } = require('express')



/**
 * TODO move to services layer
 */

/**
 * This Service is responsible for registering this content node (CN) on the UserReplicaSetManager L2 contract (URSM)
 *
 * Steps:
 * - If already registered on URSM, exit successfully
 * - Submit requests for proposal to 3 nodes already registered on URSM
 *    - keep attempting to submit requests until 3 successful or no remaining nodes
 * - Register self on URSM with 3 proposer signatures
 */
class URSMService {
  constructor (nodeConfig, audiusLibs) {
    this.nodeConfig = nodeConfig
    this.audiusLibs = audiusLibs
    this.spID = nodeConfig.get('spID')
    this.delegateOwnerWallet = nodeConfig.get('delegateOwnerWallet')
    this.delegatePrivateKey = nodeConfig.get('delegatePrivateKey')
    this.spOwnerWallet = nodeConfig.get('spOwnerWallet')

    // Requires properly initialized libs instance and non-zero spID
    // Currently spID is configured inside snapbackSM
    if (!this.audiusLibs || !this.spID || !this.delegateOwnerWallet || !this.delegatePrivateKey || !this.spOwnerWallet) {
      throw new Error('nope')
    }

    this.numSignaturesRequired = 3
  }

  logInfo (msg) {
    logger.info(`URSMService || ${msg}`)
  }

  logError (msg) {
    logger.error(`URSMService ERROR || ${msg}`)
  }

  /**
   * TODO DESCRIPTION
   *
   * Steps: 
   *  1. Fetch node record from L1 ServiceProviderFactory for spID
   *    a. Short-circuit if no L1 record found
   *  2. Fetch node record from L2 UserReplicaSetManager for spID
   *    a. Short-circuit if L2 record for node already matches L1 record (i.e. delegateOwnerWallets match)
   *  3. Fetch list of all nodes registered on URSM, in order to submit requests for proposal
   *    a. Randomize list to minimize bias
   *    b. Organize list to ensure requests are sent to nodes with unique ownerWallets
   *  4. Submit requests for proposal to nodes until 3 successful signatures received
   *    a. Must have signatures from nodes with unique ownerWallets
   *    b. Error if all available nodes contacted without 3 successful signatures
   *  5. Submit registration transaction to URSM with signatures
   */
  async init () {
    this.logInfo('STARTING INIT')

    /**
     * 1. Fetch node record from L1 ServiceProviderFactory for spID
     */
    const spRecordFromSPFactory = await this.audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo(
      'content-node',
      this.spID
    )
    let {
      owner: ownerWalletFromSPFactory,
      delegateOwnerWallet: delegateOwnerWalletFromSPFactory,
      endpoint: endpointFromSPFactory
    } = spRecordFromSPFactory
    delegateOwnerWalletFromSPFactory = delegateOwnerWalletFromSPFactory.toLowerCase()


    /**
     * 1-a. Short-circuit if no L1 record found
     */
    if (
      LibsUtils.isZeroAddress(ownerWalletFromSPFactory)
      || LibsUtils.isZeroAddress(delegateOwnerWalletFromSPFactory)
      || !endpointFromSPFactory
    ) {
      throw new Error('L1recordbad')
    }

    /**
     * 2. Fetch node record from L2 UserReplicaSetManager for spID
     */
    const delegateOwnerWalletFromURSM = (
      (await this.audiusLibs.contracts.UserReplicaSetManagerClient.getContentNodeWallets(this.spID))
      .delegateOwnerWallet
    ).toLowerCase()

    /**
     * 2-a. Short-circuit if L2 record for node already matches L1 record (i.e. delegateOwnerWallets match)
     */
    if (delegateOwnerWalletFromSPFactory === delegateOwnerWalletFromURSM) {
      // throw new Error('L2recordmatch')
      this.logInfo(`l2recordbad`)
    }

    /**
     * 3. Fetch list of all nodes registered on URSM, in order to submit requests for proposal
     *  a. Randomize list to minimize bias
     *  b. Remove duplicates by owner_wallet key due to on-chain uniqueness constraint
     */
    let URSMContentNodes = await this.audiusLibs.discoveryProvider.getURSMContentNodes()
    
    // TODO - setting list to single value for testing purposes
    const tmp = URSMContentNodes[0]
    this.logInfo(`tmp: ${JSON.stringify(tmp, null, 2)}`)

    URSMContentNodes = URSMContentNodes.filter(node => node.endpoint)
    URSMContentNodes = _.shuffle(URSMContentNodes)
    URSMContentNodes = Object.values(_.keyBy(URSMContentNodes, 'owner_wallet'))

    /**
     * TODO document
     */
    // let numRemainingSignatures = 1
    let numRemainingSignatures = 3
    // let availableNodes = [tmp]
    let availableNodes = URSMContentNodes
    let receivedSignatures = []

    while (numRemainingSignatures > 0) {
      if (availableNodes.length < numRemainingSignatures) {
        // TODO what is appropriate way to error -> kill proc, set flag to flip health check?
        throw new Error('Failure to receive required attestation signatures for URSM Registration')
      }

      let nodesToAttempt = availableNodes.slice(0, numRemainingSignatures)
      availableNodes = availableNodes.slice(numRemainingSignatures)

      let responses = await Promise.all(nodesToAttempt.map(async (node) => {
        try {
          const resp = await this._submitRequestForProposal(node.endpoint)
          this.logInfo(`submitRFP resp: ${JSON.stringify(resp, null, 2)}`)
          return resp
        } catch (e) {
          this.logError(`RFP failed to node ${node.endpoint} with error ${e}`)
          return null
        }
      }))
      this.logInfo(`respones: ${JSON.stringify(responses, null, 2)}`)
      responses = responses.filter(Boolean)

      numRemainingSignatures -= responses.length
      receivedSignatures = receivedSignatures.concat(responses)
    }

    if (receivedSignatures.length !== 3) {
      throw new Error('3 signatutres required')
    }

    this.logInfo(`receviedsigns: ${JSON.stringify(receivedSignatures, null, 2)}`)
    return 'yes'

    /**
     * Submit proposal 
     */

    const proposerSpIDs = receivedSignatures.map(signatureObj => signatureObj.spID)
    const proposerNonces = receivedSignatures.map(signatureObj => signatureObj.nonce)
    try {
      const regTx = await this.audiusLibs.contracts.UserReplicaSetManagerClient.addOrUpdateContentNode(
        this.spID,
        [
          this.delegateOwnerWallet,
          this.spOwnerWallet
        ],
        proposerSpIDs,
        proposerNonces,
        receivedSignatures[0].sig,
        receivedSignatures[1].sig,
        receivedSignatures[2].sig
      )
      this.logInfo('successfully relayed chain write')
  
      // TODO - p sure internally libs sendTransaction has retries, so should be gucci but want to make this configurable.
    } catch (e) {
      // TODO better error handling
      throw new Error(`shit failed ${e}`)
    }
  }

  /**
   * 
   * @param {*} nodeEndpoint 
   */
  async _submitRequestForProposal (nodeEndpoint) {
    const { timestamp, signature } = generateTimestampAndSignature({ spID: this.spID }, this.delegatePrivateKey)

    this.logInfo(`submitting RFP to ${nodeEndpoint} for spID ${this.spID} // ${timestamp} // ${signature} // privkey: ${this.delegatePrivateKey}`)

    let RFPResp = await axios({
      baseURL: nodeEndpoint,
      url: '/ursm_request_for_proposal',
      method: 'get',
      // timeout needs to be several seconds as the route makes multiple web requests internally
      timeout: 5000,
      params: {
        spID: this.spID,
        timestamp,
        signature
      }
    })
    this.logInfo(`RFPRESP from endpoint: ${nodeEndpoint}: ${JSON.stringify(RFPResp.data, null, 2)}`)

    // NOTE - this doesn't work for some reason
    // RFPResp = parseCNodeResponse(RFPResp)

    // this.logInfo(`RFPResp2: ${JSON.stringify(RFPResp, null, 2)}`)

    return {
      spID: RFPResp.data.data.spID,
      nonce: RFPResp.data.data.nonce,
      sig: RFPResp.data.data.sig
    }
  }
}

module.exports = URSMService