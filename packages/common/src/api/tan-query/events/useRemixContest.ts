import { EventEntityTypeEnum, EventEventTypeEnum } from '@audius/sdk'

import { Event } from '~/models/Event'
import { ID } from '~/models/Identifiers'

import { SelectableQueryOptions } from '../types'

import { useEvent } from './useEvent'
import { useEventIdsByEntityId } from './useEventsByEntityId'

/**
 * Hook to fetch the remix contest event for a given entity ID.
 * Returns the first active RemixContest event found, or null if none exists.
 */
export const useRemixContest = (
  entityId: ID | null | undefined,
  options?: SelectableQueryOptions<Event>
) => {
  const eventsQuery = useEventIdsByEntityId(
    {
      entityId,
      entityType: EventEntityTypeEnum.Track,
      eventType: EventEventTypeEnum.RemixContest
    },
    {
      enabled: !!options?.enabled
    }
  )

  const remixContestId = eventsQuery.data?.[0]

  const { data: remixContest } = useEvent(remixContestId, options)

  return {
    ...eventsQuery,
    data: remixContest
  }
}
