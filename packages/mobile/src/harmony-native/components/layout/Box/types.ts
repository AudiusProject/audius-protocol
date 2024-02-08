import type { BaseBoxProps } from '@audius/harmony/src/components/layout/Box/types'
import type { ViewProps, ViewStyle } from 'react-native'

export type BoxProps = Omit<BaseBoxProps, 'flex' | 'alignSelf'> & {
  /* Per emotion/native docs:
    Note that the flex property works like CSS shorthand, 
    and not the legacy flex property in React Native. 
    Setting flex: 1 sets flexShrink to 1 in addition to setting flexGrow to 1 and flexBasis to 0.
    */
  flex?: ViewStyle['flex']
  alignSelf?: ViewStyle['alignSelf']
} & ViewProps
