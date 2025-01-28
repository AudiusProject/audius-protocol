import { ID } from '@audius/common/models'
import { cacheTracksSelectors } from '@audius/common/store'

import { useSelector } from 'utils/reducer'

import { TextLink, TextLinkProps } from './TextLink'

const { getTrack } = cacheTracksSelectors

type TrackLinkProps = Omit<TextLinkProps, 'to'> & {
  trackId: ID
}

export const TrackLink = ({ trackId, ...props }: TrackLinkProps) => {
  const track = useSelector((state) => getTrack(state, { id: trackId }))
  if (!track) return null

  return (
    <TextLink to={track.permalink} {...props}>
      {track.title}
    </TextLink>
  )
}
