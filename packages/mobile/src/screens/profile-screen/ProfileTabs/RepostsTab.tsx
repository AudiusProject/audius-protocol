import { useMemo } from 'react'

import {
  profilePageSelectors,
  profilePageFeedLineupActions as feedActions
} from '@audius/common'
import { useProxySelector } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import { useRoute } from '@react-navigation/native'

import { Lineup } from 'app/components/lineup'

import { EmptyProfileTile } from '../EmptyProfileTile'
import type { ProfileTabRoutes } from '../routes'
import { useSelectProfile } from '../selectors'

const { getProfileFeedLineup } = profilePageSelectors

export const RepostsTab = () => {
  const { params } = useRoute<ProfileTabRoutes<'Reposts'>>()
  const { lazy } = params
  const { handle, user_id, repost_count } = useSelectProfile([
    'handle',
    'user_id',
    'repost_count'
  ])

  const lineup = useProxySelector(
    (state) => getProfileFeedLineup(state, handle),
    [handle]
  )

  const fetchPayload = useMemo(() => ({ userId: user_id }), [user_id])
  const extraFetchOptions = useMemo(() => ({ handle }), [handle])

  // This prevents showing empty tile before lineup has started to fetch content
  const canShowEmptyTile = repost_count === 0 || lineup.status !== Status.IDLE

  return (
    <Lineup
      selfLoad
      lazy={lazy}
      pullToRefresh
      actions={feedActions}
      lineup={lineup}
      fetchPayload={fetchPayload}
      extraFetchOptions={extraFetchOptions}
      limit={repost_count}
      disableTopTabScroll
      LineupEmptyComponent={
        canShowEmptyTile ? <EmptyProfileTile tab='reposts' /> : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  )
}
