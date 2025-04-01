import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'

export const getEventQueryKey = (eventId: ID | null | undefined) => [
  QUERY_KEYS.events,
  eventId
]

export const getEventListQueryKey = ({
  pageSize,
  sortMethod
}: {
  pageSize?: number
  sortMethod?: 'newest' | 'timestamp'
}) => [QUERY_KEYS.events, { pageSize, sortMethod }]
