const axios = require("axios")
const { promisify } = require('util')
const crypto = require('crypto')
const randomBytes = promisify(crypto.randomBytes)

const {
  handleResponse,
  errorResponseBadRequest,
  successResponse,
  parseCNodeResponse,
  errorResponseServerError
} = require("../apiHelpers")
const { logger } = require('../logging')
const config = require('../config')
const { generateTimestampAndSignature, recoverWallet } = require("../apiSigning")

module.exports = function (app) {
  /**
   * TODO
   * - rate limit
   * - consider also validating L1 healthy state eg valid bounds
   */

  /**
   * This route is called by an requesting node attempting to self register on L2 UserReplicaSetManager
   *    contract (URSM) via Chain of Trust. The requesting node is requesting a signature from this node
   *    (the proposer node) to submit as part of the contract registration transaction.
   *
   * Steps:
   *  1. Short circuit if node is already registered on URSM
   *  2. Fetch node info from L1 ServiceProviderFactory for spID
   *    a. Error if no L1 record found
   *  3. Confirm request was signed by delegate owner wallet registered on L1 for spID, given request signature artifacts
   *  4. Confirm health check returns healthy and response data matches on-chain data
   *    a. Confirm health check response was signed by delegate owner wallet registered on L1 for spID
   *  5. Generate & return proposal signature artifacts
   */
  app.get('/ursm_request_for_proposal', handleResponse(async (req, res, next) => {
    const libs = req.app.get('audiusLibs')

    let { spID, timestamp: reqTimestamp, signature: reqSignature } = req.query

    if (!spID || !reqTimestamp || !reqSignature) {
      return errorResponseBadRequest('Must provide all required query parameters: spID, timestamp, signature')
    }

    spID = parseInt(spID)

    /**
     * Short circuit if node already registered on URSM contract
     */
    const alreadyRegisteredOnURSM = !libs.Utils.isZeroAddress(
      await libs.contracts.UserReplicaSetManagerClient.getContentNodeWallet(spID)
    )
    if (alreadyRegisteredOnURSM) {
      return errorResponseBadRequest(
        `Cannot submit proposal signature - Node with spID ${spID} already registered on UserReplicaSetManager contract`
      )
    }

    /**
     * Fetch node info from L1 ServiceProviderFactory for spID
     */
    const nodeSpInfoFromSPFactory = await libs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo(
      libs.creatorNode.serviceTypeName,
      spID
    )
    if (!nodeSpInfoFromSPFactory) {
      return errorResponseBadRequest(`SpID ${spID} is not registered as valid SP on L1 ServiceProviderFactory`)
    }
    let {
      owner: ownerWalletFromChain,
      delegateOwnerWallet: delegateOwnerWalletFromSPFactory,
      endpoint: nodeEndpointFromChain
    } = nodeSpInfoFromSPFactory
    delegateOwnerWalletFromSPFactory = delegateOwnerWalletFromSPFactory.toLowerCase()

    /**
     * Confirm request was signed by delegate owner wallet registered on L1 for spID, given request signature artifacts
     */
    let requesterWalletRecoveryObj = { spID, reqTimestamp }
    let recoveredDelegateOwnerWallet = (recoverWallet(requesterWalletRecoveryObj, reqSignature)).toLowerCase()
    if (delegateOwnerWalletFromSPFactory !== recoveredDelegateOwnerWallet) {
      return errorResponseBadRequest(
        'Request for proposal must be signed by delegate owner wallet registered on L1 for spID'
      )
    }

    /**
     * Request node's up-to-date health info
     *
     * - uses endpoint registered on L1 for spID
     * - passes `randomBytesToSign` string in request to check that response was signed for provided data
     */
    const randomBytesToSign = (await randomBytes(18)).toString()
    let nodeHealthCheckResp = await axios({
      baseURL: nodeEndpointFromChain,
      url: '/health_check',
      method: 'get',
      timeout: 1000,
      params: {
        randomBytesToSign
      }
    })
    nodeHealthCheckResp = parseCNodeResponse(
      nodeHealthCheckResp,
      ['healthy', 'creatorNodeEndpoint', 'spID', 'spOwnerWallet', 'randomBytesToSign']
    )

    /**
     * Confirm health check returns healthy and response data matches on-chain data
     */
    if (
      !(nodeHealthCheckResp.healthy)
      || (nodeHealthCheckResp.creatorNodeEndpoint !== nodeEndpointFromChain)
      || (nodeHealthCheckResp.spID !== spID)
      || ((nodeHealthCheckResp.spOwnerWallet).toLowerCase() !== ownerWalletFromChain.toLowerCase())
    ) {
      return errorResponseServerError(`CN unhealthy or misconfigured`)
    }

    /**
     * Confirm health check response was signed by delegate owner wallet registered on L1
     *    for spID and includes `randomBytesToSign`
     */
    let {
      timestamp: respTimestamp,
      signature: respSignature,
      ...responseData
    } = nodeHealthCheckResp.rawResponse
    const responderWalletRecoveryObj = { ...responseData, randomBytesToSign, timestamp: respTimestamp }
    recoveredDelegateOwnerWallet = (recoverWallet(responderWalletRecoveryObj, respSignature)).toLowerCase()
    if (delegateOwnerWalletFromSPFactory !== recoveredDelegateOwnerWallet) {
      return errorResponseBadRequest(
        'Health check response must be signed by delegate owner wallet registered on L1 for spID'
      )
    }

    // Generate proposal signature artifacts
    const proposalSignatureInfo = await libs.contracts.UserReplicaSetManagerClient.getProposeAddOrUpdateContentNodeRequestData(
      spID,
      delegateOwnerWalletFromSPFactory,
      config.get('spID'),
      config.get('delegateOwnerWallet'),
      libs.ethWeb3Manager.getWeb3()
    )

    return successResponse({
      nonce: proposalSignatureInfo.nonce,
      sig: proposalSignatureInfo.sig,
      spID: config.get('spID')
    })
  }))

  app.get('/submitRFP', handleResponse(async (req, res, next) => {
    const spID = config.get('spID')
    const delegatePrivateKey = config.get('delegatePrivateKey')
    const libs = req.app.get('audiusLibs')

    if (!spID || !delegatePrivateKey) {
      return errorResponseBadRequest('Missing required configs: spID, delegatePrivateKey')
    }

    const targetEndpoint = req.query.targetEndpoint

    const { timestamp, signature } = generateTimestampAndSignature({ spID }, delegatePrivateKey)

    const proposalSignatureResp = await axios({
      baseURL: targetEndpoint,
      url: '/ursm_request_for_proposal',
      method: 'get',
      timeout: 5000,
      params: {
        spID,
        timestamp,
        signature
      }
    })

    // Generate arguments for proposal
    const proposerSpIDs = []
    const proposerNonces = []

    await libs.contracts.UserReplicaSetManagerClient.addOrUpdateContentNode(
      spID,
      config.get('delegateOwnerWallet'),
      proposerSpIDs,
      proposerNonces,
      sig1,
      sig2,
      sig3
    )

    return successResponse('got this far bruh')
  }))
}