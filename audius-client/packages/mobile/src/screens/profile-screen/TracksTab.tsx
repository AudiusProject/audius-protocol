import { useCallback } from 'react'

import { tracksActions } from 'audius-client/src/common/store/pages/profile/lineups/tracks/actions'

import { Lineup } from 'app/components/lineup'
import { useProfile } from 'app/hooks/selectors'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'

import { EmptyProfileTile } from './EmptyProfileTile'
import { useProfileTracksLineup } from './selectors'

export const TracksTab = () => {
  const profile = useProfile()
  const lineup = useProfileTracksLineup()
  const dispatchWeb = useDispatchWeb()

  const loadMore = useCallback(
    (offset: number, limit: number) => {
      if (!profile) return
      dispatchWeb(
        tracksActions.fetchLineupMetadatas(offset, limit, false, {
          userId: profile.user_id
        })
      )
    },
    [dispatchWeb, profile]
  )

  if (!profile) return null

  if (profile.track_count === 0) {
    return <EmptyProfileTile profile={profile} tab='tracks' />
  }

  return (
    <Lineup
      leadingElementId={profile._artist_pick}
      listKey='profile-tracks'
      actions={tracksActions}
      lineup={lineup}
      limit={profile.track_count}
      loadMore={loadMore}
      disableTopTabScroll
    />
  )
}
