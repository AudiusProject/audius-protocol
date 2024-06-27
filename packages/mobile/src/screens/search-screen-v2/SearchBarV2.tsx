import { Dimensions } from 'react-native'

import { IconSearch, TextInput, TextInputSize } from '@audius/harmony-native'

import { useSearchQuery } from './searchState'

const searchBarWidth = Dimensions.get('window').width - 80

const messages = {
  label: 'Search'
}

export const SearchBarV2 = () => {
  const [query, setQuery] = useSearchQuery()

  return (
    <TextInput
      startIcon={IconSearch}
      size={TextInputSize.SMALL}
      label={messages.label}
      placeholder={messages.label}
      style={{ width: searchBarWidth }}
      value={query}
      onChangeText={setQuery}
    />
  )
}
