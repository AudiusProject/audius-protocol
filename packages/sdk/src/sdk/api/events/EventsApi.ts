import snakecaseKeys from 'snakecase-keys'

import { LoggerService } from '../../services'
import {
  EntityManagerService,
  EntityType,
  Action
} from '../../services/EntityManager/types'
import { decodeHashId } from '../../utils/hashId'
import { parseParams } from '../../utils/parseParams'
import {
  Configuration,
  EventsApi as GeneratedEventsApi
} from '../generated/default'

import {
  CreateEventRequest,
  CreateEventSchema,
  UpdateEventRequest,
  UpdateEventSchema,
  DeleteEventRequest,
  DeleteEventSchema
} from './types'

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

  /**
   * Create an event
   */
  async createEvent(params: CreateEventRequest) {
    // Parse inputs
    const parsedParameters = await parseParams(
      'createEvent',
      CreateEventSchema
    )(params)

    const {
      userId,
      eventId,
      eventType,
      entityType,
      entityId: eventEntityId,
      endDate,
      eventData
    } = parsedParameters
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
          endDate,
          eventData
        })
      })
    })
    this.logger.info('Successfully created a event')
    return response
  }

  /**
   * Update an event
   */
  async updateEvent(params: UpdateEventRequest) {
    // Parse inputs
    const parsedParameters = await parseParams(
      'updateEvent',
      UpdateEventSchema
    )(params)

    const { userId, eventId, endDate, eventData } = parsedParameters
    const response = await this.entityManager.manageEntity({
      entityId: eventId,
      userId,
      entityType: EntityType.EVENT,
      action: Action.UPDATE,
      metadata: JSON.stringify({
        cid: '',
        data: snakecaseKeys({ endDate, eventData })
      })
    })
    this.logger.info('Successfully updated the event')
    return response
  }

  /**
   * Delete an event
   */
  async deleteEvent(params: DeleteEventRequest) {
    // Parse inputs
    const parsedParameters = await parseParams(
      'deleteEvent',
      DeleteEventSchema
    )(params)

    const { userId, eventId } = parsedParameters

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
