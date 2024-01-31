import { profilePageActions, getContext } from '@audius/common/store'
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

  const apiClient = yield* getContext('apiClient')
  const userTagsResponse = yield* call([apiClient, apiClient.getUserTags], {
    userId
  })
  if (userTagsResponse) {
    const { data: topTags } = userTagsResponse
    yield* put(fetchTopTagsSucceeded(handle, topTags))
  } else {
    yield* put(fetchTopTagsFailed(handle))
  }
}
