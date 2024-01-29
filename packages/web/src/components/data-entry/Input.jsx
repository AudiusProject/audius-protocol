import { Component } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './Input.module.css'

class Input extends Component {
  state = {
    value: this.props.defaultValue,
    focused: false,
    warning: false
  }

  onFocus = () => {
    this.setState({
      focused: true
    })
    if (this.props.onFocus) this.props.onFocus(true)
  }

  onBlur = (e) => {
    this.setState({
      focused: false
    })
    if (this.props.onBlur) this.props.onBlur(e.target.value)
  }

  onChange = (e) => {
    if (
      this.props.characterLimit &&
      e.target.value.length > this.props.characterLimit
    )
      return

    if (!this.props.value) {
      this.setState({
        value: e.target.value,
        warning:
          !!this.props.characterLimit &&
          e.target.value.length >= 0.9 * this.props.characterLimit
      })
    }
    this.props.onChange(e.target.value)
  }

  onKeyDown = (...args) => {
    if (this.props.onKeyDown) this.props.onKeyDown(...args)
  }

  render() {
    const {
      className,
      id,
      name,
      autoComplete,
      characterLimit,
      showCharacterLimit,
      size,
      variant,
      disabled,
      isRequired,
      error,
      type,
      inputRef,
      value: valueOverride,
      autoFocus
    } = this.props

    let { placeholder } = this.props

    const { focused, warning } = this.state

    let value = this.state.value
    if (valueOverride !== null && valueOverride !== undefined)
      value = valueOverride

    const miniPlaceholder = focused || value !== ''
    if (isRequired && !miniPlaceholder && placeholder)
      placeholder = placeholder + ' *'

    const style = {
      [styles.large]: size === 'large',
      [styles.medium]: size === 'medium',
      [styles.small]: size === 'small',
      [styles.warning]: (warning && focused) || this.props.warning,
      [styles.elevatedPlaceholder]: variant === 'elevatedPlaceholder',
      [styles.shaded]: variant === 'shaded',
      [styles.focused]: focused,
      [styles.disabled]: disabled,
      [styles.error]: error,
      [styles.data]: miniPlaceholder
    }

    const inputProps = {
      onChange: this.onChange,
      onFocus: this.onFocus,
      onBlur: this.onBlur,
      onKeyDown: this.onKeyDown,
      type,
      name,
      autoComplete,
      disabled,
      value,
      ref: inputRef,
      autoFocus
    }

    if (!focused && variant !== 'elevatedPlaceholder') {
      inputProps.placeholder = placeholder
    }

    return (
      <div className={cn(styles.input, style, className)}>
        {variant === 'elevatedPlaceholder' ? (
          <label
            htmlFor={id}
            className={cn('placeholder', styles.placeholder, {
              focus: focused || value !== ''
            })}
          >
            {placeholder}
          </label>
        ) : null}
        <input id={id} {...inputProps} />
        {showCharacterLimit && (
          <div className={styles.characterCount}>
            {value.length}/{characterLimit}
          </div>
        )}
      </div>
    )
  }
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
  onBlur: PropTypes.func
}

Input.defaultProps = {
  type: 'text',
  placeholder: 'Input',
  defaultValue: '',
  autoComplete: 'off',
  size: 'medium',
  variant: 'normal',
  disabled: false,
  error: false,
  isRequired: false,
  onChange: () => {}
}

export default Input
