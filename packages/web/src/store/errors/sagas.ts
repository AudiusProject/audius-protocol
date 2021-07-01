import * as Sentry from '@sentry/browser'
import { push as pushRoute } from 'connected-react-router'
import { takeEvery, put } from 'redux-saga/effects'

import { ERROR_PAGE } from 'utils/route'

import * as errorActions from './actions'

export const Levels: { [level in errorActions.Level]: Sentry.Severity } = {
  Critical: Sentry.Severity.Critical,
  Warning: Sentry.Severity.Warning,
  Fatal: Sentry.Severity.Fatal,
  Debug: Sentry.Severity.Debug,
  Error: Sentry.Severity.Error,
  Info: Sentry.Severity.Info,
  Log: Sentry.Severity.Log
}

function* handleError(action: errorActions.HandleErrorAction) {
  console.debug(`Handling error: ${action.message}`)
  if (action.shouldReport) {
    try {
      Sentry.withScope(scope => {
        if (action.level) {
          const sentryLevel = Levels[action.level]
          scope.setLevel(sentryLevel)
        }
        if (action.additionalInfo) {
          console.debug(
            `Additional error info: ${JSON.stringify(action.additionalInfo)}`
          )
          scope.setExtras(action.additionalInfo)
        }
        Sentry.captureException(new Error(action.message))
      })
    } catch (e) {
      console.error(`Got error trying to log error: ${e.message}`)
    }
  }

  if (action.shouldRedirect) {
    yield put(pushRoute(ERROR_PAGE))
  }
}

function* watchHandleError() {
  yield takeEvery(errorActions.HANDLE_ERROR, handleError)
}

export default function sagas() {
  return [watchHandleError]
}
