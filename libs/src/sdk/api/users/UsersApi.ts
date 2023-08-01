import snakecaseKeys from 'snakecase-keys'
import type { AuthService, StorageService } from '../../services'
import {
  Action,
  EntityManagerService,
  EntityType,
  WriteOptions
} from '../../services/EntityManager/types'
import { generateMetadataCidV1 } from '../../utils/cid'
import { parseparams } from '../../utils/parseparams'
import { retry3 } from '../../utils/retry'
import {
  Configuration,
  UsersApi as GeneratedUsersApi
} from '../generated/default'
import {
  FollowUserRequest,
  FollowUserSchema,
  SubscribeToUserRequest,
  SubscribeToUserSchema,
  UpdateProfileRequest,
  UnfollowUserRequest,
  UnfollowUserSchema,
  UnsubscribeFromUserRequest,
  UnsubscribeFromUserSchema,
  UpdateProfileSchema
} from './types'
import type { LoggerService } from '../../services/Logger'

export class UsersApi extends GeneratedUsersApi {
  constructor(
    configuration: Configuration,
    private readonly storage: StorageService,
    private readonly entityManager: EntityManagerService,
    private readonly auth: AuthService,
    private readonly logger: LoggerService
  ) {
    super(configuration)
    this.logger = logger.createPrefixedLogger('[users-api]')
  }

  /** @hidden
   * Update a user profile
   */
  async updateProfile(
    params: UpdateProfileRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { onProgress, profilePictureFile, coverArtFile, userId, metadata } =
      await parseparams('updateProfile', UpdateProfileSchema)(params)

    const [profilePictureResp, coverArtResp] = await Promise.all([
      profilePictureFile &&
        retry3(
          async () =>
            await this.storage.uploadFile({
              file: profilePictureFile,
              onProgress,
              template: 'img_square'
            }),
          (e) => {
            this.logger.info('Retrying uploadProfilePicture', e)
          }
        ),
      coverArtFile &&
        retry3(
          async () =>
            await this.storage.uploadFile({
              file: coverArtFile,
              onProgress,
              template: 'img_backdrop'
            }),
          (e) => {
            this.logger.info('Retrying uploadProfileCoverArt', e)
          }
        )
    ])

    const updatedMetadata = {
      ...metadata,
      ...(profilePictureResp ? { profilePicture: profilePictureResp?.id } : {}),
      ...(coverArtResp ? { coverPhoto: coverArtResp?.id } : {})
    }

    // Write metadata to chain
    const metadataCid = await generateMetadataCidV1(updatedMetadata)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: userId,
      action: Action.UPDATE,
      metadata: JSON.stringify({
        cid: metadataCid.toString(),
        data: snakecaseKeys(updatedMetadata)
      }),
      auth: this.auth,
      ...writeOptions
    })
  }

  /** @hidden
   * Follow a user
   */
  async followUser(params: FollowUserRequest, writeOptions?: WriteOptions) {
    // Parse inputs
    const { userId, followeeUserId } = await parseparams(
      'followUser',
      FollowUserSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: followeeUserId,
      action: Action.FOLLOW,
      auth: this.auth,
      ...writeOptions
    })
  }

  /** @hidden
   * Unfollow a user
   */
  async unfollowUser(params: UnfollowUserRequest, writeOptions?: WriteOptions) {
    // Parse inputs
    const { userId, followeeUserId } = await parseparams(
      'unfollowUser',
      UnfollowUserSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: followeeUserId,
      action: Action.UNFOLLOW,
      auth: this.auth,
      ...writeOptions
    })
  }

  /** @hidden
   * Subscribe to a user
   */
  async subscribeToUser(
    params: SubscribeToUserRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, subscribeeUserId } = await parseparams(
      'subscribeToUser',
      SubscribeToUserSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: subscribeeUserId,
      action: Action.SUBSCRIBE,
      auth: this.auth,
      ...writeOptions
    })
  }

  /** @hidden
   * Unsubscribe from a user
   */
  async unsubscribeFromUser(
    params: UnsubscribeFromUserRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, subscribeeUserId } = await parseparams(
      'unsubscribeFromUser',
      UnsubscribeFromUserSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: subscribeeUserId,
      action: Action.UNSUBSCRIBE,
      auth: this.auth,
      ...writeOptions
    })
  }
}
