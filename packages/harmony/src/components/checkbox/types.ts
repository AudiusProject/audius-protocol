import { InputHTMLAttributes } from 'react'

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  indeterminate?: boolean
  _isHovered?: boolean
  _isFocused?: boolean
}
