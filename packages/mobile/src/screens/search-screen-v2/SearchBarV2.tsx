import { Dimensions } from 'react-native'

import { IconSearch, TextInput, TextInputSize } from '@audius/harmony-native'
import type { TextInputProps } from '@audius/harmony-native'

const searchBarWidth = Dimensions.get('window').width - 80

const messages = {
  label: 'Search'
}

type SeacrhBarV2Props = Partial<TextInputProps>

export const SearchBarV2 = (props: SeacrhBarV2Props) => {
  return (
    <TextInput
      startIcon={IconSearch}
      size={TextInputSize.SMALL}
      label={messages.label}
      placeholder={messages.label}
      style={{ width: searchBarWidth }}
      {...props}
    />
  )
}
