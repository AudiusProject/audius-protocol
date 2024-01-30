import { Component } from 'react'

import Select from 'antd/lib/select'
import cn from 'classnames'
import PropTypes from 'prop-types'

import { IconCaretDown as IconCaretDown } from '@audius/harmony'
import { HelperText } from 'components/data-entry/HelperText'

import styles from './DropdownInput.module.css'

const Option = Select.Option

class DropdownInput extends Component {
  state = {
    focused: false
  }

  onVisibleChange = (visible) => {
    this.setState({
      focused: visible
    })
  }

  onSelect = (value) => {
    this.setState({
      focused: false
    })
    this.props.onSelect(value)
  }

  render() {
    const {
      'aria-label': ariaLabel,
      menu,
      defaultValue,
      label,
      labelStyle,
      dropdownStyle,
      dropdownInputStyle,
      helperText,
      layout,
      size,
      variant,
      disabled,
      isRequired,
      error,
      id,
      focused = this.state.focused,
      footer,
      input,
      onSearch,
      value
    } = this.props
    let { placeholder } = this.props

    if (isRequired && placeholder) placeholder = placeholder + ' *'

    const style = {
      [styles.horizontal]: layout === 'horizontal',
      [styles.vertical]: layout === 'vertical',
      [styles.large]: size === 'large',
      [styles.medium]: size === 'medium',
      [styles.small]: size === 'small',
      [styles.alternative]: variant === 'alternative',
      [styles.focused]: focused,
      [styles.disabled]: disabled,
      [styles.error]: error
    }

    const options = menu.items.map((item, i) => {
      if (item.id && item.text && !item.el) {
        return (
          <Option key={item.id} value={item.id} query={item.text} role='option'>
            {item.text}
          </Option>
        )
      } else if (item.text && item.el) {
        return (
          <Option
            key={item.text}
            value={item.value || item.text}
            query={item.text}
            disabled={item.disabled}
            role='option'
          >
            {item.el}
          </Option>
        )
      } else {
        return (
          <Option key={item} value={item} query={item} role='option'>
            {item}
          </Option>
        )
      }
    })

    // Add dropdown footer if given
    if (footer) {
      options.push(
        <div className={styles.footer} disabled>
          {footer}
        </div>
      )
    }

    let goodDefault = false
    menu.items.forEach((item) => {
      if (defaultValue === item || defaultValue === item.text) {
        goodDefault = true
      }
    })
    const defaultValueProp = goodDefault
      ? {
          defaultValue
        }
      : {}

    return (
      <div
        className={cn(styles.wrapper, style, {
          [styles.hasValue]: input || value
        })}
      >
        {label && !value ? (
          <label
            htmlFor={id}
            className={cn(styles.label, labelStyle, {
              [styles.labelFocus]: focused || input
            })}
          >
            {label}
          </label>
        ) : null}
        <div className={cn(styles.dropdownInput, dropdownInputStyle)}>
          <Select
            {...defaultValueProp}
            value={value}
            id={id}
            aria-label={ariaLabel}
            dropdownClassName={cn(styles.select, dropdownStyle, style)}
            showSearch
            disabled={disabled}
            showArrow={false}
            defaultActiveFirstOption={false}
            optionFilterProp='children'
            onSelect={this.onSelect}
            filterOption={(input, option) =>
              option.props.query?.toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={''}
            onDropdownVisibleChange={this.onVisibleChange}
            onSearch={onSearch}
          >
            {options}
          </Select>
          <IconCaretDown className={styles.arrow} />
        </div>
        {helperText ? (
          <HelperText error={error}>{helperText}</HelperText>
        ) : null}
      </div>
    )
  }
}

DropdownInput.propTypes = {
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
  menu: PropTypes.object,
  label: PropTypes.string,
  labelStyle: PropTypes.string,
  dropdownStyle: PropTypes.string,
  dropdownInputStyle: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  layout: PropTypes.oneOf(['horizontal', 'vertical']),
  variant: PropTypes.oneOf(['default', 'alternative']),
  disabled: PropTypes.bool,
  mount: PropTypes.oneOf(['parent', 'page', 'body']),
  isRequired: PropTypes.bool,
  error: PropTypes.bool,
  onSelect: PropTypes.func
}

export default DropdownInput
