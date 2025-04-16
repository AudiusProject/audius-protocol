import { useMemo } from 'react'

import { Id, OptionalId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { eventMetadataFromSDK } from '~/adapters/event'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'
import { Event } from '~/models/Event'
import { removeNullable } from '~/utils'

import { SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../useCurrentUserId'

import {
  getEventsByEntityIdQueryKey,
  EventsByEntityIdOptions,
  getEventQueryKey
} from './utils'

export const useEventsByEntityId = <TReturn extends Event>(
  args: EventsByEntityIdOptions,
  options?: SelectableQueryOptions<ID[], TReturn>
) => {
  const { entityId, ...restArgs } = args ?? {}
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const select = useMemo(() => options?.select, [])

  const queryData = useQuery({
    queryKey: getEventsByEntityIdQueryKey(args),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const response = await sdk.events.getEntityEvents({
        entityId: Id.parse(entityId),
        userId: OptionalId.parse(currentUserId),
        ...restArgs
      })
      const events = response.data ?? []
      const eventsMetadata = events
        .map(eventMetadataFromSDK)
        .filter(removeNullable)

      eventsMetadata.forEach((event) => {
        queryClient.setQueryData(getEventQueryKey(event.eventId), event)
      })

      return eventsMetadata.map((event) => event.eventId)
    },
    ...options,
    enabled: options?.enabled !== false && !!entityId,
    select
  })

  return queryData
}
