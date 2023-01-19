import { useEffect } from 'react'

import type { Nullable } from '@audius/common'
import { formatSeconds } from '@audius/common'
import { useStreamPosition } from 'react-native-google-cast'
import { useProgress } from 'react-native-track-player'

import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

type PositionTimestampProps = {
  dragSeconds: Nullable<string>
  setDragSeconds: (seconds: Nullable<string>) => void
}

const useStyles = makeStyles(({ palette }) => ({
  timestamp: {
    width: 50,
    color: palette.neutral,
    fontSize: 12,
    flexShrink: 1,
    textAlign: 'right'
  }
}))

export const PositionTimestamp = (props: PositionTimestampProps) => {
  const { dragSeconds, setDragSeconds } = props
  const styles = useStyles()
  const { position: trackPlayerPosition, duration: progressDuration } =
    useProgress(1000)

  const streamPosition = useStreamPosition(1000)

  useEffect(() => {
    setDragSeconds(null)
  }, [progressDuration, streamPosition, setDragSeconds])

  const position = streamPosition ?? trackPlayerPosition

  return (
    <Text
      style={[styles.timestamp, { textAlign: 'right' }]}
      fontSize='xs'
      weight='regular'
      numberOfLines={1}
    >
      {dragSeconds || formatSeconds(position)}
    </Text>
  )
}
