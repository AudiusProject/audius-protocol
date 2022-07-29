import { Component } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import Input from './Input.js'
import styles from './LabeledInput.module.css'

class LabeledInput extends Component {
  render() {
    const { label, labelStyle, layout } = this.props

    return (
      <div
        className={cn(styles.input, {
          [styles.horizontal]: layout === 'horizontal',
          [styles.vertical]: layout === 'vertical'
        })}
      >
        <div className={cn(styles.label, labelStyle)}>{label}</div>
        <Input {...this.props} />
      </div>
    )
  }
}

LabeledInput.propTypes = {
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
  size: PropTypes.oneOf(['large', 'medium', 'small']),
  variant: PropTypes.oneOf(['normal', 'elevatedPlaceholder']),
  disabled: PropTypes.bool,
  isRequired: PropTypes.bool,
  error: PropTypes.bool,
  label: PropTypes.string,
  labelStyle: PropTypes.string,
  layout: PropTypes.oneOf(['horizontal', 'vertical']),
  onChange: PropTypes.func
}

LabeledInput.defaultProps = {
  placeholder: 'Input',
  label: 'Label',
  layout: 'vertical',
  size: 'medium',
  variant: 'normal',
  disabled: false,
  isRequired: false,
  error: false,
  onChange: () => {}
}

export default LabeledInput
