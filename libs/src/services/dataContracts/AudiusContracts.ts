import type { AbiItem } from 'web3-utils'
import { Utils, Logger } from '../../utils'

// load classes wrapping contracts
import { RegistryClient } from './RegistryClient'
import { UserFactoryClient } from './UserFactoryClient'
import { TrackFactoryClient } from './TrackFactoryClient'
import { SocialFeatureFactoryClient } from './SocialFeatureFactoryClient'
import { PlaylistFactoryClient } from './PlaylistFactoryClient'
import { UserLibraryFactoryClient } from './UserLibraryFactoryClient'
import { IPLDBlacklistFactoryClient } from './IPLDBlacklistFactoryClient'
import { UserReplicaSetManagerClient } from './UserReplicaSetManagerClient'
import type { Web3Manager } from '../web3Manager'
import type { ContractClient } from '../contracts/ContractClient'
import { abi as RegistryABI } from '../../data-contracts/ABIs/Registry.json'
import { abi as UserFactoryABI } from '../../data-contracts/ABIs/UserFactory.json'
import { abi as TrackFactoryABI } from '../../data-contracts/ABIs/TrackFactory.json'
import { abi as SocialFeatureFactoryABI } from '../../data-contracts/ABIs/SocialFeatureFactory.json'
import { abi as PlaylistFactoryABI } from '../../data-contracts/ABIs/PlaylistFactory.json'
import { abi as UserLibraryFactoryABI } from '../../data-contracts/ABIs/UserLibraryFactory.json'
import { abi as IPLDBlacklistFactoryABI } from '../../data-contracts/ABIs/IPLDBlacklistFactory.json'
import { abi as UserReplicaSetManagerABI } from '../../data-contracts/ABIs/UserReplicaSetManager.json'

// define contract registry keys
const UserFactoryRegistryKey = 'UserFactory'
const TrackFactoryRegistryKey = 'TrackFactory'
const SocialFeatureFactoryRegistryKey = 'SocialFeatureFactory'
const PlaylistFactoryRegistryKey = 'PlaylistFactory'
const UserLibraryFactoryRegistryKey = 'UserLibraryFactory'
const IPLDBlacklistFactoryRegistryKey = 'IPLDBlacklistFactory'
const UserReplicaSetManagerRegistryKey = 'UserReplicaSetManager'

export class AudiusContracts {
  web3Manager: Web3Manager
  registryAddress: string
  isServer: boolean
  logger: Logger
  RegistryClient: RegistryClient
  UserFactoryClient: UserFactoryClient
  TrackFactoryClient: TrackFactoryClient
  SocialFeatureFactoryClient: SocialFeatureFactoryClient
  PlaylistFactoryClient: PlaylistFactoryClient
  UserLibraryFactoryClient: UserLibraryFactoryClient
  IPLDBlacklistFactoryClient: IPLDBlacklistFactoryClient
  contractClients: ContractClient[]
  UserReplicaSetManagerClient: UserReplicaSetManagerClient | undefined | null
  contracts: Record<string, string> | undefined
  contractAddresses: Record<string, string> | undefined

  constructor(
    web3Manager: Web3Manager,
    registryAddress: string,
    isServer: boolean,
    logger: Logger = console
  ) {
    this.web3Manager = web3Manager
    this.registryAddress = registryAddress
    this.isServer = isServer
    this.logger = logger

    this.RegistryClient = new RegistryClient(
      this.web3Manager,
      RegistryABI as AbiItem[],
      this.registryAddress
    )
    this.getRegistryAddressForContract =
      this.getRegistryAddressForContract.bind(this)

    this.UserFactoryClient = new UserFactoryClient(
      this.web3Manager,
      UserFactoryABI as AbiItem[],
      UserFactoryRegistryKey,
      this.getRegistryAddressForContract,
      this.logger
    )

    this.TrackFactoryClient = new TrackFactoryClient(
      this.web3Manager,
      TrackFactoryABI as AbiItem[],
      TrackFactoryRegistryKey,
      this.getRegistryAddressForContract,
      this.logger
    )

    this.SocialFeatureFactoryClient = new SocialFeatureFactoryClient(
      this.web3Manager,
      SocialFeatureFactoryABI as AbiItem[],
      SocialFeatureFactoryRegistryKey,
      this.getRegistryAddressForContract,
      this.logger
    )

    this.PlaylistFactoryClient = new PlaylistFactoryClient(
      this.web3Manager,
      PlaylistFactoryABI as AbiItem[],
      PlaylistFactoryRegistryKey,
      this.getRegistryAddressForContract,
      this.logger
    )

    this.UserLibraryFactoryClient = new UserLibraryFactoryClient(
      this.web3Manager,
      UserLibraryFactoryABI as AbiItem[],
      UserLibraryFactoryRegistryKey,
      this.getRegistryAddressForContract,
      this.logger
    )

    this.IPLDBlacklistFactoryClient = new IPLDBlacklistFactoryClient(
      this.web3Manager,
      IPLDBlacklistFactoryABI as AbiItem[],
      IPLDBlacklistFactoryRegistryKey,
      this.getRegistryAddressForContract,
      this.logger
    )

    this.contractClients = [
      this.UserFactoryClient,
      this.TrackFactoryClient,
      this.SocialFeatureFactoryClient,
      this.PlaylistFactoryClient,
      this.UserLibraryFactoryClient,
      this.IPLDBlacklistFactoryClient
    ]
  }

  async init() {
    if (this.isServer) {
      await Promise.all(
        this.contractClients.map(async (client) => await client.init())
      )
      await this.initUserReplicaSetManagerClient()
    }
  }

  // Special case initialization flow for UserReplicaSetManagerClient backwards compatibility
  // Until the contract is deployed and added to the data contract registry, replica set
  // operations will flow through the existing UserFactory
  async initUserReplicaSetManagerClient() {
    try {
      if (
        this.UserReplicaSetManagerClient &&
        this.UserReplicaSetManagerClient._contractAddress !==
          '0x0000000000000000000000000000000000000000'
      ) {
        return
      }

      this.UserReplicaSetManagerClient = new UserReplicaSetManagerClient(
        this.web3Manager,
        UserReplicaSetManagerABI as AbiItem[],
        UserReplicaSetManagerRegistryKey,
        this.getRegistryAddressForContract,
        this.logger
      )
      await this.UserReplicaSetManagerClient.init()
      if (
        this.UserReplicaSetManagerClient._contractAddress ===
        '0x0000000000000000000000000000000000000000'
      ) {
        throw new Error(
          `Failed retrieve address for ${this.UserReplicaSetManagerClient.contractRegistryKey}`
        )
      }
      const seedComplete =
        await this.UserReplicaSetManagerClient.getSeedComplete()
      if (!seedComplete) {
        throw new Error('UserReplicaSetManager pending seed operation')
      }
    } catch (e) {
      // Nullify failed attempt to initialize
      console.log(
        `Failed to initialize UserReplicaSetManagerClient with error ${
          (e as Error).message
        }`
      )
      this.UserReplicaSetManagerClient = null
    }
  }

  /* ------- CONTRACT META-FUNCTIONS ------- */

  /**
   * Retrieves contract address from Registry by key, caching previously retrieved data.
   * Refreshes cache if cached value is empty or zero address.
   * Value is empty during first time call, and zero if call is made before contract is deployed,
   *    since Registry sets default value of all contract keys to zero address if not registered.
   * @param contractName registry key of contract
   */
  async getRegistryAddressForContract(contractName: string) {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#Computed_property_names
    this.contracts = this.contracts ?? { [this.registryAddress]: 'registry' }
    this.contractAddresses = this.contractAddresses ?? {
      registry: this.registryAddress
    }

    if (
      !this.contractAddresses[contractName] ||
      Utils.isZeroAddress(this.contractAddresses[contractName] as string)
    ) {
      const address = (await this.RegistryClient.getContract(
        contractName
      )) as string
      this.contracts[address] = contractName
      this.contractAddresses[contractName] = address
    }
    return this.contractAddresses[contractName] as string
  }

  async getRegistryContractForAddress(address: string) {
    if (!this.contracts) {
      throw new Error('No contracts found. Have you called init() yet?')
    }
    const contractRegistryKey = this.contracts[address]
    if (!contractRegistryKey) {
      throw new Error(
        `No registry contract found for contract address ${address}`
      )
    }
    return contractRegistryKey
  }
}
