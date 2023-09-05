import { useCallback, useEffect } from 'react'

import {
  profilePageSelectors,
  profilePageTracksLineupActions as tracksActions
} from '@audius/common'
import type { RouteProp } from '@react-navigation/core'
import { useRoute } from '@react-navigation/core'
import { useDispatch, useSelector } from 'react-redux'

import { Lineup } from 'app/components/lineup'

import { EmptyProfileTile } from './EmptyProfileTile'
import { getIsOwner, useSelectProfile } from './selectors'
const { getProfileTracksLineup, getProfileUserHandle } = profilePageSelectors

export const TracksTab = () => {
  const { params } =
    useRoute<RouteProp<{ Tracks: { handle: string } }, 'Tracks'>>()
  const lineup = useSelector(getProfileTracksLineup)
  const dispatch = useDispatch()

  const profileHandle = useSelector(getProfileUserHandle)
  const isOwner = useSelector(getIsOwner)

  const isProfileLoaded =
    profileHandle === params?.handle ||
    (params?.handle === 'accountUser' && isOwner)

  const { user_id, track_count, _artist_pick } = useSelectProfile([
    'user_id',
    'track_count',
    '_artist_pick'
  ])

  useEffect(() => {
    if (isProfileLoaded) {
      dispatch(tracksActions.fetchLineupMetadatas())
    }
  }, [dispatch, isProfileLoaded])

  // TODO: use fetchPayload (or change Remixes page)
  const loadMore = useCallback(
    (offset: number, limit: number) => {
      dispatch(
        tracksActions.fetchLineupMetadatas(offset, limit, false, {
          userId: user_id
        })
      )
    },
    [dispatch, user_id]
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
