import { useCurrentCommentSection } from '@audius/common/context'
import { formatTrackTimestamp, TextLink, TextLinkProps } from '@audius/harmony'

type TimestampLinkProps = {
  timestampSeconds: number
} & TextLinkProps

export const TimestampLink = (props: TimestampLinkProps) => {
  const { timestampSeconds, ...other } = props
  const { playTrack } = useCurrentCommentSection()

  return (
    <TextLink
      onClick={() => playTrack(timestampSeconds)}
      variant='visible'
      size='s'
      {...other}
    >
      {formatTrackTimestamp(timestampSeconds)}
    </TextLink>
  )
}
