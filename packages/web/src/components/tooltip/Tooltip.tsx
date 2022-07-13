import { useState, useEffect } from 'react'

import AntTooltip from 'antd/lib/tooltip'
import cn from 'classnames'

import { getCurrentThemeColors } from 'utils/theme/theme'

import styles from './Tooltip.module.css'
import { TooltipProps } from './types'

const themeColors = getCurrentThemeColors()

export const Tooltip = ({
  children,
  className = '',
  color = themeColors['--secondary-transparent'],
  disabled = false,
  mount = 'parent',
  mouseEnterDelay = 0.5,
  mouseLeaveDelay = 0,
  placement = 'top',
  shouldDismissOnClick = true,
  shouldWrapContent = true,
  text = ''
}: TooltipProps) => {
  const [hideTooltip, setHideTooltip] = useState(false)

  useEffect(() => {
    if (hideTooltip) {
      const hideTooltipTimeout = setTimeout(() => {
        setHideTooltip(false)
      }, 2500)
      return () => clearTimeout(hideTooltipTimeout)
    }
  }, [hideTooltip])

  let popupContainer
  const page = document.getElementById('page')
  switch (mount) {
    case 'parent':
      popupContainer = (triggerNode: HTMLElement) =>
        triggerNode.parentNode ?? page
      break
    case 'page': {
      if (page) popupContainer = () => page
      break
    }
  }

  const visibleProps = disabled || hideTooltip ? { visible: false } : {}

  return (
    <AntTooltip
      {...visibleProps}
      placement={placement}
      title={text}
      color={color}
      // @ts-ignore
      getPopupContainer={popupContainer}
      overlayClassName={cn(styles.tooltip, className, {
        [styles.nonWrappingTooltip]: !shouldWrapContent
      })}
      mouseEnterDelay={mouseEnterDelay}
      mouseLeaveDelay={mouseLeaveDelay}
      onClick={() => shouldDismissOnClick && setHideTooltip(true)}>
      {children}
    </AntTooltip>
  )
}

export default Tooltip
