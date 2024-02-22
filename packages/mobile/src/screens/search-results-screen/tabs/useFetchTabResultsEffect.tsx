import { useCallback, useContext } from 'react'

import {
  searchResultsPageActions,
  searchResultsPageSelectors,
  SearchKind
} from '@audius/common/store'
import { useFocusEffect } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'

import { make, track } from 'app/services/analytics'
import { EventNames } from 'app/types/analytics'

import { SearchQueryContext } from '../SearchQueryContext'
import { ALL_CATEGORY_RESULTS_LIMIT } from '../constants'

const { getSearchText, getIsTagSearch, getSearchResults } =
  searchResultsPageSelectors

export const useFetchTabResultsEffect = (searchKind: SearchKind) => {
  const dispatch = useDispatch()
  const { query, isTagSearch } = useContext(SearchQueryContext)
  const storeSearchText = useSelector(getSearchText)
  const storeIsTagSearch = useSelector(getIsTagSearch)
  const searchResults = useSelector(getSearchResults)

  let cachedResult: number[] | undefined | null
  if (searchKind === SearchKind.ALBUMS) {
    cachedResult = searchResults.albumIds
  } else if (searchKind === SearchKind.PLAYLISTS) {
    cachedResult = searchResults.playlistIds
  } else if (searchKind === SearchKind.TRACKS) {
    cachedResult = searchResults.trackIds
  } else if (searchKind === SearchKind.USERS) {
    cachedResult = searchResults.artistIds
  } else {
    cachedResult = null
  }

  const shouldFetch =
    query !== storeSearchText ||
    storeIsTagSearch !== isTagSearch ||
    cachedResult === undefined

  useFocusEffect(
    useCallback(() => {
      if (isTagSearch) {
        if (shouldFetch) {
          dispatch(
            searchResultsPageActions.fetchSearchPageTags(
              query,
              searchKind,
              ALL_CATEGORY_RESULTS_LIMIT,
              0
            )
          )
        }
        track(
          make({
            eventName: EventNames.SEARCH_TAG_SEARCH,
            tag: query,
            source: 'search results page'
          })
        )
      } else {
        if (shouldFetch) {
          dispatch(
            searchResultsPageActions.fetchSearchPageResults(
              query,
              searchKind,
              ALL_CATEGORY_RESULTS_LIMIT,
              0
            )
          )
        }
        track(
          make({
            eventName: EventNames.SEARCH_SEARCH,
            term: query,
            source: 'more results page'
          })
        )
      }
    }, [dispatch, isTagSearch, query, searchKind, shouldFetch])
  )
}
