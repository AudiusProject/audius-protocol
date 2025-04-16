import { EventEntityTypeEnum, EventEventTypeEnum } from '@audius/sdk'

import { Event } from '~/models/Event'
import { ID } from '~/models/Identifiers'

import { SelectableQueryOptions } from '../types'

import { useEvents } from './useEvents'
import { useEventsByEntityId } from './useEventsByEntityId'

/**
 * Hook to fetch the remix contest event for a given entity ID.
 * Returns the first active RemixContest event found, or null if none exists.
 */
export const useRemixContest = (
  entityId: ID | null | undefined,
  options?: SelectableQueryOptions<ID[], Event>
) => {
  const eventsQuery = useEventsByEntityId(
    {
      entityId,
      entityType: EventEntityTypeEnum.Track,
      eventType: EventEventTypeEnum.RemixContest
    },
    { ...options }
  )

  // @ts-ignore: KJ - this is an ID[], but it thinks it's Event[]
  const { data: events } = useEvents(eventsQuery.data ?? [])

  return {
    ...eventsQuery,
    data: events?.[0]
  }
}
