import type { ComponentType } from 'react'

import type { IconProps as HarmonyIconProps } from '@audius/harmony'
import type { AnimateProps } from 'react-native-reanimated'
import type { SvgProps } from 'react-native-svg'

export * from '@audius/harmony/src/icons'

export type IconProps = SvgProps & HarmonyIconProps & { fillSecondary?: string }

export type Icon = ComponentType<AnimateProps<IconProps> | IconProps>
