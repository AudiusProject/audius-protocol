import { useMemo } from 'react'

import { Id, OptionalId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { eventMetadataFromSDK } from '~/adapters/event'
import { useAudiusQueryContext } from '~/audius-query'
import { Event } from '~/models/Event'
import { ID } from '~/models/Identifiers'
import { removeNullable } from '~/utils'

import { SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../useCurrentUserId'

import {
  getEventsByEntityIdQueryKey,
  EventsByEntityIdOptions,
  getEventQueryKey
} from './utils'

type UseEventsByEntityIdOptions<TResult = Event[]> = SelectableQueryOptions<
  Event[],
  TResult
> &
  EventsByEntityIdOptions

export const useEventsByEntityId = <TResult>(
  entityId: ID | null | undefined,
  options?: UseEventsByEntityIdOptions<TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const select = useMemo(() => options?.select, [])

  const queryData = useQuery({
    queryKey: getEventsByEntityIdQueryKey(entityId, options),
    queryFn: async () => {
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
      const eventsMetadata = events
        .map(eventMetadataFromSDK)
        .filter(removeNullable)

      eventsMetadata.forEach((event) => {
        queryClient.setQueryData(getEventQueryKey(event.eventId), event)
      })

      return eventsMetadata
    },
    enabled: options?.enabled !== false && entityId !== undefined,
    select
  })

  return queryData
}
