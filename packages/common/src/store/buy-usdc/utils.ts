import { PublicKey } from '@solana/web3.js'
import { call, delay, select } from 'typed-redux-saga'

import { getTokenAccountInfo } from '~/services/audius-backend/solana'
import { IntKeys } from '~/services/remote-config'
import {
  MAX_CONTENT_PRICE_CENTS,
  MAX_USDC_PURCHASE_AMOUNT_CENTS,
  MIN_CONTENT_PRICE_CENTS,
  MIN_USDC_PURCHASE_AMOUNT_CENTS
} from '~/services/remote-config/defaults'

import { getAccountUser } from '../account/selectors'
import { getContext } from '../effects'
import { getSDK } from '../sdkUtils'

const POLL_ACCOUNT_INFO_DELAY_MS = 1000
const POLL_ACCOUNT_INFO_RETRIES = 30

/**
 * Derives a USDC user bank for a given eth address, creating it if necessary.
 * Defaults to the wallet of the current user.
 */
export function* getOrCreateUSDCUserBank(ethAddress?: string) {
  const audiusSdk = yield* getContext('audiusSdk')
  const sdk = yield* call(audiusSdk)
  let ethWallet = ethAddress
  if (!ethWallet) {
    const user = yield* select(getAccountUser)
    if (!user?.wallet) {
      throw new Error('Failed to create USDC user bank: No user wallet found.')
    }
    ethWallet = user.wallet
  }
  const { userBank } = yield* call(
    [
      sdk.services.claimableTokensClient,
      sdk.services.claimableTokensClient.getOrCreateUserBank
    ],
    {
      ethWallet,
      mint: 'USDC'
    }
  )
  return userBank
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
  retryDelayMs?: number
  maxRetryCount?: number
}) {
  const sdk = yield* getSDK()

  let retries = 0
  let result
  while (retries < maxRetryCount && !result) {
    result = yield* call(getTokenAccountInfo, sdk, getTokenAccountInfoArgs)
    retries += 1
    yield* delay(retryDelayMs)
  }
  if (!result) {
    throw new Error(
      `Failed to fetch USDC user bank token account info for ${getTokenAccountInfoArgs.tokenAccount.toString()}`
    )
  }
  return result
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

  return {
    minContentPriceCents,
    maxContentPriceCents,
    minUSDCPurchaseAmountCents,
    maxUSDCPurchaseAmountCents,
    maxRetryCount,
    retryDelayMs
  }
}
