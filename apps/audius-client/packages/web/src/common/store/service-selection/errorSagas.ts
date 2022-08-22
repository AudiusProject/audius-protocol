import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'store/errors/actions'

import { fetchServicesFailed } from './slice'

const errorsWithoutRedirect = new Set([fetchServicesFailed.type])

// TODO: This definition should live in Service Selection Actions
// once we've settled on a pattern for defining actions in TS
type ServiceSelectionActions = {
  type: string
  error: string
}

function* handleError(action: ServiceSelectionActions) {
  const shouldRedirect = !errorsWithoutRedirect.has(action.type)

  // Append extra info depending on the action type
  const extras: { error?: string } = { error: action.error }

  yield put(
    errorActions.handleError({
      message: action.type,
      shouldRedirect,
      shouldReport: true,
      additionalInfo: extras
    })
  )
}

export function* watchServiceSelectionErrors() {
  yield takeEvery([fetchServicesFailed.type], handleError)
}
