import { PublicKey } from '@solana/web3.js'
import { channel, Channel } from 'redux-saga'
import { call, delay, select, take } from 'typed-redux-saga'

import {
  createUserBankIfNeeded,
  getTokenAccountInfo,
  MintName
} from '~/services/audius-backend/solana'
import { IntKeys } from '~/services/remote-config'
import {
  MAX_CONTENT_PRICE_CENTS,
  MAX_USDC_PURCHASE_AMOUNT_CENTS,
  MIN_CONTENT_PRICE_CENTS,
  MIN_USDC_PURCHASE_AMOUNT_CENTS,
  BUY_TOKEN_VIA_SOL_SLIPPAGE_BPS
} from '~/services/remote-config/defaults'

import { getContext } from '../effects'
import { getFeePayer } from '../solana/selectors'

const POLL_ACCOUNT_INFO_DELAY_MS = 1000
const POLL_ACCOUNT_INFO_RETRIES = 30

// Create a channel to manage concurrent requests
let pendingUserBankCreation: Channel<{
  result?: Awaited<ReturnType<typeof createUserBankIfNeeded>>
  error?: Error
}> | null = null

/**
 * Derives a USDC user bank for a given eth address, creating it if necessary.
 * Defaults to the wallet of the current user. Uses a channel to manage concurrent
 * requests so there is only one creation attempt in flight at a time.
 */
export function* getOrCreateUSDCUserBank(ethAddress?: string) {
  // If there's already a pending operation, wait for its result
  if (pendingUserBankCreation) {
    const { result, error } = yield* take(pendingUserBankCreation)
    if (error) throw error
    if (!result)
      throw new Error('No user bank returned from createUserBankIfNeeded')
    return result
  }

  // Create a new channel for this bank creation
  pendingUserBankCreation = channel()
  try {
    const audiusBackendInstance = yield* getContext('audiusBackendInstance')
    const { track } = yield* getContext('analytics')
    const feePayerOverride = yield* select(getFeePayer)

    if (!feePayerOverride) {
      throw new Error(
        'getOrCreateUSDCUserBank: unexpectedly no fee payer override'
      )
    }

    // Perform the bank creation
    const result = yield* call(createUserBankIfNeeded, audiusBackendInstance, {
      ethAddress,
      feePayerOverride,
      mint: 'usdc',
      recordAnalytics: track
    })

    // Put the successful result on the channel
    pendingUserBankCreation.put({ result })
    return result
  } catch (error) {
    // Put the error on the channel
    pendingUserBankCreation.put({ error: error as Error })
    throw error
  } finally {
    // Close and cleanup the channel
    pendingUserBankCreation.close()
    pendingUserBankCreation = null
  }
}

/** Polls for the given token account info up to a maximum retry count. Useful
 * for ensuring account is returned if it may have just been created.
 */
export function* pollForTokenAccountInfo({
  retryDelayMs = POLL_ACCOUNT_INFO_DELAY_MS,
  maxRetryCount = POLL_ACCOUNT_INFO_RETRIES,
  ...getTokenAccountInfoArgs
}: {
  tokenAccount: PublicKey
  mint?: MintName
  retryDelayMs?: number
  maxRetryCount?: number
}) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  let retries = 0
  let tokenAccount
  while (retries < maxRetryCount && !tokenAccount) {
    tokenAccount = yield* call(
      getTokenAccountInfo,
      audiusBackendInstance,
      getTokenAccountInfoArgs
    )
    retries += 1
    yield* delay(retryDelayMs)
  }
  if (!tokenAccount) {
    throw new Error('Failed to fetch USDC user bank token account info')
  }
  return tokenAccount
}

export function* getBuyUSDCRemoteConfig() {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* call([remoteConfigInstance, remoteConfigInstance.waitForRemoteConfig])

  const minContentPriceCents =
    remoteConfigInstance.getRemoteVar(IntKeys.MIN_CONTENT_PRICE_CENTS) ??
    MIN_CONTENT_PRICE_CENTS
  const maxContentPriceCents =
    remoteConfigInstance.getRemoteVar(IntKeys.MAX_CONTENT_PRICE_CENTS) ??
    MAX_CONTENT_PRICE_CENTS
  const minUSDCPurchaseAmountCents =
    remoteConfigInstance.getRemoteVar(IntKeys.MIN_USDC_PURCHASE_AMOUNT_CENTS) ??
    MIN_USDC_PURCHASE_AMOUNT_CENTS
  const maxUSDCPurchaseAmountCents =
    remoteConfigInstance.getRemoteVar(IntKeys.MAX_USDC_PURCHASE_AMOUNT_CENTS) ??
    MAX_USDC_PURCHASE_AMOUNT_CENTS

  const retryDelayMs =
    remoteConfigInstance.getRemoteVar(IntKeys.BUY_TOKEN_WALLET_POLL_DELAY_MS) ??
    undefined
  const maxRetryCount =
    remoteConfigInstance.getRemoteVar(
      IntKeys.BUY_TOKEN_WALLET_POLL_MAX_RETRIES
    ) ?? undefined

  // Only used in the BuyCryptoViaSol flow
  const slippage =
    remoteConfigInstance.getRemoteVar(IntKeys.BUY_TOKEN_VIA_SOL_SLIPPAGE_BPS) ??
    BUY_TOKEN_VIA_SOL_SLIPPAGE_BPS

  return {
    minContentPriceCents,
    maxContentPriceCents,
    minUSDCPurchaseAmountCents,
    maxUSDCPurchaseAmountCents,
    maxRetryCount,
    retryDelayMs,
    slippage
  }
}
