import React, { useCallback, useEffect, useRef, useState } from 'react'

import { useClickOutside } from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import { useTransition, animated } from 'react-spring'

import { ReactComponent as IconRemove } from 'assets/img/iconRemove.svg'
import useInstanceVar from 'hooks/useInstanceVar'
import { getScrollParent } from 'utils/scrollParent'

import styles from './Popup.module.css'

/**
 * Gets the css transform origin prop from the display position
 * @param {string} position
 * @returns transform origin
 */
const getTransformOrigin = position => {
  switch (position) {
    case 'topCenter':
      return 'bottom center'
    case 'topRight':
      return 'bottom left'
    case 'topLeft':
      return 'bottom right'
    case 'bottomRight':
      return 'top left'
    case 'bottomLeft':
      return 'top right'
    case 'bottomCenter':
    default:
      return 'top center'
  }
}

/**
 * Figures out whether the specified position would overflow the window
 * and picks a better position accordingly
 * @param {string} position
 * @param {ClientRect} rect the content
 * @param {ClientRect} wrapper the wrapper of the content
 * @return {string | null} null if it would not overflow
 */
const getComputedPosition = (position, rect, wrapper) => {
  if (!rect || !wrapper) return position
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  const overflowRight = rect.x + wrapper.width > windowWidth
  const overflowLeft = rect.x - wrapper.width < 0
  const overflowBottom = rect.y + wrapper.height > windowHeight
  const overflowTop = rect.y - wrapper.height < 0

  let computedPosition = position
  // TODO: Clean this funky string replacing up when we move this file to typescript
  if (overflowRight) {
    computedPosition = computedPosition.replace('Right', 'Left')
  }
  if (overflowLeft) {
    computedPosition = computedPosition.replace('Left', 'Right')
  }
  if (overflowTop) {
    computedPosition = computedPosition.replace('top', 'bottom')
  }
  if (overflowBottom) {
    computedPosition = computedPosition.replace('bottom', 'top')
  }
  return computedPosition
}

/**
 * A popup is an in-place menu that shows on top of the UI. A popup does
 * not impact the rest of the UI (e.g. graying it out). It differs
 * from modals, which does take over the whole UI and are usually
 * center-screened.
 */
const Popup = ({
  className,
  wrapperClassName,
  // An optional ref to a container that, when a click happens inside
  // will ignore the clickOutside logic
  ignoreClickOutsideRef,
  isVisible,
  animationDuration,
  onClose,
  onAfterClose,
  title,
  noHeader,
  triggerRef,
  // The direction that the popup expands in
  position = 'bottomCenter',
  children,
  zIndex
}) => {
  const wrapper = useRef()
  const placeholder = useRef()
  const [getOriginalTopPosition, setOriginalTopPosition] = useInstanceVar(0)
  const [computedPosition, setComputedPosition] = useState(position)

  useEffect(() => {
    if (isVisible) {
      const rect = placeholder.current.getBoundingClientRect()
      const wrapperRect = wrapper.current.getBoundingClientRect()
      const computed = getComputedPosition(position, rect, wrapperRect)
      setComputedPosition(computed)
    }
  }, [isVisible, setComputedPosition, position, placeholder, wrapper])

  // On visible, set the position
  useEffect(() => {
    if (isVisible) {
      // When the popup becomes visible, set the position based on the placeholder
      const rect = placeholder.current.getBoundingClientRect()
      const wrapperRect = wrapper.current.getBoundingClientRect()

      let left
      let top
      if (!triggerRef) {
        left = rect.x - wrapperRect.width / 2 + rect.width / 2
        top = rect.y
      } else {
        const triggerRect = triggerRef.current.getBoundingClientRect()
        switch (computedPosition) {
          case 'topCenter':
            top = rect.y - wrapperRect.height - triggerRect.height
            left = rect.x - wrapperRect.width / 2 + triggerRect.width / 2
            break
          case 'topRight':
            top = rect.y - wrapperRect.height - triggerRect.height
            left = rect.x
            break
          case 'topLeft':
            top = rect.y - wrapperRect.height - triggerRect.height
            left = rect.x - wrapperRect.width + triggerRect.width
            break
          case 'bottomRight':
            top = rect.y
            left = rect.x + triggerRect.width
            break
          case 'bottomLeft':
            top = rect.y
            left = rect.x - wrapperRect.width + triggerRect.width
            break
          case 'bottomCenter':
          default:
            top = rect.y
            left = rect.x - wrapperRect.width / 2 + triggerRect.width / 2
        }
      }
      wrapper.current.style.top = `${top}px`
      wrapper.current.style.left = `${left}px`

      setOriginalTopPosition(top)
    }
  }, [
    isVisible,
    wrapper,
    placeholder,
    triggerRef,
    computedPosition,
    setOriginalTopPosition
  ])

  // Callback invoked on each scroll. Uses original top position to scroll with content.
  // Takes scrollParent to get the current scroll position as well as the intitial scroll position
  // when the popup became visible.
  const watchScroll = useCallback(
    (scrollParent, initialScrollPosition) => {
      const scrollTop = scrollParent.scrollTop
      wrapper.current.style.top = `${
        getOriginalTopPosition() - scrollTop + initialScrollPosition
      }px`
    },
    [wrapper, getOriginalTopPosition]
  )

  // Set up scroll listeners
  useEffect(() => {
    if (isVisible && placeholder.current) {
      const scrollParent = getScrollParent(placeholder.current)
      const initialScrollPosition = scrollParent.scrollTop
      const listener = () => watchScroll(scrollParent, initialScrollPosition)
      scrollParent.addEventListener('scroll', listener)
      return () => {
        scrollParent.removeEventListener('scroll', listener)
      }
    }
  }, [isVisible, watchScroll, placeholder])

  const handleClose = useCallback(() => {
    onClose()
    setTimeout(() => {
      onAfterClose()
    }, animationDuration)
  }, [onClose, onAfterClose, animationDuration])

  const clickOutsideRef = useClickOutside(handleClose, target => {
    if (target instanceof Element && ignoreClickOutsideRef) {
      return ignoreClickOutsideRef.current.contains(target)
    }
    return false
  })

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
    config: { duration: 180 },
    unique: true
  })

  const wrapperStyle = zIndex ? { zIndex } : {}

  return (
    <>
      <div ref={placeholder} className={cn(styles.placeholder, className)} />
      {/* Portal the actual popup out of this dom structure so that it can break out of overflows */}
      {ReactDOM.createPortal(
        <div
          ref={wrapper}
          className={cn(styles.wrapper, wrapperClassName)}
          style={wrapperStyle}
        >
          {transitions.map(({ item, key, props }) =>
            item ? (
              <animated.div
                className={cn(styles.popup, className)}
                ref={clickOutsideRef}
                key={key}
                style={{
                  ...props,
                  transformOrigin: getTransformOrigin(computedPosition)
                }}
              >
                {!noHeader && (
                  <div className={styles.header}>
                    <IconRemove
                      className={styles.iconRemove}
                      onClick={handleClose}
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
}

Popup.propTypes = {
  className: PropTypes.string,
  isVisible: PropTypes.bool.isRequired,
  // Duration in milliseconds
  animationDuration: PropTypes.number,
  // Fired when a close is dispatched, but the animation is not necessarily finished
  onClose: PropTypes.func.isRequired,
  // Fired after the popup finishes closing
  onAfterClose: PropTypes.func,
  // Top of popup title
  title: PropTypes.string.isRequired,
  children: PropTypes.arrayOf(PropTypes.element),
  zIndex: PropTypes.number
}

Popup.defaultProps = {
  animationDuration: 90,
  onAfterClose: () => {}
}

export default Popup
