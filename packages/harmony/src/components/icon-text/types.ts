import { ReactNode } from 'react'

import { IconComponent } from '~harmony/components/icon'
import { IconColors, TextColors } from '~harmony/foundations'

type IconInfo = {
  icon: IconComponent
  color?: IconColors
}

export type IconTextProps = {
  icons?: IconInfo[]
  children?: ReactNode
  color?: TextColors
}
