import { Dimensions } from 'react-native'

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
      value={query}
      onChangeText={setQuery}
    />
  )
}
