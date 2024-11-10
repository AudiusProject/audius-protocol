import {
  userCollectionMetadataFromSDK,
  transformAndCleanList
} from '@audius/common/adapters'
import { Id, Kind } from '@audius/common/models'
import {
  cacheActions,
  profilePageActions,
  profilePageSelectors,
  getSDK
} from '@audius/common/store'
import { isEqual } from 'lodash'
import { put, select, takeLatest, call, all } from 'typed-redux-saga'

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
  const sdk = yield* getSDK()
  const { handle } = action
  const user = yield* select((state) => getProfileUser(state, { handle }))

  if (!user) {
    yield* put(fetchCollectionsFailed(handle))
    return
  }

  const { user_id, _collectionIds } = user
  function* getPlaylists() {
    const { data } = yield* call(
      [sdk.full.users, sdk.full.users.getPlaylistsByUser],
      {
        id: Id.parse(user_id)
      }
    )
    return transformAndCleanList(data, userCollectionMetadataFromSDK)
  }
  function* getAlbums() {
    const { data } = yield* call(
      [sdk.full.users, sdk.full.users.getAlbumsByUser],
      {
        id: Id.parse(user_id)
      }
    )
    return transformAndCleanList(data, userCollectionMetadataFromSDK)
  }
  try {
    const [playlists, albums] = yield* all([
      call(getPlaylists),
      call(getAlbums)
    ])
    const latestCollections = [...playlists, ...albums]

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
