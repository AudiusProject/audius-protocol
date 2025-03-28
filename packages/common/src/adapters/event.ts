import { Event as EventSDK, HashId, OptionalHashId } from '@audius/sdk'

import { Event, EventType, EventEntityType } from '~/models/Event'
import { Nullable } from '~/utils/typeUtils'

export const eventMetadataFromSDK = (input: EventSDK): Event | undefined => {
  const {
    eventId,
    userId,
    entityId,
    eventType,
    entityType,
    eventData,
    isDeleted,
    endDate,
    createdAt,
    updatedAt,
    ...rest
  } = input

  const decodedEventId = HashId.parse(eventId)
  const decodedUserId = HashId.parse(userId)
  const decodedEntityId = entityId ? OptionalHashId.parse(entityId) : null

  if (!decodedEventId || !decodedUserId) {
    return undefined
  }

  return {
    ...rest,
    event_id: Number(decodedEventId),
    user_id: Number(decodedUserId),
    event_type: eventType as unknown as EventType,
    entity_type: entityType as Nullable<EventEntityType>,
    entity_id: decodedEntityId ? Number(decodedEntityId) : null,
    event_data: eventData as Record<string, any>,
    is_deleted: Boolean(isDeleted),
    end_date: endDate ? endDate.toISOString() : null,
    created_at: createdAt?.toISOString() ?? new Date().toISOString(),
    updated_at: updatedAt?.toISOString() ?? new Date().toISOString()
  }
}

export const eventMetadataListFromSDK = (
  inputs: EventSDK[] | undefined
): Event[] => {
  if (!inputs) return []
  return inputs
    .map(eventMetadataFromSDK)
    .filter((event): event is Event => event !== undefined)
}
