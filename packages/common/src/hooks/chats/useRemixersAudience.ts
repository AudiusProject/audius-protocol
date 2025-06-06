import { useMemo } from 'react'

import { useRemixedTracks, useRemixersCount } from '~/api'
import { ID } from '~/models'

export const useRemixersAudience = ({
  remixedTrackId
}: {
  remixedTrackId?: ID
}) => {
  const { data: remixersCount } = useRemixersCount({ trackId: remixedTrackId })

  const { data: remixedTracks } = useRemixedTracks()
  const isDisabled = !remixedTracks?.length

  const remixedTracksOptions = useMemo(
    () =>
      (remixedTracks ?? []).map((track) => ({
        value: track.trackId,
        label: track.title
      })),
    [remixedTracks]
  )

  return {
    isDisabled,
    remixersCount,
    remixedTracksOptions
  }
}
