import { useMemo } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { keyBy } from 'lodash'
import { useDispatch } from 'react-redux'

import { useQueryContext } from '~/api/tan-query/utils'
import { Event } from '~/models/Event'
import { ID } from '~/models/Identifiers'

import { getEventsBatcher } from '../batchers/getEventsBatcher'
import { QueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'
import { combineQueryResults } from '../utils/combineQueryResults'
import { useQueries } from '../utils/useQueries'

import { getEventQueryKey } from './utils'

export const useEvents = (
  eventIds: ID[] | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  const queryResults = useQueries({
    queries: eventIds?.map((eventId) => ({
      queryKey: getEventQueryKey(eventId),
      queryFn: async () => {
        const sdk = await audiusSdk()
        const batchGetEvents = getEventsBatcher({
          sdk,
          currentUserId,
          queryClient,
          dispatch
        })
        return await batchGetEvents.fetch(eventId)
      },
      ...options,
      enabled: options?.enabled !== false && !!eventId
    })),
    combine: combineQueryResults<Event[]>
  })
  const { data: events } = queryResults

  const byId = useMemo(() => keyBy(events, 'eventId'), [events])

  return { ...queryResults, byId }
}
