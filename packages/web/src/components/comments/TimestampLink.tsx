import { useCallback, MouseEvent } from 'react'

import { useCurrentCommentSection } from '@audius/common/context'
import { formatTrackTimestamp, TextLink, TextLinkProps } from '@audius/harmony'

type TimestampLinkProps = {
  timestampSeconds: number
  onClick?: (e: MouseEvent<HTMLAnchorElement>, timestampSeconds: number) => void
} & Omit<TextLinkProps, 'onClick'>

export const TimestampLink = (props: TimestampLinkProps) => {
  const { timestampSeconds, onClick, ...other } = props
  const { playTrack } = useCurrentCommentSection()

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      playTrack(timestampSeconds)
      onClick?.(e, timestampSeconds)
    },
    [timestampSeconds, playTrack, onClick]
  )

  return (
    <TextLink onClick={handleClick} variant='visible' {...other}>
      {formatTrackTimestamp(timestampSeconds)}
    </TextLink>
  )
}
