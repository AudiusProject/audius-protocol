import { EventEntityTypeEnum, EventEventTypeEnum } from '@audius/sdk'

import { Event } from '~/models/Event'
import { ID } from '~/models/Identifiers'

import { SelectableQueryOptions } from '../types'

import { useEventsByEntityId } from './useEventsByEntityId'

/**
 * Hook to fetch the remix contest event for a given entity ID.
 * Returns the first active RemixContest event found, or null if none exists.
 */
export const useRemixContest = (
  entityId: ID | null | undefined,
  options?: SelectableQueryOptions<Event[], Event>
) => {
  const eventsQuery = useEventsByEntityId(
    {
      entityId,
      entityType: EventEntityTypeEnum.Track,
      eventType: EventEventTypeEnum.RemixContest,
      filterDeleted: true,
      limit: 1
    },
    { ...options, select: (events) => events[0] }
  )

  return eventsQuery
}
