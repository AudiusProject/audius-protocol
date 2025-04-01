import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'

export const getEventQueryKey = (eventId: ID | null | undefined) => [
  QUERY_KEYS.events,
  eventId
]

export const getEventListQueryKey = ({ pageSize }: { pageSize?: number }) => [
  QUERY_KEYS.events,
  { pageSize }
]
