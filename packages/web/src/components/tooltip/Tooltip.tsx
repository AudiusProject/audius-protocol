import { useState, useCallback, useRef, CSSProperties } from 'react'

import { Text } from '@audius/harmony'
import { useTheme } from '@emotion/react'
import AntTooltip from 'antd/lib/tooltip'
import cn from 'classnames'

import styles from './Tooltip.module.css'
import { TooltipProps } from './types'

export const Tooltip = ({
  children,
  className = '',
  color = 'secondary',
  disabled = false,
  mount = 'parent',
  getPopupContainer,
  mouseEnterDelay = 0.5,
  mouseLeaveDelay = 0,
  placement = 'top',
  shouldDismissOnClick = true,
  shouldWrapContent = true,
  text = ''
}: TooltipProps) => {
  // Keep track of a hidden state ourselves so we can dismiss the tooltip on click
  const [isHiddenOverride, setIsHiddenOverride] = useState(false)

  const theme = useTheme()

  const themedColor =
    color === 'primary'
      ? theme.color.secondary.secondary
      : color === 'white'
        ? theme.color.special.white
        : theme.color.secondary.secondary

  // Keep track of whether we are hovering over the tooltip to know when to
  // allow it to become visible again
  const mousedOver = useRef(false)

  const onClick = useCallback(() => {
    if (shouldDismissOnClick) {
      setIsHiddenOverride(true)
    }
  }, [shouldDismissOnClick, setIsHiddenOverride])

  const onMouseOut = useCallback(() => {
    mousedOver.current = false
    // Reset the hidden override if we are mousing
    // out from the tooltip so that it can be used to
    // hide the tooltip on the next hover.
    setIsHiddenOverride(false)
  }, [mousedOver, setIsHiddenOverride])

  const onMouseOver = useCallback(() => {
    mousedOver.current = true
  }, [mousedOver])

  const onVisibleChange = useCallback(
    (visible: boolean) => {
      // Reset the hidden override if we are becoming invisible or
      // the mouse is not overtop the tooltip
      if (!visible || !mousedOver.current) {
        setIsHiddenOverride(false)
      }
    },
    [setIsHiddenOverride]
  )

  let popupContainer
  const page =
    typeof document !== 'undefined' ? document.getElementById('page') : null
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

  // Keep track of visibility to override antd's native visibility.
  // Use an empty object when visible as to not trigger the antd component to update
  const visibleProps = disabled || isHiddenOverride ? { visible: false } : {}
  // Use a css property so that when we change visibility on click the tooltip
  // immediately disappears instead of animating out.
  const overlayStyle = {
    visibility: isHiddenOverride ? 'hidden' : 'visible'
  } as CSSProperties

  if (disabled) return <>{children}</>

  return (
    <AntTooltip
      {...visibleProps}
      overlayStyle={overlayStyle}
      placement={placement}
      title={
        <Text color='white' lineHeight='single'>
          {text}
        </Text>
      }
      color={themedColor}
      // @ts-ignore
      getPopupContainer={getPopupContainer || popupContainer}
      overlayClassName={cn(styles.tooltip, className, {
        [styles.nonWrappingTooltip]: !shouldWrapContent
      })}
      mouseEnterDelay={mouseEnterDelay}
      mouseLeaveDelay={mouseLeaveDelay}
      onClick={onClick}
      onMouseOut={onMouseOut}
      onMouseOver={onMouseOver}
      onVisibleChange={onVisibleChange}
    >
      {children}
    </AntTooltip>
  )
}

export default Tooltip
