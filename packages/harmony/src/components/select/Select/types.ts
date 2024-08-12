import { ReactNode } from 'react'

import { IconComponent } from 'components/icon'
import { TextInputProps } from 'components/input'
import { MenuProps } from 'components/internal/Menu'

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
   * A function to handle when the value is changed
   */
  onChange: (value: Value) => void
  options: ReactNode
}

export type SelectProps<Value extends string = string> = {
  value: Value
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
  menuProps?: Partial<MenuProps>
  clearable?: boolean
} & Omit<TextInputProps, 'value' | 'onChange' | 'children'>
