import { ReactNode } from 'react'

import { IconComponent } from 'components/icon'
import { IconColors, TextColors } from 'foundations'

type IconInfo = {
  icon: IconComponent
  color?: IconColors
}

export type IconTextProps = {
  icons?: IconInfo[]
  children?: ReactNode
  color?: TextColors
}
