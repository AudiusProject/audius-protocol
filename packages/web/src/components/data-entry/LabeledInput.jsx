import cn from 'classnames'
import PropTypes from 'prop-types'

import Input from './Input.jsx'
import styles from './LabeledInput.module.css'

const LabeledInput = ({
  placeholder = 'Input',
  label = 'Label',
  layout = 'vertical',
  size = 'medium',
  variant = 'normal',
  disabled = false,
  isRequired = false,
  error = false,
  onChange = () => {},
  labelStyle,
  ...props
}) => {
  return (
    <div
      className={cn(styles.input, {
        [styles.horizontal]: layout === 'horizontal',
        [styles.vertical]: layout === 'vertical'
      })}
    >
      <div className={cn(styles.label, labelStyle)}>{label}</div>
      <Input
        placeholder={placeholder}
        label={label}
        layout={layout}
        size={size}
        variant={variant}
        disabled={disabled}
        isRequired={isRequired}
        error={error}
        onChange={onChange}
        {...props}
      />
    </div>
  )
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

export default LabeledInput
