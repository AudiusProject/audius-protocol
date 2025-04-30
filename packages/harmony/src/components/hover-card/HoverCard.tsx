import { useRef, useCallback, memo } from 'react'

import { Flex, Paper, Popup } from '..'
import { useHoverDelay } from '../../hooks/useHoverDelay'
import { Origin } from '../popup/types'

import { HoverCardProps } from './types'

const DEFAULT_ANCHOR_ORIGIN: Origin = {
  horizontal: 'right',
  vertical: 'center'
}

const DEFAULT_TRANSFORM_ORIGIN: Origin = {
  horizontal: 'left',
  vertical: 'center'
}

/**
 * HoverCard is a component that displays content in a hover card/tooltip
 * with a Paper container when the user hovers over the component's children.
 *
 * The hover card appears to the right of the child element and disappears when
 * the user's mouse leaves either the trigger or the card.
 *
 * @example
 * ```tsx
 * <HoverCard
 *   content={
 *     <>
 *       <SomeHeader />
 *       <SomeBody />
 *     </>
 *   }
 * >
 *   <Text>Hover over me</Text>
 * </HoverCard>
 * ```
 */
const HoverCardComponent = ({
  children,
  className,
  content,
  onClose,
  onClick,
  anchorOrigin = DEFAULT_ANCHOR_ORIGIN,
  transformOrigin = DEFAULT_TRANSFORM_ORIGIN,
  mouseEnterDelay = 0.5
}: HoverCardProps) => {
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const {
    isHovered,
    handleMouseEnter,
    handleMouseLeave,
    clearTimer,
    setIsHovered
  } = useHoverDelay(mouseEnterDelay)

  const handleClose = useCallback(() => {
    clearTimer()
    onClose?.()
  }, [clearTimer, onClose])

  const handleClick = useCallback(() => {
    onClick?.()
    clearTimer()
    setIsHovered(false)
  }, [onClick, clearTimer, setIsHovered])

  return (
    <Flex
      ref={anchorRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      <Popup
        shadow='near'
        anchorRef={anchorRef}
        isVisible={isHovered}
        onClose={handleClose}
        dismissOnMouseLeave
        hideCloseButton
        zIndex={30000}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
      >
        <Paper
          className={className}
          borderRadius='m'
          backgroundColor='white'
          direction='column'
          onClick={handleClick}
        >
          {content}
        </Paper>
      </Popup>
    </Flex>
  )
}

export const HoverCard = memo(HoverCardComponent)
