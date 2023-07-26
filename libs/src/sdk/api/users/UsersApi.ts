import snakecaseKeys from 'snakecase-keys'
import type { AuthService, StorageService } from '../../services'
import {
  Action,
  EntityManagerService,
  EntityType,
  WriteOptions
} from '../../services/EntityManager/types'
import { generateMetadataCidV1 } from '../../utils/cid'
import { parseRequestParameters } from '../../utils/parseRequestParameters'
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

export class UsersApi extends GeneratedUsersApi {
  constructor(
    configuration: Configuration,
    private readonly storage: StorageService,
    private readonly entityManager: EntityManagerService,
    private readonly auth: AuthService
  ) {
    super(configuration)
  }

  /** @hidden
   * Update a user profile
   */
  async updateProfile(
    requestParameters: UpdateProfileRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { onProgress, profilePictureFile, coverArtFile, userId, metadata } =
      await parseRequestParameters(
        'updateProfile',
        UpdateProfileSchema
      )(requestParameters)

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
            console.log('Retrying uploadProfilePicture', e)
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
            console.log('Retrying uploadProfileCoverArt', e)
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
  async followUser(
    requestParameters: FollowUserRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, followeeUserId } = await parseRequestParameters(
      'followUser',
      FollowUserSchema
    )(requestParameters)

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
  async unfollowUser(
    requestParameters: UnfollowUserRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, followeeUserId } = await parseRequestParameters(
      'unfollowUser',
      UnfollowUserSchema
    )(requestParameters)

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
    requestParameters: SubscribeToUserRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, subscribeeUserId } = await parseRequestParameters(
      'subscribeToUser',
      SubscribeToUserSchema
    )(requestParameters)

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
    requestParameters: UnsubscribeFromUserRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, subscribeeUserId } = await parseRequestParameters(
      'unsubscribeFromUser',
      UnsubscribeFromUserSchema
    )(requestParameters)

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
