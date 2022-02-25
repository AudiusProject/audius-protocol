import { useCallback } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { SearchInput } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { MessageType } from 'app/message'
import { updateQuery } from 'app/store/search/actions'
import {
  getSearchQuery,
  getSearchResultQuery
} from 'app/store/search/selectors'

export const SearchBar = () => {
  const query = useSelector(getSearchQuery)
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWeb()

  const handleChangeText = useCallback(
    (text: string) => {
      dispatch(updateQuery(text))
      if (!text.startsWith('#')) {
        dispatchWeb({
          type: MessageType.UPDATE_SEARCH_QUERY,
          query: text
        })
      }
    },
    [dispatch, dispatchWeb]
  )

  const searchResultQuery = useSelector(getSearchResultQuery)
  const isTagSearch = query.startsWith('#')
  const hasText = query !== ''
  const isLoading = !isTagSearch && hasText && searchResultQuery !== query

  return (
    <SearchInput
      autoFocus
      value={query}
      onChangeText={handleChangeText}
      Icon={isLoading ? LoadingSpinner : undefined}
    />
  )
}
