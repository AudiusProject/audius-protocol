import { useCallback, useContext } from 'react'

import {
  searchResultsPageActions,
  searchResultsPageSelectors,
  SearchKind
} from '@audius/common/store'
import {
    ID
  } from '@audius/common/models'
  
import { useFocusEffect } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'

import { make, track } from 'app/services/analytics'
import { EventNames } from 'app/types/analytics'

import { SearchQueryContext } from '../SearchQueryContext'
import { ALL_CATEGORY_RESULTS_LIMIT } from '../constants'

const { getSearchText, getIsTagSearch, getSearchResults } =
  searchResultsPageSelectors

export const useTrackSearchResultSelect = (searchQuery: string, kind: 'track' | 'profile' | 'playlist' | 'album') => {
    const trackSearchResultSelect = (
        id: ID,
      ) => {
        track(
          make({
            eventName: EventNames.SEARCH_RESULT_SELECT,
            term: searchQuery,
            source: 'more results page',
            kind,
            id
          })
        )
      }
    return trackSearchResultSelect
}
