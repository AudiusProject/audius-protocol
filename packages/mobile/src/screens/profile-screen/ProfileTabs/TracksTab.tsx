import { useMemo } from 'react'

import {
  profilePageSelectors,
  profilePageTracksLineupActions as tracksActions
} from '@audius/common'
import { useProxySelector } from '@audius/common/hooks'

import { Lineup } from 'app/components/lineup'

import { EmptyProfileTile } from '../EmptyProfileTile'
import { useSelectProfile } from '../selectors'

const { getProfileTracksLineup } = profilePageSelectors

export const TracksTab = () => {
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

  const fetchPayload = useMemo(() => ({ userId: user_id }), [user_id])
  const extraFetchOptions = useMemo(() => ({ handle }), [handle])

  return (
    <Lineup
      selfLoad
      pullToRefresh
      leadingElementId={artist_pick_track_id}
      actions={tracksActions}
      lineup={lineup}
      fetchPayload={fetchPayload}
      extraFetchOptions={extraFetchOptions}
      disableTopTabScroll
      LineupEmptyComponent={<EmptyProfileTile tab='tracks' />}
      showsVerticalScrollIndicator={false}
    />
  )
}
