import { useMemo } from 'react'

import { useProfileTracks } from '@audius/common/api'
import { profilePageTracksLineupActions as tracksActions } from '@audius/common/store'

import { Lineup } from 'app/components/lineup'

import { EmptyProfileTile } from '../EmptyProfileTile'
import { useSelectProfile } from '../selectors'

export const TracksTab = () => {
  const { handle, user_id, artist_pick_track_id } = useSelectProfile([
    'handle',
    'user_id',
    'artist_pick_track_id'
  ])

  const { lineup, loadNextPage } = useProfileTracks({ handle })

  const fetchPayload = useMemo(() => ({ userId: user_id }), [user_id])
  const extraFetchOptions = useMemo(() => ({ handle }), [handle])

  return (
    <Lineup
      selfLoad
      pullToRefresh
      leadingElementId={artist_pick_track_id}
      actions={tracksActions}
      lineup={lineup}
      tanQuery
      loadMore={loadNextPage}
      fetchPayload={fetchPayload}
      extraFetchOptions={extraFetchOptions}
      disableTopTabScroll
      LineupEmptyComponent={<EmptyProfileTile tab='tracks' />}
      showsVerticalScrollIndicator={false}
    />
  )
}
