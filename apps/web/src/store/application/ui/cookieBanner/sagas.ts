import { call, put, takeEvery } from 'typed-redux-saga'

import { shouldShowCookieBanner, dismissCookieBanner } from 'utils/gdpr'

import { showCookieBanner, DISMISS_COOKIE_BANNER } from './actions'

export function* checkCookieBanner() {
  const show = yield* call(shouldShowCookieBanner)
  if (show) {
    yield put(showCookieBanner())
  }
}

export function* watchDismiss() {
  yield takeEvery(DISMISS_COOKIE_BANNER, () => {
    dismissCookieBanner()
  })
}

export default function sagas() {
  return [checkCookieBanner, watchDismiss]
}
