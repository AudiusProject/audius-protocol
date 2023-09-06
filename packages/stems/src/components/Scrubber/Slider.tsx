import { useState, useEffect, useCallback, useRef, CSSProperties } from 'react'
import * as React from 'react'

import cn from 'classnames'

import styles from './Slider.module.css'
import { useAnimations } from './hooks'
import { ScrubberProps } from './types'

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
  mediaKey,
  isPlaying,
  isMobile,
  isDisabled,
  elapsedSeconds,
  totalSeconds,
  playbackRate,
  onScrub,
  onScrubRelease,
  includeExpandedTargets = true,
  style
}: ScrubberProps) => {
  const [previousMediaKey, setPreviousMediaKey] = useState('')

  // Percentage of the complete scrubber being dragged to.
  // e.g. 0.25 means the user has dragged the scrubber 1/4th of the way.
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

  const { play, pause, setPercent } = useAnimations(
    trackRef,
    handleRef,
    elapsedSeconds,
    totalSeconds,
    playbackRate
  )

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
    (e: React.MouseEvent | MouseEvent) => {
      setDragPercent(e.pageX)
    },
    [setDragPercent]
  )

  /**
   * Sets the percentage across the scurbber for a given touch event.
   */
  const setDragPercentTouch = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      setDragPercent(e.touches[0].pageX)
    },
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
      if (dragPercent.current !== null) {
        setPercent(dragPercent.current)
        const seconds = dragPercent.current * totalSeconds
        if (onScrub) {
          onScrub(seconds)
        }
      }
    },
    [dragPercent, setDragPercentMouse, totalSeconds, setPercent, onScrub]
  )

  /**
   * Watches user touch movements while the scrubber handle is being dragged.
   */
  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      e.stopPropagation()
      e.preventDefault()

      setDragPercentTouch(e)
      if (dragPercent.current !== null) {
        setPercent(dragPercent.current)

        const seconds = dragPercent.current * totalSeconds
        if (onScrub) {
          onScrub(seconds)
        }
      }
    },
    [dragPercent, setDragPercentTouch, totalSeconds, setPercent, onScrub]
  )

  /**
   * Watches for a mouse-up action (which may not occur on the scrubber itself),
   * calls the release callback, and resets dragging state.
   */
  const onMouseUp = useCallback(() => {
    if (mouseMoveRef.current) {
      document.removeEventListener('mousemove', mouseMoveRef.current)
    }
    if (mouseUpRef.current) {
      document.removeEventListener('mouseup', mouseUpRef.current)
    }

    if (dragPercent.current !== null) {
      const seconds = dragPercent.current * totalSeconds
      if (onScrubRelease) {
        onScrubRelease(seconds)
      }

      dragPercent.current = null
    }
  }, [mouseMoveRef, mouseUpRef, dragPercent, totalSeconds, onScrubRelease])

  /**
   * Watches for a touch-end action (which may not occur on the scrubber itself),
   * calls the release callback, and resets dragging state.
   */
  const onTouchEnd = useCallback(() => {
    if (touchMoveRef.current) {
      document.removeEventListener('touchmove', touchMoveRef.current)
    }
    if (touchEndRef.current) {
      document.removeEventListener('touchend', touchEndRef.current)
    }

    if (dragPercent.current !== null) {
      const seconds = dragPercent.current * totalSeconds
      if (onScrubRelease) {
        onScrubRelease(seconds)
      }

      dragPercent.current = null
    }
  }, [touchMoveRef, touchEndRef, dragPercent, totalSeconds, onScrubRelease])

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

    setDragPercentMouse(e)
    if (dragPercent.current !== null) {
      setPercent(dragPercent.current)
    }
  }

  /**
   * Attaches touch-move and touch-end event listeners and sets dragging state.
   */
  const onTouchStart = (e: React.TouchEvent) => {
    touchMoveRef.current = onTouchMove
    touchEndRef.current = onTouchEnd
    document.addEventListener('touchmove', touchMoveRef.current)
    document.addEventListener('touchend', touchEndRef.current)

    setDragPercentTouch(e)
    if (dragPercent.current !== null) {
      setPercent(dragPercent.current)
    }
  }

  // Watch interactions to the scrubber and call to animate
  useEffect(() => {
    if (!dragPercent.current) {
      if (isPlaying) play()
      else pause()
    }
  }, [isPlaying, dragPercent, play, pause])

  useEffect(() => {
    setPercent(elapsedSeconds / totalSeconds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackRate])

  // When the key changes, reset the animation
  useEffect(() => {
    if (mediaKey !== previousMediaKey) {
      if (!totalSeconds) {
        setPercent(0)
      } else {
        setPercent(elapsedSeconds / totalSeconds)
      }
      setPreviousMediaKey(mediaKey)
    }
  }, [
    mediaKey,
    previousMediaKey,
    setPreviousMediaKey,
    setPercent,
    elapsedSeconds,
    totalSeconds
  ])

  const getShowHandle = () =>
    !style || style.showHandle === undefined ? true : style.showHandle

  const getRailStyle = () => {
    const s: CSSProperties = {}
    if (style && style.railUnlistenedColor) {
      s.background = style.railUnlistenedColor
    }
    return s
  }

  const getTrackStyle = () => {
    const s: CSSProperties = {}
    if (style && style.railListenedColor) {
      s.background = style.railListenedColor
    }

    if (style && style.railListenedColor) {
      s.borderRadius = 'var(--unit-half)'
    }
    return s
  }

  const getSliderStyle = () => {
    if (style && style.sliderMargin) return { margin: style.sliderMargin }
    return {}
  }

  const getHandleStyle = () => {
    const s: CSSProperties = {}
    if (style) {
      if (style.handleColor) s.background = style.handleColor
      if (style.handleShadow) s.boxShadow = style.handleShadow
    }
    return s
  }

  return (
    <div
      className={cn(styles.slider, {
        [styles.isMobile]: isMobile,
        [styles.isDisabled]: isDisabled,
        [styles.showHandle]: getShowHandle(),
        [styles.expandedTargets]: includeExpandedTargets
      })}
      onMouseDown={isDisabled ? () => {} : onMouseDown}
      onTouchStart={isDisabled ? () => {} : onTouchStart}
      style={getSliderStyle()}
    >
      <div ref={railRef} className={styles.rail} style={getRailStyle()}>
        <div ref={trackRef} className={styles.trackWrapper}>
          <div
            ref={trackRef}
            className={styles.track}
            style={getTrackStyle()}
          />
        </div>
      </div>
      <div ref={handleRef} className={styles.handleWrapper}>
        <div
          ref={handleRef}
          className={styles.handle}
          style={getHandleStyle()}
        />
      </div>
    </div>
  )
}
