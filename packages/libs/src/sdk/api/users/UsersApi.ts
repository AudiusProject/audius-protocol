import snakecaseKeys from 'snakecase-keys'

import type {
  AuthService,
  DiscoveryNodeSelectorService,
  StorageService
} from '../../services'
import {
  Action,
  EntityManagerService,
  EntityType,
  AdvancedOptions
} from '../../services/EntityManager/types'
import type { LoggerService } from '../../services/Logger'
import type { ClaimableTokensClient } from '../../services/Solana/programs/ClaimableTokensClient/ClaimableTokensClient'
import { parseParams } from '../../utils/parseParams'
import { retry3 } from '../../utils/retry'
import {
  BASE_PATH,
  Configuration,
  DownloadPurchasesAsCSVRequest,
  DownloadSalesAsCSVRequest,
  DownloadUSDCWithdrawalsAsCSVRequest,
  UsersApi as GeneratedUsersApi
} from '../generated/default'
import * as runtime from '../generated/default/runtime'

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
  UpdateProfileSchema,
  SendTipRequest,
  SendTipSchema
} from './types'

export class UsersApi extends GeneratedUsersApi {
  constructor(
    configuration: Configuration,
    private readonly discoveryNodeSelectorService: DiscoveryNodeSelectorService,
    private readonly storage: StorageService,
    private readonly entityManager: EntityManagerService,
    private readonly auth: AuthService,
    private readonly logger: LoggerService,
    private readonly claimableTokens: ClaimableTokensClient
  ) {
    super(configuration)
    this.logger = logger.createPrefixedLogger('[users-api]')
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

    // Write metadata to chain
    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.USER,
      entityId: userId,
      action: Action.UPDATE,
      metadata: JSON.stringify({
        cid: '',
        data: snakecaseKeys(updatedMetadata)
      }),
      auth: this.auth,
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
      auth: this.auth,
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
      auth: this.auth,
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
      auth: this.auth,
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
      auth: this.auth,
      ...advancedOptions
    })
  }

  /**
   * Downloads the sales the user has made as a CSV file
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

    const host = await this.discoveryNodeSelectorService.getSelectedEndpoint()
    const path = `/users/{id}/sales/download`.replace(
      `{${'id'}}`,
      encodeURIComponent(String(params.id))
    )
    const url = `${host}${BASE_PATH}${path}`
    const response = await fetch(url, {
      method: 'GET'
    })
    return response.blob()
  }

  /**
   * Downloads the purchases the user has made as a CSV file
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

    const host = await this.discoveryNodeSelectorService.getSelectedEndpoint()
    const path = `/users/{id}/purchases/download`.replace(
      `{${'id'}}`,
      encodeURIComponent(String(params.id))
    )
    const url = `${host}${BASE_PATH}${path}`
    const response = await fetch(url, {
      method: 'GET'
    })
    return response.blob()
  }

  /**
   * Downloads the USDC withdrawals the user has made as a CSV file
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

    const host = await this.discoveryNodeSelectorService.getSelectedEndpoint()
    const path = `/users/{id}/withdrawals/download`.replace(
      `{${'id'}}`,
      encodeURIComponent(String(params.id))
    )
    const url = `${host}${BASE_PATH}${path}`
    const response = await fetch(url, {
      method: 'GET',
      headers: headerParameters
    })
    return response.blob()
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
      mint: 'wAUDIO',
      auth: this.auth
    })
    const transfer = await this.claimableTokens.createTransferInstruction({
      ethWallet,
      destination,
      mint: 'wAUDIO'
    })

    const transaction = await this.claimableTokens.buildTransaction({
      instructions: [secp, transfer]
    })
    return await this.claimableTokens.sendTransaction(transaction)
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
}
