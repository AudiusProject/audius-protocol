import { useMemo } from 'react'

import { Event as EventSDK, Id, OptionalId, decodeHashId } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'
import { keyBy } from 'lodash'

import { useAudiusQueryContext } from '~/audius-query'
import { Event } from '~/models/Event'
import { ID } from '~/models/Identifiers'

import { SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../useCurrentUserId'

import { getEventsByEntityIdQueryKey, EventsByEntityIdOptions } from './utils'

const transformEvent = (event: EventSDK): Event => ({
  ...event,
  eventId: decodeHashId(event.eventId)!,
  userId: decodeHashId(event.userId)!,
  entityId: event.entityId ? (decodeHashId(event.entityId) ?? null) : null
})

type UseEventsByEntityIdOptions<TResult = Event[]> = SelectableQueryOptions<
  Event[],
  TResult
> &
  EventsByEntityIdOptions

export const useEventsByEntityId = <TResult = Event[]>(
  entityId: ID | null | undefined,
  options?: UseEventsByEntityIdOptions<TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()

  const queryData = useQuery({
    queryKey: getEventsByEntityIdQueryKey(entityId, options),
    queryFn: async () => {
      if (!entityId) return []
      const sdk = await audiusSdk()
      const response = await sdk.events.getEntityEvents({
        entityId: Id.parse(entityId),
        userId: OptionalId.parse(currentUserId),
        entityType: options?.entityType,
        filterDeleted: options?.filterDeleted,
        offset: options?.offset,
        limit: options?.limit
      })
      const events = response.data ?? []
      return events.map(transformEvent)
    },
    enabled: options?.enabled !== false && entityId !== undefined
  })

  return queryData
}
