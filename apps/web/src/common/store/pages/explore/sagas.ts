import { ID, explorePageActions, getContext } from '@audius/common'
import { call, put, takeEvery } from 'typed-redux-saga'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import { retrieveCollections } from 'common/store/cache/collections/utils'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { STATIC_EXPLORE_CONTENT_URL } from 'utils/constants'
const { fetchExplore, fetchExploreSucceeded, fetchExploreFailed } =
  explorePageActions

const EXPLORE_CONTENT_URL =
  process.env.REACT_APP_EXPLORE_CONTENT_URL || STATIC_EXPLORE_CONTENT_URL

type ExploreContent = {
  featuredPlaylists: ID[]
  featuredProfiles: ID[]
}

export const fetchExploreContent = async (
  exploreContentUrl = EXPLORE_CONTENT_URL
): Promise<ExploreContent> => {
  const response = await fetch(exploreContentUrl)
  return await response.json()
}

function* watchFetchExplore() {
  yield* takeEvery(fetchExplore.type, function* () {
    yield* call(waitForBackendSetup)
    const { EXPLORE_CONTENT_URL } = yield* getContext('env')
    try {
      const exploreContent = yield* call(
        fetchExploreContent,
        EXPLORE_CONTENT_URL ?? STATIC_EXPLORE_CONTENT_URL
      )
      yield* call(
        retrieveCollections,
        null,
        exploreContent.featuredPlaylists,
        false
      )
      yield* call(fetchUsers, exploreContent.featuredProfiles)

      yield* put(fetchExploreSucceeded({ exploreContent }))
    } catch (e) {
      console.error(e)
      yield* put(fetchExploreFailed())
    }
  })
}

export default function sagas() {
  return [watchFetchExplore]
}
