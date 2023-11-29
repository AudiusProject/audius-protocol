import type { BaseFlexProps } from '@audius/harmony'
import type { ViewStyle } from 'react-native'

import type { NativeBoxProps } from '../Box/types'

export type NativeFlexProps = NativeBoxProps &
  Omit<
    BaseFlexProps,
    'alignItems' | 'flexDirection' | 'direction' | 'wrap' | 'justifyContent'
  > & {
    direction?: ViewStyle['flexDirection']
    wrap?: ViewStyle['flexWrap']
    alignItems?: ViewStyle['alignItems']
    justifyContent?: ViewStyle['justifyContent']
  }
