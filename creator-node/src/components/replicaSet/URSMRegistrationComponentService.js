const axios = require('axios')
const { promisify } = require('util')
const crypto = require('crypto')
const randomBytes = promisify(crypto.randomBytes)
const { Utils: LibsUtils } = require('@audius/libs')

const {
  parseCNodeResponse,
  ErrorServerError,
  ErrorBadRequest
} = require("../../apiHelpers")
const { recoverWallet, signatureHasExpired } = require("../../apiSigning")


/**
 * TODO
 * - rate limit
 * - consider also validating L1 healthy state eg valid bounds
 *
 * This route is called by a requesting node attempting to create or update its record on L2
 *    UserReplicaSetManager contract (URSM) via Chain of Trust. The requesting node submits a request for
 *    signature from this node (proposer node) to submit as part of the contract addOrUpdateContentNode transaction.
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
const respondToURSMRequestForProposal = async ({ audiusLibs, nodeConfig }, logger, spID, reqTimestamp, reqSignature) => {
  if (!spID || !reqTimestamp || !reqSignature) {
    throw new ErrorBadRequest('Must provide all required query parameters: spID, timestamp, signature')
  }

  spID = parseInt(spID)

  /**
   * Fetch node info from L1 ServiceProviderFactory for spID
   */
  const spRecordFromSPFactory = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo(
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
    throw new ErrorBadRequest(`SpID ${spID} is not registered as valid SP on L1 ServiceProviderFactory`)
  }

  /**
   * Short-circuit if L2 record already matches L1 record (i.e. delegateOwnerWallets match)
   */
  const delegateOwnerWalletFromURSM = (
    (await audiusLibs.contracts.UserReplicaSetManagerClient.getContentNodeWallets(spID))
    .delegateOwnerWallet
  ).toLowerCase()
  if (delegateOwnerWalletFromSPFactory === delegateOwnerWalletFromURSM) {
    throw new ErrorBadRequest(
      `No-op - UserReplicaSetManager record for node with spID ${spID} already matches L1 ServiceProviderFactory record`
    )
  }

  /**
   * Confirm request was signed by delegate owner wallet registered on L1 for spID, given request signature artifacts
   */
  let requesterWalletRecoveryObj = { spID, timestamp: reqTimestamp }
  let recoveredDelegateOwnerWallet = (recoverWallet(requesterWalletRecoveryObj, reqSignature)).toLowerCase()
  if (delegateOwnerWalletFromSPFactory !== recoveredDelegateOwnerWallet) {
    throw new ErrorBadRequest(
      'Request for proposal must be signed by delegate owner wallet registered on L1 for spID'
    )
  }

  /**
   * Request node's up-to-date health info
   *  - uses endpoint registered on L1 for spID
   *  - passes `randomBytesToSign` string in request to check that response was signed for provided data
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
  nodeHealthCheckResp = parseCNodeResponse(
    nodeHealthCheckResp,
    ['healthy', 'creatorNodeEndpoint', 'spID', 'spOwnerWallet', 'randomBytesToSign']
  )

  /**
   * Confirm health check returns healthy and response data matches on-chain data
   */
  if (
    !(nodeHealthCheckResp.healthy)
    || (nodeHealthCheckResp.creatorNodeEndpoint !== nodeEndpointFromSPFactory)
    || (nodeHealthCheckResp.spID !== spID)
    || ((nodeHealthCheckResp.spOwnerWallet).toLowerCase() !== ownerWalletFromSPFactory.toLowerCase())
  ) {
    throw new ErrorServerError(`CN unhealthy or misconfigured`)
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
  if (signatureHasExpired(respTimestamp)) {
    throw new ErrorBadRequest('Health check response signature has expired')
  }
  const responderWalletRecoveryObj = { ...responseData, randomBytesToSign, timestamp: respTimestamp }
  recoveredDelegateOwnerWallet = (recoverWallet(responderWalletRecoveryObj, respSignature)).toLowerCase()
  if (delegateOwnerWalletFromSPFactory !== recoveredDelegateOwnerWallet) {
    throw new ErrorBadRequest(
      'Health check response must be signed by delegate owner wallet registered on L1 for spID'
    )
  }

  // Generate proposal signature artifacts
  const proposalSignatureInfo = await audiusLibs.contracts.UserReplicaSetManagerClient.getProposeAddOrUpdateContentNodeRequestData(
    spID,
    delegateOwnerWalletFromSPFactory,
    ownerWalletFromSPFactory,
    nodeConfig.get('spID')
  )

  return {
    nonce: proposalSignatureInfo.nonce,
    sig: proposalSignatureInfo.sig,
    spID: nodeConfig.get('spID')
  }
}

module.exports = {
  respondToURSMRequestForProposal
}