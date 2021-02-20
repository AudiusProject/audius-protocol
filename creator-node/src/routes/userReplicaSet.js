const axios = require("axios")
const { promisify } = require('util')
const crypto = require('crypto')
const randomBytes = promisify(crypto.randomBytes)
const { Utils: LibsUtils } = require('@audius/libs')

const {
  handleResponse,
  errorResponseBadRequest,
  successResponse,
  parseCNodeResponse,
  errorResponseServerError
} = require("../apiHelpers")
const { logger } = require('../logging')
const config = require('../config')
const { generateTimestampAndSignature, recoverWallet, signatureHasExpired } = require("../apiSigning")

module.exports = function (app) {
  /**
   * TODO
   * - rate limit
   * - consider also validating L1 healthy state eg valid bounds
   * - move to component pattern
   */

  /**
   * This route is called by a requesting node attempting to self register or update record on L2
   *    UserReplicaSetManager contract (URSM) via Chain of Trust. The requesting node is requesting a
   *    signature from this node (proposer node) to submit as part of the contract registration transaction.
   *
   * Steps:
   *  1. Fetch node info from L1 ServiceProviderFactory for spID
   *    a. Error if no L1 record found
   *    b. Short circuit if L2 record for node already matches L1 record (i.e. delegateOwnerWallets match)
   *  2. Confirm request was signed by delegate owner wallet registered on L1 for spID, given request signature artifacts
   *  3. Confirm health check returns healthy and response data matches on-chain data
   *    a. Confirm health check response was signed by delegate owner wallet registered on L1 for spID
   *  4. Generate & return proposal signature artifacts
   */
  app.get('/ursm_request_for_proposal', handleResponse(async (req, res, next) => {
    const libs = req.app.get('audiusLibs')

    let {
      spID,
      timestamp: reqTimestamp,
      signature: reqSignature
    } = req.query

    if (!spID || !reqTimestamp || !reqSignature) {
      return errorResponseBadRequest('Must provide all required query parameters: spID, timestamp, signature')
    }

    spID = parseInt(spID)

    /**
     * Fetch all nodes from SPF
     */
    for await (const spID of [1,2,3,4]) {
      const data = await libs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo(
        'content-node',
        spID
      )
      logger.info(`NODE INFO for spID ${spID}: ${JSON.stringify(data, null, 2)}`)
    }

    /**
     * Fetch node info from L1 ServiceProviderFactory for spID
     */
    const spRecordFromSPFactory = await libs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo(
      'content-node',
      spID
    )
    let {
      owner: ownerWalletFromSPFactory,
      delegateOwnerWallet: delegateOwnerWalletFromSPFactory,
      endpoint: nodeEndpointFromSPFactory
    } = spRecordFromSPFactory
    delegateOwnerWalletFromSPFactory = delegateOwnerWalletFromSPFactory.toLowerCase()
    
    if (
      LibsUtils.isZeroAddress(ownerWalletFromSPFactory)
      || LibsUtils.isZeroAddress(delegateOwnerWalletFromSPFactory)
      || !nodeEndpointFromSPFactory
    ) {
      return errorResponseBadRequest(`SpID ${spID} is not registered as valid SP on L1 ServiceProviderFactory`)
    }

    /**
     * Short-circuit if L2 record already matches L1 record (i.e. delegateOwnerWallets match)
     */
    const delegateOwnerWalletFromURSM = (
      (await libs.contracts.UserReplicaSetManagerClient.getContentNodeWallets(spID))
      .delegateOwnerWallet
    ).toLowerCase()
    if (delegateOwnerWalletFromSPFactory === delegateOwnerWalletFromURSM) {
      return errorResponseBadRequest(
        `No-op - UserReplicaSetManager record for node with spID ${spID} already matches L1 ServiceProviderFactory record`
      )
    }

    /**
     * Confirm request was signed by delegate owner wallet registered on L1 for spID, given request signature artifacts
     */
    let requesterWalletRecoveryObj = { spID, timestamp: reqTimestamp }
    let recoveredDelegateOwnerWallet = (recoverWallet(requesterWalletRecoveryObj, reqSignature)).toLowerCase()
    logger.info(`delwalSPF: ${delegateOwnerWalletFromSPFactory} // delwalsign: ${recoveredDelegateOwnerWallet} // ts ${reqTimestamp} // sig ${reqSignature}`)
    if (delegateOwnerWalletFromSPFactory !== recoveredDelegateOwnerWallet) {
      return errorResponseBadRequest(
        'Request for proposal must be signed by delegate owner wallet registered on L1 for spID'
      )
    }

    logger.info('SIDTEST GOT HERE?????')

    /**
     * Request node's up-to-date health info
     *
     * - uses endpoint registered on L1 for spID
     * - passes `randomBytesToSign` string in request to check that response was signed for provided data
     */
    const randomBytesToSign = (await randomBytes(18)).toString()
    let nodeHealthCheckResp = await axios({
      baseURL: nodeEndpointFromSPFactory,
      url: '/health_check',
      method: 'get',
      timeout: 1000,
      params: {
        randomBytesToSign
      }
    })
    logger.info('SIDTEST GOT HERE2')
    nodeHealthCheckResp = parseCNodeResponse(
      nodeHealthCheckResp,
      ['healthy', 'creatorNodeEndpoint', 'spID', 'spOwnerWallet', 'randomBytesToSign']
    )
    logger.info('SIDTEST GOT HERE3')

    /**
     * Confirm health check returns healthy and response data matches on-chain data
     */
    if (
      !(nodeHealthCheckResp.healthy)
      || (nodeHealthCheckResp.creatorNodeEndpoint !== nodeEndpointFromSPFactory)
      || (nodeHealthCheckResp.spID !== spID)
      || ((nodeHealthCheckResp.spOwnerWallet).toLowerCase() !== ownerWalletFromSPFactory.toLowerCase())
    ) {
      return errorResponseServerError(`CN unhealthy or misconfigured`)
    }
    logger.info('SIDTEST GOT HERE4')

    /**
     * Confirm health check response was signed by delegate owner wallet registered on L1
     *    for spID and includes `randomBytesToSign`
     */
    let {
      timestamp: respTimestamp,
      signature: respSignature,
      ...responseData
    } = nodeHealthCheckResp.rawResponse
    if (signatureHasExpired(respTimestamp)) {
      return errorResponseBadRequest('Health check response signature has expired')
    }
    const responderWalletRecoveryObj = { ...responseData, randomBytesToSign, timestamp: respTimestamp }
    recoveredDelegateOwnerWallet = (recoverWallet(responderWalletRecoveryObj, respSignature)).toLowerCase()
    if (delegateOwnerWalletFromSPFactory !== recoveredDelegateOwnerWallet) {
      return errorResponseBadRequest(
        'Health check response must be signed by delegate owner wallet registered on L1 for spID'
      )
    }

    logger.info('SIDTEST GOT HERE5')

    // Generate proposal signature artifacts
    const proposalSignatureInfo = await libs.contracts.UserReplicaSetManagerClient.getProposeAddOrUpdateContentNodeRequestData(
      spID,
      delegateOwnerWalletFromSPFactory,
      ownerWalletFromSPFactory,
      config.get('spID')
    )

    logger.info('SIDTEST GOT HERE6')

    return successResponse({
      nonce: proposalSignatureInfo.nonce,
      sig: proposalSignatureInfo.sig,
      spID: config.get('spID')
    })
  }))

  app.get('/submitRFP', handleResponse(async (req, res, next) => {
    const serviceRegistry = req.app.get('serviceRegistry')
    try {
      await serviceRegistry.URSMService.init()
    } catch (e) {
      logger.error(`INIT ERROR: ${e}`)
    }

    return successResponse('got this far bruh')
  }))
}