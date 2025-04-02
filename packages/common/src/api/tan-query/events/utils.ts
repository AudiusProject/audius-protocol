import { ID } from '~/models'
import { Event } from '~/models/Event'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey } from '../types'

export const getEventQueryKey = (eventId: ID | null | undefined) => {
  return [QUERY_KEYS.events, eventId] as unknown as QueryKey<Event>
}

export const getEventListQueryKey = ({ pageSize }: { pageSize?: number }) => {
  return [QUERY_KEYS.events, { pageSize }] as unknown as QueryKey<Event[]>
}
