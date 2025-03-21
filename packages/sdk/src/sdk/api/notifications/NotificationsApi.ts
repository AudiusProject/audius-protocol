import type { Configuration } from '../../api/generated/default'
import type { EntityManagerService } from '../../services'
import { Action, EntityType } from '../../services/EntityManager/types'
import { parseParams } from '../../utils/parseParams'

import {
  MarkAllNotificationsAsViewedRequest,
  UpdatePlaylistLastViewedAtRequest,
  MarkAllNotificationsAsViewedSchema,
  UpdatePlaylistLastViewedAtSchema
} from './types'

export class NotificationsApi {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    _config: Configuration,
    private readonly entityManager: EntityManagerService
  ) {}

  /**
   * When a user views all of their notifications
   */
  async markAllNotificationsAsViewed(
    params: MarkAllNotificationsAsViewedRequest
  ) {
    const { userId } = await parseParams(
      'markAllNotificationsAsViewed',
      MarkAllNotificationsAsViewedSchema
    )(params)
    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.NOTIFICATION,
      // In this case, we are the entityId since we are marking our own notifications as viewed
      entityId: userId,
      action: Action.VIEW,
      metadata: ''
    })
  }

  /**
   * When a user views a playlist
   */
  async updatePlaylistLastViewedAt(params: UpdatePlaylistLastViewedAtRequest) {
    const { playlistId, userId } = await parseParams(
      'updatePlaylistLastViewedAt',
      UpdatePlaylistLastViewedAtSchema
    )(params)
    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.NOTIFICATION,
      entityId: playlistId,
      action: Action.VIEW_PLAYLIST,
      metadata: ''
    })
  }
}
