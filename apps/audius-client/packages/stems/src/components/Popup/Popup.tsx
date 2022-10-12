import {
  forwardRef,
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import * as React from 'react'

import cn from 'classnames'
import ReactDOM from 'react-dom'
import { useTransition, animated } from 'react-spring'

import { IconButton } from 'components/IconButton'
import { IconRemove } from 'components/Icons'
import { useClickOutside } from 'hooks/useClickOutside'
import { getScrollParent } from 'utils/scrollParent'
import { standard } from 'utils/transitions'

import styles from './Popup.module.css'
import { PopupProps, Position, popupDefaultProps } from './types'

const messages = {
  close: 'close popup'
}

/**
 * Number of pixels between the edge of the container and the popup
 * before the popup needs to reposition itself to be in view.
 */
const CONTAINER_INSET_PADDING = 16

/**
 * Gets the css transform origin prop from the display position
 * @param {Position} position
 * @returns {string} transform origin
 */
const getTransformOrigin = (position: Position) =>
  ({
    [Position.TOP_LEFT]: 'bottom right',
    [Position.TOP_CENTER]: 'bottom center',
    [Position.TOP_RIGHT]: 'bottom left',
    [Position.BOTTOM_LEFT]: 'top right',
    [Position.BOTTOM_CENTER]: 'top center',
    [Position.BOTTOM_RIGHT]: 'top left'
  }[position] ?? 'top center')

/**
 * Figures out whether the specified position would overflow the window
 * and picks a better position accordingly
 * @param {Position} position
 * @param {ClientRect} rect the content
 * @param {ClientRect} wrapper the wrapper of the content
 * @return {string | null} null if it would not overflow
 */
const getComputedPosition = (
  position: Position,
  anchorRect: DOMRect,
  wrapperRect: DOMRect,
  containerRef?: MutableRefObject<HTMLDivElement | undefined>
): Position => {
  if (!anchorRect || !wrapperRect) return position

  let containerWidth, containerHeight
  if (containerRef && containerRef.current) {
    containerWidth =
      containerRef.current.getBoundingClientRect().width -
      CONTAINER_INSET_PADDING
    containerHeight =
      containerRef.current.getBoundingClientRect().height -
      CONTAINER_INSET_PADDING
  } else {
    containerWidth = window.innerWidth - CONTAINER_INSET_PADDING
    containerHeight = window.innerHeight - CONTAINER_INSET_PADDING
  }

  const overflowRight = anchorRect.x + wrapperRect.width > containerWidth
  const overflowLeft = anchorRect.x - wrapperRect.width < 0
  const overflowBottom = anchorRect.y + wrapperRect.height > containerHeight
  const overflowTop = anchorRect.y - wrapperRect.height < 0

  if (overflowRight) {
    position = position.replace('Right', 'Left') as Position
  }
  if (overflowLeft) {
    position = position.replace('Left', 'Right') as Position
  }
  if (overflowTop) {
    position = position.replace('top', 'bottom') as Position
  }
  if (overflowBottom) {
    position = position.replace('bottom', 'top') as Position
  }
  return position
}

/**
 * Figures out whether the specified position would still overflow the window
 * after being computed and adds extra offsets
 */
const getAdjustedPosition = (
  top: number,
  left: number,
  wrapperRect: DOMRect
): { adjustedTop: number; adjustedLeft: number } => {
  if (!wrapperRect) return { adjustedTop: 0, adjustedLeft: 0 }

  const containerWidth = window.innerWidth - CONTAINER_INSET_PADDING
  const containerHeight = window.innerHeight - CONTAINER_INSET_PADDING

  const overflowRight = left + wrapperRect.width > containerWidth
  const overflowLeft = left < 0
  const overflowBottom = top + wrapperRect.height > containerHeight
  const overflowTop = top < 0

  const adjusted = { adjustedTop: 0, adjustedLeft: 0 }
  if (overflowRight) {
    adjusted.adjustedLeft =
      adjusted.adjustedLeft - (left + wrapperRect.width - containerWidth)
  }
  if (overflowLeft) {
    adjusted.adjustedLeft = adjusted.adjustedLeft + wrapperRect.width
  }
  if (overflowTop) {
    adjusted.adjustedTop =
      adjusted.adjustedTop - (top + wrapperRect.height - containerHeight)
  }
  if (overflowBottom) {
    adjusted.adjustedTop = adjusted.adjustedTop + wrapperRect.height
  }
  return adjusted
}

/**
 * A popup is an in-place container that shows on top of the UI. A popup does
 * not impact the rest of the UI (e.g. graying it out). It differs
 * from modals, which do take over the whole UI and are usually
 * center-screened.
 */
export const Popup = forwardRef<HTMLDivElement, PopupProps>(function Popup(
  {
    anchorRef,
    animationDuration,
    checkIfClickInside,
    children,
    isVisible,
    onAfterClose,
    onClose,
    position = Position.BOTTOM_CENTER,
    showHeader,
    title,
    className,
    wrapperClassName,
    zIndex,
    containerRef
  },
  ref
) {
  const handleClose = useCallback(() => {
    onClose()
    setTimeout(() => {
      if (onAfterClose) {
        onAfterClose()
      }
    }, animationDuration)
  }, [onClose, onAfterClose, animationDuration])

  const popupRef: React.MutableRefObject<HTMLDivElement> = useClickOutside(
    handleClose,
    checkIfClickInside,
    isVisible,
    typeof ref === 'function' ? undefined : ref
  )

  const wrapperRef = useRef<HTMLDivElement>(null)
  const originalTopPosition = useRef<number>(0)
  const [computedPosition, setComputedPosition] = useState(position)

  const getRects = useCallback(
    () =>
      [anchorRef, wrapperRef].map((r) => r?.current?.getBoundingClientRect()),
    [anchorRef, wrapperRef]
  )

  // On visible, set the position
  useEffect(() => {
    if (isVisible) {
      const [anchorRect, wrapperRect] = getRects()
      if (!anchorRect || !wrapperRect) return

      const computed = getComputedPosition(
        position,
        anchorRect,
        wrapperRect,
        containerRef
      )
      setComputedPosition(computed)

      const positionMap = {
        [Position.TOP_LEFT]: [
          anchorRect.y - wrapperRect.height,
          anchorRect.x - wrapperRect.width
        ],
        [Position.TOP_CENTER]: [
          anchorRect.y - wrapperRect.height,
          anchorRect.x - wrapperRect.width / 2 + anchorRect.width / 2
        ],
        [Position.TOP_RIGHT]: [
          anchorRect.y - wrapperRect.height,
          anchorRect.x + anchorRect.width
        ],
        [Position.BOTTOM_LEFT]: [
          anchorRect.y + anchorRect.height,
          anchorRect.x - wrapperRect.width
        ],
        [Position.BOTTOM_CENTER]: [
          anchorRect.y + anchorRect.height,
          anchorRect.x - wrapperRect.width / 2 + anchorRect.width / 2
        ],
        [Position.BOTTOM_RIGHT]: [
          anchorRect.y + anchorRect.height,
          anchorRect.x + anchorRect.width
        ]
      }

      const [top, left] =
        positionMap[computed] ?? positionMap[Position.BOTTOM_CENTER]
      const { adjustedTop, adjustedLeft } = getAdjustedPosition(
        top,
        left,
        wrapperRect
      )

      if (wrapperRef.current) {
        wrapperRef.current.style.top = `${top + adjustedTop}px`
        wrapperRef.current.style.left = `${left + adjustedLeft}px`
      }

      originalTopPosition.current = top
    }
  }, [
    position,
    isVisible,
    wrapperRef,
    anchorRef,
    computedPosition,
    setComputedPosition,
    getRects,
    originalTopPosition,
    containerRef
  ])

  // Callback invoked on each scroll. Uses original top position to scroll with content.
  // Takes scrollParent to get the current scroll position as well as the intitial scroll position
  // when the popup became visible.
  const watchScroll = useCallback(
    (scrollParent, initialScrollPosition) => {
      const scrollTop = scrollParent.scrollTop
      if (wrapperRef.current) {
        wrapperRef.current.style.top = `${
          originalTopPosition.current - scrollTop + initialScrollPosition
        }px`
      }
    },
    [wrapperRef, originalTopPosition]
  )

  // Set up scroll listeners
  useEffect(() => {
    if (isVisible && anchorRef.current) {
      const scrollParent = getScrollParent(anchorRef.current)
      if (!scrollParent) return

      const initialScrollPosition = scrollParent.scrollTop
      const listener = () => watchScroll(scrollParent, initialScrollPosition)
      scrollParent.addEventListener('scroll', listener)
      return () => {
        scrollParent.removeEventListener('scroll', listener)
      }
    }

    return () => {}
  }, [isVisible, watchScroll, anchorRef])

  // Set up key listeners
  useEffect(() => {
    if (isVisible) {
      const escapeListener = (e: KeyboardEvent) => {
        if (e.code === 'Escape') {
          handleClose()
        }
      }

      window.addEventListener('keydown', escapeListener)

      return () => window.removeEventListener('keydown', escapeListener)
    }
    return () => {}
  }, [isVisible, handleClose])

  const transitions = useTransition(isVisible, null, {
    from: {
      transform: `scale(0)`,
      opacity: 0
    },
    enter: {
      transform: `scale(1)`,
      opacity: 1
    },
    leave: {
      transform: `scale(0)`,
      opacity: 0
    },
    config: standard,
    unique: true
  })

  const wrapperStyle = zIndex ? { zIndex } : {}

  return (
    <>
      {/* Portal the popup out of the dom structure so that it has a separate stacking context */}
      {ReactDOM.createPortal(
        <div
          ref={wrapperRef}
          className={cn(styles.wrapper, wrapperClassName)}
          style={wrapperStyle}
        >
          {transitions.map(({ item, key, props }) =>
            item ? (
              <animated.div
                className={cn(styles.popup, className)}
                ref={popupRef}
                key={key}
                style={{
                  ...props,
                  transformOrigin: getTransformOrigin(computedPosition)
                }}
              >
                {showHeader && (
                  <div className={styles.header}>
                    <IconButton
                      aria-label={messages.close}
                      onClick={handleClose}
                      icon={<IconRemove className={styles.iconRemove} />}
                    />
                    <div className={styles.title}>{title}</div>
                  </div>
                )}
                {children}
              </animated.div>
            ) : null
          )}
        </div>,
        document.body
      )}
    </>
  )
})

Popup.defaultProps = popupDefaultProps
