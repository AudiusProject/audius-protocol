import snakecaseKeys from 'snakecase-keys'

import { LoggerService } from '../../services'
import {
  EntityManagerService,
  EntityType,
  Action
} from '../../services/EntityManager/types'
import { decodeHashId } from '../../utils/hashId'
import {
  Configuration,
  EventsApi as GeneratedEventsApi
} from '../generated/default'

type EventMetadata = {
  userId: number
  eventId: number
  eventType?: string
  entityType?: string
  entityId?: number
  isDeleted?: boolean
  endDate?: string // ISO format date string
}

export class EventsApi extends GeneratedEventsApi {
  constructor(
    configuration: Configuration,
    private readonly entityManager: EntityManagerService,
    private readonly logger: LoggerService
  ) {
    super(configuration)
    this.logger = logger.createPrefixedLogger('[events-api]')
  }

  async generateEventId() {
    const response = await this.getUnclaimedEventID()
    const { data: unclaimedId } = response
    if (!unclaimedId) {
      return Math.floor(Math.random() * 1000000)
    }
    return decodeHashId(unclaimedId)!
  }

  async createEvent(metadata: EventMetadata) {
    const {
      userId,
      eventId,
      eventType,
      entityType,
      entityId: eventEntityId,
      isDeleted,
      endDate
    } = metadata
    const entityId = eventId ?? (await this.generateEventId())

    const response = await this.entityManager.manageEntity({
      entityId,
      userId,
      entityType: EntityType.EVENT,
      action: Action.CREATE,
      metadata: JSON.stringify({
        cid: '',
        data: snakecaseKeys({
          eventType,
          entityType,
          entityId: eventEntityId,
          isDeleted,
          endDate
        })
      })
    })
    this.logger.info('Successfully created a event')
    return response
  }

  async updateEvent(metadata: EventMetadata) {
    const { userId, eventId, isDeleted, endDate } = metadata
    const response = await this.entityManager.manageEntity({
      entityId: eventId,
      userId,
      entityType: EntityType.EVENT,
      action: Action.UPDATE,
      metadata: JSON.stringify({
        cid: '',
        data: snakecaseKeys({
          isDeleted,
          endDate
        })
      })
    })
    this.logger.info('Successfully updated the event')
    return response
  }

  async deleteEvent(metadata: EventMetadata) {
    const { userId, eventId } = metadata

    const response = await this.entityManager.manageEntity({
      entityId: eventId,
      userId,
      entityType: EntityType.EVENT,
      action: Action.DELETE,
      metadata: ''
    })
    this.logger.info('Successfully deleted the event')
    return response
  }
}
