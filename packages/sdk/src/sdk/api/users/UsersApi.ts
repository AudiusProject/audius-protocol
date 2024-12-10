import snakecaseKeys from 'snakecase-keys'

import type { StorageService } from '../../services'
import { EmailEncryptionService } from '../../services/Encryption'
import {
  Action,
  AdvancedOptions,
  EntityManagerService,
  EntityType
} from '../../services/EntityManager/types'
import type { LoggerService } from '../../services/Logger'
import type { ClaimableTokensClient } from '../../services/Solana/programs/ClaimableTokensClient/ClaimableTokensClient'
import type { SolanaClient } from '../../services/Solana/programs/SolanaClient'
import { HashId } from '../../types/HashId'
import { generateMetadataCidV1 } from '../../utils/cid'
import { encodeHashId } from '../../utils/hashId'
import { parseParams } from '../../utils/parseParams'
import { retry3 } from '../../utils/retry'
import {
  Configuration,
  DownloadPurchasesAsCSVRequest,
  DownloadSalesAsCSVRequest,
  DownloadUSDCWithdrawalsAsCSVRequest,
  UsersApi as GeneratedUsersApi
} from '../generated/default'
import * as runtime from '../generated/default/runtime'

import {
  CreateUserRequest,
  CreateUserSchema,
  EmailRequest,
  EmailSchema,
  FollowUserRequest,
  FollowUserSchema,
  SendTipReactionRequest,
  SendTipReactionRequestSchema,
  SendTipRequest,
  SendTipSchema,
  SubscribeToUserRequest,
  SubscribeToUserSchema,
  UnfollowUserRequest,
  UnfollowUserSchema,
  UnsubscribeFromUserRequest,
  UnsubscribeFromUserSchema,
  UpdateProfileRequest,
  UpdateProfileSchema
} from './types'

export class UsersApi extends GeneratedUsersApi {
  constructor(
    configuration: Configuration,
    private readonly storage: StorageService,
    private readonly entityManager: EntityManagerService,
    private readonly logger: LoggerService,
    private readonly claimableTokens: ClaimableTokensClient,
    private readonly solanaClient: SolanaClient,
    private readonly emailEncryption: EmailEncryptionService
  ) {
    super(configuration)
    this.logger = logger.createPrefixedLogger('[users-api]')
  }

  /** @hidden
   * Generate a new user id for use in creation flow
   */
  private async generateUserId() {
    const response = new runtime.JSONApiResponse<{ data: string }>(
      await this.request({
        path: '/users/unclaimed_id',
        method: 'GET',
        headers: {},
        query: {
          noCache: Math.floor(Math.random() * 1000).toString()
        }
      })
    )
    return await response.value()
  }

  /** @hidden
   * Create a user
   */
  async createUser(
    params: CreateUserRequest,
    advancedOptions?: AdvancedOptions
  ) {
    const { onProgress, profilePictureFile, coverArtFile, metadata } =
      await parseParams('createUser', CreateUserSchema)(params)

    const { data } = await this.generateUserId()
    if (!data) {
      throw new Error('Failed to generate userId')
    }
    const userId = HashId.parse(data)

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
      userId,
      ...(profilePictureResp
        ? { profilePictureSizes: profilePictureResp?.id }
        : {}),
      ...(coverArtResp ? { coverPhotoSizes: coverArtResp?.id } : {})
    }

    const entityMetadata = snakecaseKeys(updatedMetadata)

    const cid = (await generateMetadataCidV1(entityMetadata)).toString()

    // Write metadata to chain
    const { blockHash, blockNumber } = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: userId,
      action: Action.CREATE,
      metadata: JSON.stringify({
        cid,
        data: entityMetadata
      }),
      ...advancedOptions
    })

    return { blockHash, blockNumber, metadata: updatedMetadata }
  }

  /** @hidden
   * Creates a guest for guest checkout
   */
  async createGuest(advancedOptions?: AdvancedOptions) {
    const { data } = await this.generateUserId()
    if (!data) {
      throw new Error('Failed to generate userId')
    }
    const userId = HashId.parse(data)
    const metadata = {
      userId
    }

    // Write metadata to chain
    const { blockHash, blockNumber } = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: userId,
      action: Action.CREATE,
      metadata: JSON.stringify({
        cid: null,
        data: null
      }),

      ...advancedOptions
    })

    return { blockHash, blockNumber, metadata }
  }

  /** @hidden
   * Update a user profile
   */
  async updateProfile(
    params: UpdateProfileRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { onProgress, profilePictureFile, coverArtFile, userId, metadata } =
      await parseParams('updateProfile', UpdateProfileSchema)(params)

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

    const cid = (await generateMetadataCidV1(updatedMetadata)).toString()

    // Write metadata to chain
    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: userId,
      action: Action.UPDATE,
      metadata: JSON.stringify({
        cid,
        data: snakecaseKeys(updatedMetadata)
      }),
      ...advancedOptions
    })
  }

  /** @hidden
   * Follow a user
   */
  async followUser(
    params: FollowUserRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, followeeUserId } = await parseParams(
      'followUser',
      FollowUserSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: followeeUserId,
      action: Action.FOLLOW,
      ...advancedOptions
    })
  }

  /** @hidden
   * Unfollow a user
   */
  async unfollowUser(
    params: UnfollowUserRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, followeeUserId } = await parseParams(
      'unfollowUser',
      UnfollowUserSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: followeeUserId,
      action: Action.UNFOLLOW,
      ...advancedOptions
    })
  }

  /** @hidden
   * Subscribe to a user
   */
  async subscribeToUser(
    params: SubscribeToUserRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, subscribeeUserId } = await parseParams(
      'subscribeToUser',
      SubscribeToUserSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: subscribeeUserId,
      action: Action.SUBSCRIBE,
      ...advancedOptions
    })
  }

  /** @hidden
   * Unsubscribe from a user
   */
  async unsubscribeFromUser(
    params: UnsubscribeFromUserRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, subscribeeUserId } = await parseParams(
      'unsubscribeFromUser',
      UnsubscribeFromUserSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: subscribeeUserId,
      action: Action.UNSUBSCRIBE,
      ...advancedOptions
    })
  }

  /**
   * Downloads the sales the user has made as a CSV file.
   * Similar to generated raw method, but forced response type as blob
   */
  async downloadSalesAsCSVBlob(
    params: DownloadSalesAsCSVRequest
  ): Promise<Blob> {
    if (params.id === null || params.id === undefined) {
      throw new runtime.RequiredError(
        'id',
        'Required parameter params.id was null or undefined when calling downloadSalesAsCSV.'
      )
    }

    const queryParameters: any = {}

    if (params.userId !== undefined) {
      queryParameters.user_id = params.userId
    }

    const headerParameters: runtime.HTTPHeaders = {}

    const response = await this.request({
      path: `/users/{id}/sales/download`.replace(
        `{${'id'}}`,
        encodeURIComponent(String(params.id))
      ),
      method: 'GET',
      headers: headerParameters,
      query: queryParameters
    })

    return await new runtime.BlobApiResponse(response).value()
  }

  /**
   * Downloads the purchases the user has made as a CSV file.
   * Similar to generated raw method, but forced response type as blob
   */
  async downloadPurchasesAsCSVBlob(
    params: DownloadPurchasesAsCSVRequest
  ): Promise<Blob> {
    if (params.id === null || params.id === undefined) {
      throw new runtime.RequiredError(
        'id',
        'Required parameter params.id was null or undefined when calling downloadPurchasesAsCSV.'
      )
    }

    const queryParameters: any = {}

    if (params.userId !== undefined) {
      queryParameters.user_id = params.userId
    }

    const headerParameters: runtime.HTTPHeaders = {}

    const response = await this.request({
      path: `/users/{id}/purchases/download`.replace(
        `{${'id'}}`,
        encodeURIComponent(String(params.id))
      ),
      method: 'GET',
      headers: headerParameters,
      query: queryParameters
    })

    return await new runtime.BlobApiResponse(response).value()
  }

  /**
   * Downloads the USDC withdrawals the user has made as a CSV file
   * Similar to generated raw method, but forced response type as blob
   */
  async downloadUSDCWithdrawalsAsCSVBlob(
    params: DownloadUSDCWithdrawalsAsCSVRequest
  ): Promise<Blob> {
    if (params.id === null || params.id === undefined) {
      throw new runtime.RequiredError(
        'id',
        'Required parameter params.id was null or undefined when calling downloadUSDCWithdrawalsAsCSV.'
      )
    }

    const queryParameters: any = {}
    if (params.userId !== undefined) {
      queryParameters.user_id = params.userId
    }

    const headerParameters: runtime.HTTPHeaders = {}

    const response = await this.request({
      path: `/users/{id}/withdrawals/download`.replace(
        `{${'id'}}`,
        encodeURIComponent(String(params.id))
      ),
      method: 'GET',
      headers: headerParameters,
      query: queryParameters
    })

    return await new runtime.BlobApiResponse(response).value()
  }

  /**
   * Sends a wAUDIO tip from one user to another.
   * @hidden subject to change
   */
  async sendTip(request: SendTipRequest) {
    const { amount } = await parseParams('sendTip', SendTipSchema)(request)

    const { ethWallet } = await this.getWalletAndUserBank(request.senderUserId)
    const { ethWallet: receiverEthWallet, userBank: destination } =
      await this.getWalletAndUserBank(request.receiverUserId)

    if (!ethWallet) {
      throw new Error('Invalid sender: No Ethereum wallet found.')
    }
    if (!receiverEthWallet) {
      throw new Error('Invalid recipient: No Ethereum wallet found.')
    }
    if (!destination) {
      throw new Error('Invalid recipient: No user bank found.')
    }

    const secp = await this.claimableTokens.createTransferSecpInstruction({
      ethWallet,
      destination,
      amount,
      mint: 'wAUDIO'
    })
    const transfer = await this.claimableTokens.createTransferInstruction({
      ethWallet,
      destination,
      mint: 'wAUDIO'
    })

    const transaction = await this.solanaClient.buildTransaction({
      instructions: [secp, transfer]
    })
    return await this.claimableTokens.sendTransaction(transaction)
  }

  /**
   * Submits a reaction to a tip being received.
   * @hidden
   */
  async sendTipReaction(
    params: SendTipReactionRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, metadata } = await parseParams(
      'sendTipReaction',
      SendTipReactionRequestSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TIP,
      entityId: userId,
      action: Action.UPDATE,
      metadata: JSON.stringify({
        cid: '',
        data: snakecaseKeys(metadata)
      }),
      ...advancedOptions
    })
  }

  /**
   * Helper function for sendTip that gets the user wallet and creates
   * or gets the wAUDIO user bank for given user ID.
   */
  private async getWalletAndUserBank(id: string) {
    const res = await this.getUser({ id })
    const ethWallet = res.data?.ercWallet
    if (!ethWallet) {
      return { ethWallet: null, userBank: null }
    }
    const { userBank } = await this.claimableTokens.getOrCreateUserBank({
      ethWallet,
      mint: 'wAUDIO'
    })
    return { ethWallet, userBank }
  }

  /**
   * Helper method to manage email encryption keys
   */
  private async getEmailEncryptionKeys({
    primaryUserIdHash,
    emailOwnerUserIdHash
  }: {
    primaryUserIdHash: string
    emailOwnerUserIdHash: string
  }) {
    const { data: encryptedEmailKey } = await this.getUserEmailKey({
      id: primaryUserIdHash
    })

    // If we already have an encrypted key, decrypt it
    if (encryptedEmailKey) {
      const symmetricKey = await this.emailEncryption.decryptSymmetricKey(
        encryptedEmailKey,
        primaryUserIdHash
      )
      return { symmetricKey, primaryUserEncryptedKey: encryptedEmailKey }
    }

    // Otherwise create a new shared key
    const { symmetricKey, primaryUserEncryptedKey } =
      await this.emailEncryption.createSharedKey(primaryUserIdHash, [
        emailOwnerUserIdHash
      ])
    return { symmetricKey, primaryUserEncryptedKey }
  }

  /** @hidden
   * Share an encrypted email with a user
   */
  async shareEmail(params: EmailRequest, advancedOptions?: AdvancedOptions) {
    const { emailOwnerUserId, primaryUserId, email } = await parseParams(
      'shareEmail',
      EmailSchema
    )(params)

    // Get hashed IDs and validate
    const primaryUserIdHash = encodeHashId(primaryUserId)
    const emailOwnerUserIdHash = encodeHashId(emailOwnerUserId)
    if (!primaryUserIdHash || !emailOwnerUserIdHash) {
      throw new Error('Primary user ID and email owner user ID are required')
    }

    const { symmetricKey, primaryUserEncryptedKey } =
      await this.getEmailEncryptionKeys({
        primaryUserIdHash,
        emailOwnerUserIdHash
      })

    const encryptedEmail = await this.emailEncryption.encryptEmail(
      email,
      symmetricKey
    )

    const metadata = {
      email_owner_user_id: emailOwnerUserId,
      primary_user_id: primaryUserId,
      encrypted_email: encryptedEmail,
      encrypted_key: primaryUserEncryptedKey,
      delegated_user_ids: [],
      delegated_keys: []
    }

    return await this.entityManager.manageEntity({
      userId: primaryUserId,
      entityType: EntityType.ENCRYPTED_EMAIL,
      entityId: primaryUserId,
      action: Action.ADD_EMAIL,
      metadata: JSON.stringify({
        cid: '',
        data: metadata
      }),
      ...advancedOptions
    })
  }
}
