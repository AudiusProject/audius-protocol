import { useCallback } from 'react'

import {
  profilePageSelectors,
  profilePageTracksLineupActions as tracksActions
} from '@audius/common'
import type { RouteProp } from '@react-navigation/core'
import { useRoute } from '@react-navigation/core'

import { Lineup } from 'app/components/lineup'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { EmptyProfileTile } from './EmptyProfileTile'
import { getIsOwner, useSelectProfile } from './selectors'
const { getProfileTracksLineup, getProfileUserHandle } = profilePageSelectors

export const TracksTab = () => {
  const { params } =
    useRoute<RouteProp<{ Tracks: { handle: string } }, 'Tracks'>>()
  const lineup = useSelectorWeb(getProfileTracksLineup, isEqual)
  const dispatchWeb = useDispatchWeb()

  const profileHandle = useSelectorWeb(getProfileUserHandle)
  const isOwner = useSelectorWeb(getIsOwner)

  const isProfileLoaded =
    profileHandle === params?.handle ||
    (params?.handle === 'accountUser' && isOwner)

  const { user_id, track_count, _artist_pick } = useSelectProfile([
    'user_id',
    'track_count',
    '_artist_pick'
  ])

  // TODO: use fetchPayload (or change Remixes page)
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

  /**
   * If the profile isn't loaded yet, pass the lineup an empty entries
   * array so only skeletons are displayed
   */
  return (
    <Lineup
      leadingElementId={_artist_pick}
      listKey='profile-tracks'
      actions={tracksActions}
      lineup={isProfileLoaded ? lineup : { ...lineup, entries: [] }}
      limit={track_count}
      loadMore={loadMore}
      disableTopTabScroll
      ListEmptyComponent={<EmptyProfileTile tab='tracks' />}
      showsVerticalScrollIndicator={false}
    />
  )
}
