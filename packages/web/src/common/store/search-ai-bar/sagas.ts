import { accountSelectors, SearchKind, getContext } from '@audius/common/store'

import { Name } from '@audius/common/models'
import { removeNullable } from '@audius/common/utils'
import { flatMap, zip } from 'lodash'
import {
  call,
  all,
  cancel,
  fork,
  put,
  race,
  select,
  take
} from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { waitForRead } from 'utils/sagaHelpers'

import * as searchActions from './actions'
import { getSearch } from './selectors'

const getUserId = accountSelectors.getUserId

const searchMultiMap: {
  [key: string]: string[]
} = {
  grimes: ['grimez', 'grimes']
}

export function* getSearchResults(searchText: string) {
  yield* waitForRead()

  const apiClient = yield* getContext('apiClient')
  const userId = yield* select(getUserId)

  let results
  if (searchText in searchMultiMap) {
    const searches = searchMultiMap[searchText].map((query) =>
      call([apiClient, 'getSearchAutocomplete'], {
        currentUserId: userId,
        query,
        limit: 10,
        offset: 0,
        kind: SearchKind.USERS
      })
    )
    const allSearchResults = yield* all(searches)
    results = allSearchResults.reduce(
      (acc, cur) => {
        acc.tracks = flatMap(zip(acc.tracks, cur.tracks)).filter(removeNullable)
        acc.users = flatMap(zip(acc.users, cur.users)).filter(removeNullable)
        acc.albums = flatMap(zip(acc.albums, cur.albums)).filter(removeNullable)
        acc.playlists = flatMap(zip(acc.playlists, cur.playlists)).filter(
          removeNullable
        )
        return acc
      },
      { tracks: [], albums: [], playlists: [], users: [] }
    )
  } else {
    results = yield* call([apiClient, 'getSearchAutocomplete'], {
      currentUserId: userId,
      query: searchText,
      limit: 10,
      offset: 0,
      kind: SearchKind.USERS
    })
  }
  const { users } = results
  const checkedUsers = users.filter((u) => !u.is_deactivated)
  return {
    users: checkedUsers
  }
}

function* fetchSearchAsync(action: searchActions.FetchSearchAction) {
  yield* call(waitForRead)
  yield* put(searchActions.fetchSearchRequested(action.searchText))
  const search = yield* select(getSearch)
  if (action.searchText === search.searchText) {
    const previousResults = {
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
