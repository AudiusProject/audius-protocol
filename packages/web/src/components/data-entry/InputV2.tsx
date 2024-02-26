import { ComponentPropsWithoutRef, MutableRefObject, RefCallback } from 'react'

import { Text } from '@audius/harmony'
import cn from 'classnames'

import layoutStyles from 'components/layout/layout.module.css'

import { HelperText } from './HelperText'
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
  inputRootClassName?: string
  inputClassName?: string
  label?: string
  helperText?: string
  startAdornment?: string
  endAdornment?: string
}

export const InputV2 = (props: InputV2Props) => {
  const {
    required,
    label: labelProp,
    className,
    inputRootClassName,
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
    helperText,
    startAdornment,
    endAdornment,
    ...other
  } = props

  const characterCount = value !== undefined ? `${value}`.length : 0
  const nearCharacterLimit = maxLength && characterCount >= 0.9 * maxLength
  const elevatePlaceholder = variant === InputV2Variant.ELEVATED_PLACEHOLDER
  const label = required ? `${labelProp} *` : labelProp

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
    <div className={cn(styles.inputRow, layoutStyles.row)}>
      <div className={cn(layoutStyles.row, styles.inputContainer)}>
        {startAdornment ? (
          <Text variant='label' size='l' color='subdued'>
            {startAdornment}
          </Text>
        ) : null}
        <input
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={inputRef}
          className={cn(styles.textInput, inputClassName)}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={
            isFocused || startAdornment || endAdornment
              ? placeholder
              : undefined
          }
          {...other}
        />
      </div>
      {endAdornment ? (
        <Text variant='label' size='l' color='subdued'>
          {endAdornment}
        </Text>
      ) : null}
    </div>
  )

  return (
    <div className={cn(styles.root, className)}>
      <div className={cn(styles.inputRoot, inputRootClassName, style)}>
        {elevatePlaceholder ? (
          <label className={styles.elevatedLabel}>
            <span
              className={cn(styles.label, {
                [styles.hasValue]:
                  characterCount > 0 || startAdornment || endAdornment
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
      {helperText ? <HelperText error={error}>{helperText}</HelperText> : null}
    </div>
  )
}
