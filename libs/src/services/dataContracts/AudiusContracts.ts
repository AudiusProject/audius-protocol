import type { AbiItem } from 'web3-utils'
import type { Logger } from '../../utils'

// load classes wrapping contracts
import { EntityManagerClient } from './EntityManagerClient'
import type { Web3Manager } from '../web3Manager'
import type {
  ContractClient,
  GetRegistryAddress
} from '../contracts/ContractClient'
import { abi as EntityManagerABI } from '../../data-contracts/ABIs/EntityManager.json'

export class AudiusContracts {
  web3Manager: Web3Manager
  registryAddress: string
  entityManagerAddress: string
  isServer: boolean
  logger: Logger
  EntityManagerClient: EntityManagerClient | undefined
  contractClients: ContractClient[]
  contracts: Record<string, string> | undefined
  contractAddresses: Record<string, string> | undefined

  constructor(
    web3Manager: Web3Manager,
    registryAddress: string,
    entityManagerAddress: string,
    isServer: boolean,
    logger: Logger = console
  ) {
    this.web3Manager = web3Manager
    this.registryAddress = registryAddress
    this.entityManagerAddress = entityManagerAddress
    this.isServer = isServer
    this.logger = logger

    this.contractClients = []

    if (this.entityManagerAddress) {
      this.EntityManagerClient = new EntityManagerClient(
        this.web3Manager,
        EntityManagerABI as AbiItem[],
        'EntityManager',
        this.getEmptyRegistryAddress,
        this.logger,
        this.entityManagerAddress
      )
      this.contractClients.push(this.EntityManagerClient)
    }
  }

  getEmptyRegistryAddress: GetRegistryAddress = async () => {
    return await Promise.resolve('')
  }

  async init() {
    if (this.isServer) {
      await Promise.all(
        this.contractClients.map(async (client) => await client.init())
      )
    }
  }
}
