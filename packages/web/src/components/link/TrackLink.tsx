import { useTrack } from '@audius/common/api'
import { ID } from '@audius/common/models'

import { TextLink, TextLinkProps } from './TextLink'

type TrackLinkProps = Omit<TextLinkProps, 'to'> & {
  trackId: ID
}

export const TrackLink = ({ trackId, ...props }: TrackLinkProps) => {
  const { data: track } = useTrack(trackId, {
    select: (track) => {
      return { title: track?.title, permalink: track?.permalink }
    }
  })
  if (!track) return null

  return (
    <TextLink to={track.permalink} {...props}>
      {track.title}
    </TextLink>
  )
}
