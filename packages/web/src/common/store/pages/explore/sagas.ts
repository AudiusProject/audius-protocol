import { ID } from '@audius/common/models'
import {
  explorePageSelectors,
  explorePageActions,
  getContext,
  accountSelectors
} from '@audius/common/store'
import { call, put, takeEvery, select } from 'typed-redux-saga'

import { retrieveCollections } from 'common/store/cache/collections/utils'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { STATIC_EXPLORE_CONTENT_URL } from 'utils/constants'
import { waitForRead } from 'utils/sagaHelpers'
const {
  fetchExplore,
  fetchExploreSucceeded,
  fetchExploreFailed,
  fetchPlaylists,
  fetchPlaylistsSucceded,
  fetchProfiles,
  fetchProfilesSucceded
} = explorePageActions
const { getPlaylistIds, getProfileIds } = explorePageSelectors
const { getUserId } = accountSelectors

type ExploreContent = {
  featuredPlaylists: ID[]
  featuredProfiles: ID[]
}

export const fetchExploreContent = async (
  exploreContentUrl: string = STATIC_EXPLORE_CONTENT_URL
): Promise<ExploreContent> => {
  const response = await fetch(exploreContentUrl)
  const json = await response.json()
  return {
    featuredPlaylists: json.featuredPlaylists.map((id: string) => parseInt(id)),
    featuredProfiles: json.featuredProfiles.map((id: string) => parseInt(id))
  }
}

function* watchFetchExplore() {
  yield* takeEvery(fetchExplore.type, function* () {
    yield* call(waitForRead)
    const { EXPLORE_CONTENT_URL } = yield* getContext('env')
    const isNativeMobile = yield* getContext('isNativeMobile')
    try {
      const exploreContent = yield* call(
        fetchExploreContent,
        EXPLORE_CONTENT_URL ?? STATIC_EXPLORE_CONTENT_URL
      )

      if (!isNativeMobile) {
        const userId = yield* select(getUserId)
        yield* call(
          retrieveCollections,
          exploreContent.featuredPlaylists.slice(0, 4),
          { userId }
        )
        yield* call(fetchUsers, exploreContent.featuredProfiles.slice(0, 4))
      }

      yield* put(fetchExploreSucceeded({ exploreContent }))
    } catch (e) {
      console.error(e)
      yield* put(fetchExploreFailed())
    }
  })
}

function* watchFetchPlaylists() {
  yield* takeEvery(fetchPlaylists.type, function* fetchPlaylistsAsync() {
    const userId = yield* select(getUserId)
    const featuredPlaylistIds = yield* select(getPlaylistIds)
    yield* call(retrieveCollections, featuredPlaylistIds, { userId })
    yield* put(fetchPlaylistsSucceded())
  })
}

function* watchFetchProfiles() {
  yield* takeEvery(fetchProfiles.type, function* fetchProfilesAsync() {
    const featuredProfileIds = yield* select(getProfileIds)
    yield* call(fetchUsers, featuredProfileIds)
    yield* put(fetchProfilesSucceded())
  })
}

export default function sagas() {
  return [watchFetchExplore, watchFetchPlaylists, watchFetchProfiles]
}
