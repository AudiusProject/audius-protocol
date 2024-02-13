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
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { useTransition, animated } from 'react-spring'

import { IconButton } from 'components/IconButton'
import { IconRemove } from 'components/Icons'
import { useClickOutside } from 'hooks/useClickOutside'
import { getScrollParent } from 'utils/scrollParent'
import { standard } from 'utils/transitions'

import styles from './Popup.module.css'
import { PopupProps, Position, Origin } from './types'

const messages = {
  close: 'close popup'
}

/**
 * Number of pixels between the edge of the container and the popup
 * before the popup needs to reposition itself to be in view.
 */
const CONTAINER_INSET_PADDING = 16

/**
 * Used to convert deprecated Position prop to transformOrigin prop
 */
const positionToTransformOriginMap: Record<Position, Origin> = {
  [Position.TOP_LEFT]: {
    horizontal: 'right',
    vertical: 'bottom'
  },
  [Position.TOP_CENTER]: {
    horizontal: 'center',
    vertical: 'bottom'
  },
  [Position.TOP_RIGHT]: {
    horizontal: 'left',
    vertical: 'bottom'
  },
  [Position.BOTTOM_LEFT]: {
    horizontal: 'right',
    vertical: 'top'
  },
  [Position.BOTTOM_CENTER]: {
    horizontal: 'center',
    vertical: 'top'
  },
  [Position.BOTTOM_RIGHT]: {
    horizontal: 'left',
    vertical: 'top'
  }
}

/**
 * Used to convert deprecated Position prop to anchorOrigin prop
 */
const positionToAnchorOriginMap: Record<Position, Origin> = {
  [Position.TOP_LEFT]: {
    horizontal: 'left',
    vertical: 'top'
  },
  [Position.TOP_CENTER]: {
    horizontal: 'center',
    vertical: 'top'
  },
  [Position.TOP_RIGHT]: {
    horizontal: 'right',
    vertical: 'top'
  },
  [Position.BOTTOM_LEFT]: {
    horizontal: 'left',
    vertical: 'bottom'
  },
  [Position.BOTTOM_CENTER]: {
    horizontal: 'center',
    vertical: 'bottom'
  },
  [Position.BOTTOM_RIGHT]: {
    horizontal: 'right',
    vertical: 'bottom'
  }
}

/**
 * Figures out whether the specified position would overflow the window
 * and picks a better position accordingly
 * @param {Origin} anchorOrigin where the origin is on the trigger
 * @param {Origin} transformOrigin where the origin is on the popup
 * @param {DOMRect} anchorRect the position and size of the trigger
 * @param {DOMRect} wrapperRect the position and size of the popup
 * @return {{ anchorOrigin: Origin, transformOrigin: Origin }} the new origin after accounting for overflow
 */
const getComputedOrigins = (
  anchorOrigin: Origin,
  transformOrigin: Origin,
  anchorRect: DOMRect,
  wrapperRect: DOMRect,
  containerRef?: MutableRefObject<HTMLDivElement | undefined>
) => {
  if (!anchorRect || !wrapperRect) return { anchorOrigin, transformOrigin }

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

  // Get new wrapper position
  const anchorTranslation = getOriginTranslation(anchorOrigin, anchorRect)
  const wrapperTranslation = getOriginTranslation(transformOrigin, wrapperRect)
  const wrapperX = anchorRect.x + anchorTranslation.x - wrapperTranslation.x
  const wrapperY = anchorRect.y + anchorTranslation.y - wrapperTranslation.y

  // Check bounds of the wrapper in new position are inside container
  const overflowRight = wrapperX + wrapperRect.width > containerWidth
  const overflowLeft = wrapperX < 0
  const overflowBottom = wrapperY + wrapperRect.height > containerHeight
  const overflowTop = wrapperY < 0

  // For all overflows, flip the position
  if (overflowRight) {
    anchorOrigin.horizontal = 'left'
    transformOrigin.horizontal = 'right'
  }
  if (overflowLeft) {
    anchorOrigin.horizontal = 'right'
    transformOrigin.horizontal = 'left'
  }
  if (overflowTop) {
    anchorOrigin.vertical = 'bottom'
    transformOrigin.vertical = 'top'
  }
  if (overflowBottom) {
    anchorOrigin.vertical = 'top'
    transformOrigin.vertical = 'bottom'
  }
  return { anchorOrigin, transformOrigin }
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
 * Gets the x, y offsets for the given origin using the dimensions
 * @param origin the relative origin
 * @param dimensions the dimensions to use with the relative origin
 * @returns the x and y coordinates of the new origin relative to the old one
 */
const getOriginTranslation = (
  origin: Origin,
  dimensions: { width: number; height: number }
) => {
  let x = 0
  let y = 0
  const { width, height } = dimensions
  if (origin.horizontal === 'center') {
    x += width / 2
  } else if (origin.horizontal === 'right') {
    x += width
  }
  if (origin.vertical === 'center') {
    y += height / 2
  } else if (origin.vertical === 'bottom') {
    y += height
  }
  return { x, y }
}

const defaultAnchorOrigin: Origin = {
  horizontal: 'center',
  vertical: 'bottom'
}

const defaultTransformOrigin: Origin = {
  horizontal: 'center',
  vertical: 'top'
}

/**
 * @deprecated use `@audius/harmony` Popup instead
 */
export const Popup = forwardRef<HTMLDivElement, PopupProps>(function Popup(
  props,
  ref
) {
  const {
    anchorRef,
    animationDuration = 90,
    checkIfClickInside,
    children,
    isVisible,
    onAfterClose,
    onClose,
    posrition,
    anchorOrigin: anchorOriginProp = defaultAnchorOrigin,
    transformOrigin: transformOriginProp = defaultTransformOrigin,
    dismissOnMouseLeave,
    hideCloseButton = false,
    showHeader,
    title,
    titleClassName,
    className,
    wrapperClassName,
    zIndex,
    containerRef
  } = props
  const [isClientSide, setIsClientSide] = useState(false)

  const handleClose = useCallback(() => {
    onClose()
    setTimeout(() => {
      if (onAfterClose) {
        onAfterClose()
      }
    }, animationDuration)
  }, [onClose, onAfterClose, animationDuration])

  const [anchorOrigin, transformOrigin] = position
    ? [
        positionToAnchorOriginMap[position],
        positionToTransformOriginMap[position]
      ]
    : [anchorOriginProp, transformOriginProp]

  const popupRef: React.MutableRefObject<HTMLDivElement> = useClickOutside(
    handleClose,
    checkIfClickInside,
    isVisible,
    typeof ref === 'function' ? undefined : ref
  )

  const wrapperRef = useRef<HTMLDivElement>(null)
  const originalTopPosition = useRef<number>(0)
  const [computedTransformOrigin, setComputedTransformOrigin] =
    useState(anchorOrigin)

  // On visible, set the position
  useEffect(() => {
    if (isVisible) {
      const [anchorRect, wrapperRect] = [anchorRef, wrapperRef].map((r) =>
        r?.current?.getBoundingClientRect()
      )
      if (!anchorRect || !wrapperRect) return

      const {
        anchorOrigin: anchorOriginComputed,
        transformOrigin: transformOriginComputed
      } = getComputedOrigins(
        anchorOrigin,
        transformOrigin,
        anchorRect,
        wrapperRect,
        containerRef
      )
      setComputedTransformOrigin(transformOriginComputed)

      const anchorTranslation = getOriginTranslation(
        anchorOriginComputed,
        anchorRect
      )
      const wrapperTranslation = getOriginTranslation(
        transformOriginComputed,
        wrapperRect
      )

      const top = anchorRect.y + anchorTranslation.y - wrapperTranslation.y
      const left = anchorRect.x + anchorTranslation.x - wrapperTranslation.x

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
    isVisible,
    wrapperRef,
    anchorRef,
    anchorOrigin,
    transformOrigin,
    setComputedTransformOrigin,
    originalTopPosition,
    containerRef
  ])

  // Callback invoked on each scroll. Uses original top position to scroll with content.
  // Takes scrollParent to get the current scroll position as well as the intitial scroll position
  // when the popup became visible.
  const watchScroll = useCallback(
    (scrollParent: Element, initialScrollPosition: number) => {
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

  const handleMouseLeave = useCallback(() => {
    if (dismissOnMouseLeave) {
      onClose()
    }
  }, [dismissOnMouseLeave, onClose])

  // useEffect only runs on the client
  useEffect(() => {
    setIsClientSide(true)
  }, [])

  // Portal the popup out of the dom structure so that it has a separate stacking context
  return (
    <>
      {isClientSide
        ? ReactDOM.createPortal(
            <div
              ref={wrapperRef}
              className={cn(styles.wrapper, wrapperClassName)}
              style={wrapperStyle}
              onMouseLeave={handleMouseLeave}
            >
              {transitions.map(({ item, key, props }) =>
                item ? (
                  <animated.div
                    className={cn(styles.popup, className)}
                    ref={popupRef}
                    key={key}
                    style={{
                      ...props,
                      transformOrigin: `${computedTransformOrigin.horizontal} ${computedTransformOrigin.vertical}`
                    }}
                  >
                    {showHeader && (
                      <div
                        className={cn(styles.header, {
                          [styles.noAfter]: hideCloseButton
                        })}
                      >
                        {hideCloseButton ? null : (
                          <IconButton
                            aria-label={messages.close}
                            onClick={handleClose}
                            icon={<IconRemove className={styles.iconRemove} />}
                          />
                        )}
                        <div className={cn(styles.title, titleClassName)}>
                          {title}
                        </div>
                      </div>
                    )}
                    {children}
                  </animated.div>
                ) : null
              )}
            </div>,
            document.body
          )
        : null}
    </>
  )
})
