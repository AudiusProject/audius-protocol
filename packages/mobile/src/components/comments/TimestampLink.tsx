import { useCurrentCommentSection } from '@audius/common/context'

import type { TextLinkProps } from '@audius/harmony-native'
import { TextLink } from '@audius/harmony-native'
import { formatCommentTrackTimestamp } from 'app/utils/comments'

type TimestampLinkProps = {
  timestampSeconds: number
} & Omit<TextLinkProps, 'to'>

export const TimestampLink = (props: TimestampLinkProps) => {
  const { timestampSeconds, ...other } = props
  const { playTrack } = useCurrentCommentSection()

  return (
    <TextLink
      onPress={() => playTrack(timestampSeconds)}
      variant='visible'
      {...other}
    >
      {formatCommentTrackTimestamp(timestampSeconds)}
    </TextLink>
  )
}
