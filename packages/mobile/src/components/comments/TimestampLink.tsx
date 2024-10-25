import { useCallback } from 'react'

import { useCurrentCommentSection } from '@audius/common/context'
import type { GestureResponderEvent } from 'react-native'

import type { TextLinkProps } from '@audius/harmony-native'
import { TextLink } from '@audius/harmony-native'
import { formatCommentTrackTimestamp } from 'app/utils/comments'

type TimestampLinkProps = {
  timestampSeconds: number
  onPress?: (e: GestureResponderEvent, timestampSeconds: number) => void
} & Omit<TextLinkProps, 'to' | 'onPress'>

export const TimestampLink = (props: TimestampLinkProps) => {
  const { timestampSeconds, onPress, ...other } = props
  const { playTrack } = useCurrentCommentSection()

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      playTrack(timestampSeconds)
      onPress?.(e, timestampSeconds)
    },
    [timestampSeconds, playTrack, onPress]
  )

  return (
    <TextLink onPress={handlePress} variant='visible' {...other}>
      {formatCommentTrackTimestamp(timestampSeconds)}
    </TextLink>
  )
}
