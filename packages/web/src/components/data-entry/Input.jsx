import { useState } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './Input.module.css'

const Input = ({
  className,
  id,
  name,
  autoComplete = 'off',
  characterLimit,
  showCharacterLimit,
  size = 'medium',
  variant = 'normal',
  disabled = false,
  isRequired = false,
  error = false,
  type = 'text',
  inputRef,
  value: valueOverride,
  autoFocus = false,
  placeholder = 'Input',
  defaultValue = '',
  warning,
  onKeyDown,
  onChange,
  onFocus,
  onBlur
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [focused, setFocused] = useState(false)
  const [internalWarning, setInternalWarning] = useState(false)

  const handleFocus = () => {
    setFocused(true)
    if (onFocus) onFocus(true)
  }

  const handleBlur = (e) => {
    setFocused(false)
    if (onBlur) onBlur(e.target.value)
  }

  const handleChange = (e) => {
    if (characterLimit && e.target.value.length > characterLimit) return

    if (!valueOverride) {
      setInternalValue(e.target.value)
      setInternalWarning(
        !!characterLimit && e.target.value.length >= 0.9 * characterLimit
      )
    }
    onChange?.(e.target.value)
  }

  const handleKeyDown = (...args) => {
    if (onKeyDown) onKeyDown(...args)
  }

  let displayValue = internalValue
  if (valueOverride !== null && valueOverride !== undefined)
    displayValue = valueOverride

  const miniPlaceholder = focused || displayValue !== ''
  let displayPlaceholder = placeholder
  if (isRequired && !miniPlaceholder && displayPlaceholder)
    displayPlaceholder = displayPlaceholder + ' *'

  const style = {
    [styles.large]: size === 'large',
    [styles.medium]: size === 'medium',
    [styles.small]: size === 'small',
    [styles.warning]: (internalWarning && focused) || warning,
    [styles.elevatedPlaceholder]: variant === 'elevatedPlaceholder',
    [styles.shaded]: variant === 'shaded',
    [styles.focused]: focused,
    [styles.disabled]: disabled,
    [styles.error]: error,
    [styles.data]: miniPlaceholder
  }

  const inputProps = {
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    type,
    name,
    autoComplete,
    disabled,
    value: displayValue,
    ref: inputRef,
    autoFocus
  }

  if (!focused && variant !== 'elevatedPlaceholder') {
    inputProps.placeholder = displayPlaceholder
  }

  return (
    <div className={cn(styles.input, style, className)}>
      {variant === 'elevatedPlaceholder' ? (
        <label
          htmlFor={id}
          className={cn('placeholder', styles.placeholder, {
            focus: focused || displayValue !== ''
          })}
        >
          {displayPlaceholder}
        </label>
      ) : null}
      <input id={id} {...inputProps} />
      {showCharacterLimit && (
        <div className={styles.characterCount}>
          {displayValue.length}/{characterLimit}
        </div>
      )}
    </div>
  )
}

Input.propTypes = {
  className: PropTypes.string,
  id: PropTypes.string,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
  value: PropTypes.string,
  name: PropTypes.string,
  autoComplete: PropTypes.string,
  characterLimit: PropTypes.number,
  showCharacterLimit: PropTypes.bool,
  size: PropTypes.oneOf(['large', 'medium', 'small']),
  variant: PropTypes.oneOf(['normal', 'elevatedPlaceholder', 'shaded']),
  type: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  warning: PropTypes.bool,
  onKeyDown: PropTypes.func,
  isRequired: PropTypes.bool,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  inputRef: PropTypes.any
}

export default Input
