import { profilePageActions, getSDK } from '@audius/common/store'
import { Id } from '@audius/sdk'
import { takeLatest, call, put } from 'typed-redux-saga'
const {
  FETCH_TOP_TAGS,
  fetchTopTags,
  fetchTopTagsSucceeded,
  fetchTopTagsFailed
} = profilePageActions

export function* watchFetchTopTags() {
  yield* takeLatest(FETCH_TOP_TAGS, fetchTopTagsWorker)
}

function* fetchTopTagsWorker(action: ReturnType<typeof fetchTopTags>) {
  const { userId, handle } = action
  const sdk = yield* getSDK()

  const { data: topTags } = yield* call(
    [sdk.users, sdk.users.getTopTrackTags],
    {
      id: Id.parse(userId)
    }
  )

  if (topTags) {
    yield* put(fetchTopTagsSucceeded(handle, topTags))
  } else {
    yield* put(fetchTopTagsFailed(handle))
  }
}
