import { ComponentPropsWithoutRef, MutableRefObject, RefCallback } from 'react'

import cn from 'classnames'

import styles from './InputV2.module.css'
import { useFocusState } from './useFocusState'

export enum InputV2Size {
  SMALL,
  MEDIUM,
  LARGE
}

export enum InputV2Variant {
  NORMAL,
  ELEVATED_PLACEHOLDER
}

type InputV2Props = Omit<ComponentPropsWithoutRef<'input'>, 'size'> & {
  size?: InputV2Size
  variant?: InputV2Variant
  showMaxLength?: boolean
  inputRef?:
    | MutableRefObject<HTMLInputElement | null>
    | RefCallback<HTMLInputElement>
  warning?: boolean
  error?: boolean
  inputClassName?: string
}

export const InputV2 = (props: InputV2Props) => {
  const {
    required,
    placeholder: placeholderProp,
    className,
    maxLength,
    showMaxLength,
    size = InputV2Size.MEDIUM,
    variant = InputV2Variant.NORMAL,
    inputRef,
    value,
    children,
    warning: warningProp,
    error,
    inputClassName,
    disabled,
    onFocus: onFocusProp,
    onBlur: onBlurProp,
    ...other
  } = props

  const characterCount = value ? `${value}`.length : 0
  const nearCharacterLimit = maxLength && characterCount >= 0.9 * maxLength
  const elevatePlaceholder = variant === InputV2Variant.ELEVATED_PLACEHOLDER
  const placeholder =
    required && !elevatePlaceholder ? `${placeholderProp} *` : placeholderProp

  const style = {
    [styles.large]: size === InputV2Size.LARGE,
    [styles.medium]: size === InputV2Size.MEDIUM,
    [styles.small]: size === InputV2Size.SMALL,
    [styles.warning]: warningProp || nearCharacterLimit,
    [styles.error]: error
  }

  /**
   * Since Firefox doesn't support the :has() pseudo selector,
   * manually track the focused state and use classes for focus, required, and disabled
   */
  const [isFocused, handleFocus, handleBlur] = useFocusState(
    onFocusProp,
    onBlurProp
  )

  const input = (
    <input
      onFocus={handleFocus}
      onBlur={handleBlur}
      ref={inputRef}
      placeholder={!elevatePlaceholder ? placeholder : undefined}
      required={required}
      className={inputClassName}
      value={value}
      maxLength={maxLength}
      disabled={disabled}
      {...other}
    />
  )

  return (
    <div
      className={cn(
        styles.root,
        { [styles.focused]: isFocused },
        { [styles.disabled]: disabled },
        { [styles.required]: required },
        style,
        className
      )}
    >
      {elevatePlaceholder ? (
        <label className={styles.elevatedPlaceholderLabel}>
          <span
            className={cn(styles.placeholder, {
              [styles.hasValue]: characterCount > 0
            })}
          >
            {placeholder}
          </span>
          {input}
        </label>
      ) : (
        input
      )}

      {showMaxLength && (
        <div className={styles.characterCount}>
          <span>
            {characterCount}/{maxLength}
          </span>
        </div>
      )}
      {children}
    </div>
  )
}
