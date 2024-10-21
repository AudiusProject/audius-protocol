import type { ReactNode } from 'react'

import type {
  IconColors,
  TextColors
} from '@audius/harmony/src/foundations/color'

import type { IconComponent } from '@audius/harmony-native'

type IconInfo = {
  icon: IconComponent
  color?: IconColors
}

export type IconTextProps = {
  children?: ReactNode
  color?: TextColors
  icons?: IconInfo[]
}
