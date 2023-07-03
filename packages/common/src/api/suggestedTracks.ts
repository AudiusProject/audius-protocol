import { useMemo } from 'react'

import { sampleSize } from 'lodash'
import { useSelector } from 'react-redux'

import { getUserId } from 'store/account/selectors'

import { useGetFavoritedTrackList } from './favorites'
import { useGetTracksByIds } from './track'

export const useGetSuggestedTracks = () => {
  const currentUserId = useSelector(getUserId)
  const { data: favoritedTracks } = useGetFavoritedTrackList(
    { currentUserId },
    { disabled: !currentUserId }
  )

  const favoritedTracksSample = useMemo(() => {
    return sampleSize(favoritedTracks, 5)
  }, [favoritedTracks])

  return useGetTracksByIds(
    {
      currentUserId,
      ids: favoritedTracksSample?.map((favorite) => favorite.save_item_id)
    },
    {
      disabled: !currentUserId || favoritedTracksSample.length === 0
    }
  )
}
