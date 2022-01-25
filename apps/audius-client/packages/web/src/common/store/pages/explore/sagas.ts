/* globals fetch */
import { call, put, takeEvery } from 'redux-saga/effects'

import { ID } from 'common/models/Identifiers'
import { retrieveCollections } from 'common/store/cache/collections/utils'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { waitForBackendSetup } from 'store/backend/sagas'

import * as actions from './actions'

const EXPLORE_CONTENT_URL =
  process.env.REACT_APP_EXPLORE_CONTENT_URL ||
  'https://download.audius.co/static-resources/explore-content.json'

const fetchExploreContent = async () => {
  return fetch(EXPLORE_CONTENT_URL).then(resp => resp.json())
}

function* watchFetchExplore() {
  yield takeEvery(actions.FETCH_EXPLORE, function* (action) {
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

      yield put(actions.fetchExploreSucceeded(exploreContent))
    } catch (e) {
      console.error(e)
      yield put(actions.fetchExploreFailed())
    }
  })
}

export default function sagas() {
  return [watchFetchExplore]
}
