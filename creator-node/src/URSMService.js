const { logger } = require('./logging')
const axios = require('axios')
const { parseCNodeResponse } = require('./apiHelpers')

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
    // Requires properly initialized libs instance and non-zero spID
    // Currently spID is configured inside snapbackSM
    if (!audiusLibs || !nodeConfig.get('spID')) {
      throw new Error('nope')
    }

    this.nodeConfig = nodeConfig
    this.audiusLibs = audiusLibs
    this.spID = nodeConfig.get('spID')
    this.delegateOwnerWallet = nodeConfig.get('delegateOwnerWallet')

    this.numSignaturesRequired = 3
  }

  // Class level log output
  logInfo (msg) {
    logger.info(`URSMService || ${msg}`)
  }
  logError (msg) {
    logger.error(`URSMService ERROR || ${msg}`)
  }

  /**
   * 
   */
  async init () {
    // Short circuit if already registered on URSM
    const alreadyRegistered = (
      (await audiusLibs.contracts.UserReplicaSetManagerClient.getContentNodeWallet(this.spID))
      != '0x0000000000000000000000000000000000000000'
    )
    if (alreadyRegistered) {
      this.logInfo('Node already registered on UserReplicaSetManager contract - Short-circuiting init process.')
      return
    }

    // Fetch all nodes currently registered on URSM, in order to submit requests for proposal
    const allURSMContentNodes = await this.audiusLibs.discoveryProvider.getURSMContentNodes()
    this.logInfo(`allURSMContentNodes: ${JSON.stringify(allURSMContentNodes)}`)

    // TODO at this point need to have the CN endpoints one way or another
    //  for now am just assuming it is a prop in the array of objects

    // TODO consider using _.shuffle() to randomize
    let availableNodes = allURSMContentNodes
    let numRemainingSignatures = this.numSignaturesRequired
    let receivedSignatures = []

    /** TODO document */
    while (numRemainingSignatures > 0) {
      if (availableNodes.length < numRemainingSignatures) {
        // TODO what is appropriate way to error -> kill proc, set flag to flip health check?
        throw new Error('Failure to receive required attestation signatures for URSM Registration')
      }

      let nodesToAttempt = availableNodes.slice(0, numRemainingSignatures)

      let responses = await Promise.all(nodesToAttempt.map(async (node) => {
        try {
          const resp = await axios({
            baseURL: node.endpoint,
            url: '/request_for_proposal',
            method: 'get',
            timeout: 5000,
            params: {
              spID: this.spID
            }
          })
          return {
            spID: node.spID,
            nonce: resp.nonce,
            sig: resp.sig
          }
        } catch (e) {
          this.logError(`RFP failed to node ${node.endpoint} with error ${e}`)
          return null
        }
      }))
      responses = responses.filter(Boolean)

      numRemainingSignatures -= responses.length
      receivedSignatures.concat({responses})
    }

    // getting to this point implies 3 successful signatures received
    // TODO - assert length = 3

    const proposerSpIDs = receivedSignatures.map(signatureObj => signatureObj.spID)
    const proposerNonces = receivedSignatures.map(signatureObj => signatureObj.nonce)
    try {
      const regTx = await this.audiusLibs.contracts.UserReplicaSetManagerClient.addOrUpdateContentNode(
        this.spID,
        this.delegateOwnerWallet,
        proposerSpIDs,
        proposerNonces,
        receivedSignatures[0].sig,
        receivedSignatures[1].sig,
        receivedSignatures[2].sig
      )
  
      // TODO - p sure internally libs sendTransaction has retries, so should be gucci but want to make this configurable.
    } catch (e) {
      // TODO better error handling
      throw new Error('shit failed')
    }
  }

  async submitRequestForProposal (nodeEndpoint) {
    let RFPResp = await axios({
      baseURL: nodeEndpoint,
      url: '/request_for_proposal',
      method: 'get',
      // timeout needs to be several seconds as the route makes multiple web requests internally
      timeout: 5000,
      params: {
        spID: this.spID
      }
    })
    RFPResp = parseCNodeResponse(RFPResp)

    return {
      spID: RFPResp.spID,
      nonce: RFPResp.nonce,
      sig: RFPResp.sig
    }
  }
}

module.exports = URSMService