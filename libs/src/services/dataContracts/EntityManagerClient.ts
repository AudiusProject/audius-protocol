import type { TransactionReceipt } from 'web3-core'
import sigUtil from 'eth-sig-util'
import { Buffer as SafeBuffer } from 'safe-buffer'

import { ContractClient } from '../contracts/ContractClient'
import * as signatureSchemas from '../../data-contracts/signatureSchemas'
import type { Web3Manager } from '../web3Manager'

export enum Action {
  CREATE = 'Create',
  UPDATE = 'Update',
  DELETE = 'Delete',
  VERIFY = 'Verify',
  FOLLOW = 'Follow',
  UNFOLLOW = 'Unfollow',
  SAVE = 'Save',
  UNSAVE = 'Unsave',
  REPOST = 'Repost',
  UNREPOST = 'Unrepost',
  SUBSCRIBE = 'Subscribe',
  UNSUBSCRIBE = 'Unsubscribe',
  VIEW = 'View',
  VIEW_PLAYLIST = 'ViewPlaylist'
}

export enum EntityType {
  PLAYLIST = 'Playlist',
  TRACK = 'Track',
  USER = 'User',
  USER_REPLICA_SET = 'UserReplicaSet',
  NOTIFICATION = 'Notification'
}

/**
 * Generic management of Audius Data entities
 **/
export class EntityManagerClient extends ContractClient {
  override web3Manager!: Web3Manager

  static Action = Action
  static EntityType = EntityType

  async getManageEntityParams(
    userId: number,
    entityType: EntityType,
    entityId: number,
    action: Action,
    metadataMultihash: string,
    privateKey?: string
  ): Promise<[string, string]> {
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
    let sig
    if (privateKey) {
      sig = sigUtil.signTypedData(
        SafeBuffer.from(privateKey, 'hex') as unknown as Buffer,
        {
          data: signatureData
        }
      )
    } else {
      sig = await this.web3Manager.signTypedData(signatureData)
    }
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
    return [method.encodeABI(), contractAddress]
  }

  /**
   * Calls the manage entity method on chain
   * @param {number} userId The numeric user id
   * @param {EntityType} entityType The type of entity being modified
   * @param {number} entityId The id of the entity
   * @param {Action} action Action being performed on the entity
   * @param {string} metadataMultihash CID multihash or metadata associated with action
   * @param {string}privateKey The private key used to sign the transaction
   */
  async manageEntity(
    userId: number,
    entityType: EntityType,
    entityId: number,
    action: Action,
    metadataMultihash: string,
    privateKey?: string
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
    let sig
    if (privateKey) {
      sig = sigUtil.signTypedData(
        SafeBuffer.from(privateKey, 'hex') as unknown as Buffer,
        {
          data: signatureData
        }
      )
    } else {
      sig = await this.web3Manager.signTypedData(signatureData)
    }
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
