import { useCallback, useRef, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import type { TextInputRef } from 'app/components/core'
import { TextInput } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { MessageType } from 'app/message'
import { updateQuery } from 'app/store/search/actions'
import {
  getSearchQuery,
  getSearchResultQuery
} from 'app/store/search/selectors'
import { getTagSearchRoute } from 'app/utils/routes'

export const SearchBar = () => {
  const query = useSelector(getSearchQuery)
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const [clearable, setClearable] = useState(query !== '')
  const inputRef = useRef<TextInputRef>(null)

  const handleChangeText = useCallback(
    (text: string) => {
      dispatch(updateQuery(text))
      // Do nothing for tag search (no autocomplete)
      if (!text.startsWith('#')) {
        dispatchWeb({
          type: MessageType.UPDATE_SEARCH_QUERY,
          query: text
        })
      }
      if (text !== '') {
        setClearable(true)
      } else {
        setClearable(false)
      }
    },
    [dispatch, dispatchWeb, setClearable]
  )

  const handleSubmit = useCallback(() => {
    if (query.startsWith('#')) {
      const route = getTagSearchRoute(query)
      navigation.push({
        native: {
          screen: 'TagSearch',
          params: { query }
        },
        web: { route, fromPage: 'search' }
      })
    }
  }, [query, navigation])

  const onClear = useCallback(() => {
    dispatch(updateQuery(''))
    setClearable(false)
    inputRef.current?.focus()
  }, [dispatch, setClearable])

  const searchResultQuery = useSelector(getSearchResultQuery)
  const isTagSearch = query.startsWith('#')
  const hasText = query !== ''
  const isLoading = !isTagSearch && hasText && searchResultQuery !== query
  const icon = isLoading ? LoadingSpinner : undefined

  return (
    <TextInput
      autoFocus
      ref={inputRef}
      value={query}
      onChangeText={handleChangeText}
      Icon={icon}
      clearable={!isLoading && clearable}
      onClear={onClear}
      onSubmitEditing={handleSubmit}
    />
  )
}
