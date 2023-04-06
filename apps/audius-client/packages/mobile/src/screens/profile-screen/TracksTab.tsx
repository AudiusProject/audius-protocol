import { useCallback } from 'react'

import {
  profilePageSelectors,
  profilePageTracksLineupActions as tracksActions,
  useProxySelector
} from '@audius/common'
import { useDispatch } from 'react-redux'

import { Lineup } from 'app/components/lineup'

import { EmptyProfileTile } from './EmptyProfileTile'
import { useSelectProfile } from './selectors'
const { getProfileTracksLineup } = profilePageSelectors

export const TracksTab = () => {
  const dispatch = useDispatch()

  const { handle, user_id, artist_pick_track_id } = useSelectProfile([
    'handle',
    'user_id',
    'artist_pick_track_id'
  ])

  const handleLower = handle.toLowerCase()

  const lineup = useProxySelector(
    (state) => getProfileTracksLineup(state, handleLower),
    [handleLower]
  )

  const loadMore = useCallback(
    (offset: number, limit: number) => {
      dispatch(
        tracksActions.fetchLineupMetadatas(
          offset,
          limit,
          false,
          { userId: user_id },
          { handle }
        )
      )
    },
    [dispatch, user_id, handle]
  )

  return (
    <Lineup
      selfLoad
      leadingElementId={artist_pick_track_id}
      actions={tracksActions}
      lineup={lineup}
      loadMore={loadMore}
      disableTopTabScroll
      LineupEmptyComponent={<EmptyProfileTile tab='tracks' />}
      showsVerticalScrollIndicator={false}
    />
  )
}
