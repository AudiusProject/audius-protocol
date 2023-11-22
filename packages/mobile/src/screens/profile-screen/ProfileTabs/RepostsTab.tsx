import { useCallback, useMemo } from 'react'

import {
  profilePageSelectors,
  profilePageFeedLineupActions as feedActions,
  useProxySelector,
  Status
} from '@audius/common'
import { useRoute } from '@react-navigation/native'
import { useDispatch } from 'react-redux'

import { Lineup } from 'app/components/lineup'

import { EmptyProfileTile } from '../EmptyProfileTile'
import type { ProfileTabRoutes } from '../routes'
import { useSelectProfile } from '../selectors'

const { getProfileFeedLineup } = profilePageSelectors

export const RepostsTab = () => {
  const dispatch = useDispatch()
  const { params } = useRoute<ProfileTabRoutes<'Reposts'>>()
  const { lazy } = params
  const { handle, user_id, repost_count } = useSelectProfile([
    'handle',
    'user_id',
    'repost_count'
  ])
  const handleLower = handle.toLowerCase()

  const lineup = useProxySelector(
    (state) => getProfileFeedLineup(state, handleLower),
    [handleLower]
  )

  const loadMore = useCallback(
    (offset: number, limit: number) => {
      dispatch(
        feedActions.fetchLineupMetadatas(
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

  const extraFetchOptions = useMemo(
    () => ({ handle: handleLower }),
    [handleLower]
  )

  // This prevents showing empty tile before lineup has started to fetch content
  const canShowEmptyTile = repost_count === 0 || lineup.status !== Status.IDLE

  return (
    <Lineup
      selfLoad
      lazy={lazy}
      actions={feedActions}
      lineup={lineup}
      loadMore={loadMore}
      limit={repost_count}
      disableTopTabScroll
      LineupEmptyComponent={
        canShowEmptyTile ? <EmptyProfileTile tab='reposts' /> : undefined
      }
      showsVerticalScrollIndicator={false}
      extraFetchOptions={extraFetchOptions}
    />
  )
}
