import { forwardRef } from 'react'

import cn from 'classnames'

import { Text, TextSize } from 'components/typography'

import { Flex } from '../../layout'

import { HelperText } from './HelperText'
import styles from './TextInput.module.css'
import { TextInputSize, type TextInputProps } from './types'
import { useFocusState } from './useFocusState'

const TextInput = forwardRef<HTMLInputElement, TextInputProps>((props, ref) => {
  const {
    required,
    className,
    inputRootClassName,
    maxLength,
    showMaxLengthThreshold = 0.7,
    maxLengthWarningThreshold = 0.9,
    size = TextInputSize.DEFAULT,
    hideLabel,
    label: labelProp,
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

  /**
   * Since Firefox doesn't support the :has() pseudo selector,
   * manually track the focused state and use classes for focus, required, and disabled
   */
  const [isFocused, handleFocus, handleBlur] = useFocusState(
    onFocusProp,
    onBlurProp
  )

  const characterCount = value !== undefined ? `${value}`.length : 0
  const hasValue = characterCount > 0

  // Hide the label when requested or when the size is set to small
  const shouldShowLabel = !hideLabel && size !== TextInputSize.SMALL
  const labelText = required ? `${labelProp} *` : labelProp
  const helperTextSize: TextSize = size === TextInputSize.SMALL ? 'xs' : 's'

  // Whenever a label isn't visible the placeholder should be visible in it's place (if provided)
  const shouldShowPlaceholder = isFocused || !shouldShowLabel
  const shouldShowAdornments = isFocused || hasValue || !shouldShowLabel
  // Show the maxlength text whenever we hit a certain threshold (default 70%)
  const shouldShowMaxLengthText =
    // isFocused &&
    maxLength && characterCount >= showMaxLengthThreshold * maxLength
  // Turn the maxlength text to the warning color whenever we hit a certain threshold (default 90%)
  const showMaxlengthWarningColor =
    maxLength && characterCount >= maxLengthWarningThreshold * maxLength

  const inputRootStyle = {
    [styles.default]: size === TextInputSize.DEFAULT,
    [styles.small]: size === TextInputSize.SMALL,
    [styles.warning]: warningProp,
    [styles.error]: error,
    [styles.focused]: isFocused,
    [styles.disabled]: disabled,
    [styles.required]: required
  }

  const inputElStyle = {
    [styles.default]: size === TextInputSize.DEFAULT,
    [styles.small]: size === TextInputSize.SMALL
  }

  const inputRender = (
    <Flex className={styles.inputRow}>
      <Flex className={styles.inputContainer}>
        {startAdornmentText && shouldShowAdornments ? (
          <Text variant='label' size='l' color='subdued'>
            {startAdornmentText}
          </Text>
        ) : null}
        <input
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={ref}
          className={cn(styles.textInput, inputClassName, inputElStyle)}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={shouldShowPlaceholder ? placeholder : undefined}
          aria-label={labelText ?? props['aria-label']}
          aria-required={required}
          {...other}
        />
      </Flex>
      {endAdornmentText && shouldShowAdornments ? (
        <Text variant='label' size='l' color='subdued'>
          {endAdornmentText}
        </Text>
      ) : null}
    </Flex>
  )

  return (
    <Flex className={cn(styles.root, className)} direction='column'>
      <Flex
        className={cn(styles.inputRoot, inputRootClassName, inputRootStyle)}
      >
        {StartIcon ? <StartIcon /> : null}
        <label className={styles.elevatedLabelRow}>
          {shouldShowLabel ? (
            <Flex direction='row' justifyContent='space-between'>
              <Text
                variant='body'
                tag='span'
                size='l'
                className={cn(styles.label, {
                  [styles.hasValue]: hasValue
                })}
              >
                {labelText}
              </Text>
              {shouldShowMaxLengthText ? (
                <Text
                  variant='body'
                  size='xs'
                  tag='span'
                  color={showMaxlengthWarningColor ? 'warning' : 'default'}
                >
                  {characterCount}/{maxLength}
                </Text>
              ) : null}
            </Flex>
          ) : null}
          {inputRender}
        </label>

        {EndIcon ? <EndIcon /> : null}
        {children}
      </Flex>
      {helperText ? (
        <HelperText hasError={error} size={helperTextSize}>
          {helperText}
        </HelperText>
      ) : null}
    </Flex>
  )
})

TextInput.displayName = 'TextInput'

export { TextInput }
