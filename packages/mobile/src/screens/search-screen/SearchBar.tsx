import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchSearch } from 'audius-client/src/common/store/search-bar/actions'
import { getSearchBarText } from 'audius-client/src/common/store/search-bar/selectors'
import debounce from 'lodash/debounce'
import { useDispatch, useSelector } from 'react-redux'
import { useTimeoutFn } from 'react-use'

import type { TextInputRef } from 'app/components/core'
import { TextInput } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useNavigation } from 'app/hooks/useNavigation'
import { updateQuery } from 'app/store/search/actions'
import { getSearchQuery } from 'app/store/search/selectors'

// Amount of time to wait before focusing TextInput
// after the SearchBar renders
const TEXT_INPUT_FOCUS_DELAY = 350

export const SearchBar = () => {
  const query = useSelector(getSearchQuery)
  const searchResultQuery = useSelector(getSearchBarText)
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const [clearable, setClearable] = useState(query !== '')
  const inputRef = useRef<TextInputRef>(null)

  // Wait to focus TextInput to prevent keyboard animation
  // from causing UI stutter as the screen transitions in
  useTimeoutFn(() => inputRef.current?.focus(), TEXT_INPUT_FOCUS_DELAY)

  // Ignore rule because eslint complains that it can't determine the dependencies of the callback since it's not inline.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchSearchDebounced = useCallback(
    debounce((text: string) => {
      // Do nothing for tag search (no autocomplete)
      if (!text.startsWith('#')) {
        dispatch(fetchSearch(text))
      }
    }, 250),
    [dispatch]
  )
  const handleChangeText = useCallback(
    (text: string) => {
      dispatch(updateQuery(text))
      fetchSearchDebounced(text)
      if (text !== '') {
        setClearable(true)
      } else {
        setClearable(false)
      }
    },
    [dispatch, fetchSearchDebounced, setClearable]
  )

  useEffect(() => {
    if (query !== searchResultQuery && searchResultQuery !== '') {
      handleChangeText(query)
    }
  }, [searchResultQuery, query, handleChangeText])

  const handleSubmit = useCallback(() => {
    if (query.startsWith('#')) {
      navigation.push('TagSearch', { query })
    }
  }, [query, navigation])

  const onClear = useCallback(() => {
    dispatch(updateQuery(''))
    setClearable(false)
    inputRef.current?.focus()
  }, [dispatch, setClearable])

  const isTagSearch = query.startsWith('#')
  const hasText = query !== ''
  const isLoading = !isTagSearch && hasText && searchResultQuery !== query
  const icon = isLoading ? LoadingSpinner : undefined

  return (
    <TextInput
      ref={inputRef}
      value={query}
      onChangeText={handleChangeText}
      Icon={icon}
      clearable={!isLoading && clearable}
      onClear={onClear}
      onSubmitEditing={handleSubmit}
      returnKeyType='search'
    />
  )
}
