import { useCallback, useEffect, useRef, useState } from 'react'

import moment from 'moment'
import { StyleSheet, View } from 'react-native'
import { useDispatch } from 'react-redux'

import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { SEEK, seek } from 'app/store/audio/actions'
import { ThemeColors } from 'app/utils/theme'

import { Slider } from './Slider'

const SEEK_INTERVAL = 200

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR

// Timeout applied when releasing the drag-handle before timestamps reset.
const SCRUB_RELEASE_TIMEOUT_MS = 400

// Pretty formats seconds into m:ss or h:mm:ss
const formatSeconds = (seconds: number) => {
  const utc = moment.utc(moment.duration(seconds, 'seconds').asMilliseconds())
  if (seconds > SECONDS_PER_HOUR) {
    return utc.format('h:mm:ss')
  }
  return utc.format('m:ss')
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    timestamp: {
      width: 50,
      color: themeColors.neutral,
      fontSize: 12,
      flexShrink: 1
    }
  })

type ScrubberProps = {
  /**
   * A unique key to represent this instances of playback.
   * If the user replays the same track, mediaKey should change
   */
  mediaKey: string
  /**
   * Whether audio is playing and the scrubber should animate
   */
  isPlaying: boolean
  /**
   * The duration of the currently playing track
   */
  duration: number
  /**
   * Callback invoked when focus is gained on the scrubber
   */
  onPressIn: () => void
  /**
   * Callback invoked when focus is lost on the scrubber
   */
  onPressOut: () => void
}

/**
 * Scrubber component to control track playback & seek.
 */
export const Scrubber = ({
  mediaKey,
  isPlaying,
  duration,
  onPressIn,
  onPressOut
}: ScrubberProps) => {
  const styles = useThemedStyles(createStyles)
  const dispatch = useDispatch()

  // The left-hand timestamp
  const [timestampStart, setTimestampStart] = useState('')
  // The right-hand timestamp
  const [timestampEnd, setTimestampEnd] = useState('')

  const [dragSeconds, setDragSeconds] = useState<string | null>(null)

  const [isDragging, setIsDragging] = useState(false)

  const handlePressIn = useCallback(() => {
    onPressIn()
    setIsDragging(true)
  }, [onPressIn, setIsDragging])

  const handlePressOut = useCallback(
    (percentComplete) => {
      if (global.progress) {
        if (duration) {
          setTimestampStart(formatSeconds(percentComplete * duration))
          dispatch(seek({ type: SEEK, seconds: percentComplete * duration }))
        }
      }
      onPressOut()
      setIsDragging(false)
      setTimeout(() => {
        setDragSeconds(null)
      }, SCRUB_RELEASE_TIMEOUT_MS)
    },
    [onPressOut, setIsDragging, dispatch, duration]
  )

  // Register an interval to update the start / end timestamps (duration)
  const seekInterval = useRef<NodeJS.Timeout | null>(null)

  const onDrag = useCallback(
    (percentComplete) => {
      if (global.progress && duration) {
        setDragSeconds(formatSeconds(percentComplete * duration))
      }
    },
    [duration, setDragSeconds]
  )

  useEffect(() => {
    setDragSeconds(formatSeconds(0))
    setTimeout(() => {
      setDragSeconds(null)
    }, SCRUB_RELEASE_TIMEOUT_MS)
  }, [mediaKey])

  useEffect(() => {
    if (!isDragging) {
      seekInterval.current = setInterval(() => {
        if (isPlaying && global.progress) {
          const { currentTime, seekableDuration } = global.progress
          if (seekableDuration !== undefined) {
            setTimestampStart(formatSeconds(currentTime))
            setTimestampEnd(formatSeconds(seekableDuration))
          }
        }
      }, SEEK_INTERVAL)
    }
    return () => {
      if (seekInterval.current) {
        clearInterval(seekInterval.current)
      }
    }
  }, [mediaKey, isPlaying, seekInterval, isDragging])

  return (
    <View style={styles.root}>
      <Text
        style={[styles.timestamp, { textAlign: 'right' }]}
        weight='regular'
        numberOfLines={1}>
        {dragSeconds || timestampStart}
      </Text>
      <Slider
        mediaKey={mediaKey}
        isPlaying={isPlaying}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onDrag={onDrag}
        duration={duration}
      />
      <Text style={styles.timestamp} weight='regular' numberOfLines={1}>
        {timestampEnd}
      </Text>
    </View>
  )
}
