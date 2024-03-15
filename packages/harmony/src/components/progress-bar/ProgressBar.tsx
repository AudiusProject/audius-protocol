import { useState, useEffect, useMemo } from 'react'

import BN from 'bn.js'
import cn from 'classnames'

import styles from './ProgressBar.module.css'
import { ProgressBarProps, ProgressValue } from './types'

const getBN = (num: ProgressValue): BN => {
  if (num instanceof BN) return num
  return new BN(num)
}

function clampBN(value: BN, min: BN, max: BN): BN {
  return BN.min(BN.max(value, min), max)
}

export const ProgressBar = (props: ProgressBarProps) => {
  const {
    className,
    sliderClassName,
    sliderBarClassName,
    min = new BN(0),
    max = new BN(100),
    value,
    showLabels = false,
    minWrapper: MinWrapper,
    maxWrapper: MaxWrapper,
    ...other
  } = props
  const [sliderWidth, setSliderWidth] = useState(0)

  const percentage = useMemo(() => {
    const minBN = getBN(min)
    const maxBN = getBN(max)
    const valBN = getBN(value)

    return clampBN(valBN.sub(minBN), new BN(0), maxBN)
      .mul(new BN(100))
      .div(maxBN.sub(minBN))
  }, [max, min, value])

  useEffect(() => {
    setSliderWidth(percentage.toNumber())
  }, [percentage])

  return (
    <div
      className={cn(styles.container, { [className!]: !!className })}
      role='progressbar'
      aria-valuenow={percentage.toNumber()}
      {...other}
    >
      <div
        className={cn(styles.slider, {
          [sliderClassName!]: !!sliderClassName
        })}
      >
        <div
          className={cn(styles.sliderBar, {
            [sliderBarClassName!]: !!sliderBarClassName
          })}
          style={{ width: `${sliderWidth}%` }}
        ></div>
      </div>
      {showLabels && (
        <div className={styles.labels}>
          <div className={styles.minLabel}>
            {MinWrapper ? <MinWrapper value={min} /> : min.toString()}
          </div>
          <div className={styles.maxLabel}>
            {MaxWrapper ? <MaxWrapper value={max} /> : max.toString()}
          </div>
        </div>
      )}
    </div>
  )
}
