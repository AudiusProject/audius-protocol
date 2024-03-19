import { useState, useEffect } from 'react'

import cn from 'classnames'
import moment from 'moment'

import styles from './Scrubber.module.css'
import { Slider } from './Slider'
import { ScrubberProps, defaultScrubberProps } from './types'

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR

/** Timeout applied when releasing the drag-handle before timestamps reset. */
const SCRUB_RELEASE_TIMEOUT_MS = 200

/** Pretty formats seconds into m:ss. */
const formatSeconds = (seconds: number) => {
  const utc = moment.utc(moment.duration(seconds, 'seconds').asMilliseconds())
  if (seconds > SECONDS_PER_HOUR) {
    return utc.format('h:mm:ss')
  }
  return utc.format('m:ss')
}

/**
 * @beta - This component was directly ported from stems and subject to change
 * Wraps the `<Slider />` component and provides timestamp indicators.
 */
export const Scrubber = ({
  mediaKey,
  isPlaying,
  isDisabled,
  isMobile,
  includeTimestamps,
  elapsedSeconds,
  totalSeconds,
  playbackRate,
  onScrub,
  onScrubRelease,
  includeExpandedTargets,
  style,
  className
}: ScrubberProps) => {
  const [dragSeconds, setDragSeconds] = useState<number | null>(null)

  const resetDragSeconds = (isPlaying: boolean) => {
    if (isPlaying) {
      setTimeout(() => setDragSeconds(null), SCRUB_RELEASE_TIMEOUT_MS)
    }
  }

  const onHandleScrub = (seconds: number) => {
    setDragSeconds(seconds)
    if (onScrub) {
      onScrub(seconds)
    }
  }

  const onHandleScrubRelease = (seconds: number) => {
    if (onScrubRelease) {
      onScrubRelease(seconds)
    }
    resetDragSeconds(isPlaying)
  }

  useEffect(() => {
    resetDragSeconds(isPlaying)
  }, [isPlaying])

  const timestampStart = dragSeconds !== null ? dragSeconds : elapsedSeconds

  return (
    <div
      className={cn(styles.scrubber, {
        [styles.isDisabled]: isDisabled,
        [styles.isMobile]: isMobile,
        className
      })}
    >
      {includeTimestamps && (
        <div className={styles.timestampStart}>
          {formatSeconds(timestampStart)}
        </div>
      )}
      <Slider
        mediaKey={mediaKey}
        isPlaying={isPlaying}
        isDisabled={isDisabled}
        isMobile={isMobile}
        elapsedSeconds={elapsedSeconds}
        totalSeconds={totalSeconds}
        playbackRate={playbackRate}
        onScrub={onHandleScrub}
        onScrubRelease={onHandleScrubRelease}
        includeExpandedTargets={includeExpandedTargets}
        style={style}
      />
      {includeTimestamps && (
        <div className={styles.timestampEnd}>{formatSeconds(totalSeconds)}</div>
      )}
    </div>
  )
}

Scrubber.defaultProps = defaultScrubberProps
