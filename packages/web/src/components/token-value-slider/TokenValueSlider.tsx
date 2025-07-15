import { FC, useState, useRef, useEffect } from 'react'

import { AUDIO, AudioWei } from '@audius/fixed-decimal'
import cn from 'classnames'

import styles from './TokenValueSlider.module.css'
import { TokenValueSliderProps } from './types'

const messages = {
  min: 'MIN',
  max: 'MAX',
  current: 'CURRENT'
}

/**
 * Calculates percentage for slider position using BigInt arithmetic
 * @param value Current value
 * @param min Minimum value
 * @param max Maximum value
 * @returns Percentage as a number between 0 and 1
 */
const calculatePercentage = (
  value: AudioWei,
  min: AudioWei,
  max: AudioWei
): number => {
  const valueDiff = BigInt(value - min)
  const maxDiff = BigInt(max - min)

  if (maxDiff === BigInt(0)) {
    return 0
  }

  // Use integer arithmetic to avoid decimal precision issues
  // Multiply by 10000 for better precision, then divide
  const percentage = Number((valueDiff * BigInt(10000)) / maxDiff) / 10000
  return percentage
}

export const TokenValueSlider: FC<TokenValueSliderProps> = ({
  className,
  sliderClassName,
  sliderBarClassName,
  min,
  max,
  minSliderWidth,
  value,
  initialValue,
  isIncrease,
  minWrapper: MinWrapper,
  maxWrapper: MaxWrapper
}: TokenValueSliderProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const maxValueRef = useRef<HTMLDivElement | null>(null)
  const minValueRef = useRef<HTMLDivElement | null>(null)

  const [initialSliderWidth, setInitialSliderWidth] = useState(0)
  const [sliderWidth, setSliderWidth] = useState(0)

  useEffect(() => {
    if (containerRef.current) {
      const valueDiff = BigInt(value) - min
      const percentage = calculatePercentage(value, min, max)
      const totalWidth = containerRef.current.offsetWidth

      if (valueDiff === BigInt(0)) {
        setSliderWidth(0)
      } else {
        const newSliderWidth = Math.max(
          totalWidth * Math.min(Math.max(percentage, 0), 1),
          minSliderWidth
        )
        setSliderWidth(newSliderWidth)
      }
    }
  }, [value, containerRef, max, min, setSliderWidth, minSliderWidth])

  useEffect(() => {
    if (initialValue && !initialSliderWidth && containerRef.current) {
      const percentage = calculatePercentage(initialValue, min, max)
      const totalWidth = containerRef.current.offsetWidth
      const newSliderWidth = Math.max(
        totalWidth * Math.min(Math.max(percentage, 0), 1),
        minSliderWidth
      )
      setInitialSliderWidth(newSliderWidth)
    }
  }, [
    initialValue,
    containerRef,
    minSliderWidth,
    max,
    min,
    initialSliderWidth,
    setInitialSliderWidth
  ])

  return (
    <div
      className={cn(styles.container, { [className!]: !!className })}
      ref={containerRef}
    >
      <div
        className={cn(styles.slider, {
          [sliderClassName!]: !!sliderClassName
        })}
      >
        <div
          className={cn(
            styles.newValueSlider,
            {
              [styles.invalid]: value > max || value < min,
              [styles.lighter]: isIncrease
            },
            sliderBarClassName
          )}
          style={{ width: sliderWidth }}
        />
        <div
          className={cn(styles.initialValueSlider, {
            [styles.lighter]: !isIncrease
          })}
          style={{ width: initialSliderWidth }}
        />
      </div>
      <div className={styles.minMax}>
        {min && (
          <div ref={maxValueRef} className={styles.minValue}>
            {MinWrapper ? (
              <MinWrapper value={min} />
            ) : (
              <>
                <span className={styles.minLabel}>
                  {isIncrease !== undefined
                    ? isIncrease
                      ? messages.current
                      : messages.min
                    : messages.min}
                </span>
                <span>
                  {AUDIO(min).trunc().toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </span>
              </>
            )}
          </div>
        )}
        {max && (
          <div ref={minValueRef} className={styles.maxValues}>
            {MaxWrapper ? (
              <MaxWrapper value={max} />
            ) : (
              <>
                <span>
                  {AUDIO(max).trunc().toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </span>
                <span className={styles.maxLabel}>
                  {isIncrease !== undefined
                    ? isIncrease
                      ? messages.max
                      : messages.current
                    : messages.max}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
