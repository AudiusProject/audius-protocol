import { useMemo } from 'react'

import { useProfileTracks } from '@audius/common/api'
import { profilePageTracksLineupActions as tracksActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { TanQueryLineup } from 'app/components/lineup/TanQueryLineup'

import { EmptyProfileTile } from '../EmptyProfileTile'
import { useSelectProfile } from '../selectors'

export const TracksTab = () => {
  const { handle, user_id, artist_pick_track_id } = useSelectProfile([
    'handle',
    'user_id',
    'artist_pick_track_id'
  ])
  const {
    data,
    lineup,
    loadNextPage,
    pageSize,
    isFetching,
    refresh: refreshQuery,
    isPending,
    hasNextPage
  } = useProfileTracks({
    handle
  })

  const fetchPayload = useMemo(() => ({ userId: user_id }), [user_id])
  const extraFetchOptions = useMemo(() => ({ handle }), [handle])

  return (
    <TanQueryLineup
      selfLoad
      pullToRefresh
      leadingElementId={artist_pick_track_id}
      actions={tracksActions}
      lineup={lineup}
      loadMore={loadNextPage}
      fetchPayload={fetchPayload}
      extraFetchOptions={extraFetchOptions}
      disableTopTabScroll
      LineupEmptyComponent={<EmptyProfileTile tab='tracks' />}
      showsVerticalScrollIndicator={false}
      // Tan query props
      pageSize={pageSize}
      isFetching={isFetching}
      isPending={isPending}
      queryData={data}
      loadNextPage={loadNextPage}
      hasMore={hasNextPage}
      refresh={refreshQuery}
    />
  )
}
