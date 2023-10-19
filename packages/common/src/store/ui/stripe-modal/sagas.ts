import { call, takeEvery, put, select } from 'typed-redux-saga'

import { createStripeSession } from 'services/audius-backend/stripe'
import { getContext } from 'store/effects'

import { setVisibility } from '../modals/parentSlice'

import { getStripeModalState } from './selectors'
import {
  cancelStripeOnramp,
  initializeStripeModal,
  stripeSessionCreated,
  stripeSessionStatusChanged
} from './slice'

function* handleInitializeStripeModal({
  payload: { amount, destinationCurrency, destinationWallet }
}: ReturnType<typeof initializeStripeModal>) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const { onrampFailed } = yield* select(getStripeModalState)
  try {
    const res = yield* call(createStripeSession, audiusBackendInstance, {
      amount,
      destinationCurrency,
      destinationWallet
    })
    yield* put(stripeSessionCreated({ clientSecret: res.client_secret }))
  } catch (e) {
    // TODO: When we have better error messages from identity, we should extract them here so
    // they make it into analytics.
    // https://linear.app/audius/issue/PAY-2041/[usdc]-we-should-pipe-the-stripe-session-creation-error-back-from
    if (onrampFailed) {
      yield* put({ type: onrampFailed.type, payload: { error: e } })
    }
    yield* put(setVisibility({ modal: 'StripeOnRamp', visible: 'closing' }))
  }
}

function* handleStripeSessionChanged({
  payload: { status }
}: ReturnType<typeof stripeSessionStatusChanged>) {
  if (status === 'fulfillment_complete') {
    const { onrampSucceeded } = yield* select(getStripeModalState)
    if (onrampSucceeded) {
      yield* put(onrampSucceeded)
    }
    yield* put(setVisibility({ modal: 'StripeOnRamp', visible: 'closing' }))
  }
}

function* handleCancelStripeOnramp() {
  const { onrampCanceled } = yield* select(getStripeModalState)
  yield* put(setVisibility({ modal: 'StripeOnRamp', visible: 'closing' }))

  if (onrampCanceled) {
    yield* put(onrampCanceled)
  }
}

function* watchInitializeStripeModal() {
  yield takeEvery(initializeStripeModal, handleInitializeStripeModal)
}

function* watchStripeSessionChanged() {
  yield takeEvery(stripeSessionStatusChanged, handleStripeSessionChanged)
}

function* watchCancelStripeOnramp() {
  yield takeEvery(cancelStripeOnramp, handleCancelStripeOnramp)
}

export default function sagas() {
  return [
    watchInitializeStripeModal,
    watchStripeSessionChanged,
    watchCancelStripeOnramp
  ]
}
