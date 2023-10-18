import { forwardRef, useId } from 'react'

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
    id: idProp,
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

  // For focus behavior and accessiblity, <label> needs to have a htmlFor={} provided to an id matching the input
  const backupId = useId()
  const id = idProp ?? backupId

  const characterCount = value !== undefined ? `${value}`.length : 0
  const hasValue = characterCount > 0

  // Hide the label when requested or when the size is set to small
  const shouldShowLabel = !hideLabel && size !== TextInputSize.SMALL
  const labelText = required ? `${labelProp} *` : labelProp
  const helperTextSize: TextSize = size === TextInputSize.SMALL ? 'xs' : 's'

  // Whenever a label isn't visible the placeholder should be visible in it's place (if provided)
  const shouldShowPlaceholder = isFocused || !shouldShowLabel
  const shouldShowAdornments = isFocused || hasValue || !shouldShowLabel
  // Show the maxlength text whenever we hit a certain threshold (default 70%) + the input is focused
  const shouldShowMaxLengthText =
    isFocused &&
    maxLength &&
    characterCount >= showMaxLengthThreshold * maxLength
  // Turn the maxlength text to the warning color whenever we hit a certain threshold (default 90%)
  const showMaxlengthWarningColor =
    maxLength && characterCount >= maxLengthWarningThreshold * maxLength

  // Styles for the root of the input
  const inputRootStyle = {
    [styles.default]: size === TextInputSize.DEFAULT,
    [styles.small]: size === TextInputSize.SMALL,
    [styles.warning]: warningProp,
    [styles.error]: error,
    [styles.focused]: isFocused,
    [styles.disabled]: disabled,
    [styles.required]: required
  }

  // Styles for the input element itself
  const inputElStyle = {
    [styles.default]: size === TextInputSize.DEFAULT,
    [styles.small]: size === TextInputSize.SMALL,
    [styles.disabled]: disabled
  }

  const inputRender = (
    <Flex
      className={cn(styles.inputAdornmentRow, { [styles.focused]: isFocused })}
    >
      {startAdornmentText && shouldShowAdornments ? (
        <Text variant='label' size='l' color='subdued'>
          {startAdornmentText}
        </Text>
      ) : null}
      <input
        onFocus={handleFocus}
        onBlur={handleBlur}
        ref={ref}
        className={cn(styles.inputElement, inputClassName, inputElStyle)}
        value={value}
        maxLength={maxLength}
        disabled={disabled}
        placeholder={shouldShowPlaceholder ? placeholder : undefined}
        aria-label={labelText ?? props['aria-label']}
        aria-required={required}
        id={id}
        {...other}
      />
      {endAdornmentText && shouldShowAdornments ? (
        <Text variant='label' size='l' color='subdued'>
          {endAdornmentText}
        </Text>
      ) : null}
    </Flex>
  )

  return (
    <Flex className={cn(styles.root, className)} direction='column'>
      <label
        htmlFor={id}
        className={cn(styles.inputRoot, inputRootClassName, inputRootStyle)}
      >
        {StartIcon ? <StartIcon /> : null}
        <div className={styles.innerRootContainer}>
          {shouldShowLabel ? (
            <Flex
              className={styles.labelRow}
              direction='row'
              alignItems='center'
              justifyContent='space-between'
              gap='s'
            >
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
        </div>

        {EndIcon ? <EndIcon /> : null}
        {children}
      </label>
      {helperText ? (
        <HelperText hasError={error} size={helperTextSize}>
          {helperText}
        </HelperText>
      ) : null}
    </Flex>
  )
})

export { TextInput }
