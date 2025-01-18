import Animated, { Layout } from 'react-native-reanimated'

import type { PaperProps, TextInputProps } from '@audius/harmony-native'
import {
  IconFilter,
  Paper,
  TextInput,
  TextInputSize
} from '@audius/harmony-native'

type FilterInputProps = PaperProps &
  Pick<TextInputProps, 'onChangeText' | 'placeholder'>

export const FilterInput = (props: FilterInputProps) => {
  const { onChangeText, placeholder, ...paperProps } = props

  return (
    <Animated.View layout={Layout}>
      <Paper mv='l' mh='m' p='s' {...paperProps}>
        <TextInput
          label='filter'
          size={TextInputSize.SMALL}
          placeholder={placeholder}
          onChangeText={onChangeText}
          returnKeyType='search'
          endAdornment={<IconFilter color='subdued' size='m' />}
        />
      </Paper>
    </Animated.View>
  )
}
