import { getTrackPreviewDuration, playerSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

const { getCurrentTrack, getPreviewing } = playerSelectors

export const useCurrentTrackDuration = () => {
  const track = useSelector(getCurrentTrack)
  const isPreviewing = useSelector(getPreviewing)

  return !track
    ? 0
    : isPreviewing
    ? getTrackPreviewDuration(track)
    : track.duration
}
