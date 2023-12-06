import { css } from '@emotion/native'
import { View } from 'react-native'

import { Box, Flex, type NativeFlexProps } from '@audius/harmony-native'

type DividerProps = NativeFlexProps

// TODO: temporary component until harmony divider exists
export const Divider = (props: DividerProps) => {
  const { children, ...rest } = props
  return (
    <Flex {...rest} direction='row' alignItems='center' gap='s'>
      <Box borderTop='strong' style={css({ flex: 1 })} />
      <View>{children}</View>
      <Box borderTop='strong' style={css({ flex: 1 })} />
    </Flex>
  )
}
