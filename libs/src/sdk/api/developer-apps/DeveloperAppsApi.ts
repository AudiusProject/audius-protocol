import type { Configuration } from '../generated/default'

import * as secp from '@noble/secp256k1'
import type { AuthService, EntityManagerService } from '../../services'

import { Action, EntityType } from '../../services/EntityManager/types'

import { decodeHashId } from '../../utils/hashId'
import { objectMissingValues } from '../../utils/object'
import {
  CREATE_DEVELOPER_APP_REQUIRED_VALUES,
  DELETE_DEVELOPER_APP_REQUIRED_VALUES
} from './constants'
import type {
  CreateDeveloperAppRequest,
  DeleteDeveloperAppRequest
} from './types'

// Note (nkang): Eventually this will extend the generated DeveloperAppsApi
export class DeveloperAppsApi {
  constructor(
    _config: Configuration,
    private readonly entityManager: EntityManagerService,
    private readonly auth: AuthService
  ) {}

  /**
   * Create a developer app
   */
  async createDeveloperApp(requestParameters: CreateDeveloperAppRequest) {
    const { name, userId, isPersonalAccess } = requestParameters
    // TODO (nkang + seabass): Use Zod for validation
    const metadataMissingValues = objectMissingValues(
      requestParameters,
      CREATE_DEVELOPER_APP_REQUIRED_VALUES
    )
    if (metadataMissingValues?.length) {
      throw new Error(
        `Create Developer App error - Metadata object is missing values: ${metadataMissingValues}`
      )
    }

    const decodedUserId = decodeHashId(userId)
    if (decodedUserId == null) {
      throw new Error(`Create Developer App error - user id is invalid`)
    }
    const apiSecretRaw = secp.utils.randomPrivateKey()
    const apiKeyRaw = secp.getPublicKey(apiSecretRaw, true)
    const apiSecret = Buffer.from(apiSecretRaw).toString('hex')
    const apiKey = Buffer.from(apiKeyRaw).toString('hex')
    const response = await this.entityManager.manageEntity({
      userId: decodedUserId,
      entityType: EntityType.DEVELOPER_APP,
      entityId: 0, // Contract requires uint, but we don't actually need this field for this action. Just use 0.
      action: Action.CREATE,
      metadata: JSON.stringify({
        name,
        address: apiKey,
        is_personal_access: isPersonalAccess ?? false
      }),
      auth: this.auth
    })
    // TODO(nkang): If is_personal_access is true, create the grant from user to developer app. Waiting until SDK confirmer is implemented, so for now we can trigger the grant creation in client.
    const txReceipt = response.txReceipt
    return {
      blockHash: txReceipt.blockHash,
      blockNumber: txReceipt.blockNumber,
      apiKey,
      apiSecret
    }
  }

  /**
   * Delete a developer app
   */
  async deleteDeveloperApp(requestParameters: DeleteDeveloperAppRequest) {
    const { userId, appApiKey } = requestParameters
    const metadataMissingValues = objectMissingValues(
      requestParameters,
      DELETE_DEVELOPER_APP_REQUIRED_VALUES
    )
    if (metadataMissingValues?.length) {
      throw new Error(
        `Delete Developer App error - Metadata object is missing values: ${metadataMissingValues}`
      )
    }

    const decodedUserId = decodeHashId(userId)
    if (decodedUserId == null) {
      throw new Error(`Delete Developer App error - user id is invalid`)
    }

    const response = await this.entityManager.manageEntity({
      userId: decodedUserId,
      entityType: EntityType.DEVELOPER_APP,
      entityId: 0, // Contract requires uint, but we don't actually need this field for this action. Just use 0.
      action: Action.DELETE,
      metadata: JSON.stringify({
        address: appApiKey
      }),
      auth: this.auth
    })
    const txReceipt = response.txReceipt

    return {
      blockHash: txReceipt.blockHash,
      blockNumber: txReceipt.blockNumber
    }
  }
}
