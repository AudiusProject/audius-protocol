import { forwardRef, useState, memo, useCallback } from 'react'

import { TextInput } from '../TextInput'
import type { PasswordInputProps } from './types'
import {
  IconVisibilityHidden,
  IconVisibilityPublic
} from 'components/typography'
import styles from './PasswordInput.modules.css'

const messages = {
  hidePasswordInput: 'Hide password input',
  showPasswordInput: 'Show password input'
}

type VisibilityButtonProps = {
  onClick: () => void
  isVisible: boolean
}

const VisibilityButton = memo(
  ({ onClick, isVisible }: VisibilityButtonProps) => {
    const VisibilityIcon = isVisible
      ? IconVisibilityPublic
      : IconVisibilityHidden
    return (
      <button
        tabIndex={0}
        aria-label={
          isVisible ? messages.hidePasswordInput : messages.showPasswordInput
        }
        className={styles.button}
        onClick={(e) => {
          e.preventDefault()
          onClick()
        }}
      >
        {
          <VisibilityIcon
            aria-hidden={true}
            className={styles.icon}
            size='large'
          />
        }
      </button>
    )
  }
)

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
