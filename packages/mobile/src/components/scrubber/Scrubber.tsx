import { useCallback, useEffect, useState } from 'react'

import { formatSeconds, playerActions } from '@audius/common'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import Text from 'app/components/text'
import { makeStyles } from 'app/styles'

import { PositionTimestamp } from './PositionTimestamp'
import { Slider } from './Slider'

const { seek } = playerActions

// Timeout applied when releasing the drag-handle before timestamps reset.
const SCRUB_RELEASE_TIMEOUT_MS = 1000

// Pretty formats seconds into m:ss or h:mm:ss

const useStyles = makeStyles(({ palette }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  timestamp: {
    width: 50,
    color: palette.neutral,
    fontSize: 12,
    flexShrink: 1
  }
}))

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
export const Scrubber = (props: ScrubberProps) => {
  const { mediaKey, isPlaying, duration, onPressIn, onPressOut } = props
  const styles = useStyles()
  const dispatch = useDispatch()
  const [dragSeconds, setDragSeconds] = useState<string | null>(null)

  const handlePressIn = useCallback(() => {
    onPressIn()
  }, [onPressIn])

  const handlePressOut = useCallback(
    (percentComplete: number) => {
      if (duration) {
        dispatch(seek({ seconds: percentComplete * duration }))
      }
      onPressOut()
      setTimeout(() => {
        setDragSeconds(null)
      }, SCRUB_RELEASE_TIMEOUT_MS)
    },
    [onPressOut, dispatch, duration]
  )

  const onDrag = useCallback(
    (percentComplete: number) => {
      if (duration) {
        setDragSeconds(formatSeconds(percentComplete * duration))
      }
    },
    [duration, setDragSeconds]
  )

  useEffect(() => {
    setDragSeconds(formatSeconds(0))
  }, [mediaKey])

  // TODO: disable scrubber animation when now playing is closed
  // Disable tracking bar animation when now playing bar is open
  return (
    <View style={styles.root}>
      <PositionTimestamp
        dragSeconds={dragSeconds}
        setDragSeconds={setDragSeconds}
      />
      <Slider
        mediaKey={mediaKey}
        isPlaying={isPlaying}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onDrag={onDrag}
        duration={duration}
      />
      <Text style={styles.timestamp} weight='regular' numberOfLines={1}>
        {formatSeconds(duration)}
      </Text>
    </View>
  )
}
