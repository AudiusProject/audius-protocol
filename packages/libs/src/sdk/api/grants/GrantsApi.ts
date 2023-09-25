import type { AuthService, EntityManagerService } from '../../services'
import { Action, EntityType } from '../../services/EntityManager/types'
import { parseParams } from '../../utils/parseParams'
import type { Configuration } from '../generated/default'

import {
  CreateGrantRequest,
  CreateGrantSchema,
  RevokeGrantRequest,
  RevokeGrantSchema
} from './types'

export class GrantsApi {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    _config: Configuration,
    private readonly entityManager: EntityManagerService,
    private readonly auth: AuthService
  ) {}

  /**
   * When user authorizes app to perform actions on their behalf
   */
  async createGrant(params: CreateGrantRequest) {
    const { userId, appApiKey } = await parseParams(
      'createGrant',
      CreateGrantSchema
    )(params)

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
  async revokeGrant(params: RevokeGrantRequest) {
    const { userId, appApiKey } = await parseParams(
      'revokeGrant',
      RevokeGrantSchema
    )(params)

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
