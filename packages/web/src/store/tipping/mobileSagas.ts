import { put, takeEvery } from 'redux-saga/effects'

import { RecentTipsStorage } from 'common/models/Tipping'
import { fetchRecentTips } from 'common/store/tipping/slice'
import { Nullable } from 'common/utils/typeUtils'
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
