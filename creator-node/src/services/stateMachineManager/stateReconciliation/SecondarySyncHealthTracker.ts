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
import { WalletToSecondaryAndMaxErrorReached } from './types'

const { logger: genericLogger } = require('../../../logging')
const redisClient = require('../../../redis')

const REDIS_KEY_PREFIX_PRIMARY_TO_SECONDARY_SYNC_FAILURE =
  'PRIMARY_TO_SECONDARY_SYNC_FAILURE'

const REDIS_KEY_EXPIRY_SECONDS = 259_200 // 3 days -- small range of buffer time to delete keys by
const PROCESS_USERS_BATCH_SIZE = 30

export class SecondarySyncHealthTracker {
  walletToSecondaryAndMaxErrorReached: WalletToSecondaryAndMaxErrorReached

  // Param exists so when processing jobs, data can be serialized into redis for processing later
  constructor(
    { walletToSecondaryAndMaxErrorReached } = {
      walletToSecondaryAndMaxErrorReached: {}
    }
  ) {
    if (!walletToSecondaryAndMaxErrorReached) {
      walletToSecondaryAndMaxErrorReached = {}
    }

    this.walletToSecondaryAndMaxErrorReached =
      walletToSecondaryAndMaxErrorReached
  }

  /**
   * On today, for a wallet on a secondary, record the failure as identified by `prometheusError` in Redis.
   * This info is later used to determine whether or not to re-enqueue another sync job or issue replica set update
   */
  async recordFailure({
    secondary,
    wallet,
    prometheusError
  }: {
    secondary: string
    wallet: string
    prometheusError: string
  }) {
    const redisKey = this._getSyncFailureRedisKey({
      secondary,
      wallet
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
   * If there is no presence of the wallet-secondary-error relationship, that means a wallet did not
   * encounter any max error capacity. Else, a max error was encountered
   * @param wallet
   * @param secondary
   * @returns flag on whether wallet on secondary exceeded the max attempts allowed
   */
  doesWalletOnSecondaryExceedMaxErrorsAllowed(
    wallet: string,
    secondary: string
  ): boolean {
    const error =
      this.walletToSecondaryAndMaxErrorReached?.[wallet]?.[secondary]

    if (error) {
      genericLogger.warn(
        {
          SecondarySyncHealthTracker:
            'doesWalletOnSecondaryExceedMaxErrorsAllowed',
          wallet,
          secondary,
          error
        },
        `Wallet encountered max errors allowed on secondary`
      )
    }

    return !!error
  }

  /**
   * Given an array of user info, determine whether the further action on the secondary for the
   * wallet should engage. Currently used for determining if a sync should reenqueue and if a
   * replica set update should be issued.
   */
  async computeWalletOnSecondaryExceedsMaxErrorsAllowed(
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
        const errorToErrorCount = await this._fetchErrorToErrorCount(
          failedSyncKey
        )

        if (errorToErrorCount) {
          // Get sync info from redis key
          const info = this._getInfoFromRedisKey(failedSyncKey)

          // Determine whether the wallet on the secondary exceeded max errors allowed
          this._determineIfWalletOnSecondaryExceededMaxErrorsAllowed({
            wallet: info.wallet,
            secondary: info.secondary,
            errorToErrorCount
          })
        }
      }
    }

    if (Object.keys(this.walletToSecondaryAndMaxErrorReached).length) {
      genericLogger.warn(
        {
          SecondarySyncHealthTracker:
            'computeWalletOnSecondaryExceedsMaxErrorsAllowed'
        },
        `Wallets on secondaries have exceeded the allowed error capacity for today: ${JSON.stringify(
          this.walletToSecondaryAndMaxErrorReached
        )}`
      )
    }
  }

  // Used for passing around state for job processing. Ideally, do not consume this data directly and
  // use the abstract methods
  getState(): {
    walletToSecondaryAndMaxErrorReached: WalletToSecondaryAndMaxErrorReached
  } {
    return {
      walletToSecondaryAndMaxErrorReached:
        this.walletToSecondaryAndMaxErrorReached
    }
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
        wallet
      })
      syncFailureKeys.push(redisKeyWalletToSecondary1)

      if (secondary2) {
        const redisKeyWalletToSecondary2 = this._getSyncFailureRedisKey({
          secondary: secondary2,
          wallet
        })
        syncFailureKeys.push(redisKeyWalletToSecondary2)
      }
    }

    return syncFailureKeys
  }

  async _fetchErrorToErrorCount(failedSyncKey: string) {
    const errorToErrorCount = await redisClient.hgetall(failedSyncKey)

    if (!errorToErrorCount) {
      return null
    }

    const errors = Object.keys(errorToErrorCount)

    if (!errors.length) {
      return null
    }

    const errorsToErrorCountParsed: { [error: string]: number } = {}
    errors.forEach((e) => {
      errorsToErrorCountParsed[e] = parseInt(errorToErrorCount[e])
    })

    return errorsToErrorCountParsed
  }

  _determineIfWalletOnSecondaryExceededMaxErrorsAllowed({
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
      const exceedsMaxErrorsAllowed = this._didErrorExceedMaxRetries(
        error,
        errorCount
      )

      // If any error exceeded, mark wallet on secondary as exceeded and
      // track down which error
      if (exceedsMaxErrorsAllowed) {
        this._updateWalletToSecondaryAndMaxErrorReached({
          wallet,
          secondary,
          error
        })
      }
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
    if (!this.walletToSecondaryAndMaxErrorReached[wallet]) {
      this.walletToSecondaryAndMaxErrorReached[wallet] = {}
    }

    this.walletToSecondaryAndMaxErrorReached[wallet][secondary] = error
  }

  _didErrorExceedMaxRetries(error: string, errorCount: number) {
    const maxRetries =
      SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES_MAP.get(error) ??
      SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES.default

    return errorCount >= maxRetries
  }

  _getSyncFailureRedisKey({
    secondary,
    wallet
  }: {
    secondary: string
    wallet: string
  }) {
    // format: YYYY-MM-DD
    const date = new Date().toISOString().split('T')[0]

    return `${REDIS_KEY_PREFIX_PRIMARY_TO_SECONDARY_SYNC_FAILURE}::${date}::${secondary}::${wallet}`
  }

  _getInfoFromRedisKey(redisKey: string): {
    date: string
    secondary: string
    wallet: string
  } {
    const info = redisKey.split('::')

    return {
      date: info[1],
      secondary: info[2],
      wallet: info[3]
    }
  }
}

module.exports = { SecondarySyncHealthTracker }
