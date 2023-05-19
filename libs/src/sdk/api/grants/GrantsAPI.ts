import type { Configuration } from '../generated/default'

import type { AuthService, EntityManagerService } from '../../services'

import { Action, EntityType } from '../../services/EntityManager/types'

import { decodeHashId } from '../../utils/hashId'
import { objectMissingValues } from '../../utils/object'
import { GRANT_REQUIRED_VALUES } from './constants'
import type { CreateGrantParameters, RevokeGrantParameters } from './types'

// Note (nkang): Eventually this will extend the generated GrantsAPI
export class GrantsAPI {
  constructor(
    _config: Configuration,
    private readonly entityManager: EntityManagerService,
    private readonly auth: AuthService
  ) {}

  /**
   * When user authorizes app to perform actions on their behalf
   */
  async createGrant(requestParameters: CreateGrantParameters) {
    const { appApiKey, userId } = requestParameters
    const metadataMissingValues = objectMissingValues(
      requestParameters,
      GRANT_REQUIRED_VALUES
    )
    if (metadataMissingValues?.length) {
      throw new Error(
        `Create Authorization error - Metadata object is missing values: ${metadataMissingValues}`
      )
    }

    const decodedUserId = decodeHashId(userId)
    if (decodedUserId == null) {
      throw new Error(`Create Authorization error - user id is invalid`)
    }

    // TODO(nkang): Format appApiKey into compressed, non-0x-prefixed pub key

    const response = await this.entityManager.manageEntity({
      userId: decodedUserId,
      entityType: EntityType.DELEGATION,
      entityId: 0, // Contract requires uint, but we don't actually need this field for this action. Just use 0.
      action: Action.CREATE,
      metadata: JSON.stringify({
        delegate_address: appApiKey
      }),
      auth: this.auth
    })
    const txReceipt = response.txReceipt

    return {
      blockHash: txReceipt.blockHash,
      blockNumber: txReceipt.blockNumber,
      error: false
    }
  }

  /**
   * When user revokes an app's authorization to perform actions on their behalf
   */
  async revokeGrant(requestParameters: RevokeGrantParameters) {
    const { appApiKey, userId } = requestParameters
    const metadataMissingValues = objectMissingValues(
      requestParameters,
      GRANT_REQUIRED_VALUES
    )
    if (metadataMissingValues?.length) {
      throw new Error(
        `Revoke Grant error - Metadata object is missing values: ${metadataMissingValues}`
      )
    }

    const decodedUserId = decodeHashId(userId)
    if (decodedUserId == null) {
      throw new Error(`Revoke Grant error - user id is invalid`)
    }

    // TODO(nkang): Format appApiKey into compressed, non-0x-prefixed pub key

    const response = await this.entityManager.manageEntity({
      userId: decodedUserId,
      entityType: EntityType.DELEGATION,
      entityId: 0, // Contract requires uint, but we don't actually need this field for this action. Just use 0.
      action: Action.DELETE,
      metadata: JSON.stringify({
        delegate_address: appApiKey
      }),
      auth: this.auth
    })
    const txReceipt = response.txReceipt

    return {
      blockHash: txReceipt.blockHash,
      blockNumber: txReceipt.blockNumber,
      error: false
    }
  }
}
