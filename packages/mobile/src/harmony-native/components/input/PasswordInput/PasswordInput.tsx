import { forwardRef } from 'react'

import { useToggle } from 'react-use'

import { IconVisibilityHidden, IconVisibilityPublic } from '../../../icons'
import { IconButton } from '../../Button/IconButton/IconButton'
import type { TextInputRef } from '../TextInput/TextInput'
import { TextInput } from '../TextInput/TextInput'

import type { PasswordInputProps } from './types'

const messages = {
  hidePasswordInput: 'Hide password input',
  showPasswordInput: 'Show password input'
}

export const PasswordInput = forwardRef(
  (props: PasswordInputProps, ref: TextInputRef) => {
    const {
      hideVisibilityToggle,
      textContentType = 'password',
      ...restProps
    } = props
    const [isPasswordVisible, toggleIsPasswordVisible] = useToggle(false)
    const VisibilityIcon = isPasswordVisible
      ? IconVisibilityPublic
      : IconVisibilityHidden

    return (
      <TextInput
        ref={ref}
        autoComplete='off'
        autoCorrect={false}
        autoCapitalize='none'
        textContentType={textContentType}
        secureTextEntry={!isPasswordVisible}
        clearTextOnFocus={false}
        endAdornment={
          hideVisibilityToggle ? null : (
            <IconButton
              color='subdued'
              icon={VisibilityIcon}
              onPress={toggleIsPasswordVisible}
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
