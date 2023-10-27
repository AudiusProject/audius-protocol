import { IdentityRequestError } from '@audius/sdk'
import { call, takeEvery, put, select } from 'typed-redux-saga'

import { Name } from 'models/Analytics'
import { ErrorLevel } from 'models/ErrorReporting'
import { createStripeSession } from 'services/audius-backend/stripe'
import { getContext } from 'store/effects'

import { setVisibility } from '../modals/parentSlice'

import { reportStripeFlowAnalytics } from './sagaHelpers'
import { getStripeModalState } from './selectors'
import {
  cancelStripeOnramp,
  initializeStripeModal,
  stripeSessionCreated,
  stripeSessionStatusChanged
} from './slice'
import {
  StripeSessionCreationError,
  StripeSessionCreationErrorResponseData
} from './types'

function* handleInitializeStripeModal({
  payload: { amount, destinationCurrency, destinationWallet }
}: ReturnType<typeof initializeStripeModal>) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const reportToSentry = yield* getContext('reportToSentry')
  const { track, make } = yield* getContext('analytics')
  const { onrampFailed } = yield* select(getStripeModalState)
  try {
    const res = yield* call(createStripeSession, audiusBackendInstance, {
      amount,
      destinationCurrency,
      destinationWallet
    })
    yield* put(stripeSessionCreated({ clientSecret: res.client_secret }))
    yield* call(
      track,
      make({
        eventName: Name.STRIPE_SESSION_CREATED,
        amount,
        destinationCurrency
      })
    )
  } catch (e) {
    const {
      code,
      message: stripeErrorMessage,
      type
    } = ((e as IdentityRequestError).response?.data ??
      {}) as StripeSessionCreationErrorResponseData

    const error = new StripeSessionCreationError(code, stripeErrorMessage, type)

    if (onrampFailed) {
      yield* put({
        type: onrampFailed.type,
        payload: { error }
      })
    }
    yield* put(setVisibility({ modal: 'StripeOnRamp', visible: 'closing' }))
    yield* call(reportToSentry, {
      level: ErrorLevel.Error,
      error,
      additionalInfo: {
        code,
        stripeErrorMessage,
        type,
        amount,
        destinationCurrency
      }
    })
    yield* call(
      track,
      make({
        eventName: Name.STRIPE_SESSION_CREATION_ERROR,
        amount,
        code,
        destinationCurrency,
        stripeErrorMessage,
        type
      })
    )
  }
}

function* handleStripeSessionChanged({
  payload: { session }
}: ReturnType<typeof stripeSessionStatusChanged>) {
  const { onrampSucceeded, previousStripeSessionData } = yield* select(
    getStripeModalState
  )
  if (session.status === 'fulfillment_complete') {
    if (onrampSucceeded) {
      yield* put(onrampSucceeded)
    }
    yield* put(setVisibility({ modal: 'StripeOnRamp', visible: 'closing' }))
  }
  yield* call(reportStripeFlowAnalytics, session, previousStripeSessionData)
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
