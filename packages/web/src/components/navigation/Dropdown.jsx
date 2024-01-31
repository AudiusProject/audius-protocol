import { Component } from 'react'

import { IconCaretDown } from '@audius/harmony'
import AntDropdown from 'antd/lib/dropdown'
import AntMenu from 'antd/lib/menu'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './Dropdown.module.css'

class Dropdown extends Component {
  state = {
    index: this.props.defaultIndex || 0,
    focused: false
  }

  onVisibleChange = (visible) => {
    this.setState({
      focused: visible
    })
  }

  onClick = (index, callback) => {
    this.setState({ index, focused: false })
    if (callback) callback()
    this.props.onSelect(this.props.menu.items[index].text)
    this.props.onSelectIndex(index)
  }

  render() {
    const {
      size,
      variant,
      label,
      error,
      disabled,
      menu,
      textClassName,
      focused = this.state.focused,
      index = this.state.index
    } = this.props

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
                this.onClick(i, item.onClick)
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
            onVisibleChange={this.onVisibleChange}
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
  defaultIndex: PropTypes.number
}

Dropdown.defaultProps = {
  size: 'small',
  variant: 'shadow',
  label: '',
  disabled: false,
  error: false,
  menu: {
    items: []
  },
  onSelect: () => {},
  onSelectIndex: () => {}
}

export default Dropdown
