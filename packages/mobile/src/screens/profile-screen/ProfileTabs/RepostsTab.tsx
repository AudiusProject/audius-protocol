import { useMemo } from 'react'

import { useProfileReposts } from '@audius/common/api'
import { Status } from '@audius/common/models'
import { profilePageFeedLineupActions as feedActions } from '@audius/common/store'
import { useRoute } from '@react-navigation/native'
import { useDispatch } from 'react-redux'

import { TanQueryLineup } from 'app/components/lineup/TanQueryLineup'

import { EmptyProfileTile } from '../EmptyProfileTile'
import type { ProfileTabRoutes } from '../routes'
import { useSelectProfile } from '../selectors'

export const RepostsTab = () => {
  const { params } = useRoute<ProfileTabRoutes<'Reposts'>>()
  const { lazy } = params
  const { handle, user_id, repost_count } = useSelectProfile([
    'handle',
    'user_id',
    'repost_count'
  ])

  const {
    data,
    isFetching,
    isPending,
    lineup,
    loadNextPage,
    pageSize,
    refresh: refreshQuery,
    hasNextPage
  } = useProfileReposts({ handle })

  const fetchPayload = useMemo(() => ({ userId: user_id }), [user_id])
  const extraFetchOptions = useMemo(() => ({ handle }), [handle])

  // This prevents showing empty tile before lineup has started to fetch content
  const canShowEmptyTile = repost_count === 0 || lineup.status !== Status.IDLE

  return (
    <TanQueryLineup
      selfLoad
      lazy={lazy}
      pullToRefresh
      actions={feedActions}
      fetchPayload={fetchPayload}
      extraFetchOptions={extraFetchOptions}
      limit={repost_count}
      disableTopTabScroll
      LineupEmptyComponent={
        canShowEmptyTile ? <EmptyProfileTile tab='reposts' /> : undefined
      }
      showsVerticalScrollIndicator={false}
      // Tan query props
      loadNextPage={loadNextPage}
      hasMore={hasNextPage}
      pageSize={pageSize}
      queryData={data}
      isFetching={isFetching}
      isPending={isPending}
      lineup={lineup}
      refresh={refreshQuery}
    />
  )
}
