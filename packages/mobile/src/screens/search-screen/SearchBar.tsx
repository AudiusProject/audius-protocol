import { useCallback, useRef, useState } from 'react'

import { fetchSearch } from 'audius-client/src/common/store/search-bar/actions'
import { getSearchBarText } from 'audius-client/src/common/store/search-bar/selectors'
import debounce from 'lodash/debounce'
import { useDispatch, useSelector } from 'react-redux'

import type { TextInputRef } from 'app/components/core'
import { TextInput } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useNavigation } from 'app/hooks/useNavigation'
import { updateQuery } from 'app/store/search/actions'
import { getSearchQuery } from 'app/store/search/selectors'

export const SearchBar = () => {
  const query = useSelector(getSearchQuery)
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const [clearable, setClearable] = useState(query !== '')
  const inputRef = useRef<TextInputRef>(null)

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

  const searchResultQuery = useSelector(getSearchBarText)
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
