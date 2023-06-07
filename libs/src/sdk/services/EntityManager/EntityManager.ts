import type { TransactionReceipt } from 'web3-core'
import Web3 from '../../utils/web3'
import type Web3Type from 'web3'
import type { AbiItem } from 'web3-utils'
import fetch, { Headers } from 'cross-fetch'

// TODO: move into sdk?
import * as signatureSchemas from '../../../data-contracts/signatureSchemas'
import { abi as EntityManagerABI } from '../../../data-contracts/ABIs/EntityManager.json'

import { mergeConfigWithDefaults } from '../../utils/mergeConfigs'
import type { Contract } from 'web3-eth-contract'
import {
  CONFIRMATION_TIMEOUT,
  defaultEntityManagerConfig,
  DEFAULT_GAS_LIMIT,
  POLLING_FREQUENCY_MILLIS
} from './constants'
import {
  BlockConfirmation,
  EntityManagerConfig,
  EntityManagerService,
  ManageEntityOptions
} from './types'

export class EntityManager implements EntityManagerService {
  /**
   * Configuration passed in by consumer (with defaults)
   */
  private readonly config: EntityManagerConfig

  private readonly contract: Contract
  private readonly web3: Web3Type

  constructor(config?: EntityManagerConfig) {
    this.config = mergeConfigWithDefaults(config, defaultEntityManagerConfig)
    this.web3 = new Web3(
      new Web3.providers.HttpProvider(this.config.web3ProviderUrl, {
        timeout: 10000
      })
    )
    this.contract = new this.web3.eth.Contract(
      EntityManagerABI as AbiItem[],
      this.config.contractAddress
    )
  }

  /**
   * Calls the manage entity method on chain to update some data
   */
  async manageEntity({
    userId,
    entityType,
    entityId,
    action,
    metadata,
    auth,
    confirmationTimeout = CONFIRMATION_TIMEOUT,
    skipConfirmation = false
  }: ManageEntityOptions): Promise<{ txReceipt: TransactionReceipt }> {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getManageEntityData(
      chainId,
      this.config.contractAddress,
      userId,
      entityType,
      entityId,
      action,
      metadata,
      nonce
    )

    const senderAddress = await auth.getAddress()
    const signature = await auth.signTransaction(signatureData)

    const method = await this.contract.methods.manageEntity(
      userId,
      entityType,
      entityId,
      action,
      metadata,
      nonce,
      signature
    )

    const response = await fetch(`${this.config.identityServiceUrl}/relay`, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({
        contractAddress: this.config.contractAddress,
        contractRegistryKey: 'EntityManager',
        encodedABI: method.encodeABI(),
        // Gas limit not really needed with ACDC
        gasLimit: DEFAULT_GAS_LIMIT,
        senderAddress
      })
    })

    const jsonResponse = await response.json()

    if (!skipConfirmation) {
      await this.confirmWrite(jsonResponse.receipt, confirmationTimeout)
    }

    return {
      txReceipt: jsonResponse.receipt
    }
  }

  /**
   * Confirms a write by polling for the block to be indexed by the selected
   * discovery node
   */
  async confirmWrite(
    {
      blockHash,
      blockNumber
    }: {
      blockHash: string
      blockNumber: number
    },
    confirmationTimeout: number = CONFIRMATION_TIMEOUT
  ) {
    const confirmBlock = async () => {
      const endpoint =
        await this.config.discoveryNodeSelector.getSelectedEndpoint()
      const {
        data: { block_passed }
      } = await (
        await fetch(
          `${endpoint}/block_confirmation?blocknumber=${blockNumber}&blockhash=${blockHash}`
        )
      ).json()

      return block_passed
        ? BlockConfirmation.CONFIRMED
        : BlockConfirmation.UNKNOWN
    }

    let confirmation: BlockConfirmation = await confirmBlock()

    const timeout = setTimeout(() => {
      throw new Error(
        `Could not confirm write within ${CONFIRMATION_TIMEOUT}ms`
      )
    }, confirmationTimeout)

    while (confirmation === BlockConfirmation.UNKNOWN) {
      await new Promise((resolve) =>
        setTimeout(resolve, POLLING_FREQUENCY_MILLIS)
      )
      confirmation = await confirmBlock()
    }

    clearTimeout(timeout)

    if (confirmation === BlockConfirmation.CONFIRMED) {
      return
    } else {
      throw Error('Transaction failed')
    }
  }
}
