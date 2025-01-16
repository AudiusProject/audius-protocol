import { useRef, useEffect } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './TextArea.module.css'

const TextArea = ({
  className,
  placeholder = 'Text area',
  defaultValue = '',
  size = 'medium',
  variant = 'normal',
  characterLimit = 256,
  resize = false,
  grows = false,
  onChange,
  value: controlledValue
}) => {
  const textareaRef = useRef()

  const growTextArea = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      textarea.style.height = '1px'
      textarea.style.height = `${textarea.scrollHeight + 20}px`
    }
  }

  useEffect(() => {
    if (grows) growTextArea()
  }, [grows])

  const handleChange = (e) => {
    if (grows) growTextArea()
    onChange?.(e.target.value)
  }

  const value = controlledValue !== undefined ? controlledValue : defaultValue

  const style = {
    [styles.noResize]: !resize,
    [styles.shaded]: variant === 'shaded',
    [styles.medium]: size === 'medium',
    [styles.small]: size === 'small'
  }

  const characterCountStyle = {
    [styles.nearLimit]: value.length > (7.0 / 8.0) * characterLimit
  }

  return (
    <div className={cn(styles.textarea, style, className)}>
      <textarea
        ref={textareaRef}
        maxLength={characterLimit}
        onChange={handleChange}
        placeholder={placeholder}
        value={value}
      />
      {characterLimit ? (
        <div className={cn(styles.characterCount, characterCountStyle)}>
          {value.length}/{characterLimit}
        </div>
      ) : null}
    </div>
  )
}

TextArea.propTypes = {
  className: PropTypes.string,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
  size: PropTypes.oneOf(['medium', 'small']),
  variant: PropTypes.oneOf(['normal', 'shaded']),
  characterLimit: PropTypes.number,
  resize: PropTypes.bool,
  grows: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.string
}

export default TextArea
