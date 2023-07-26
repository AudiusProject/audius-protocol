import type { Configuration } from '../generated/default'

import type { AuthService, EntityManagerService } from '../../services'

import { Action, EntityType } from '../../services/EntityManager/types'

import {
  CreateGrantRequest,
  CreateGrantSchema,
  RevokeGrantRequest,
  RevokeGrantSchema
} from './types'
import { parseRequestParameters } from '../../utils/parseRequestParameters'

export class GrantsApi {
  constructor(
    _config: Configuration,
    private readonly entityManager: EntityManagerService,
    private readonly auth: AuthService
  ) {}

  /**
   * When user authorizes app to perform actions on their behalf
   */
  async createGrant(requestParameters: CreateGrantRequest) {
    const { userId, appApiKey } = await parseRequestParameters(
      'createGrant',
      CreateGrantSchema
    )(requestParameters)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.GRANT,
      entityId: 0, // Contract requires uint, but we don't actually need this field for this action. Just use 0.
      action: Action.CREATE,
      metadata: JSON.stringify({
        grantee_address: `0x${appApiKey}`
      }),
      auth: this.auth
    })
  }

  /**
   * When user revokes an app's authorization to perform actions on their behalf
   */
  async revokeGrant(requestParameters: RevokeGrantRequest) {
    const { userId, appApiKey } = await parseRequestParameters(
      'revokeGrant',
      RevokeGrantSchema
    )(requestParameters)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.GRANT,
      entityId: 0, // Contract requires uint, but we don't actually need this field for this action. Just use 0.
      action: Action.DELETE,
      metadata: JSON.stringify({
        grantee_address: `0x${appApiKey}`
      }),
      auth: this.auth
    })
  }
}
