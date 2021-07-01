import React, { useState, useEffect } from 'react'

import AntTooltip from 'antd/lib/tooltip'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './Tooltip.module.css'

export const Tooltip = props => {
  const [hideTooltip, setHideTooltip] = useState(false)
  useEffect(() => {
    if (hideTooltip) {
      const hideTooltipTimeout = setTimeout(() => {
        setHideTooltip(false)
      }, 2500)
      return () => clearTimeout(hideTooltipTimeout)
    }
  }, [hideTooltip])

  const {
    mount,
    text,
    placement,
    children,
    disabled,
    mouseEnterDelay,
    mouseLeaveDelay,
    shouldWrapContent,
    className,
    shouldDismissOnClick
  } = props

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

  const visibleProps = disabled || hideTooltip ? { visible: false } : {}

  return (
    <AntTooltip
      {...visibleProps}
      placement={placement}
      title={text}
      getPopupContainer={popupContainer}
      overlayClassName={cn(styles.tooltip, className, {
        [styles.nonWrappingTooltip]: !shouldWrapContent
      })}
      mouseEnterDelay={mouseEnterDelay}
      mouseLeaveDelay={mouseLeaveDelay}
      onClick={() => shouldDismissOnClick && setHideTooltip(true)}
    >
      {children}
    </AntTooltip>
  )
}

Tooltip.propTypes = {
  // Background color can be changed by overriding
  // `--tooltip-background-color` CSS variable
  className: PropTypes.string,
  // Text to appear in tooltip
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  // Whether the tooltip gets mounted.
  mount: PropTypes.oneOf(['parent', 'page', 'body']),
  // determines if it should display.
  disabled: PropTypes.bool,
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
  // Whether there is a fixed max width, causing
  // content to wrap onto the next line.
  shouldWrapContent: PropTypes.bool,
  mouseEnterDelay: PropTypes.number,
  mouseLeaveDelay: PropTypes.number,
  shouldDismissOnClick: PropTypes.bool,
  children: PropTypes.node
}

Tooltip.defaultProps = {
  text: '',
  disabled: false,
  mount: 'page',
  placement: 'top',
  mouseEnterDelay: 0.5,
  mouseLeaveDelay: 0,
  shouldWrapContent: true,
  shouldDismissOnClick: true
}

export default Tooltip
