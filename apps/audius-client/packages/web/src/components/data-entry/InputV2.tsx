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

export type InputV2Props = Omit<ComponentPropsWithoutRef<'input'>, 'size'> & {
  size?: InputV2Size
  variant?: InputV2Variant
  showMaxLength?: boolean
  inputRef?:
    | MutableRefObject<HTMLInputElement | null>
    | RefCallback<HTMLInputElement>
  warning?: boolean
  error?: boolean
  inputClassName?: string
  label?: string
}

export const InputV2 = (props: InputV2Props) => {
  const {
    required,
    label: labelProp,
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
    placeholder,
    ...other
  } = props

  const characterCount = value ? `${value}`.length : 0
  const nearCharacterLimit = maxLength && characterCount >= 0.9 * maxLength
  const elevatePlaceholder = variant === InputV2Variant.ELEVATED_PLACEHOLDER
  const label = required && !elevatePlaceholder ? `${labelProp} *` : labelProp

  /**
   * Since Firefox doesn't support the :has() pseudo selector,
   * manually track the focused state and use classes for focus, required, and disabled
   */
  const [isFocused, handleFocus, handleBlur] = useFocusState(
    onFocusProp,
    onBlurProp
  )

  const style = {
    [styles.large]: size === InputV2Size.LARGE,
    [styles.medium]: size === InputV2Size.MEDIUM,
    [styles.small]: size === InputV2Size.SMALL,
    [styles.warning]: warningProp || nearCharacterLimit,
    [styles.error]: error,
    [styles.focused]: isFocused,
    [styles.disabled]: disabled,
    [styles.required]: required
  }

  const input = (
    <input
      onFocus={handleFocus}
      onBlur={handleBlur}
      ref={inputRef}
      required={required}
      className={inputClassName}
      value={value}
      maxLength={maxLength}
      disabled={disabled}
      placeholder={isFocused ? placeholder : undefined}
      {...other}
    />
  )

  return (
    <div className={cn(styles.root, style, className)}>
      {elevatePlaceholder ? (
        <label className={styles.elevatedLabel}>
          <span
            className={cn(styles.label, {
              [styles.hasValue]: characterCount > 0
            })}
          >
            {label}
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
