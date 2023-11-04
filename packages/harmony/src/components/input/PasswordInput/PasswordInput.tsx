import { MouseEvent, forwardRef, useCallback, useState } from 'react'

import { IconVisibilityHidden, IconVisibilityPublic } from 'icons'
import { TextInput } from '../TextInput'
import styles from './PasswordInput.modules.css'
import type { PasswordInputProps } from './types'

const messages = {
  hidePasswordInput: 'Hide password input',
  showPasswordInput: 'Show password input'
}

type VisibilityButtonProps = {
  onClick: () => void
  isVisible: boolean
}

const VisibilityButton = ({ onClick, isVisible }: VisibilityButtonProps) => {
  const VisibilityIcon = isVisible ? IconVisibilityPublic : IconVisibilityHidden
  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      onClick()
    },
    [onClick]
  )
  return (
    <button
      tabIndex={0}
      aria-label={
        isVisible ? messages.hidePasswordInput : messages.showPasswordInput
      }
      className={styles.button}
      onClick={handleClick}
    >
      <VisibilityIcon aria-hidden={true} className={styles.icon} size='l' />
    </button>
  )
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const { hideVisibilityToggle, ...restProps } = props
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)

    const handleClickVisibility = useCallback(() => {
      setIsPasswordVisible(!isPasswordVisible)
    }, [isPasswordVisible])

    return (
      <TextInput
        type={isPasswordVisible ? 'text' : 'password'}
        endAdornment={
          hideVisibilityToggle ? null : (
            <VisibilityButton
              onClick={handleClickVisibility}
              isVisible={isPasswordVisible}
            />
          )
        }
        ref={ref}
        {...restProps}
      />
    )
  }
)
