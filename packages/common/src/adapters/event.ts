import { Event as EventSDK, HashId, OptionalHashId } from '@audius/sdk'

import { Event } from '~/models/Event'

export const eventMetadataFromSDK = (input: EventSDK): Event | undefined => {
  const { eventId, userId, entityId, ...rest } = input

  const decodedEventId = HashId.parse(eventId)
  const decodedUserId = HashId.parse(userId)
  const decodedEntityId = entityId ? OptionalHashId.parse(entityId) : null

  if (!decodedEventId || !decodedUserId) {
    return undefined
  }

  return {
    ...rest,
    eventId: decodedEventId,
    userId: decodedUserId,
    entityId: decodedEntityId ?? null
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
