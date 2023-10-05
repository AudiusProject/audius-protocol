import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'

import * as signOnActions from './actions'

function* handleSignOnError(
  action: ReturnType<
    typeof signOnActions.signUpFailed | typeof signOnActions.signInFailed
  >
) {
  const SIGN_UP_ERROR_PREFIX = 'SIGN_ON/SIGN_UP_ERROR_'
  const SIGN_IN_ERROR_PREFIX = 'SIGN_ON/SIGN_IN_ERROR_'

  const shouldReport = 'shouldReport' in action ? action.shouldReport : true

  const shouldToast = 'shouldToast' in action ? action.shouldToast : false

  const errorType = (() => {
    // Compute the error type from the phase
    switch (action.type) {
      case signOnActions.SIGN_UP_FAILED:
        return `${SIGN_UP_ERROR_PREFIX}${action.phase}`
      case signOnActions.SIGN_IN_FAILED:
        return `${SIGN_IN_ERROR_PREFIX}${action.phase}`
      default:
        return action.type
    }
  })()

  const message = 'message' in action ? action.message ?? errorType : errorType

  yield put(
    errorActions.handleError({
      message,
      shouldReport,
      shouldToast,
      additionalInfo: { errorMessage: action.error },
      uiErrorCode: action.uiErrorCode
    })
  )
}

export function* watchSignOnError() {
  yield takeEvery(
    [
      signOnActions.SET_TWITTER_PROFILE_ERROR,
      signOnActions.SET_INSTAGRAM_PROFILE_ERROR,
      signOnActions.SET_TIKTOK_PROFILE_ERROR,
      signOnActions.SIGN_UP_FAILED,
      signOnActions.SIGN_UP_TIMEOUT,
      signOnActions.SIGN_IN_FAILED
    ],
    handleSignOnError
  )
}
