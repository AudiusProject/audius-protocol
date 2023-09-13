import { IconComponent } from 'components/Icons/types'
import { BaseButtonProps } from 'utils/types'

export type HarmonySelectablePillProps = {
  size?: 'default' | 'large'
  isSelected: boolean
  label: string
  icon?: IconComponent
} & BaseButtonProps
