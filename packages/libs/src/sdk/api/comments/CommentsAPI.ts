import snakecaseKeys from 'snakecase-keys'

import { AuthService, LoggerService } from '../../services'
import {
  Action,
  EntityManagerService,
  EntityType
} from '../../services/EntityManager/types'
import {
  Configuration,
  CommentsApi as GeneratedCommentsApi
} from '../generated/default'

export type CommentMetadata = {
  body: string
  userId: number
  entityId: number
  entityType: Extract<EntityType, 'TRACK'> // For now we only support comments on tracks but we discussed collections as well
  parentCommentId?: number
  timestamp_s?: number
}
export class CommentsApi extends GeneratedCommentsApi {
  constructor(
    configuration: Configuration,
    private readonly entityManager: EntityManagerService,
    private readonly auth: AuthService,
    private readonly logger: LoggerService
  ) {
    super(configuration)
  }

  async postComment(metadata: CommentMetadata) {
    const { userId } = metadata
    const newCommentId = Math.floor(Math.random() * 10000000) // TODO: need to get an unclaimed id. SEE TrackUploadHelper.generateId
    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.COMMENT,
      entityId: newCommentId,
      action: Action.CREATE,
      metadata: JSON.stringify({
        cid: '',
        data: snakecaseKeys(metadata)
      }),
      auth: this.auth
    })

    this.logger.info('Successfully uploaded comment')
    return response
  }
}
