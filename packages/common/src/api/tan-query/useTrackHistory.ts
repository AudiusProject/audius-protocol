import { Id, full } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { trackActivityFromSDK, transformAndCleanList } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { UserTrackMetadata } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeTrackData } from './utils/primeTrackData'

const DEFAULT_PAGE_SIZE = 15

type UseTrackHistoryArgs = {
  pageSize?: number
  query?: string
  sortMethod?: full.GetUsersTrackHistorySortMethodEnum
  sortDirection?: full.GetUsersTrackHistorySortDirectionEnum
}

export const useTrackHistory = (
  {
    pageSize = DEFAULT_PAGE_SIZE,
    query,
    sortMethod,
    sortDirection
  }: UseTrackHistoryArgs = {},
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useInfiniteQuery({
    queryKey: [
      QUERY_KEYS.trackHistory,
      pageSize,
      query,
      sortMethod,
      sortDirection
    ],
    initialPageParam: 0,
    getNextPageParam: (lastPage: UserTrackMetadata[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      if (!currentUserId) return []

      const { data: activityData } = await sdk.full.users.getUsersTrackHistory({
        id: Id.parse(currentUserId),
        limit: pageSize,
        offset: pageParam,
        query,
        sortMethod,
        sortDirection
      })

      if (!activityData) return []

      const tracks = transformAndCleanList(
        activityData,
        (activity: full.ActivityFull) => trackActivityFromSDK(activity)?.item
      )
      primeTrackData({ tracks, queryClient, dispatch })
      return tracks
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!currentUserId
  })
}
