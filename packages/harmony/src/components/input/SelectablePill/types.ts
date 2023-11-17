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
  label: string
  disabled?: boolean
  icon?: IconComponent
}

type InputProps =
  | ({
      type: 'checkbox' | 'radio'
    } & Omit<ComponentPropsWithoutRef<'input'>, 'chiildren' | 'size'>)
  | ({
      type?: 'button' | 'submit' | 'reset' | undefined
    } & Omit<ComponentPropsWithoutRef<'button'>, 'children'>)

export type SelectablePillProps = BaseProps & InternalProps & InputProps
