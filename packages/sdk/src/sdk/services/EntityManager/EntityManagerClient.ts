import {
  createPublicClient,
  encodeFunctionData,
  http,
  type Hex,
  type PublicClient,
  type TypedDataDefinition
} from 'viem'
import type { TransactionReceipt } from 'web3-core'

import { productionConfig } from '../../config/production'
import fetch, { Headers } from '../../utils/fetch'
import { mergeConfigWithDefaults } from '../../utils/mergeConfigs'
import { getNonce } from '../../utils/signatureSchemas'
import type { AudiusWalletClient } from '../AudiusWalletClient'
import type { DiscoveryNodeSelectorService } from '../DiscoveryNodeSelector'
import type { LoggerService } from '../Logger'

import {
  EntityManager,
  type EntityManagerTypes
} from './contract/EntityManagerContract'
import { getDefaultEntityManagerConfig } from './getDefaultConfig'
import {
  BlockConfirmation,
  EntityManagerConfig,
  EntityManagerService,
  ManageEntityOptions
} from './types'

const DEFAULT_GAS_LIMIT = 2000000
const CONFIRMATION_POLLING_INTERVAL = 2000
const CONFIRMATION_TIMEOUT = 45000

export class EntityManagerClient implements EntityManagerService {
  private readonly discoveryNodeSelector: DiscoveryNodeSelectorService
  private readonly audiusWalletClient: AudiusWalletClient
  private readonly logger: LoggerService

  private readonly chainId: number
  private readonly contractAddress: string

  private publicClient: PublicClient | undefined

  constructor(config_: EntityManagerConfig) {
    const config = mergeConfigWithDefaults(
      config_,
      getDefaultEntityManagerConfig(productionConfig)
    )
    this.discoveryNodeSelector = config.discoveryNodeSelector
    this.audiusWalletClient = config.audiusWalletClient
    this.chainId = config.chainId
    this.contractAddress = config.contractAddress
    this.logger = config.logger.createPrefixedLogger('[entity-manager]')
  }

  private async getClient() {
    if (!this.publicClient) {
      const web3Provider = `${await this.discoveryNodeSelector.getSelectedEndpoint()}/chain`
      this.publicClient = createPublicClient({
        transport: http(web3Provider)
      })
    }
    return this.publicClient
  }

  /**
   * Calls the manage entity method on chain to update some data
   */
  public async manageEntity({
    userId,
    entityType,
    entityId,
    action,
    metadata = '',
    confirmationTimeout = CONFIRMATION_TIMEOUT,
    skipConfirmation = false
  }: ManageEntityOptions): Promise<
    Pick<TransactionReceipt, 'blockHash' | 'blockNumber'>
  > {
    const nonce = await getNonce()

    const typedData: TypedDataDefinition<EntityManagerTypes, 'ManageEntity'> = {
      domain: {
        name: 'Entity Manager',
        chainId: BigInt(this.chainId),
        version: '1',
        verifyingContract: this.contractAddress as Hex
      },
      primaryType: 'ManageEntity',
      message: {
        userId: userId!,
        entityType,
        entityId,
        action,
        metadata,
        nonce
      },
      types: EntityManager.types
    }

    const [senderAddress] = await this.audiusWalletClient.getAddresses()
    const signature = await this.audiusWalletClient.signTypedData(typedData)

    const url = `${await this.discoveryNodeSelector.getSelectedEndpoint()}/relay`
    this.logger.info(`Making relay request to ${url}`)
    const response = await fetch(url, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({
        contractAddress: this.contractAddress,
        contractRegistryKey: 'EntityManager',
        encodedABI: encodeFunctionData({
          abi: EntityManager.abi,
          args: [
            userId,
            entityType,
            entityId,
            action,
            metadata,
            nonce,
            signature
          ],
          functionName: 'manageEntity'
        }),
        // Gas limit not really needed with ACDC
        gasLimit: DEFAULT_GAS_LIMIT,
        senderAddress
      })
    })
    const jsonResponse = await response.json()
    if (response.ok) {
      if (!skipConfirmation) {
        await this.confirmWrite({
          blockHash: jsonResponse.receipt.blockHash,
          blockNumber: jsonResponse.receipt.blockNumber,
          confirmationTimeout
        })
      }

      return {
        blockHash: jsonResponse.receipt.blockHash,
        blockNumber: jsonResponse.receipt.blockNumber
      }
    } else if (response.status === 429) {
      this.logger.error(
        'API Rate Limit Exceeded: You have exceeded the allowed number of requests for this action. Please wait and try again later. If you require a higher rate limit, please send an email to api@audius.co with your request, detailing the reasons and expected usage.'
      )
      throw new Error(
        'Error making relay request: API Rate Limit Exceeded. If you require a higher rate limit, please send an email to api@audius.co with your request.'
      )
    } else {
      throw new Error(
        `Error making relay request ${response.status} ${
          jsonResponse?.error?.message ? `: ${jsonResponse.error.message}` : '.'
        }`
      )
    }
  }

  /**
   * Confirms a write by polling for the block to be indexed by the selected
   * discovery node
   */
  public async confirmWrite({
    blockHash,
    blockNumber,
    confirmationTimeout = CONFIRMATION_TIMEOUT,
    confirmationPollingInterval = CONFIRMATION_POLLING_INTERVAL
  }: {
    blockHash: string
    blockNumber: number
    confirmationTimeout?: number
    confirmationPollingInterval?: number
  }) {
    this.logger.info('Confirming write')
    const confirmBlock = async () => {
      const endpoint = await this.discoveryNodeSelector.getSelectedEndpoint()
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

    const start = Date.now()
    while (confirmation === BlockConfirmation.UNKNOWN) {
      if (Date.now() - start > confirmationTimeout) {
        throw new Error(
          `Could not confirm write within ${confirmationTimeout}ms`
        )
      }
      await new Promise((resolve) =>
        setTimeout(resolve, confirmationPollingInterval)
      )
      confirmation = await confirmBlock()
    }

    this.logger.info('Write confirmed')
    return true
  }

  public async getCurrentBlock() {
    const client = await this.getClient()
    const currentBlockNumber = await client.getBlockNumber()
    const block = await client.getBlock({ blockNumber: currentBlockNumber })
    // TODO: Make this not need to be cast to number
    return { ...block, timestamp: Number(block.timestamp) }
  }
}
