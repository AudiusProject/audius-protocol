import { PublicKey } from '@solana/web3.js'
import { takeLatest } from 'redux-saga/effects'
import { call, put, race, take } from 'typed-redux-saga'

import { Name } from 'models/Analytics'
import { ErrorLevel } from 'models/ErrorReporting'
import {
  getTokenAccountInfo,
  pollForBalanceChange
} from 'services/audius-backend/solana'
import { IntKeys } from 'services/remote-config'
import { getContext } from 'store/effects'
import { setVisibility } from 'store/ui/modals/parentSlice'
import { initializeStripeModal } from 'store/ui/stripe-modal/slice'

import {
  buyUSDCFlowFailed,
  buyUSDCFlowSucceeded,
  onrampCanceled,
  onrampOpened,
  purchaseStarted,
  onrampSucceeded
} from './slice'
import { USDCOnRampProvider } from './types'
import { getUSDCUserBank } from './utils'

// TODO: Configurable min/max usdc purchase amounts?
function* getBuyUSDCRemoteConfig() {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* call([remoteConfigInstance, remoteConfigInstance.waitForRemoteConfig])
  const retryDelayMs =
    remoteConfigInstance.getRemoteVar(IntKeys.BUY_TOKEN_WALLET_POLL_DELAY_MS) ??
    undefined
  const maxRetryCount =
    remoteConfigInstance.getRemoteVar(
      IntKeys.BUY_TOKEN_WALLET_POLL_MAX_RETRIES
    ) ?? undefined
  return {
    maxRetryCount,
    retryDelayMs
  }
}

type PurchaseStepParams = {
  desiredAmount: number
  tokenAccount: PublicKey
  provider: USDCOnRampProvider
  retryDelayMs?: number
  maxRetryCount?: number
}

function* purchaseStep({
  desiredAmount,
  tokenAccount,
  provider,
  retryDelayMs,
  maxRetryCount
}: PurchaseStepParams) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const { track, make } = yield* getContext('analytics')
  const initialAccountInfo = yield* call(
    getTokenAccountInfo,
    audiusBackendInstance,
    {
      mint: 'usdc',
      tokenAccount
    }
  )
  if (!initialAccountInfo) {
    throw new Error('Could not get userbank account info')
  }
  const initialBalance = initialAccountInfo.amount

  yield* put(purchaseStarted())

  // Wait for on ramp finish
  const result = yield* race({
    success: take(onrampSucceeded),
    canceled: take(onrampCanceled)
  })

  // If the user didn't complete the on ramp flow, return early
  if (result.canceled) {
    yield* call(
      track,
      make({ eventName: Name.BUY_USDC_ON_RAMP_CANCELED, provider })
    )
    return {}
  }
  yield* call(
    track,
    make({ eventName: Name.BUY_USDC_ON_RAMP_SUCCESS, provider })
  )

  // Wait for the funds to come through
  const newBalance = yield* call(pollForBalanceChange, audiusBackendInstance, {
    mint: 'usdc',
    tokenAccount,
    initialBalance,
    retryDelayMs,
    maxRetryCount
  })

  // Check that we got the requested amount
  const purchasedAmount = newBalance - initialBalance
  if (purchasedAmount !== BigInt(desiredAmount)) {
    console.warn(
      `Warning: Purchase USDC amount differs from expected. Actual: ${
        newBalance - initialBalance
      } Wei. Expected: ${desiredAmount / 100} USDC.`
    )
  }

  return { newBalance }
}

function* doBuyUSDC({
  payload: {
    provider,
    purchaseInfo: { desiredAmount }
  }
}: ReturnType<typeof onrampOpened>) {
  const reportToSentry = yield* getContext('reportToSentry')
  const { track, make } = yield* getContext('analytics')

  const userBank = yield* getUSDCUserBank()

  try {
    if (provider !== USDCOnRampProvider.STRIPE) {
      throw new Error('USDC Purchase is only supported via Stripe')
    }

    yield* put(
      initializeStripeModal({
        // stripe expects amount in dollars, not cents
        amount: (desiredAmount / 100).toString(),
        destinationCurrency: 'usdc',
        destinationWallet: userBank.toString(),
        onrampCanceled,
        onrampSucceeded
      })
    )

    yield* put(setVisibility({ modal: 'StripeOnRamp', visible: true }))

    // Record start
    yield* call(
      track,
      make({ eventName: Name.BUY_USDC_ON_RAMP_OPENED, provider })
    )

    // Setup

    // Get config
    const { retryDelayMs, maxRetryCount } = yield* call(getBuyUSDCRemoteConfig)

    // Wait for purchase
    // Have to do some typescript finangling here due to the "race" effect in purchaseStep
    // See https://github.com/agiledigital/typed-redux-saga/issues/43
    const { newBalance } = (yield* call(purchaseStep, {
      provider,
      desiredAmount,
      tokenAccount: userBank,
      retryDelayMs,
      maxRetryCount
    }) as unknown as ReturnType<typeof purchaseStep>)!

    // If the user canceled the purchase, stop the flow
    if (newBalance === undefined) {
      return
    }

    yield* put(buyUSDCFlowSucceeded())

    // Record success
    yield* call(
      track,
      make({
        eventName: Name.BUY_USDC_SUCCESS,
        provider,
        requestedAmount: desiredAmount
      })
    )
  } catch (e) {
    yield* call(reportToSentry, {
      level: ErrorLevel.Error,
      error: e as Error,
      additionalInfo: { userBank }
    })
    yield* put(buyUSDCFlowFailed())
    yield* call(
      track,
      make({
        eventName: Name.BUY_USDC_FAILURE,
        provider,
        requestedAmount: desiredAmount,
        error: (e as Error).message
      })
    )
  }
}

function* watchOnRampOpened() {
  yield takeLatest(onrampOpened, doBuyUSDC)
}

export default function sagas() {
  return [watchOnRampOpened]
}
