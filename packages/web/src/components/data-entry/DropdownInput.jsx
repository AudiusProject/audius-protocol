import { useState } from 'react'

import { IconCaretDown } from '@audius/harmony'
import Select from 'antd/lib/select'
import cn from 'classnames'

import styles from './DropdownInput.module.css'
import { HelperText } from './HelperText'

const Option = Select.Option

const DropdownInput = ({
  'aria-label': ariaLabel,
  menu = {
    items: ['Alternative', 'Blues', 'Classical', 'Electronic', 'Hip-Hop']
  },
  defaultValue = '',
  label = '',
  labelStyle,
  dropdownStyle,
  dropdownInputStyle,
  mount = 'page',
  layout = 'vertical',
  size = 'medium',
  variant = 'default',
  disabled = false,
  isRequired = false,
  error = false,
  id,
  focused: focusedProp,
  popupContainer: popupContainerProp,
  footer,
  helperText,
  placeholder: placeholderProp = 'Input',
  onSelect = () => {},
  ...other
}) => {
  const [internalFocused, setInternalFocused] = useState(false)

  const focused = focusedProp !== undefined ? focusedProp : internalFocused

  const handleVisibleChange = (visible) => {
    setInternalFocused(visible)
  }

  const handleSelect = (value) => {
    setInternalFocused(false)
    onSelect(value)
  }

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
          placeholder={<div className={styles.placeholder}>{placeholder}</div>}
          showArrow={true}
          suffixIcon={<IconCaretDown size='xs' className={styles.arrow} />}
          defaultActiveFirstOption={false}
          optionFilterProp='children'
          onSelect={handleSelect}
          filterOption={(input, option) =>
            option.props.query?.toLowerCase().includes(input.toLowerCase())
          }
          notFoundContent={''}
          getPopupContainer={popupContainer}
          onDropdownVisibleChange={handleVisibleChange}
          {...other}
        >
          {options}
        </Select>
      </div>
      {helperText ? <HelperText error={error}>{helperText}</HelperText> : null}
    </div>
  )
}

export default DropdownInput
