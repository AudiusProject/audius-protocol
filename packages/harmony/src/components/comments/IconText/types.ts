import { IconComponent } from 'components/icon'
import { IconColors, TextColors } from 'foundations'

type IconInfo = {
  icon: IconComponent
  color?: IconColors
}

export type IconTextProps = {
  icons?: IconInfo[]
  text: string
  color?: TextColors
}
