const { recoverPersonalSignature } = require("eth-sig-util")
const { handleResponse, errorResponseBadRequest, successResponse } = require("../apiHelpers")

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
    const spID = req.query.spID

    /**
     * get info from chain
     */

    
    /**
     * make request to CN
     * confirm all info matches
     */


    /**
     * recover sig
     */
    const encodedDataMsg = req.get('Encoded-Data-Message')
    const encodedDataSig = req.get('Encoded-Data-Signature')
    if (!encodedDataMsg || !encodedDataSig) {
      return errorResponseBadRequest('Caller must provide Encoded-Data-Message and Encoded-Data-Signature headers')
    }
    const delegateOwnerWallet = recoverPersonalSignature({ data: encodedDataMsg, sig: encodedDataSig })

    /**
     * ensure sig matches on-chain
     */

     return successResponse({
       nonce,
       sig
     })
  }))
}