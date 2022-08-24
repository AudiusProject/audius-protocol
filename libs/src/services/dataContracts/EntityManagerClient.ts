import type { TransactionReceipt } from 'web3-core'

import { ContractClient } from '../contracts/ContractClient'
import * as signatureSchemas from '../../data-contracts/signatureSchemas'
import type { Web3Manager } from '../web3Manager'

export enum Action {
  CREATE = 'Create',
  UPDATE = 'Update',
  DELETE = 'Delete'
}

export enum EntityType {
  PLAYLIST = 'Playlist',
  TRACK = 'Track',
  USER = 'User'
}

/**
 * Generic management of Audius Data entities
 **/
export class EntityManagerClient extends ContractClient {
  override web3Manager!: Web3Manager

  static Action = Action
  static EntityType = EntityType

  async manageEntity(
    userId: number,
    entityType: EntityType,
    entityId: number,
    action: Action,
    metadataMultihash: string
  ): Promise<{ txReceipt: TransactionReceipt }> {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = signatureSchemas.generators.getManageEntityData(
      chainId,
      contractAddress,
      userId,
      entityType,
      entityId,
      action,
      metadataMultihash,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)
    const method = await this.getMethod(
      'manageEntity',
      userId,
      entityType,
      entityId,
      action,
      metadataMultihash,
      nonce,
      sig
    )
    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
    return {
      txReceipt: tx
    }
  }
}
