import type { BaseFlexProps } from '@audius/harmony/src/components/layout/Flex/types'
import type { ViewStyle } from 'react-native'

import type { BoxProps } from '../Box/types'

export type FlexProps = BoxProps &
  Omit<
    BaseFlexProps,
    'alignItems' | 'flexDirection' | 'direction' | 'wrap' | 'justifyContent'
  > & {
    direction?: ViewStyle['flexDirection']
    wrap?: ViewStyle['flexWrap']
    alignItems?: ViewStyle['alignItems']
    justifyContent?: ViewStyle['justifyContent']
  }
