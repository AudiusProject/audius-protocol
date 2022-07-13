import React, { useCallback, useRef, useState } from 'react'

import cn from 'classnames'

import styles from './Slider.module.css'
import { SliderProps } from './types'

/** Gets the X-position of a div. */
const getXPosition = (element: HTMLDivElement) => {
  const coords = element.getBoundingClientRect()
  return window.pageXOffset + coords.left
}

/**
 * A smooth scrubbable slider that relies on CSS animations rather
 * than progress ticks to achieve fluidity.
 */
export const Slider = ({
  defaultValue = 0,
  value,
  max,
  onChange,
  showHandle
}: SliderProps) => {
  const [isActive, setIsActive] = useState(false)

  // // Percentage of the complete scrubber being dragged to.
  // // e.g. 0.25 means the user has dragged the scrubber 1/4th of the way.
  const dragPercent = useRef<number | null>(0)

  // Refs to handle event listeners
  const mouseMoveRef = useRef<((this: Document, ev: MouseEvent) => any) | null>(
    null
  )
  const mouseUpRef = useRef<((this: Document, ev: MouseEvent) => any) | null>(
    null
  )
  const touchMoveRef = useRef<((e: TouchEvent) => any) | null>(null)
  const touchEndRef = useRef<((e: TouchEvent) => any) | null>(null)

  // Div refs
  const railRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)

  /**
   * Sets the percentage across the scrubber for a given pageX position.
   */
  const setDragPercent = useCallback(
    (pageX: number) => {
      if (railRef.current) {
        const clickPosition = pageX - getXPosition(railRef.current)
        const railWidth = railRef.current.offsetWidth
        const percent =
          Math.min(Math.max(0, clickPosition), railWidth) / railWidth
        dragPercent.current = percent
      }
    },
    [dragPercent]
  )

  /**
   * Sets the percentage across the scrubber for a given mouse event.
   */
  const setDragPercentMouse = useCallback(
    (e: React.MouseEvent | MouseEvent) => setDragPercent(e.pageX),
    [setDragPercent]
  )

  /**
   * Sets the percentage across the scurbber for a given touch event.
   */
  const setDragPercentTouch = useCallback(
    (e: React.TouchEvent | TouchEvent) => setDragPercent(e.touches[0].pageX),
    [setDragPercent]
  )

  /**
   * Watches user mouse movements while the scrubber handle is being dragged.
   */
  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      setDragPercentMouse(e)
      if (dragPercent.current !== null) onChange(dragPercent.current * max)
    },
    [setDragPercentMouse, max, onChange]
  )

  /**
   * Watches user touch movements while the scrubber handle is being dragged.
   */
  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      e.stopPropagation()
      e.preventDefault()

      setDragPercentTouch(e)
      if (dragPercent.current !== null) onChange(dragPercent.current * max)
    },
    [setDragPercentTouch, max, onChange]
  )

  /**
   * Watches for a mouse-up action (which may not occur on the scrubber itself),
   * calls the release callback, and resets dragging state.
   */
  const onMouseUp = useCallback(() => {
    setIsActive(false)
    if (mouseMoveRef.current) {
      document.removeEventListener('mousemove', mouseMoveRef.current)
    }
    if (mouseUpRef.current) {
      document.removeEventListener('mouseup', mouseUpRef.current)
    }

    if (dragPercent.current !== null) dragPercent.current = null
  }, [mouseMoveRef, mouseUpRef, dragPercent])

  /**
   * Watches for a touch-end action (which may not occur on the scrubber itself),
   * calls the release callback, and resets dragging state.
   */
  const onTouchEnd = useCallback(() => {
    setIsActive(false)
    if (touchMoveRef.current) {
      document.removeEventListener('touchmove', touchMoveRef.current)
    }
    if (touchEndRef.current) {
      document.removeEventListener('touchend', touchEndRef.current)
    }

    if (dragPercent.current !== null) dragPercent.current = null
  }, [touchMoveRef, touchEndRef, dragPercent])

  /**
   * Attaches mouse-move and mouse-up event listeners and sets dragging state.
   */
  const onMouseDown = (e: React.MouseEvent) => {
    // Cancel mouse down if touch was fired.
    if (e.button !== 0 || touchMoveRef.current) return

    mouseMoveRef.current = onMouseMove
    mouseUpRef.current = onMouseUp
    document.addEventListener('mousemove', mouseMoveRef.current)
    document.addEventListener('mouseup', mouseUpRef.current)
    setIsActive(true)

    setDragPercentMouse(e)
    if (dragPercent.current !== null) onChange(dragPercent.current * max)
  }

  /**
   * Attaches touch-move and touch-end event listeners and sets dragging state.
   */
  const onTouchStart = (e: React.TouchEvent) => {
    touchMoveRef.current = onTouchMove
    touchEndRef.current = onTouchEnd
    document.addEventListener('touchmove', touchMoveRef.current)
    document.addEventListener('touchend', touchEndRef.current)
    setIsActive(true)

    setDragPercentTouch(e)
    if (dragPercent.current !== null) onChange(dragPercent.current * max)
  }

  const transformStyles = { transform: `translate(${(value / max) * 100}%)` }

  return (
    <div
      className={cn(styles.slider, {
        [styles.active]: isActive,
        [styles.showHandle]: showHandle
      })}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}>
      <div ref={railRef} className={styles.rail}>
        <div
          ref={trackRef}
          className={styles.trackWrapper}
          style={transformStyles}>
          <div ref={trackRef} className={styles.track} />
        </div>
      </div>
      {showHandle !== false ? (
        <div
          ref={handleRef}
          className={styles.handleWrapper}
          style={transformStyles}>
          <div ref={handleRef} className={styles.handle} />
        </div>
      ) : null}
    </div>
  )
}
