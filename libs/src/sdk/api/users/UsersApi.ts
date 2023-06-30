import type { AuthService } from '../../services'
import {
  Action,
  EntityManagerService,
  EntityType,
  WriteOptions
} from '../../services/EntityManager/types'
import { parseRequestParameters } from '../../utils/parseRequestParameters'
import {
  Configuration,
  UsersApi as GeneratedUsersApi
} from '../generated/default'
import {
  FollowUserRequest,
  FollowUserSchema,
  SubscribeToUserRequest,
  SubscribeToUserSchema,
  UnfollowUserRequest,
  UnfollowUserSchema,
  UnsubscribeFromUserRequest,
  UnsubscribeFromUserSchema
} from './types'

export class UsersApi extends GeneratedUsersApi {
  constructor(
    configuration: Configuration,
    private readonly entityManager: EntityManagerService,
    private readonly auth: AuthService
  ) {
    super(configuration)
  }

  /**
   * Follow a user
   */
  async followUser(
    requestParameters: FollowUserRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, followeeUserId } = parseRequestParameters(
      'followUser',
      FollowUserSchema
    )(requestParameters)

    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: followeeUserId,
      action: Action.FOLLOW,
      auth: this.auth,
      ...writeOptions
    })
    const txReceipt = response.txReceipt

    return txReceipt
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(
    requestParameters: UnfollowUserRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, followeeUserId } = parseRequestParameters(
      'unfollowUser',
      UnfollowUserSchema
    )(requestParameters)

    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: followeeUserId,
      action: Action.UNFOLLOW,
      auth: this.auth,
      ...writeOptions
    })
    const txReceipt = response.txReceipt

    return txReceipt
  }

  /**
   * Subscribe to a user
   */
  async subscribeToUser(
    requestParameters: SubscribeToUserRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, subscribeeUserId } = parseRequestParameters(
      'subscribeToUser',
      SubscribeToUserSchema
    )(requestParameters)

    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: subscribeeUserId,
      action: Action.SUBSCRIBE,
      auth: this.auth,
      ...writeOptions
    })
    const txReceipt = response.txReceipt

    return txReceipt
  }

  /**
   * Unsubscribe from a user
   */
  async unsubscribeFromUser(
    requestParameters: UnsubscribeFromUserRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, subscribeeUserId } = parseRequestParameters(
      'unsubscribeFromUser',
      UnsubscribeFromUserSchema
    )(requestParameters)

    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: subscribeeUserId,
      action: Action.UNSUBSCRIBE,
      auth: this.auth,
      ...writeOptions
    })
    const txReceipt = response.txReceipt

    return txReceipt
  }
}
