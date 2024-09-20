import snakecaseKeys from 'snakecase-keys'

import { AuthService, LoggerService } from '../../services'
import {
  Action,
  EntityManagerService,
  EntityType
} from '../../services/EntityManager/types'
import { encodeHashId } from '../../utils/hashId'
import {
  Configuration,
  CommentsApi as GeneratedCommentsApi
} from '../generated/default'

import { CommentMetadata } from './types'

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
    const { userId, entityType = EntityType.TRACK } = metadata
    const newCommentId = Math.floor(Math.random() * 10000000) // TODO: need to get an unclaimed id. SEE TrackUploadHelper.generateId
    await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.COMMENT,
      entityId: newCommentId,
      action: Action.CREATE,
      metadata: JSON.stringify({
        cid: '',
        data: snakecaseKeys({ entityType, ...metadata })
      }),
      auth: this.auth
    })
    this.logger.info('Successfully posted a comment')
    return encodeHashId(newCommentId)
  }

  async editComment(metadata: CommentMetadata) {
    const { userId, entityId } = metadata
    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.COMMENT,
      entityId,
      action: Action.UPDATE,
      metadata: JSON.stringify({
        cid: '',
        data: snakecaseKeys(metadata)
      }),
      auth: this.auth
    })
    return response
  }

  async deleteComment(metadata: CommentMetadata) {
    const { userId, entityId } = metadata
    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.COMMENT,
      entityId,
      action: Action.DELETE,
      metadata: '',
      auth: this.auth
    })
    return response
  }

  async reactComment(userId: number, entityId: number, isLiked: boolean) {
    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.COMMENT,
      entityId,
      action: isLiked ? Action.REACT : Action.UNREACT,
      metadata: '',
      auth: this.auth
    })
    return response
  }

  async pinComment(userId: number, entityId: number, isPin: boolean) {
    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.COMMENT,
      entityId,
      action: isPin ? Action.PIN : Action.UNPIN,
      metadata: '',
      auth: this.auth
    })
    return response
  }

  async reportComment(userId: number, entityId: number) {
    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.COMMENT,
      entityId,
      action: Action.REPORT,
      metadata: '',
      auth: this.auth
    })
    return response
  }

  async muteUser(userId: number, mutedUserId: number) {
    console.log('asdf sdk mute user manage entity')
    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: mutedUserId,
      action: Action.MUTE,
      metadata: '',
      auth: this.auth
    })
    return response
  }
}
