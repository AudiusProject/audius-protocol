import { ReactNode } from 'react'

import { IconComponent } from '~harmony/components/icon'
import { TextInputProps } from '~harmony/components/input'
import { MenuContentProps, MenuProps } from '~harmony/components/internal/Menu'

export type DropdownInputOption<Value extends string> = {
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

export type DropdownInputProps<Value extends string = string> = {
  value: Value
  /**
   * A callback triggered when the value is changed
   */
  onChange?: (value: Value) => void

  /**
   * Selection options
   * e.g. { label: 'Option A', icon: IconRadar }
   */
  options: DropdownInputOption<Value>[]

  /**
   * Optional function to customize the selected option's displayed label
   * @param option The currently selected option
   * @returns The string to display as the label
   */
  renderSelectedOptionLabel?: (option: DropdownInputOption<Value>) => string

  /**
   * Optional function to render custom content in the input field
   * @param option The currently selected option
   * @returns JSX element to display in the input field
   */
  renderSelectedValue?: (
    option: DropdownInputOption<Value> | undefined
  ) => ReactNode

  children?: (props: ChildrenProps<Value>) => ReactNode

  /**
   * Label to display above options
   */
  optionsLabel?: string
  InputProps?: Partial<TextInputProps>
  menuProps?: Partial<MenuProps> & Partial<MenuContentProps>
  clearable?: boolean
} & Omit<TextInputProps, 'value' | 'onChange' | 'children'>
