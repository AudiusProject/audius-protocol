import type { ComponentPropsWithoutRef } from 'react'

import type { IconComponent } from '../../icon'

type InternalProps = {
  /**
   * @ignore: This prop is for internal use only
   */
  _isHovered?: boolean
}

type BaseProps = {
  size?: 'small' | 'large'
  isSelected?: boolean
  disabled?: boolean
  icon?: IconComponent
}

type LabelProps =
  | { label: string }
  | { icon: IconComponent; 'aria-label': string }

type InputProps =
  | ({
      type: 'checkbox' | 'radio'
    } & Omit<ComponentPropsWithoutRef<'input'>, 'chiildren' | 'size'>)
  | ({
      type?: 'button' | 'submit' | 'reset' | undefined
    } & Omit<ComponentPropsWithoutRef<'button'>, 'children'>)

export type SelectablePillProps = BaseProps &
  LabelProps &
  InternalProps &
  InputProps
