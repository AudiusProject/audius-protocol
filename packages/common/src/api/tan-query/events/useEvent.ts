import { useMemo } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useQueryContext } from '~/api'
import { Event } from '~/models/Event'
import { ID } from '~/models/Identifiers'

import { getEventsBatcher } from '../batchers/getEventsBatcher'
import { SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'

import { getEventQueryKey } from './utils'

export const useEvent = <TResult = Event>(
  eventId: ID | null | undefined,
  options?: SelectableQueryOptions<Event, TResult>
) => {
  const { audiusSdk } = useQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const select = useMemo(() => options?.select, [])

  return useQuery({
    queryKey: getEventQueryKey(eventId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const batchGetEvents = getEventsBatcher({
        sdk,
        currentUserId,
        queryClient,
        dispatch
      })
      return await batchGetEvents.fetch(eventId!)
    },
    ...options,
    select,
    enabled: options?.enabled !== false && !!eventId
  })
}
