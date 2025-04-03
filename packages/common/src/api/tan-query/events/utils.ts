import { GetEntityEventsEntityTypeEnum } from '@audius/sdk'

import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'

export type EventsByEntityIdOptions = {
  entityType?: GetEntityEventsEntityTypeEnum
  filterDeleted?: boolean
  offset?: number
  limit?: number
}

export const getEventQueryKey = (eventId: ID | null | undefined) => [
  QUERY_KEYS.events,
  eventId
]

export const getEventListQueryKey = ({ pageSize }: { pageSize?: number }) => [
  QUERY_KEYS.events,
  { pageSize }
]

export const getEventsByEntityIdQueryKey = (
  entityId: ID | null | undefined,
  options?: EventsByEntityIdOptions
) =>
  [
    QUERY_KEYS.eventsByEntityId,
    entityId,
    options?.entityType,
    options?.filterDeleted,
    options?.offset,
    options?.limit
  ] as const
