import { ReactNode } from 'react'

import { IconComponent } from '~harmony/components/icon'
import { TextInputProps } from '~harmony/components/input'
import { MenuContentProps, MenuProps } from '~harmony/components/internal/Menu'

export type SelectOption<Value extends string> = {
  value: Value
  /**
   * The label to display. If not provided, uses the value.
   */
  label?: string
  icon?: IconComponent
  leadingElement?: JSX.Element
}

type ChildrenProps<Value> = {
  /**
   * A callback triggered when the value is changed
   */
  onChange: (value: Value) => void
  /**
   * The rendered options, provided to the children render prop in case
   * they want to be incorporated as-is.
   */
  options: ReactNode
}

export type SelectProps<Value extends string = string> = {
  value: Value
  /**
   * A callback triggered when the value is changed
   */
  onChange?: (value: Value) => void

  /**
   * Selection options
   * e.g. { label: 'Option A', icon: IconRadar }
   */
  options: SelectOption<Value>[]

  children?: (props: ChildrenProps<Value>) => ReactNode

  /**
   * Label to display above options
   */
  optionsLabel?: string
  InputProps?: Partial<TextInputProps>
  menuProps?: Partial<MenuProps> & Partial<MenuContentProps>
  clearable?: boolean
} & Omit<TextInputProps, 'value' | 'onChange' | 'children'>
