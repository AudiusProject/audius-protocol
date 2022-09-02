import { RecentTipsStorage, Nullable, tippingActions } from '@audius/common'
import { put, takeEvery } from 'redux-saga/effects'

import { MessageType } from 'services/native-mobile-interface/types'
const { fetchRecentTips } = tippingActions

function* watchFetchRecentTips() {
  yield takeEvery(
    MessageType.FETCH_RECENT_TIPS,
    function* (action: { type: string; storage: Nullable<RecentTipsStorage> }) {
      yield put(fetchRecentTips({ storage: action.storage }))
    }
  )
}

const sagas = () => {
  return [watchFetchRecentTips]
}

export default sagas
