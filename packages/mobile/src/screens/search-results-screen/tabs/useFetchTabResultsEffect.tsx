import { useCallback, useContext } from 'react'

import type { SearchKind } from '@audius/common'
import { searchResultsPageActions } from '@audius/common'
import { useFocusEffect } from '@react-navigation/native'
import { useDispatch } from 'react-redux'

import { track, make } from 'app/services/analytics'
import { EventNames } from 'app/types/analytics'

import { SearchQueryContext } from '../SearchQueryContext'
import { ALL_CATEGORY_RESULTS_LIMIT } from '../constants'

export const useFetchTabResultsEffect = (searchKind: SearchKind) => {
  const dispatch = useDispatch()
  const { query, isTagSearch } = useContext(SearchQueryContext)
  useFocusEffect(
    useCallback(() => {
      if (isTagSearch) {
        dispatch(
          searchResultsPageActions.fetchSearchPageTags(
            query,
            searchKind,
            ALL_CATEGORY_RESULTS_LIMIT,
            0
          )
        )
        track(
          make({
            eventName: EventNames.SEARCH_TAG_SEARCH,
            tag: query
          })
        )
      } else {
        dispatch(
          searchResultsPageActions.fetchSearchPageResults(
            query,
            searchKind,
            ALL_CATEGORY_RESULTS_LIMIT,
            0
          )
        )
        track(
          make({
            eventName: EventNames.SEARCH_SEARCH,
            term: query
          })
        )
      }
    }, [dispatch, isTagSearch, query, searchKind])
  )
}
