import { useProfileReposts } from '@audius/common/api'
import { Status } from '@audius/common/models'
import { profilePageFeedLineupActions as feedActions } from '@audius/common/store'
import { useRoute } from '@react-navigation/native'

import { Lineup } from 'app/components/lineup'

import { EmptyProfileTile } from '../EmptyProfileTile'
import type { ProfileTabRoutes } from '../routes'
import { useSelectProfile } from '../selectors'

export const RepostsTab = () => {
  const { params } = useRoute<ProfileTabRoutes<'Reposts'>>()
  const { lazy } = params
  const { handle, repost_count } = useSelectProfile(['handle', 'repost_count'])

  const { fetchNextPage, lineup, pageSize, isFetchingNextPage, hasNextPage } =
    useProfileReposts({
      handle
    })

  // This prevents showing empty tile before lineup has started to fetch content
  const canShowEmptyTile = repost_count === 0 || lineup.status !== Status.IDLE

  return (
    <Lineup
      tanQuery
      lazy={lazy}
      pullToRefresh
      actions={feedActions}
      lineup={lineup}
      loadMore={() => {
        if (!isFetchingNextPage && hasNextPage) {
          fetchNextPage()
        }
      }}
      count={repost_count}
      pageSize={pageSize}
      disableTopTabScroll
      LineupEmptyComponent={
        canShowEmptyTile ? <EmptyProfileTile tab='reposts' /> : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  )
}
