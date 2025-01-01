import { useState } from 'react'

import { IconCaretDown } from '@audius/harmony'
import AntDropdown from 'antd/lib/dropdown'
import AntMenu from 'antd/lib/menu'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './Dropdown.module.css'

const Dropdown = ({
  size = 'small',
  variant = 'shadow',
  label = '',
  disabled = false,
  error = false,
  menu,
  onSelect,
  onSelectIndex,
  defaultIndex = 0,
  textClassName,
  focused: focusedProp
}) => {
  const [internalIndex, setInternalIndex] = useState(defaultIndex)
  const [internalFocused, setInternalFocused] = useState(false)

  const index = defaultIndex !== undefined ? defaultIndex : internalIndex
  const focused = focusedProp !== undefined ? focusedProp : internalFocused

  const handleVisibleChange = (visible) => {
    setInternalFocused(visible)
  }

  const handleClick = (clickedIndex, callback) => {
    setInternalIndex(clickedIndex)
    setInternalFocused(false)
    if (callback) callback()
    onSelect?.(menu?.items[clickedIndex]?.text)
    onSelectIndex?.(clickedIndex)
  }

  const style = {
    [styles.large]: size === 'large',
    [styles.medium]: size === 'medium',
    [styles.small]: size === 'small',
    [styles.focused]: focused,
    [styles.disabled]: disabled,
    [styles.error]: error,
    [styles.shadow]: variant === 'shadow',
    [styles.border]: variant === 'border'
  }

  const overlay = (
    <AntMenu>
      {menu.items.map((item, i) => (
        <AntMenu.Item key={`${item.text}_${i}`}>
          <div
            onClick={() => {
              handleClick(i, item.onClick)
            }}
            className={cn(textClassName)}
          >
            {item.text}
          </div>
        </AntMenu.Item>
      ))}
    </AntMenu>
  )

  const selection = menu.items.length > 0 ? menu.items[index].text : null

  return (
    <div className={styles.wrapper}>
      {label ? <div className={styles.label}>{label}</div> : null}
      <div className={cn(styles.dropdown, style)}>
        <AntDropdown
          overlay={overlay}
          trigger={['click']}
          disabled={disabled}
          onVisibleChange={handleVisibleChange}
          // Mount the dropdown inside the dropdown div.
          getPopupContainer={(trigger) => trigger.parentNode}
        >
          <div className={styles.selector}>
            <div className={cn(styles.selectorText, textClassName)}>
              {selection}
            </div>
            <IconCaretDown className={styles.iconCaret} />
          </div>
        </AntDropdown>
      </div>
    </div>
  )
}

Dropdown.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['shadow', 'border']),
  label: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  menu: PropTypes.object,
  onSelect: PropTypes.func,
  onSelectIndex: PropTypes.func,
  defaultIndex: PropTypes.number,
  focused: PropTypes.bool
}

export default Dropdown
