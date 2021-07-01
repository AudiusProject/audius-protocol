import React, { Component } from 'react'

import AntMenu from 'antd/lib/menu'
import AntTooltip from 'antd/lib/tooltip'
import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconCaretRight } from 'assets/img/iconCaretRight.svg'
import Toast from 'components/toast/Toast'

import styles from './CascadingMenu.module.css'

const SHARE_TIMEOUT = 1500

class CascadingMenu extends Component {
  state = {
    isMenuOpen: false
  }

  onToggleMenuVisibility = ({ domEvent }) => {
    domEvent.stopPropagation()
    setTimeout(() => this.props.onClose(), 200)
    this.setState({ isMenuOpen: !this.state.isMenuOpen })
  }

  onVisibilityChange = visibility => {
    this.setState({ isMenuOpen: visibility })
    if (visibility) {
      const { scrollRef } = this.props
      if (scrollRef && scrollRef.current) {
        const hideMenu = () => this.setState({ isMenuOpen: false })
        scrollRef.current.addEventListener('scroll', hideMenu)
        this.setState({ hideMenu })
      }
    } else {
      const { scrollRef } = this.props
      const { hideMenu } = this.state
      if (scrollRef && scrollRef.current && hideMenu) {
        scrollRef.current.removeEventListener('scroll', hideMenu)
      }
      setTimeout(() => this.props.onClose(), 200)
    }
  }

  menuItem = (index, item) => {
    const { itemStyle, mount } = this.props
    return (
      <AntMenu.Item key={item.text + index}>
        <div
          onClick={item.onClick}
          className={cn(styles.itemWrapper, { [itemStyle]: !!itemStyle })}
        >
          <Toast
            text={item.toastText}
            disabled={!item.showToast}
            delay={SHARE_TIMEOUT}
            mount={mount}
            placement='left'
          >
            {item.text}
          </Toast>
        </div>
      </AntMenu.Item>
    )
  }

  getPopupContainer = () => {
    const { getContainer, mount } = this.props
    if (getContainer) return getContainer
    switch (mount) {
      case 'parent':
        return triggerNode => triggerNode.parentNode
      case 'page': {
        const page = document.getElementById('page')
        if (page) return () => page
        return null
      }
      default:
        return null
    }
  }

  render() {
    const {
      dropdownStyle,
      placement,
      autoAdjustOverflow,
      className
    } = this.props
    const { isMenuOpen } = this.state
    const overlay = (
      <AntMenu
        // This is a nasty hack to make the animation a bit more fluid.
        // Normally, this defaults to 0.1, which feels slow. Changing it to 0
        // actually won't let you hover over the submenu item because it disappears
        // immediately.
        openAnimation={'slide-up'}
        subMenuCloseDelay={0.01}
        subMenuOpenDelay={0.17}
        selectable={false}
        onClick={this.onToggleMenuVisibility}
      >
        {this.props.menu.items.map((item, i) => {
          if (item.subItems) {
            return (
              <AntMenu.SubMenu
                className={cn(styles.subMenu, { [styles.hide]: !isMenuOpen })}
                key={item.text}
                title={
                  <div className={styles.subMenuTitle}>
                    <div>{item.text}</div>
                    <IconCaretRight className={styles.iconCaretRight} />
                  </div>
                }
              >
                {item.subItems.map((item, i) => {
                  return this.menuItem(i, item)
                })}
              </AntMenu.SubMenu>
            )
          } else {
            return this.menuItem(i, item)
          }
        })}
      </AntMenu>
    )

    const popupContainer = this.getPopupContainer()
    return (
      <div
        className={cn(styles.dropdownContainer, {
          [className]: !!className
        })}
        onMouseMove={e => e.preventDefault()}
      >
        <AntTooltip
          overlay={overlay}
          trigger={['click']}
          autoAdjustOverflow={autoAdjustOverflow}
          overlayClassName={cn(styles.dropdown, {
            [dropdownStyle]: !!dropdownStyle
          })}
          placement={placement}
          getPopupContainer={popupContainer}
          visible={isMenuOpen}
          onVisibleChange={this.onVisibilityChange}
        >
          {this.props.children}
        </AntTooltip>
      </div>
    )
  }
}

CascadingMenu.propTypes = {
  className: PropTypes.string,
  menu: PropTypes.object,
  placement: PropTypes.oneOf([
    'top',
    'left',
    'right',
    'bottom',
    'topLeft',
    'topRight',
    'bottomLeft',
    'bottomRight',
    'leftTop',
    'leftBottom',
    'rightTop',
    'rightBottom'
  ]),
  children: PropTypes.object,
  mount: PropTypes.oneOf(['parent', 'page', 'body']),
  itemStyle: PropTypes.string,
  getContainer: PropTypes.func,
  onClose: PropTypes.func
}

CascadingMenu.defaultProps = {
  placement: 'rightTop',
  autoAdjustOverflow: true,
  menu: {
    items: [
      {
        text: 'one',
        onClick: () => {},
        subItems: [
          {
            text: 'one one',
            onClick: () => {}
          },
          {
            text: 'one two',
            onClick: () => {}
          }
        ]
      },
      {
        text: 'two',
        onClick: () => {},
        subItems: [
          {
            text: 'two one',
            onClick: () => {}
          },
          {
            text: 'two two',
            onClick: () => {}
          }
        ]
      },
      {
        text: 'three',
        onClick: () => {}
      }
    ]
  },
  children: <div>CascadingMenu</div>,
  mount: 'parent',
  onClose: () => {}
}

export default CascadingMenu
