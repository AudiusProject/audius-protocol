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

export type SelectProps<Value extends string = string> = {
  value: Value
  onChange?: (value: Value) => void

  /**
   * Selection options
   * e.g. { label: 'Option A', icon: IconRadar }
   */
  options: SelectOption<Value>[]

  /**
   * Label to display above options
   */
  optionsLabel?: string
  InputProps?: Partial<TextInputProps>
  menuProps?: Partial<MenuProps>
} & Omit<TextInputProps, 'value' | 'onChange'>
