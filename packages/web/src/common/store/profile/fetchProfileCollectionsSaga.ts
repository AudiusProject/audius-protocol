import { Kind } from '@audius/common/models'
import {
  cacheActions,
  profilePageActions,
  profilePageSelectors,
  getContext
} from '@audius/common/store'
import { isEqual } from 'lodash'
import { put, select, takeLatest, call } from 'typed-redux-saga'

import { processAndCacheCollections } from 'common/store/cache/collections/utils'

const {
  FETCH_COLLECTIONS,
  fetchCollections,
  fetchCollectionsSucceded,
  fetchCollectionsFailed
} = profilePageActions

const { getProfileUser } = profilePageSelectors

export function* watchFetchProfileCollections() {
  yield* takeLatest(FETCH_COLLECTIONS, fetchProfileCollectionsAsync)
}

function* fetchProfileCollectionsAsync(
  action: ReturnType<typeof fetchCollections>
) {
  const { handle } = action
  const user = yield* select((state) => getProfileUser(state, { handle }))

  if (!user) {
    yield* put(fetchCollectionsFailed(handle))
    return
  }

  const { user_id, _collectionIds } = user
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  try {
    const latestCollections = yield* call(
      audiusBackendInstance.getPlaylists,
      user_id,
      null,
      false
    )

    const latestCollectionIds = latestCollections.map(
      ({ playlist_id }) => playlist_id
    )

    if (!isEqual(_collectionIds, latestCollectionIds)) {
      yield* put(
        cacheActions.update(Kind.USERS, [
          {
            id: user_id,
            metadata: { _collectionIds: latestCollectionIds }
          }
        ])
      )
    }

    yield* call(
      processAndCacheCollections,
      latestCollections,
      /* shouldRetrieveTracks= */ false
    )

    yield* put(fetchCollectionsSucceded(handle))
  } catch (e) {
    yield* put(fetchCollectionsFailed(handle))
  }
}
