import { useCallback } from 'react'

import { ID } from '~/models/Identifiers'

import { useFavoriteTrack } from './useFavoriteTrack'
import { useTrack } from './useTrack'
import { useUnfavoriteTrack } from './useUnfavoriteTrack'

type ToggleSaveTrackArgs = {
  trackId: ID
  source: string
}

export const useToggleSaveTrack = ({
  trackId,
  source
}: ToggleSaveTrackArgs) => {
  const { mutate: favoriteTrack } = useFavoriteTrack()
  const { mutate: unfavoriteTrack } = useUnfavoriteTrack()

  const { data: isSaved } = useTrack(trackId, {
    select: (track) => track?.has_current_user_saved
  })

  return useCallback(() => {
    if (isSaved) {
      unfavoriteTrack({ trackId, source })
    } else {
      favoriteTrack({ trackId, source })
    }
  }, [isSaved, favoriteTrack, unfavoriteTrack, trackId, source])
}
