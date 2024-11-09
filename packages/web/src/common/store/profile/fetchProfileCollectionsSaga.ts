import {
  userCollectionMetadataFromSDK,
  transformAndCleanList
} from '@audius/common/adapters'
import { Kind } from '@audius/common/models'
import {
  cacheActions,
  profilePageActions,
  profilePageSelectors,
  getSDK
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
  const sdk = yield* getSDK()
  const { handle } = action
  const user = yield* select((state) => getProfileUser(state, { handle }))

  if (!user) {
    yield* put(fetchCollectionsFailed(handle))
    return
  }

  const { user_id, _collectionIds } = user

  try {
    const [{ data: sdkPlaylists = [] }, { data: sdkAlbums = [] }] = yield* all([
      call([sdk.full.users, sdk.full.users.getPlaylistsByUser], user_id),
      call([sdk.full.users, sdk.full.users.getAlbumsByUser], user_id)
    ])
    const playlists = transformAndCleanList(
      sdkPlaylists,
      userCollectionMetadataFromSDK
    )
    const albums = transformAndCleanList(
      sdkAlbums,
      userCollectionMetadataFromSDK
    )
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
