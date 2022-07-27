import { RecentTipsStorage, Nullable } from '@audius/common'
import { put, takeEvery } from 'redux-saga/effects'

import { fetchRecentTips } from 'common/store/tipping/slice'
import { MessageType } from 'services/native-mobile-interface/types'

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
