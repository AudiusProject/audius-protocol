import { ContractClient } from '../contracts/ContractClient'
import * as signatureSchemas from '../../../data-contracts/signatureSchemas'
import type { Web3Manager } from '../web3Manager'

export class EntityManagerClient extends ContractClient {
  override web3Manager!: Web3Manager

  async manageEntity(
    userId: number,
    entityType: string,
    entityId: number,
    action: string,
    metadata: string
  ) {
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
      metadata,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)
    const method = await this.getMethod(
      'manageEntity',
      userId,
      entityType,
      entityId,
      action,
      metadata,
      nonce,
      sig
    )
    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
    console.log(tx)
    return {
      txReceipt: tx
    }
  }
}
