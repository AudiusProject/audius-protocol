import { useMemo } from 'react'

import { Event as EventSDK, Id, OptionalId } from '@audius/sdk'
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
  eventId: parseInt(event.eventId),
  userId: parseInt(event.userId),
  entityId: event.entityId ? parseInt(event.entityId) : null
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

  const queryKey = useMemo(
    () => getEventsByEntityIdQueryKey(entityId, options),
    [entityId, options]
  )

  const { data, ...rest } = useQuery<EventSDK[], Error, TResult>({
    queryKey: queryKey ?? ['events', 'entity', null],
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
      return response.data ?? []
    },
    select: (data: EventSDK[]) => {
      const events = data.map(transformEvent)
      return options?.select
        ? options.select(events)
        : (events as unknown as TResult)
    }
    // enabled: options?.enabled !== false && !!queryKey
  })

  const events = data as unknown as Event[] | undefined
  const byId = useMemo(() => keyBy(events ?? [], 'eventId'), [events])

  return { data, byId, ...rest }
}
