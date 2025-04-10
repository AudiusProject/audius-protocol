import { ReactNode, useRef, useState } from 'react'

import { Paper, Popup } from '..'

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
  onClose
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
    <div
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
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'center'
        }}
        transformOrigin={{
          horizontal: 'left',
          vertical: 'center'
        }}
      >
        <Paper
          className={className}
          borderRadius='m'
          backgroundColor='white'
          direction='column'
        >
          {content}
        </Paper>
      </Popup>
    </div>
  )
}

export type FlairHoverCardProps = {
  /**
   * Content displayed as the hover trigger
   */
  children: ReactNode

  /**
   * Content displayed inside the hover card
   */
  content: ReactNode

  /**
   * Optional CSS class name
   */
  className?: string

  /**
   * Callback fired when the hover card is closed
   */
  onClose?: () => void
}
