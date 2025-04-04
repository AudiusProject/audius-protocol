import { EventEventTypeEnum } from '@audius/sdk'

import { Event } from '~/models/Event'
import { ID } from '~/models/Identifiers'

import { SelectableQueryOptions } from '../types'

import { useEventsByEntityId } from './useEventsByEntityId'
import { EventsByEntityIdOptions } from './utils'

type UseRemixContestOptions<TResult = Event[]> = SelectableQueryOptions<
  Event[],
  TResult
> &
  EventsByEntityIdOptions

/**
 * Hook to fetch the remix contest event for a given entity ID.
 * Returns the first RemixContest event found, or null if none exists.
 */
export const useRemixContest = (
  entityId: ID | null | undefined,
  options?: UseRemixContestOptions
) => {
  const eventsQuery = useEventsByEntityId<Event | null>(entityId, {
    ...options,
    select: (events) =>
      events.find(
        (event) => event.eventType === EventEventTypeEnum.RemixContest
      ) ?? null
  })

  return eventsQuery
}
