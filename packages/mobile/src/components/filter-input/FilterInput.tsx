import Animated, { Layout } from 'react-native-reanimated'

import type { PaperProps, TextInputProps } from '@audius/harmony-native'
import {
  IconFilter,
  Paper,
  TextInput,
  TextInputSize
} from '@audius/harmony-native'

type FilterInputProps = PaperProps &
  Pick<TextInputProps, 'onChangeText' | 'placeholder' | 'value' | 'autoFocus'>

export const FilterInput = (props: FilterInputProps) => {
  const { onChangeText, placeholder, value, autoFocus, ...paperProps } = props

  return (
    <Animated.View layout={Layout}>
      <Paper mv='l' mh='m' p='s' {...paperProps}>
        <TextInput
          label='filter'
          size={TextInputSize.SMALL}
          placeholder={placeholder}
          onChangeText={onChangeText}
          value={value}
          returnKeyType='search'
          endAdornment={<IconFilter color='subdued' size='m' />}
          autoFocus={autoFocus}
        />
      </Paper>
    </Animated.View>
  )
}
