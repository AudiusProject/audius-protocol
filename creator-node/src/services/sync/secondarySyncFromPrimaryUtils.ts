import type Logger from 'bunyan'
import type {
  ForceResyncConfig,
  ForceResyncSigningData,
  SyncRequestAxiosData
} from '../stateMachineManager/stateReconciliation/types'

import _ from 'lodash'
import {
  getContentNodeInfoFromEndpoint,
  getReplicaSetEndpointsByWallet
} from '../ContentNodeInfoManager'
import config from '../../config'
import { isFqdn } from '../../utils'
import { logger as genericLogger } from '../../logging'
import { recoverWallet, signatureHasExpired } from '../../apiSigning'

const generateDataForSignatureRecovery = (
  body: SyncRequestAxiosData
): ForceResyncSigningData => {
  const { wallet, creator_node_endpoint, sync_type, immediate } = body
  return {
    wallet,
    creator_node_endpoint,
    sync_type,
    immediate
  }
}

/**
 * Checks to see if the host requesting the sync is the primary of the observed user
 * @param {Object} param
 * @param {Object} param.apiSigning object containing the data, signaqture, and timestamp for signature verification
 * @param {Object} param.libs the libs instance
 * @param {string} param.wallet the observed user's wallet
 * @param {boolean} param.forceResync flag from the request to force resync (i.e. clearing old user state) or not
 * @param {Object} param.logger log object
 * @param {Object} param.logContext object of log context. used when this sync job is enqueued
 * @returns true or false, depending on the request flag and whether the requester host is the primary of the user
 */
const shouldForceResync = async (
  { libs, logContext }: any,
  forceResyncConfig: ForceResyncConfig
) => {
  if (!forceResyncConfig) return false

  const { signatureData, wallet, forceResync } = forceResyncConfig

  const logger: Logger = logContext
    ? genericLogger.child(logContext)
    : genericLogger

  logger.debug(
    `Checking shouldForceResync: wallet=${wallet} forceResync=${forceResync}`
  )

  if (!forceResync || !signatureData) {
    return false
  }

  const { data, timestamp, signature } = signatureData
  if (!data || !timestamp || !signature) {
    return false
  }

  const expired = signatureHasExpired(timestamp)
  if (expired) return false

  // Derive the Content Node delegate wallet from the data, signature, and timestamp
  const recoveredPrimaryWallet = recoverWallet(
    { ...data, timestamp },
    signature
  )

  try {
    // Get the delegate wallet from the primary of the observed user
    const replicaSetEndpoints = await getReplicaSetEndpointsByWallet({
      userReplicaSetManagerClient: libs.contracts.UserReplicaSetManagerClient,
      wallet,
      parentLogger: logger,
      getUsers: libs.User.getUsers
    })
    const primaryInfo = await getContentNodeInfoFromEndpoint(
      replicaSetEndpoints.primary!,
      logger
    )
    if (primaryInfo === undefined) return false
    const { delegateOwnerWallet: actualPrimaryWallet } = primaryInfo

    logger.debug(
      `shouldForceResync wallets actual: ${actualPrimaryWallet} recovered: ${recoveredPrimaryWallet}`
    )

    // Check that the recovered public key = primary wallet on chain
    return (
      recoveredPrimaryWallet.toLowerCase() === actualPrimaryWallet.toLowerCase()
    )
  } catch (e: any) {
    logger.error(
      `shouldForceResync Could not verify primary delegate owner key: ${e.message}: ${e.stack}`
    )
  }

  return false
}

/**
 * Retrieves current FQDN registered on-chain with node's owner wallet
 * and throws if it doesn't match.
 */
const getAndValidateOwnEndpoint = async (logger: Logger): Promise<string> => {
  const cNodeEndpoint = config.get('creatorNodeEndpoint')

  if (!cNodeEndpoint) {
    throw new Error('Must provide creatorNodeEndpoint config var.')
  }

  const cNodeInfo = await getContentNodeInfoFromEndpoint(cNodeEndpoint, logger)

  // Confirm on-chain endpoint exists and is valid FQDN
  // Error condition is met if any of the following are true
  // - No spInfo returned from chain
  // - Configured spOwnerWallet does not match on chain spOwnerWallet
  // - Configured delegateOwnerWallet does not match on chain delegateOwnerWallet
  // - Endpoint returned from chain but is an invalid FQDN, preventing successful operations
  // - Endpoint returned from chain does not match configured endpoint
  if (
    cNodeInfo === undefined ||
    !cNodeInfo.hasOwnProperty('endpoint') ||
    cNodeInfo.owner.toLowerCase() !==
      config.get('spOwnerWallet').toLowerCase() ||
    cNodeInfo.delegateOwnerWallet.toLowerCase() !==
      config.get('delegateOwnerWallet').toLowerCase() ||
    !isFqdn(cNodeInfo.endpoint) ||
    cNodeInfo.endpoint !== cNodeEndpoint
  ) {
    throw new Error(
      `Cannot getAndValidateOwnEndpoint for node. Returned from chain=${JSON.stringify(
        cNodeInfo
      )}, configs=(creatorNodeEndpoint=${config.get(
        'creatorNodeEndpoint'
      )}, spOwnerWallet=${config.get(
        'spOwnerWallet'
      )}, delegateOwnerWallet=${config.get('delegateOwnerWallet')})`
    )
  }
  return cNodeInfo.endpoint
}

export {
  shouldForceResync,
  generateDataForSignatureRecovery,
  getAndValidateOwnEndpoint
}
