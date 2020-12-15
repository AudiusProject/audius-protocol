import React, { useCallback, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import cn from 'classnames'
import { useTransition, animated } from 'react-spring'

import useClickOutside from 'hooks/useClickOutside'

import { ReactComponent as IconRemove } from 'assets/img/iconRemove.svg'

import styles from './Popup.module.css'

/**
 * A popup is an in-place menu that shows on top of the UI. A popup does
 * not impact the rest of the UI (e.g. graying it out). It differs
 * from modals, which does take over the whole UI and are usually
 * center-screened.
 */
const Popup = ({
  className,
  isVisible,
  animationDuration,
  onClose,
  onAfterClose,
  title,
  children
}) => {
  const wrapper = useRef()
  const placeholder = useRef()

  useEffect(() => {
    if (isVisible) {
      // When the popup becomes visible, set the position based on the placeholder
      const rect = placeholder.current.getBoundingClientRect()
      const wrapperRect = wrapper.current.getBoundingClientRect()
      wrapper.current.style.left = `${
        rect.x - wrapperRect.width / 2 + rect.width / 2
      }px`
      wrapper.current.style.top = `${rect.y}px`
    }
  }, [isVisible, wrapper, placeholder])

  const handleClose = useCallback(() => {
    onClose()
    setTimeout(() => {
      onAfterClose()
    }, animationDuration)
  }, [onClose, onAfterClose, animationDuration])

  const ref = useClickOutside(handleClose)

  const transitions = useTransition(isVisible, null, {
    from: { transform: `scale(0)`, opacity: 0, transformOrigin: 'top center' },
    enter: { transform: `scale(1)`, opacity: 1, transformOrigin: 'top center' },
    leave: { transform: `scale(0)`, opacity: 0, transformOrigin: 'top center' },
    config: { duration: 180 },
    unique: true
  })

  return (
    <>
      <div ref={placeholder} className={cn(styles.placeholder, className)} />
      {/* Portal the actual popup out of this dom structure so that it can break out of overflows */}
      {ReactDOM.createPortal(
        <div ref={wrapper} className={styles.wrapper}>
          {transitions.map(({ item, key, props }) =>
            item ? (
              <animated.div
                className={cn(styles.popup, className)}
                ref={ref}
                key={key}
                style={props}
              >
                <div className={styles.header}>
                  <IconRemove
                    className={styles.iconRemove}
                    onClick={handleClose}
                  />
                  <div className={styles.title}>{title}</div>
                </div>
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
  children: PropTypes.arrayOf(PropTypes.element)
}

Popup.defaultProps = {
  animationDuration: 90,
  onAfterClose: () => {}
}

export default Popup
