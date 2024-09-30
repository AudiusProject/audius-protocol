import { useMemo } from 'react'

import {
  useGetCurrentUserId,
  useGetRemixedTracks,
  useGetRemixersCount
} from '~/api'
import { ID } from '~/models'

export const useRemixersAudience = ({
  remixedTrackId
}: {
  remixedTrackId?: ID
}) => {
  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: remixersCount } = useGetRemixersCount({
    userId: currentUserId!,
    trackId: remixedTrackId
  })

  const { data: remixedTracks } = useGetRemixedTracks({
    userId: currentUserId!
  })
  const isDisabled = !remixedTracks?.length

  const remixedTracksOptions = useMemo(
    () =>
      (remixedTracks ?? []).map((track) => ({
        value: track.trackId,
        // TODO: Use track title
        label: track.trackId
      })),
    [remixedTracks]
  )

  return {
    isDisabled,
    remixersCount,
    remixedTracksOptions
  }
}
