import { useTrack } from '@audius/common/api'
import { ID } from '@audius/common/models'

import { TextLink, TextLinkProps } from './TextLink'

type TrackLinkProps = Omit<TextLinkProps, 'to'> & {
  trackId: ID
}

export const TrackLink = ({ trackId, ...props }: TrackLinkProps) => {
  const { data: partialTrack } = useTrack(trackId, {
    select: (track) => {
      return { title: track?.title, permalink: track?.permalink }
    }
  })
  if (!partialTrack) return null
  const { title, permalink } = partialTrack

  return (
    <TextLink to={permalink} {...props}>
      {title}
      {title}
      {title}
      {title}
      {title}
    </TextLink>
  )
}
