import { Component } from 'react'

import Select from 'antd/lib/select'
import cn from 'classnames'

import IconCaretDown from 'assets/img/iconCaretDown.svg'

import styles from './DropdownInput.module.css'
import { HelperText } from './HelperText'

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
      mount,
      layout,
      size,
      variant,
      disabled,
      isRequired,
      error,
      id,
      focused = this.state.focused,
      popupContainer: popupContainerProp,
      footer,
      helperText,
      placeholder: placeholderProp,
      onSelect: ignoredonSelect,
      ...other
    } = this.props
    const placeholder =
      isRequired && placeholderProp ? `${placeholderProp}*` : placeholderProp

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

    let popupContainer = popupContainerProp ?? null
    switch (mount) {
      case 'parent':
        popupContainer = (triggerNode) => triggerNode.parentNode
        break
      case 'page': {
        const page = document.getElementById('page')
        if (page) popupContainer = () => page
        break
      }
      default:
        popupContainer = popupContainerProp ?? null
    }

    return (
      <div className={cn(styles.wrapper, style)}>
        {label ? (
          <label htmlFor={id} className={cn(styles.label, labelStyle)}>
            {label}
          </label>
        ) : null}
        <div className={cn(styles.dropdownInput, dropdownInputStyle)}>
          <Select
            {...defaultValueProp}
            id={id}
            aria-label={ariaLabel}
            dropdownClassName={cn(styles.select, dropdownStyle, style)}
            showSearch
            disabled={disabled}
            placeholder={
              <div className={styles.placeholder}>{placeholder}</div>
            }
            showArrow={true}
            suffixIcon={<IconCaretDown className={styles.arrow} />}
            defaultActiveFirstOption={false}
            optionFilterProp='children'
            onSelect={this.onSelect}
            filterOption={(input, option) =>
              option.props.query?.toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={''}
            getPopupContainer={popupContainer}
            onVisibleChange={this.onVisibleChange}
            {...other}
          >
            {options}
          </Select>
        </div>
        {helperText ? (
          <HelperText error={error}>{helperText}</HelperText>
        ) : null}
      </div>
    )
  }
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
