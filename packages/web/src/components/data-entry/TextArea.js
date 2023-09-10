import { createRef, Component } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './TextArea.module.css'

class TextArea extends Component {
  state = {
    value: this.props.defaultValue
  }

  textareaRef = createRef()

  growTextArea = () => {
    if (this.textareaRef.current) {
      const textarea = this.textareaRef.current
      textarea.style.height = '1px'
      textarea.style.height = `${textarea.scrollHeight + 20}px`
    }
  }

  onChange = (e) => {
    if (this.props.grows) this.growTextArea()
    this.setState({
      value: e.target.value
    })
    this.props.onChange(e.target.value)
  }

  componentDidMount() {
    if (this.props.grows) this.growTextArea()
  }

  render() {
    const {
      className,
      placeholder,
      size,
      variant,
      characterLimit,
      resize,
      value = this.state.value
    } = this.props

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
          ref={this.textareaRef}
          maxLength={characterLimit}
          onChange={this.onChange}
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
  onChange: PropTypes.func
}

TextArea.defaultProps = {
  placeholder: 'Text area',
  defaultValue: '',
  size: 'medium',
  variant: 'normal',
  characterLimit: 256,
  resize: false,
  grows: false,
  onChange: () => {}
}

export default TextArea
