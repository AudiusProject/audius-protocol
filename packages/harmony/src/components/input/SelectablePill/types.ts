import type { ComponentPropsWithoutRef } from 'react'

import type { IconComponent } from '../../icon'

type InternalProps = {
  /**
   * @ignore: This prop is for internal use only
   */
  _isHovered?: boolean
}

export type SelectablePillProps = {
  size?: 'default' | 'large'
  isSelected?: boolean
  label: string
  disabled?: boolean
  icon?: IconComponent
} & InternalProps &
  Omit<ComponentPropsWithoutRef<'button'>, 'children'>
