import { forwardRef, useId } from 'react'

import cn from 'classnames'

import { Text, TextSize } from 'components/text'

import { Flex } from '../../layout'
import { useFocusState } from '../useFocusState'

import styles from './TextInput.module.css'
import { TextInputSize, type TextInputProps } from './types'

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (props, ref) => {
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
    const placeholderText =
      required && hideLabel ? `${placeholder} *` : placeholder
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
      [styles.disabled]: disabled,
      [styles.focused]: isFocused
    }

    const inputRender = (
      <Flex alignItems='center' justifyContent='space-between'>
        {startAdornmentText && shouldShowAdornments ? (
          <Text variant='label' size='l' color='subdued'>
            {startAdornmentText}
          </Text>
        ) : null}
        <input
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={ref}
          className={cn(styles.input, inputClassName, inputElStyle)}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={shouldShowPlaceholder ? placeholderText : undefined}
          aria-label={props['aria-label'] ?? labelText}
          aria-required={required}
          role='textbox'
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

    const isLabelElevated = hasValue || isFocused

    return (
      <Flex
        className={cn(styles.root, className)}
        direction='column'
        gap='xs'
        alignItems='flex-start'
        w='100%'
      >
        <label
          htmlFor={id}
          className={cn(
            styles.contentContainer,
            inputRootClassName,
            inputRootStyle
          )}
        >
          {StartIcon ? <StartIcon size='m' /> : null}
          <Flex direction='column' gap='xs' justifyContent='center' w='100%'>
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
                  size={isLabelElevated ? 's' : 'l'}
                  color='subdued'
                  css={(theme) => ({
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    zIndex: 2,
                    transition: `all ${theme.motion.expressive}`,
                    transform: isLabelElevated
                      ? 'translate(0, 0)'
                      : 'translate(0px, 13px)'
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
          </Flex>
          {EndIcon ? <EndIcon size='m' /> : null}
        </label>
        {helperText ? (
          <Text
            variant='body'
            size={helperTextSize}
            strength='default'
            color={error ? 'danger' : 'default'}
          >
            {helperText}
          </Text>
        ) : null}
      </Flex>
    )
  }
)
