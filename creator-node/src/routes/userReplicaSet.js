const axios = require("axios")
const { recoverPersonalSignature } = require("eth-sig-util")
const { handleResponse, errorResponseBadRequest, successResponse, parseCNodeResponse } = require("../apiHelpers")
const { logger } = require('../logging')

module.exports = function (app) {

  /**
   * TODO rate limit, maybe behind authMiddleware? prob not tho
   */


  /**
   * const spInfo = SPFactory.getServiceEndpointInfo('content-node', spID)
   * ensure non-empty resp
   * make web request to spInfo.endpoint/health_check & confirm returns matching spID, endpoint, serviceType,
   *    healthy status = 200, spOwnerWallet
   * 
   * also maybe confirm on-chain healthy state valid bounds etc?
   *
   * recover public key from signature using eth-sig-util.recoverPersonalSignature (see authMiddleawre)
   * 
   * ensure sig matches wallet from chain
   *
   * if all successful:
   * compute proposer signature via getProposeAddOrUpdate....
   * 
   */
  app.get('/request_for_proposal', handleResponse(async (req, res, next) => {
    const libs = req.app.get('audiusLibs')

    const spID = parseInt(req.query.spID)

    if (!spID) {
      return errorResponseBadRequest('Must provide spID query param')
    }

    /**
     * Fetch node info from L1 ServiceProviderFactory
     */
    const nodeSpInfoFromChain = await libs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo('content-node', spID)
    if (!nodeSpInfoFromChain) {
      return errorResponseBadRequest('SpID is not registered as valid SP on L1 ServiceProviderFactory')
    }
    const {
      owner: ownerWalletFromChain,
      delegateOwnerWallet: delegateOwnerWalletFromChain,
      endpoint: nodeEndpointFromChain
    } = nodeSpInfoFromChain
    logger.info(`SIDTEST NODESPINFOFROMCHAIN: ${JSON.stringify(nodeSpInfoFromChain, null, 2)}`)

    // Make request to node health check
    let nodeHealthCheckResp = await axios({
      baseURL: nodeEndpointFromChain,
      url: '/health_check',
      method: 'get',
      timeout: 1000
    })
    nodeHealthCheckResp = parseCNodeResponse(nodeHealthCheckResp, ['healthy', 'creatorNodeEndpoint', 'spID', 'spOwnerWallet'])
    logger.info(`SIDTEST NODEHEALTHCHECKRESP: ${JSON.stringify(nodeHealthCheckResp, null, 2)}`)

    // Confirm health check returns healthy and data matches on-chain data
    if (
      !(nodeHealthCheckResp.healthy)
      || (nodeHealthCheckResp.creatorNodeEndpoint !== nodeEndpointFromChain)
      || (nodeHealthCheckResp.spID !== spID)
      || (nodeHealthCheckResp.spOwnerWallet !== ownerWalletFromChain)
    ) {
      return errorResponseBadRequest(`HEALTHCHECK INACURRATE:
      \ ${(nodeHealthCheckResp.creatorNodeEndpoint != nodeEndpointFromChain)}
      \ || ep1: ${nodeHealthCheckResp.creatorNodeEndpoint} ; ep2: ${nodeEndpointFromChain}
      \ || ${(nodeHealthCheckResp.spID != spID)} \
      \ || ${(nodeHealthCheckResp.spOwnerWallet != ownerWalletFromChain)}`)
    }

    return successResponse({
      msg: `SIDTEST:`
        + ` || ${!(nodeHealthCheckResp.healthy)}`
        + ` || ${(nodeHealthCheckResp.creatorNodeEndpoint !== nodeEndpointFromChain)}`
        + ` || ${(nodeHealthCheckResp.spID !== spID)}`
        + ` || ${(nodeHealthCheckResp.spOwnerWallet !== ownerWalletFromChain)}`
        + ` || spow1: ${nodeHealthCheckResp.spOwnerWallet} ; spow2: ${ownerWalletFromChain}`
    })
    // Validate signature from health check



    // Validate signature from original request
    const encodedDataMsg = req.get('Encoded-Data-Message')
    const encodedDataSig = req.get('Encoded-Data-Signature')
    if (!encodedDataMsg || !encodedDataSig) {
      return errorResponseBadRequest('Caller must provide Encoded-Data-Message and Encoded-Data-Signature headers')
    }
    const delegateOwnerWallet = recoverPersonalSignature({ data: encodedDataMsg, sig: encodedDataSig })

    return successResponse({
      nonce,
      sig
    })
  }))
}