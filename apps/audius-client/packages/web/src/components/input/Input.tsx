import {
  ReactNode,
  useCallback,
  useRef,
  KeyboardEvent,
  ChangeEvent
} from 'react'

import cn from 'classnames'

import styles from './Input.module.css'

type InputSize = 'large' | 'default' | 'small'
type InputVariant = 'default' | 'bordered'

type InputProps = {
  className?: string
  inputClassName?: string
  type?: string
  name?: string
  placeholder?: string
  value?: string
  prefix?: ReactNode
  variant?: InputVariant
  size?: InputSize
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  onKeyPress?: (e: KeyboardEvent<HTMLInputElement>) => void
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}

export const Input = ({
  className = '',
  inputClassName = '',
  prefix = null,
  variant = 'default',
  size = 'default',
  ...inputProps
}: InputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleLabelClick = useCallback(() => {
    inputRef.current?.focus()
  }, [inputRef])

  return (
    <div
      className={cn(
        styles.inputContainer,
        {
          [styles.large]: size === 'large',
          [styles.small]: size === 'small',
          [styles.bordered]: variant === 'bordered'
        },
        className
      )}>
      {prefix ? (
        <label className={styles.inputPrefix} onClick={handleLabelClick}>
          {prefix}
        </label>
      ) : null}
      <input
        ref={inputRef}
        className={cn(styles.input, inputClassName)}
        {...inputProps}
      />
    </div>
  )
}
