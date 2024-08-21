import { ComponentPropsWithoutRef } from 'react'

export type CheckboxProps = ComponentPropsWithoutRef<'input'> & {
  indeterminate?: boolean
  _isHovered?: boolean
  _isFocused?: boolean
}
