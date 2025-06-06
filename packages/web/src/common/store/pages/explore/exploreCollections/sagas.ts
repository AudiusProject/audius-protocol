import { primeCollectionDataSaga, queryAccountUser } from '@audius/common/api'
import { Collection, UserCollectionMetadata } from '@audius/common/models'
import {
  explorePageCollectionsActions,
  ExploreCollectionsVariant,
  getContext
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { uniq } from 'lodash'
import { takeEvery, call, put } from 'typed-redux-saga'

import { requiresAccount } from 'common/utils/requiresAccount'
import { waitForRead } from 'utils/sagaHelpers'

const { EXPLORE_PAGE } = route
const { fetch, fetchSucceeded } = explorePageCollectionsActions

function* fetchLetThemDJ() {
  const explore = yield* getContext('explore')
  const user = yield* call(queryAccountUser)
  const collections = yield* call([explore, 'getTopCollections'], {
    type: 'playlist',
    limit: 20,
    userId: user?.user_id
  })
  return collections
}

function* fetchTopAlbums() {
  const explore = yield* getContext('explore')
  const user = yield* call(queryAccountUser)
  const collections = yield* call([explore, 'getTopCollections'], {
    type: 'album',
    limit: 20,
    userId: user?.user_id
  })
  return collections
}

function* fetchMoodPlaylists(moods: string[]) {
  const explore = yield* getContext('explore')
  const user = yield* call(queryAccountUser)
  const collections = yield* call([explore, 'getTopPlaylistsForMood'], {
    moods,
    limit: 20,
    userId: user?.user_id
  })
  return collections
}

const fetchMap = {
  [ExploreCollectionsVariant.LET_THEM_DJ]: requiresAccount(
    fetchLetThemDJ,
    EXPLORE_PAGE
  ),
  [ExploreCollectionsVariant.TOP_ALBUMS]: fetchTopAlbums,
  [ExploreCollectionsVariant.MOOD]: fetchMoodPlaylists
}

function* watchFetch() {
  yield* takeEvery(fetch.type, function* (action: ReturnType<typeof fetch>) {
    yield* waitForRead()

    const { variant, moods } = action.payload

    let collections: UserCollectionMetadata[] | Collection[] | undefined
    if (variant === ExploreCollectionsVariant.MOOD) {
      collections = yield* call(
        fetchMap[ExploreCollectionsVariant.MOOD],
        moods!
      )
    } else if (variant === ExploreCollectionsVariant.DIRECT_LINK) {
      // no-op
    } else {
      collections = yield* call(fetchMap[variant])
    }
    if (!collections) return

    yield* call(primeCollectionDataSaga, collections)

    const collectionIds = uniq(
      collections.map((c: UserCollectionMetadata | Collection) => c.playlist_id)
    )

    yield* put(
      fetchSucceeded({
        variant,
        collectionIds
      })
    )
  })
}

export default function sagas() {
  return [watchFetch]
}
