import { forwardRef } from 'react'

import { useToggle } from 'react-use'

import { IconButton } from 'components/button'
import { IconVisibilityHidden, IconVisibilityPublic } from 'icons'

import { TextInput } from '../TextInput'

import type { PasswordInputProps } from './types'

const messages = {
  hidePasswordInput: 'Hide password input',
  showPasswordInput: 'Show password input'
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const { hideVisibilityToggle, ...restProps } = props
    const [isPasswordVisible, toggleIsPasswordVisible] = useToggle(false)
    const VisibilityIcon = isPasswordVisible
      ? IconVisibilityPublic
      : IconVisibilityHidden

    return (
      <TextInput
        ref={ref}
        type={isPasswordVisible ? 'text' : 'password'}
        endAdornment={
          hideVisibilityToggle ? null : (
            <IconButton
              icon={VisibilityIcon}
              onClick={toggleIsPasswordVisible}
              aria-label={
                isPasswordVisible
                  ? messages.hidePasswordInput
                  : messages.showPasswordInput
              }
              ripple
            />
          )
        }
        {...restProps}
      />
    )
  }
)
