import { useMemo } from 'react'

import { useProfileUser } from '@audius/common/api'
import { useProxySelector } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import {
  profilePageFeedLineupActions as feedActions,
  profilePageSelectors
} from '@audius/common/store'
import { useRoute } from '@react-navigation/native'

import { Lineup } from 'app/components/lineup'

import { EmptyProfileTile } from '../EmptyProfileTile'
import type { ProfileTabRoutes } from '../routes'

const { getProfileFeedLineup } = profilePageSelectors

export const RepostsTab = () => {
  const { params } = useRoute<ProfileTabRoutes<'Reposts'>>()
  const { lazy } = params
  const {
    handle = '',
    user_id,
    repost_count = 0
  } = useProfileUser({
    select: (user) => ({
      handle: user.handle,
      user_id: user.user_id,
      repost_count: user.repost_count
    })
  }).user ?? {}

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
      isCollapsible
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
