import { Name } from '@audius/common/models'
import { waitForWrite } from 'audius-client/src/utils/sagaHelpers'
import { make } from 'common/store/analytics/actions'
import { call, put, takeEvery } from 'typed-redux-saga'

import { setVisibility } from '../drawers/slice'

import { requestReview } from './slice'

function* displayRequestReviewDrawer() {
  yield* call(waitForWrite)
  yield put(setVisibility({ drawer: 'RateCallToAction', visible: true }))
  yield* put(make(Name.RATE_CTA_DISPLAYED, {}))
}

function* watchRequestReview() {
  yield* takeEvery(requestReview.type, displayRequestReviewDrawer)
}

export default function sagas() {
  return [watchRequestReview]
}
