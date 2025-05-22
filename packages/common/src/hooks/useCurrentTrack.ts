import { useSelector } from 'react-redux'

import { useTrack } from '~/api'

import { playerSelectors } from '../store/player'

const { getTrackId } = playerSelectors

/**
 * Hook to get the current track from the player state
 * @returns The current track or null if no track is playing
 */
export const useCurrentTrack = () => {
  const trackId = useSelector(getTrackId)
  const { data: track } = useTrack(trackId)
  return track ?? null
}
