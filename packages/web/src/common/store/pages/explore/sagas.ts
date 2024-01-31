import {
  explorePageSelectors,
  explorePageActions,
  getContext
} from '@audius/common/store'

import { ID } from '@audius/common/models'
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

type ExploreContent = {
  featuredPlaylists: ID[]
  featuredProfiles: ID[]
}

export const fetchExploreContent = async (
  exploreContentUrl: string = STATIC_EXPLORE_CONTENT_URL
): Promise<ExploreContent> => {
  const response = await fetch(exploreContentUrl)
  return await response.json()
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
        yield* call(retrieveCollections, exploreContent.featuredPlaylists)
        yield* call(fetchUsers, exploreContent.featuredProfiles)
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
    const featuredPlaylistIds = yield* select(getPlaylistIds)
    yield* call(retrieveCollections, featuredPlaylistIds)
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
