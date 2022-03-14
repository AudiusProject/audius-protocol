import { useCallback, useRef, useState } from 'react'

import { TextInput } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { SearchInput } from 'app/components/core'
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
  const [clearable, setClearable] = useState(false)
  const inputRef = useRef<TextInput>(null)

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
    const route = getTagSearchRoute(query)
    navigation.push({
      native: {
        screen: 'TagSearch',
        params: { query }
      },
      web: { route, fromPage: 'search' }
    })
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
    <SearchInput
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
