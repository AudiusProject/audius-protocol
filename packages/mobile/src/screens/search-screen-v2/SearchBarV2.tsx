import { Dimensions, Pressable } from 'react-native'

import {
  IconCloseAlt,
  IconSearch,
  TextInput,
  TextInputSize
} from '@audius/harmony-native'

import { useSearchQuery } from './searchState'

const searchBarWidth = Dimensions.get('window').width - 80

const messages = {
  label: 'Search'
}

export const SearchBarV2 = () => {
  const [query, setQuery] = useSearchQuery()

  const clearQuery = () => {
    setQuery('')
  }

  return (
    <TextInput
      startIcon={IconSearch}
      endIcon={() =>
        query ? (
          <Pressable onPress={clearQuery} hitSlop={10}>
            <IconCloseAlt size='s' color='subdued' />
          </Pressable>
        ) : null
      }
      size={TextInputSize.SMALL}
      label={messages.label}
      placeholder={messages.label}
      style={{ width: searchBarWidth }}
      value={query}
      onChangeText={setQuery}
    />
  )
}
