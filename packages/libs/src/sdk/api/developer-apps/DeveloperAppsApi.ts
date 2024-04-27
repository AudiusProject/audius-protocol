import type Web3Type from 'web3'

import type { AuthService, EntityManagerService } from '../../services'
import {
  Action,
  EntityType,
  AdvancedOptions
} from '../../services/EntityManager/types'
import { parseParams } from '../../utils/parseParams'
import Web3 from '../../utils/web3'
import {
  Configuration,
  DeveloperAppsApi as GeneratedDeveloperAppsApi
} from '../generated/default'

import {
  CreateDeveloperAppRequest,
  CreateDeveloperAppSchema,
  UpdateDeveloperAppRequest,
  UpdateDeveloperAppSchema,
  DeleteDeveloperAppRequest,
  DeleteDeveloperAppSchema
} from './types'

export class DeveloperAppsApi extends GeneratedDeveloperAppsApi {
  private readonly web3: Web3Type

  constructor(
    config: Configuration,
    private readonly entityManager: EntityManagerService,
    private readonly auth: AuthService
  ) {
    super(config)

    this.web3 = new Web3()
  }

  /**
   * Create a developer app
   */
  async createDeveloperApp(
    params: CreateDeveloperAppRequest,
    advancedOptions?: AdvancedOptions
  ) {
    const { name, userId, description, imageUrl } = await parseParams(
      'createDeveloperApp',
      CreateDeveloperAppSchema
    )(params)

    const wallet = this.web3.eth.accounts.create()
    const privateKey = wallet.privateKey
    const address = wallet.address

    const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
    const message = `Creating Audius developer app at ${unixTs}`

    const signature = wallet.sign(message).signature
    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.DEVELOPER_APP,
      entityId: 0, // Contract requires uint, but we don't actually need this field for this action. Just use 0.
      action: Action.CREATE,
      metadata: JSON.stringify({
        name,
        description,
        image_url: imageUrl,
        app_signature: {
          message,
          signature
        }
      }),
      auth: this.auth,
      ...advancedOptions
    })

    const apiKey = address.slice(2).toLowerCase()
    const apiSecret = privateKey.slice(2).toLowerCase()
    return {
      ...response,
      apiKey,
      apiSecret
    }
  }

  /**
   * Update a developer app
   */
  async updateDeveloperApp(
    params: UpdateDeveloperAppRequest,
    advancedOptions?: AdvancedOptions
  ) {
    const { appApiKey, name, userId, description, imageUrl } =
      await parseParams('updateDeveloperApp', UpdateDeveloperAppSchema)(params)

    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.DEVELOPER_APP,
      entityId: 0, // Contract requires uint, but we don't actually need this field for this action. Just use 0.
      action: Action.UPDATE,
      metadata: JSON.stringify({
        address: `0x${appApiKey}`,
        name,
        description,
        image_url: imageUrl
      }),
      auth: this.auth,
      ...advancedOptions
    })

    return {
      ...response
    }
  }

  /**
   * Delete a developer app
   */
  async deleteDeveloperApp(params: DeleteDeveloperAppRequest) {
    const { userId, appApiKey } = await parseParams(
      'deleteDeveloperApp',
      DeleteDeveloperAppSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.DEVELOPER_APP,
      entityId: 0, // Contract requires uint, but we don't actually need this field for this action. Just use 0.
      action: Action.DELETE,
      metadata: JSON.stringify({
        address: `0x${appApiKey}`
      }),
      auth: this.auth
    })
  }
}
