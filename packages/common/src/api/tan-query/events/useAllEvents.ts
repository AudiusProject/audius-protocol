import { Event as SDKEvent } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

import { eventMetadataFromSDK } from '~/adapters/event'
import { useAudiusQueryContext } from '~/audius-query'
import { Event } from '~/models/Event'

import { QueryOptions } from '../types'
import { useCurrentUserId } from '../useCurrentUserId'

import { getEventQueryKey, getEventListQueryKey } from './utils'

const DEFAULT_PAGE_SIZE = 25

type UseAllEventsArgs = {
  pageSize?: number
  sortMethod?: 'newest' | 'timestamp'
}

/**
 * Hook to fetch all events with infinite query support.
 * This version supports infinite scrolling and maintains the full list of events.
 */
export const useAllEvents = (
  {
    pageSize = DEFAULT_PAGE_SIZE,
    sortMethod = 'newest'
  }: UseAllEventsArgs = {},
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()

  const queryRes = useInfiniteQuery({
    queryKey: getEventListQueryKey({ pageSize, sortMethod }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: Event[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data } = await sdk.events.getAllEvents({
        limit: pageSize,
        offset: pageParam,
        userId: currentUserId?.toString(),
        sortMethod
      })

      if (!data) return []

      const events = data
        .map((sdkEvent: SDKEvent) => {
          const event = eventMetadataFromSDK(sdkEvent)
          if (!event) return null
          // Prime the event cache with individual events
          queryClient.setQueryData(getEventQueryKey(event.eventId), event)
          return event
        })
        .filter((event): event is Event => event !== null)

      return events
    },
    select: (data) => data.pages.flat(),
    ...options
  })

  return {
    data: queryRes.data,
    isPending: queryRes.isPending,
    isLoading: queryRes.isLoading,
    isSuccess: queryRes.isSuccess,
    hasNextPage: queryRes.hasNextPage,
    isFetchingNextPage: queryRes.isFetchingNextPage,
    fetchNextPage: queryRes.fetchNextPage
  }
}
