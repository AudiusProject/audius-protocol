import { put, takeEvery } from 'redux-saga/effects'

import {
  OpenSearchMessage,
  FetchSearchSuccessMessage,
  FetchSearchFailureMessage
} from 'services/native-mobile-interface/search'
import { MessageType } from 'services/native-mobile-interface/types'

import * as searchBarActions from './actions'

function* watchOpenSeach() {
  yield takeEvery(searchBarActions.OPEN_MOBILE_SEARCH_BAR, function () {
    const message = new OpenSearchMessage()
    message.send()
  })
}

function* watchFetchSearch() {
  yield takeEvery(
    [MessageType.UPDATE_SEARCH_QUERY, MessageType.SUBMIT_SEARCH_QUERY],
    function* (action: { type: string; query: string }) {
      yield put(searchBarActions.fetchSearch(action.query))
    }
  )
}

function* watchSetSearchSucceeded() {
  yield takeEvery(
    searchBarActions.FETCH_SEARCH_SUCCEEDED,
    function (action: searchBarActions.FetchSearchSucceededAction) {
      const results = action.results
      const searchText = action.searchText
      const message = new FetchSearchSuccessMessage({
        query: searchText,
        results
      })
      message.send()
    }
  )
}

function* watchSetSearchFailed() {
  yield takeEvery(
    searchBarActions.FETCH_SEARCH_FAILED,
    function (action: searchBarActions.FetchSearchFailedAction) {
      const message = new FetchSearchFailureMessage({
        query: action.searchText
      })
      message.send()
    }
  )
}

const sagas = () => {
  return [
    watchOpenSeach,
    watchFetchSearch,
    watchSetSearchSucceeded,
    watchSetSearchFailed
  ]
}

export default sagas
