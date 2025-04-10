import { useRef, useState } from 'react'

import { Flex, Paper, Popup } from '..'
import { Origin } from '../popup/types'

import { FlairHoverCardProps } from './types'

const DEFAULT_ANCHOR_ORIGIN: Origin = {
  horizontal: 'right',
  vertical: 'center'
}

const DEFAULT_TRANSFORM_ORIGIN: Origin = {
  horizontal: 'left',
  vertical: 'center'
}

/**
 * FlairHoverCard is a component that displays content in a hover card/tooltip
 * with a Paper container when the user hovers over the component's children.
 *
 * The hover card appears to the right of the child element and disappears when
 * the user's mouse leaves either the trigger or the card.
 *
 * @example
 * ```tsx
 * <FlairHoverCard
 *   content={
 *     <>
 *       <SomeHeader />
 *       <SomeBody />
 *     </>
 *   }
 * >
 *   <Text>Hover over me</Text>
 * </FlairHoverCard>
 * ```
 */
export const FlairHoverCard = ({
  children,
  className,
  content,
  onClose,
  onClick,
  anchorOrigin = DEFAULT_ANCHOR_ORIGIN,
  transformOrigin = DEFAULT_TRANSFORM_ORIGIN
}: FlairHoverCardProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const anchorRef = useRef<HTMLDivElement | null>(null)

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const handleClose = () => {
    setIsHovered(false)
    if (onClose) onClose()
  }

  return (
    <Flex
      ref={anchorRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <Popup
        anchorRef={anchorRef}
        isVisible={isHovered}
        onClose={handleClose}
        dismissOnMouseLeave
        hideCloseButton
        zIndex={30000} // Using tooltip z-index
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
      >
        <Paper
          className={className}
          borderRadius='m'
          backgroundColor='white'
          direction='column'
          onClick={onClick}
        >
          {content}
        </Paper>
      </Popup>
    </Flex>
  )
}
