import React, { Component } from 'react'

import Select from 'antd/lib/select'
import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconCaretDown } from 'assets/img/iconCaretDown.svg'

import styles from './DropdownInput.module.css'

const Option = Select.Option

class DropdownInput extends Component {
  state = {
    focused: false
  }

  onVisibleChange = visible => {
    this.setState({
      focused: visible
    })
  }

  onSelect = value => {
    this.setState({
      focused: false
    })
    this.props.onSelect(value)
  }

  render() {
    const {
      menu,
      defaultValue,
      label,
      labelStyle,
      mount,
      layout,
      size,
      variant,
      disabled,
      isRequired,
      error,
      focused = this.state.focused
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
      if (item.id && item.text) {
        return (
          <Option key={item.id} value={item.id} query={item.text}>
            {item.text}
          </Option>
        )
      } else if (item.text && item.el) {
        return (
          <Option key={item.text} value={item.text} query={item.text}>
            {item.el}
          </Option>
        )
      } else {
        return (
          <Option key={item} value={item} query={item}>
            {item}
          </Option>
        )
      }
    })

    let goodDefault = false
    menu.items.forEach(item => {
      if (defaultValue === item || defaultValue === item.text) {
        goodDefault = true
      }
    })
    const defaultValueProp = goodDefault
      ? {
          defaultValue
        }
      : {}

    let popupContainer = null
    switch (mount) {
      case 'parent':
        popupContainer = triggerNode => triggerNode.parentNode
        break
      case 'page': {
        const page = document.getElementById('page')
        if (page) popupContainer = () => page
        break
      }
      default:
        popupContainer = null
    }

    return (
      <div className={cn(styles.wrapper, style)}>
        {label ? (
          <div className={cn(styles.label, labelStyle)}>{label}</div>
        ) : null}
        <div className={styles.dropdownInput}>
          <Select
            {...defaultValueProp}
            dropdownClassName={cn(styles.select, style)}
            showSearch
            disabled={disabled}
            placeholder={
              <div className={styles.placeholder}>{placeholder}</div>
            }
            showArrow={false}
            defaultActiveFirstOption={false}
            optionFilterProp='children'
            onSelect={this.onSelect}
            filterOption={(input, option) =>
              option.props.query.toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={''}
            getPopupContainer={popupContainer}
            onDropdownVisibleChange={this.onVisibleChange}
          >
            {options}
          </Select>
          <IconCaretDown className={styles.arrow} />
        </div>
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
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  layout: PropTypes.oneOf(['horizontal', 'vertical']),
  variant: PropTypes.oneOf(['default', 'alternative']),
  disabled: PropTypes.bool,
  mount: PropTypes.oneOf(['parent', 'page', 'body']),
  isRequired: PropTypes.bool,
  error: PropTypes.bool,
  onSelect: PropTypes.func
}

DropdownInput.defaultProps = {
  placeholder: 'Input',
  defaultValue: '',
  menu: {
    items: ['Alternative', 'Blues', 'Classical', 'Electronic', 'Hip-Hop']
  },
  label: '',
  size: 'medium',
  layout: 'vertical',
  variant: 'default',
  disabled: false,
  mount: 'page',
  isRequired: false,
  error: false,
  onSelect: () => {}
}

export default DropdownInput
