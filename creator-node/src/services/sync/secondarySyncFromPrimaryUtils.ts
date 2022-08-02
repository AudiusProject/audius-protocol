import type {
  SyncRequestAxiosData,
  ForceResyncAuthParams,
  ForceResyncConfig
} from '../stateMachineManager/stateReconciliation/types'

const _ = require('lodash')

const { logger: genericLogger } = require('../../logging')
const config = require('../../config')
const ContentNodeInfoManager = require('../stateMachineManager/ContentNodeInfoManager')
const {
  recoverWallet,
  generateTimestampAndSignature
} = require('../../apiSigning')

// Function to sign sync data. This is used to determine whether or not to `forceResync`
const signSyncData = (syncData: SyncRequestAxiosData) => {
  return generateTimestampAndSignature(
    syncData,
    config.get('delegatePrivateKey')
  )
}

// Derive the Content Node delegate wallet from the data, signature, and timestamp
const recoverWalletFromSyncData = ({
  data,
  timestamp,
  signature
}: ForceResyncAuthParams) => {
  return recoverWallet({ ...data, timestamp }, signature)
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
const shouldForceResync = async (forceResyncConfig: ForceResyncConfig) => {
  if (!forceResyncConfig) return false

  let {
    apiSigning: { data, signature, timestamp },
    wallet,
    forceResync,
    libs,
    logContext,
    logger
  } = forceResyncConfig

  if (logContext) {
    logger = genericLogger.child(logContext)
  } else if (!logger) {
    logger = genericLogger
  }

  logger.debug(
    `Checking shouldForceResync: wallet=${wallet} forceResync=${forceResync}`
  )

  if (!forceResync || !data || !timestamp || !signature) {
    return false
  }

  // Derive the Content Node delegate wallet from the data, signature, and timestamp
  const recoveredPrimaryWallet = recoverWalletFromSyncData({
    data,
    timestamp,
    signature
  })

  try {
    // Get the delegate wallet from the primary of the observed user
    const userPrimaryId = (await libs.User.getUsers(1, 0, null, wallet))[0]
      .primary_id
    const { delegateOwnerWallet: actualPrimaryWallet } =
      ContentNodeInfoManager.getContentNodeInfoFromSpId(userPrimaryId)

    logger.debug(
      `actual: ${actualPrimaryWallet} recovered: ${recoveredPrimaryWallet}`
    )

    // Check that the receovered public key = primary wallet on chain
    return recoveredPrimaryWallet === actualPrimaryWallet
  } catch (e: any) {
    logger.error(`Could not verify primary delegate owner key: ${e.message}`)
  }

  return false
}

export { shouldForceResync, signSyncData }
