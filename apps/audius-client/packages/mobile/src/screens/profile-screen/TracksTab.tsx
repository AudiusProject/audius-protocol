import { useCallback } from 'react'

import { tracksActions } from 'audius-client/src/common/store/pages/profile/lineups/tracks/actions'
import { getProfileTracksLineup } from 'audius-client/src/common/store/pages/profile/selectors'
import { isEqual } from 'lodash'

import { Lineup } from 'app/components/lineup'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { EmptyProfileTile } from './EmptyProfileTile'
import { useSelectProfile } from './selectors'

export const TracksTab = () => {
  const lineup = useSelectorWeb(getProfileTracksLineup, isEqual)
  const dispatchWeb = useDispatchWeb()
  const { user_id, track_count, _artist_pick } = useSelectProfile([
    'user_id',
    'track_count',
    '_artist_pick'
  ])

  const loadMore = useCallback(
    (offset: number, limit: number) => {
      dispatchWeb(
        tracksActions.fetchLineupMetadatas(offset, limit, false, {
          userId: user_id
        })
      )
    },
    [dispatchWeb, user_id]
  )

  return (
    <Lineup
      leadingElementId={_artist_pick}
      listKey='profile-tracks'
      actions={tracksActions}
      lineup={lineup}
      limit={track_count}
      loadMore={loadMore}
      disableTopTabScroll
      ListEmptyComponent={<EmptyProfileTile tab='tracks' />}
      showsVerticalScrollIndicator={false}
    />
  )
}
