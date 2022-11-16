/**
 * SecondarySyncHealthTracker
 * API for Primary to track wallet-secondary encountered errors. Used to determine if further
 * action should be taking place on a secondary for a wallet
 */

import { ComputeWalletOnSecondaryUserInfo } from '../stateMonitoring/types'
import {
  SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES,
  SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES_MAP
} from './SecondarySyncHealthTrackerConstants'
import {
  WalletToSecondaryAndMaxErrorReached,
  WalletToSecondaryToShouldContinueAction
} from './types'

const { logger: genericLogger } = require('../../../logging')
const redisClient = require('../../../redis')

const REDIS_KEY_PREFIX_PRIMARY_TO_SECONDARY_SYNC_FAILURE =
  'PRIMARY_TO_SECONDARY_SYNC_FAILURE'

const REDIS_KEY_EXPIRY_SECONDS = 259_200 // 3 days -- small range of buffer time to delete keys by
const PROCESS_USERS_BATCH_SIZE = 30

export class SecondarySyncHealthTracker {
  walletToSecondaryToShouldContinueAction: WalletToSecondaryToShouldContinueAction
  walletsToSecondaryAndMaxErrorReached: WalletToSecondaryAndMaxErrorReached

  constructor() {
    this.walletToSecondaryToShouldContinueAction = {}
    this.walletsToSecondaryAndMaxErrorReached = {}
  }

  /**
   * On today, for a wallet on a secondary, record the failure as identified by `prometheusError` in Redis.
   * This info is later used to determine whether or not to re-enqueue another sync job or issue replica set update
   */
  async recordFailure({
    secondary,
    wallet,
    syncType,
    prometheusError
  }: {
    secondary: string
    wallet: string
    syncType: string
    prometheusError: string
  }) {
    const redisKey = this._getSyncFailureRedisKey({
      secondary,
      wallet,
      syncType
    })

    try {
      // For a secondary-wallet pairing for today, increment the error count for prometheusError by 1
      await redisClient.hincrby(redisKey, prometheusError, 1 /* increment */)

      // Set the expiry by REDIS_KEY_EXPIRY_SECONDS
      await redisClient.expire(redisKey, REDIS_KEY_EXPIRY_SECONDS)

      genericLogger.debug(
        { SecondarySyncHealthTracker: 'recordFailure' },
        `Incremented ${redisKey}:${prometheusError} count`
      )
    } catch (e: any) {
      genericLogger.error(
        { SecondarySyncHealthTracker: 'recordFailure' },
        `Failed to increment ${redisKey}:${prometheusError} count`
      )
    }
  }

  /**
   * If there is no presence of the wallet, wallet-secondary pair, that means no
   * error was encountered. Else, return what is in the map
   * @param wallet
   * @param secondary
   * @returns flag on whether action should continue
   */
  shouldWalletOnSecondaryContinueAction(
    wallet: string,
    secondary: string
  ): boolean {
    if (
      !this.walletToSecondaryToShouldContinueAction ||
      !this.walletToSecondaryToShouldContinueAction[wallet] ||
      !this.walletToSecondaryToShouldContinueAction[wallet][secondary]
    ) {
      return true
    }

    return this.walletToSecondaryToShouldContinueAction[wallet][secondary]
  }

  /**
   * Given an array of user info, determine whether the further action on the secondary for the
   * wallet should engage. Currently used for determining if a sync should reenqueue and if a
   * replica set update should be issued.
   */
  async computeIfWalletOnSecondaryShouldContinueActions(
    userInfo: ComputeWalletOnSecondaryUserInfo[]
  ) {
    // For each secondary-wallet-date
    for (let i = 0; i < userInfo.length; i += PROCESS_USERS_BATCH_SIZE) {
      // Get batch slice of users
      const userInfoSlice = userInfo.slice(i, i + PROCESS_USERS_BATCH_SIZE)

      // Get all the keys for sync failures
      const failedSyncKeys =
        await this._getSyncFailureKeyForWalletOnSecondaries(userInfoSlice)

      for (const failedSyncKey of failedSyncKeys) {
        // Get all the errors encountered for the wallet-secondaray-date
        const errorToErrorCount = await redisClient.hgetall(failedSyncKey)

        if (errorToErrorCount) {
          // Get sync info from redis key
          const info = this._getInfoFromRedisKey(failedSyncKey)

          // Determine whether for the secondary-wallet-error should a failed sync retry
          this._determineIfSyncShouldReenqueue({
            wallet: info.wallet,
            secondary: info.secondary,
            errorToErrorCount
          })
        }
      }
    }

    if (Object.keys(this.walletsToSecondaryAndMaxErrorReached).length) {
      genericLogger.warn(
        {
          SecondarySyncHealthTracker:
            'computeIfWalletOnSecondaryShouldContinueActions'
        },
        `Wallets on secondaries have exceeded the allowed error capacity for today: ${JSON.stringify(
          this.walletsToSecondaryAndMaxErrorReached
        )}`
      )
    }
  }

  getWalletToSecondaryToShouldContinueAction(): WalletToSecondaryToShouldContinueAction {
    return this.walletToSecondaryToShouldContinueAction
  }

  /**
   * Given user info, generate the redis keys
   * @param userInfo user info
   * @returns the redis keys
   */
  async _getSyncFailureKeyForWalletOnSecondaries(
    userInfo: ComputeWalletOnSecondaryUserInfo[]
  ): Promise<string[]> {
    const syncFailureKeys = []
    for (const { wallet, secondary1, secondary2 } of userInfo) {
      const redisKeyWalletToSecondary1 = this._getSyncFailureRedisKey({
        secondary: secondary1,
        wallet,
        syncType: '*'
      })

      const redisKeyWalletToSecondary2 = this._getSyncFailureRedisKey({
        secondary: secondary2,
        wallet,
        syncType: '*'
      })

      syncFailureKeys.push(redisKeyWalletToSecondary1)
      syncFailureKeys.push(redisKeyWalletToSecondary2)
    }

    return syncFailureKeys
  }

  _determineIfSyncShouldReenqueue({
    wallet,
    secondary,
    errorToErrorCount
  }: {
    wallet: string
    secondary: string
    errorToErrorCount: { [error: string]: number /* the error count */ }
  }) {
    // Get the error and number of times the error occurred
    for (const [error, errorCount] of Object.entries(errorToErrorCount)) {
      // Compare the above number to the max retry attempts
      const shouldContinueAction = this._shouldContinueAction(error, errorCount)

      if (!shouldContinueAction) {
        this._updateWalletToSecondaryAndMaxErrorReached({
          wallet,
          secondary,
          error
        })
      }

      // If under, record retry to 'true'. Else, record retry as 'false'.
      this._updateWalletToSecondaryToShouldContinueAction({
        shouldContinueAction,
        wallet,
        secondary
      })
    }
  }

  _updateWalletToSecondaryToShouldContinueAction({
    shouldContinueAction,
    wallet,
    secondary
  }: {
    wallet: string
    secondary: string
    shouldContinueAction: boolean
  }) {
    if (!this.walletToSecondaryToShouldContinueAction[wallet]) {
      this.walletToSecondaryToShouldContinueAction[wallet] = {}
    }

    this.walletToSecondaryToShouldContinueAction[wallet][secondary] =
      shouldContinueAction
  }

  _shouldContinueAction(error: string, errorCount: number) {
    const maxRetries = SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES_MAP.get(error)

    if (maxRetries === undefined) {
      return errorCount <= SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES.default
    }

    return errorCount <= maxRetries
  }

  _getSyncFailureRedisKey({
    secondary,
    wallet,
    syncType
  }: {
    secondary: string
    wallet: string
    syncType: string
  }) {
    // format: YYYY-MM-DD
    const date = new Date().toISOString().split('T')[0]

    return `${REDIS_KEY_PREFIX_PRIMARY_TO_SECONDARY_SYNC_FAILURE}::${date}::${secondary}::${wallet}::${syncType}`
  }

  _getInfoFromRedisKey(redisKey: string): {
    date: string
    secondary: string
    wallet: string
    syncType: string
  } {
    const info = redisKey.split('::')

    return {
      date: info[1],
      secondary: info[2],
      wallet: info[3],
      syncType: info[4]
    }
  }

  _updateWalletToSecondaryAndMaxErrorReached({
    wallet,
    secondary,
    error
  }: {
    wallet: string
    secondary: string
    error: string
  }) {
    if (!this.walletsToSecondaryAndMaxErrorReached[wallet]) {
      this.walletsToSecondaryAndMaxErrorReached[wallet] = {}
    }

    this.walletsToSecondaryAndMaxErrorReached[wallet][secondary] = error
  }
}

module.exports = SecondarySyncHealthTracker
