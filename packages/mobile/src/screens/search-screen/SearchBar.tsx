import type { Ref } from 'react'
import { forwardRef, useState } from 'react'

import type { TextInput as RNTextInput } from 'react-native'
import { Dimensions } from 'react-native'
import { useDebounce } from 'react-use'

import {
  IconButton,
  IconCloseAlt,
  IconSearch,
  spacing,
  TextInput,
  TextInputSize
} from '@audius/harmony-native'

import { useSearchQuery } from './searchState'

const searchBarWidth = Dimensions.get('window').width - 80

const messages = {
  label: 'Search'
}

type SearchBarProps = {
  autoFocus?: boolean
}

export const SearchBar = forwardRef(
  ({ autoFocus = false }: SearchBarProps, ref: Ref<RNTextInput>) => {
    const [query, setQuery] = useSearchQuery()
    const [searchInput, setSearchInput] = useState(query)
    useDebounce(() => setQuery(searchInput), 400, [searchInput])

    const clearQuery = () => {
      setQuery('')
    }

    return (
      <TextInput
        ref={ref}
        autoFocus={autoFocus}
        startIcon={IconSearch}
        endIcon={() =>
          query ? (
            <IconButton
              icon={IconCloseAlt}
              size='s'
              color='subdued'
              onPress={clearQuery}
              hitSlop={10}
            />
          ) : null
        }
        size={TextInputSize.SMALL}
        label={messages.label}
        placeholder={messages.label}
        style={{ width: searchBarWidth }}
        innerContainerStyle={query ? { paddingRight: spacing.s } : {}}
        value={searchInput}
        onChangeText={setSearchInput}
      />
    )
  }
)
