import { ReactNode } from 'react'

type Value =
  | string
  | {
      id: string
      text: string
    }
  | {
      text: string
      el: JSX.Element
      value?: string
    }

export type DropdownInputProps = {
  placeholder: string
  defaultValue?: Value
  menu: { items: Value[] }
  label?: string
  labelStyle?: string
  dropdownStyle?: string
  dropdownInputStyle?: string
  size?: 'small' | 'medium' | 'large'
  layout?: 'horizontal' | 'vertical'
  variant?: 'default' | 'alternative'
  disabled?: boolean
  mount?: 'parent' | 'page' | 'body'
  isRequired?: boolean
  error?: boolean
  onSelect?: (value: string) => void
  popupContainer?: (triggerNode: HTMLElement) => void
  footer?: ReactNode
  helperText?: string
  onChange?: (value: string) => void
}

declare const DropdownInput = (props: DropdownInputProps) => JSX.Element

export default DropdownInput
