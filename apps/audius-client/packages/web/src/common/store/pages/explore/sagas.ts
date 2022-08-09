import { ID } from '@audius/common'
import { call, put, takeEvery } from 'redux-saga/effects'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import { retrieveCollections } from 'common/store/cache/collections/utils'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { STATIC_EXPLORE_CONTENT_URL } from 'utils/constants'

import {
  fetchExplore,
  fetchExploreSucceeded,
  fetchExploreFailed
} from './slice'

const EXPLORE_CONTENT_URL =
  process.env.REACT_APP_EXPLORE_CONTENT_URL || STATIC_EXPLORE_CONTENT_URL

export const fetchExploreContent = async () => {
  return fetch(EXPLORE_CONTENT_URL).then((resp) => resp.json())
}

function* watchFetchExplore() {
  yield takeEvery(fetchExplore.type, function* (action) {
    yield call(waitForBackendSetup)
    try {
      const exploreContent: {
        featuredPlaylists: ID[]
        featuredProfiles: ID[]
      } = yield call(fetchExploreContent)
      yield call(
        retrieveCollections,
        null,
        exploreContent.featuredPlaylists,
        false
      )
      yield call(fetchUsers, exploreContent.featuredProfiles)

      yield put(fetchExploreSucceeded({ exploreContent }))
    } catch (e) {
      console.error(e)
      yield put(fetchExploreFailed())
    }
  })
}

export default function sagas() {
  return [watchFetchExplore]
}
