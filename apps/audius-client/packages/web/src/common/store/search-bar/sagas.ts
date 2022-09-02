import {
  Name,
  accountSelectors,
  getContext,
  waitForAccount
} from '@audius/common'
import { call, cancel, fork, put, race, select, take } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { waitForBackendSetup } from 'common/store/backend/sagas'

import * as searchActions from './actions'
import { getSearch } from './selectors'

const getUserId = accountSelectors.getUserId

export function* getSearchResults(searchText: string) {
  const apiClient = yield* getContext('apiClient')
  yield* waitForAccount()
  const userId = yield* select(getUserId)

  const results = yield* call([apiClient, 'getSearchAutocomplete'], {
    currentUserId: userId,
    query: searchText,
    limit: 3,
    offset: 0
  })
  const { tracks, albums, playlists, users } = results
  const checkedUsers = users.filter((u) => !u.is_deactivated)
  const checkedTracks = tracks.filter(
    (t) => !t.is_delete && !t.user.is_deactivated
  )
  const checkedPlaylists = playlists.filter((p) => !p.user?.is_deactivated)
  const checkedAlbums = albums.filter((a) => !a.user?.is_deactivated)
  return {
    users: checkedUsers,
    tracks: checkedTracks,
    albums: checkedAlbums,
    playlists: checkedPlaylists
  }
}

function* fetchSearchAsync(action: searchActions.FetchSearchAction) {
  yield* call(waitForBackendSetup)
  yield* put(searchActions.fetchSearchRequested(action.searchText))
  const search = yield* select(getSearch)
  if (action.searchText === search.searchText) {
    const previousResults = {
      tracks: search.tracks,
      albums: search.albums,
      playlists: search.playlists,
      users: search.users
    }
    yield* put(
      searchActions.fetchSearchSucceeded(previousResults, search.searchText)
    )
  } else {
    const results = yield* call(getSearchResults, action.searchText)
    if (results) {
      yield* put(searchActions.fetchSearchSucceeded(results, action.searchText))
      yield* put(
        make(Name.SEARCH_SEARCH, {
          term: action.searchText,
          source: 'autocomplete'
        })
      )
    } else {
      yield* put(searchActions.fetchSearchFailed(action.searchText))
    }
  }
}

function* watchSearch() {
  let lastTask
  while (true) {
    const { searchAction, cancelSearch } = yield* race({
      searchAction: take<searchActions.FetchSearchAction>(
        searchActions.FETCH_SEARCH
      ),
      cancelSearch: take(searchActions.CANCEL_FETCH_SEARCH)
    })
    if (lastTask) {
      // cancel is no-op if the task has already terminated
      yield* cancel(lastTask)

      // Reset the search bar state
      yield* put(searchActions.clearSearch())
    }
    if (!cancelSearch && searchAction) {
      lastTask = yield* fork(fetchSearchAsync, searchAction)
    }
  }
}

export default function sagas() {
  const sagas = [watchSearch]
  return sagas
}
