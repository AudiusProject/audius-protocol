import * as secp from '@noble/secp256k1'
import { keccak_256 } from '@noble/hashes/sha3'

import {
  Configuration,
  DeveloperAppsApi as GeneratedDeveloperAppsApi
} from '../generated/default'
import { pubToAddress } from 'ethereumjs-util'
import type { AuthService, EntityManagerService } from '../../services'
import {
  Action,
  EntityType,
  WriteOptions
} from '../../services/EntityManager/types'

import {
  CreateDeveloperAppSchema,
  CreateDeveloperAppRequest,
  DeleteDeveloperAppSchema,
  DeleteDeveloperAppRequest
} from './types'
import { parseRequestParameters } from '../../utils/parseRequestParameters'

export class DeveloperAppsApi extends GeneratedDeveloperAppsApi {
  constructor(
    config: Configuration,
    private readonly entityManager: EntityManagerService,
    private readonly auth: AuthService
  ) {
    super(config)
  }

  /**
   * Create a developer app
   */
  async createDeveloperApp(
    requestParameters: CreateDeveloperAppRequest,
    writeOptions?: WriteOptions
  ) {
    const { name, userId, description } = parseRequestParameters(
      'createDeveloperApp',
      CreateDeveloperAppSchema
    )(requestParameters)

    const apiSecretRaw = secp.utils.randomPrivateKey()
    const walletPubKey = secp.getPublicKey(
      apiSecretRaw,
      /** compressed = */ false
    )
    const apiKeyRaw = pubToAddress(Buffer.from(walletPubKey))

    const apiSecret = Buffer.from(apiSecretRaw).toString('hex')
    const apiKey = apiKeyRaw.toString('hex')

    const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
    const message = `Creating Audius developer app at ${unixTs}`
    const signature = await secp.sign(
      keccak_256(message),
      Buffer.from(apiSecretRaw),
      {
        recovered: true,
        der: false
      }
    )

    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.DEVELOPER_APP,
      entityId: 0, // Contract requires uint, but we don't actually need this field for this action. Just use 0.
      action: Action.CREATE,
      metadata: JSON.stringify({
        name,
        description,
        app_signature: {
          message,
          signature
        }
      }),
      auth: this.auth,
      ...writeOptions
    })

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
    const { userId, appApiKey } = parseRequestParameters(
      'deleteDeveloperApp',
      DeleteDeveloperAppSchema
    )(requestParameters)

    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.DEVELOPER_APP,
      entityId: 0, // Contract requires uint, but we don't actually need this field for this action. Just use 0.
      action: Action.DELETE,
      metadata: JSON.stringify({
        address: `0x${appApiKey}`
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
