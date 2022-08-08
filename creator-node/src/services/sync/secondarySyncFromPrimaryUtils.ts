import type {
  ForceResyncConfig,
  ForceResyncSigningData,
  SyncRequestAxiosData
} from '../stateMachineManager/stateReconciliation/types'

const _ = require('lodash')

const { logger: genericLogger } = require('../../logging')
const ContentNodeInfoManager = require('../stateMachineManager/ContentNodeInfoManager')
const { recoverWallet } = require('../../apiSigning')

const asyncRetry = require('../../utils/asyncRetry')

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

  const logger = logContext ? genericLogger.child(logContext) : genericLogger

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

  // Derive the Content Node delegate wallet from the data, signature, and timestamp
  const recoveredPrimaryWallet = recoverWallet(
    { ...data, timestamp },
    signature
  )

  try {
    // Get the delegate wallet from the primary of the observed user
    const userPrimaryId = await asyncRetry({
      asyncFn: async () => {
        return (await libs.User.getUsers(1, 0, null, wallet))[0].primary_id
      },
      logLabel: 'shouldForceResync'
    })
    const { delegateOwnerWallet: actualPrimaryWallet } =
      ContentNodeInfoManager.getContentNodeInfoFromSpId(userPrimaryId)

    logger.debug(
      `shouldForceResync wallets actual: ${actualPrimaryWallet} recovered: ${recoveredPrimaryWallet}`
    )

    // Check that the recovered public key = primary wallet on chain
    return (
      recoveredPrimaryWallet.toLowerCase() === actualPrimaryWallet.toLowerCase()
    )
  } catch (e: any) {
    logger.error(
      `shouldForceResync Could not verify primary delegate owner key: ${e.message}`
    )
  }

  return false
}

export { shouldForceResync, generateDataForSignatureRecovery }
