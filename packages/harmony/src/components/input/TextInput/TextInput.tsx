import { forwardRef, type ComponentPropsWithoutRef } from 'react'

import cn from 'classnames'

import layoutStyles from 'components/layout/layout.module.css'
import { IconComponent, Text } from 'components/typography'

import { HelperText } from './HelperText'
import styles from './TextInput.module.css'
import { useFocusState } from './useFocusState'

export enum TextInputSize {
  SMALL = 'small',
  DEFAULT = 'default'
}

export type TextInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'size'> & {
  /**
   * Input sizes. NOTE: small inputs will not show the label
   * @default default
   */
  size?: TextInputSize
  /**
   * Show a "x/Max" text displaying number of characters allowed
   * @default false
   */
  showMaxLength?: boolean
  /**
   * Toggle warning state
   */
  warning?: boolean
  /**
   * Toggle error state
   */
  error?: boolean
  /**
   * Hides the label. If the label is hidden the placeholder will show instead.
   * @default false
   */
  hideLabel?: boolean
  /**
   * ClassName on the div wrapping the whole input container (doesn't include assistive text)
   */
  inputRootClassName?: string
  /**
   * Label Text
   */
  label?: string
  /**
   * Helper text that shows up below the input
   */
  helperText?: string
  /**
   * Floating text on the lefthand side of the input.
   */
  startAdornmentText?: string
  /**
   * Floating text on the righthand side of the input
   */
  endAdornmentText?: string
  /**
   * Floating icon on the lefthand side of the input. Note: will float to the left of the label & content
   */
  startIcon?: IconComponent
  /**
   * Floating text on the righthand side of the input
   */
  endIcon?: IconComponent
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (props: TextInputProps, ref) => {
    const {
      required,
      label: labelProp,
      className,
      inputRootClassName,
      maxLength,
      showMaxLength,
      size = TextInputSize.DEFAULT,
      hideLabel,
      value,
      children,
      warning: warningProp,
      error,
      className: inputClassName,
      disabled,
      onFocus: onFocusProp,
      onBlur: onBlurProp,
      placeholder,
      helperText,
      startAdornmentText,
      endAdornmentText,
      startIcon: StartIcon,
      endIcon: EndIcon,
      ...other
    } = props

    const characterCount = value !== undefined ? `${value}`.length : 0
    const nearCharacterLimit = maxLength && characterCount >= 0.9 * maxLength

    // Hide the label when: requested, when the size is small, or when adornment text is present
    const shouldShowLabel =
      !hideLabel &&
      size !== TextInputSize.SMALL &&
      endAdornmentText === undefined &&
      startAdornmentText === undefined

    const label = required ? `${labelProp} *` : labelProp

    /**
     * Since Firefox doesn't support the :has() pseudo selector,
     * manually track the focused state and use classes for focus, required, and disabled
     */
    const [isFocused, handleFocus, handleBlur] = useFocusState(
      onFocusProp,
      onBlurProp
    )

    // Whenever a label isn't visible the placeholder shows in it's place
    const shouldShowPlaceholder = isFocused || !shouldShowLabel

    const style = {
      [styles.default]: size === TextInputSize.DEFAULT,
      [styles.small]: size === TextInputSize.SMALL,
      [styles.warning]: warningProp || nearCharacterLimit,
      [styles.error]: error,
      [styles.focused]: isFocused,
      [styles.disabled]: disabled,
      [styles.required]: required
    }

    const input = (
      <div className={cn(styles.inputRow, layoutStyles.row)}>
        <div className={cn(layoutStyles.row, styles.inputContainer)}>
          {startAdornmentText ? (
            <Text variant='label' size='l' color='subdued'>
              {startAdornmentText}
            </Text>
          ) : null}
          <input
            onFocus={handleFocus}
            onBlur={handleBlur}
            ref={ref}
            className={cn(styles.textInput, inputClassName)}
            value={value}
            maxLength={maxLength}
            disabled={disabled}
            placeholder={shouldShowPlaceholder ? placeholder : undefined}
            aria-label={
              label ?? endAdornmentText ?? startAdornmentText ?? placeholder
            }
            {...other}
          />
        </div>
        {endAdornmentText ? (
          <Text variant='label' size='l' color='subdued'>
            {endAdornmentText}
          </Text>
        ) : null}
      </div>
    )

    return (
      <div className={cn(styles.root, className)}>
        <div className={cn(styles.inputRoot, inputRootClassName, style)}>
          {StartIcon ? <StartIcon /> : null}
          {shouldShowLabel ? (
            <label className={styles.elevatedLabel}>
              <Text
                variant='body'
                tag='span'
                className={cn(styles.label, {
                  [styles.hasValue]: characterCount > 0
                })}
              >
                {label}
              </Text>
              {input}
            </label>
          ) : (
            input
          )}

          {showMaxLength && (
            <div className={styles.characterCount}>
              <Text
                variant='body'
                size='xs'
                tag='span'
                color={error ? 'error' : 'default'}
              >
                {characterCount}/{maxLength}
              </Text>
            </div>
          )}
          {EndIcon ? <EndIcon /> : null}
          {children}
        </div>
        {helperText ? (
          <HelperText hasError={error}>{helperText}</HelperText>
        ) : null}
      </div>
    )
  }
)
