import { useState, useEffect } from 'react'

import cn from 'classnames'

import { formatTrackTimestamp } from '~harmony/utils'

import styles from './Scrubber.module.css'
import { Slider } from './Slider'
import { ScrubberProps } from './types'

/** Timeout applied when releasing the drag-handle before timestamps reset. */
const SCRUB_RELEASE_TIMEOUT_MS = 200

/**
 * @beta - This component was directly ported from stems and subject to change
 * Wraps the `<Slider />` component and provides timestamp indicators.
 */
export const Scrubber = ({
  mediaKey,
  isPlaying,
  isDisabled,
  isMobile,
  includeTimestamps = true,
  elapsedSeconds,
  totalSeconds,
  playbackRate,
  getAudioPosition,
  getTotalTime,
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
          {formatTrackTimestamp(timestampStart)}
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
        getAudioPosition={getAudioPosition}
        getTotalTime={getTotalTime}
        onScrubRelease={onHandleScrubRelease}
        includeExpandedTargets={includeExpandedTargets}
        style={style}
      />
      {includeTimestamps && (
        <div className={styles.timestampEnd}>
          {formatTrackTimestamp(totalSeconds)}
        </div>
      )}
    </div>
  )
}
