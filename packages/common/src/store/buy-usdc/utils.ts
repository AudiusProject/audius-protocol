import { call, select } from 'typed-redux-saga'

import { createUserBankIfNeeded } from '~/services/audius-backend/solana'
import { IntKeys } from '~/services/remote-config'
import {
  MAX_CONTENT_PRICE_CENTS,
  MAX_USDC_PURCHASE_AMOUNT_CENTS,
  MIN_CONTENT_PRICE_CENTS,
  MIN_USDC_PURCHASE_AMOUNT_CENTS,
  BUY_TOKEN_VIA_SOL_SLIPPAGE_BPS
} from '~/services/remote-config/defaults'
import { getContext } from '~/store/effects'
import { getFeePayer } from '~/store/solana/selectors'

/**
 * Derives a USDC user bank for a given eth address, creating it if necessary.
 * Defaults to the wallet of the current user.
 */
export function* getUSDCUserBank(ethAddress?: string) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const { track } = yield* getContext('analytics')
  const feePayerOverride = yield* select(getFeePayer)
  if (!feePayerOverride) {
    throw new Error('getUSDCUserBank: unexpectedly no fee payer override')
  }
  return yield* call(createUserBankIfNeeded, audiusBackendInstance, {
    ethAddress,
    feePayerOverride,
    mint: 'usdc',
    recordAnalytics: track
  })
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
