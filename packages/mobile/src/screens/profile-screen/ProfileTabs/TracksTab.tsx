import { useProfileTracks } from '@audius/common/api'
import { profilePageTracksLineupActions as tracksActions } from '@audius/common/store'

import { Lineup } from 'app/components/lineup'

import { EmptyProfileTile } from '../EmptyProfileTile'
import { useSelectProfile } from '../selectors'

export const TracksTab = () => {
  const { handle, artist_pick_track_id } = useSelectProfile([
    'handle',
    'user_id',
    'artist_pick_track_id'
  ])

  const { fetchNextPage, lineup, pageSize } = useProfileTracks({
    handle
  })

  const loadMore = () => {
    fetchNextPage()
  }

  return (
    <Lineup
      tanQuery
      pullToRefresh
      leadingElementId={artist_pick_track_id}
      actions={tracksActions}
      lineup={lineup}
      loadMore={loadMore}
      pageSize={pageSize}
      disableTopTabScroll
      LineupEmptyComponent={<EmptyProfileTile tab='tracks' />}
      showsVerticalScrollIndicator={false}
    />
  )
}
