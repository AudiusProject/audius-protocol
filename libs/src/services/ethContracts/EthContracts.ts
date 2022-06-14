import semver from 'semver'
import { AudiusTokenClient } from './AudiusTokenClient'
import { RegistryClient } from './RegistryClient'
import { GovernanceClient } from './GovernanceClient'
import { ServiceTypeManagerClient } from './ServiceTypeManagerClient'
import { ServiceProviderFactoryClient } from './ServiceProviderFactoryClient'
import { StakingProxyClient } from './StakingProxyClient'
import { DelegateManagerClient } from './DelegateManagerClient'
import { ClaimsManagerClient } from './ClaimsManagerClient'
import { ClaimDistributionClient } from './ClaimDistributionClient'
import { WormholeClient } from './WormholeClient'
import { EthRewardsManagerClient } from './EthRewardsManagerClient'
import { TrustedNotifierManagerClient } from './TrustedNotifierManagerClient'
import { Logger, Utils } from '../../utils'
import type { EthWeb3Manager } from '../ethWeb3Manager'
import type { ContractClient } from '../contracts/ContractClient'

const AudiusTokenABI = Utils.importEthContractABI('AudiusToken.json').abi
const RegistryABI = Utils.importEthContractABI('Registry.json').abi
const GovernanceABI = Utils.importEthContractABI('Governance.json').abi
const ServiceTypeManagerABI = Utils.importEthContractABI(
  'ServiceTypeManager.json'
).abi
const ServiceProviderFactoryABI = Utils.importEthContractABI(
  'ServiceProviderFactory.json'
).abi
const StakingABI = Utils.importEthContractABI('Staking.json').abi
const DelegateManagerABI = Utils.importEthContractABI(
  'DelegateManagerV2.json'
).abi
const ClaimsManagerABI = Utils.importEthContractABI('ClaimsManager.json').abi
const ClaimDistributionABI = Utils.importEthContractABI(
  'AudiusClaimDistributor.json'
).abi
const WormholeClientABI = Utils.importEthContractABI('WormholeClient.json').abi
const EthRewardsManagerABI = Utils.importEthContractABI(
  'EthRewardsManager.json'
).abi
const TrustedNotifierManagerABI = Utils.importEthContractABI(
  'TrustedNotifierManager.json'
).abi

const GovernanceRegistryKey = 'Governance'
const ServiceTypeManagerProxyKey = 'ServiceTypeManagerProxy'
const ServiceProviderFactoryRegistryKey = 'ServiceProviderFactory'
const StakingProxyKey = 'StakingProxy'
const DelegateManagerRegistryKey = 'DelegateManager'
const ClaimsManagerProxyKey = 'ClaimsManagerProxy'
const ClaimDistributionRegistryKey = 'ClaimDistribution'
const EthRewardsManagerProxyKey = 'EthRewardsManagerProxy'
const TrustedNotifierManagerProxyKey = 'TrustedNotifierManagerProxy'

const TWO_MINUTES = 2 * 60 * 1000

export const serviceType = Object.freeze({
  DISCOVERY_PROVIDER: 'discovery-node',
  CREATOR_NODE: 'content-node'
})
const serviceTypeList = Object.values(serviceType)

export type EthContractsConfig = {
  ethWeb3Manager: EthWeb3Manager
  tokenContractAddress: string
  registryAddress: string
  claimDistributionContractAddress: string
  wormholeContractAddress: string
  isServer?: boolean
  logger?: Logger
  isDebug?: boolean
}

export class EthContracts {
  ethWeb3Manager: EthWeb3Manager
  tokenContractAddress: string
  claimDistributionContractAddress: string
  wormholeContractAddress: string
  registryAddress: string
  isServer: boolean
  logger: Logger
  isDebug: boolean
  expectedServiceVersions: null | string[]
  AudiusTokenClient: AudiusTokenClient
  RegistryClient: RegistryClient
  StakingProxyClient: StakingProxyClient
  GovernanceClient: GovernanceClient
  ClaimsManagerClient: ClaimsManagerClient
  EthRewardsManagerClient: EthRewardsManagerClient
  ServiceTypeManagerClient: ServiceTypeManagerClient
  ServiceProviderFactoryClient: ServiceProviderFactoryClient
  DelegateManagerClient: DelegateManagerClient
  ClaimDistributionClient: ClaimDistributionClient | undefined
  WormholeClient: WormholeClient
  TrustedNotifierManagerClient: TrustedNotifierManagerClient
  contractClients: ContractClient[]
  _regressedMode: boolean
  contracts: Record<string, string> | undefined
  contractAddresses: Record<string, string> | undefined

  constructor({
    ethWeb3Manager,
    tokenContractAddress,
    registryAddress,
    claimDistributionContractAddress,
    wormholeContractAddress,
    isServer = false,
    logger = console,
    isDebug = false
  }: EthContractsConfig) {
    this.ethWeb3Manager = ethWeb3Manager
    this.tokenContractAddress = tokenContractAddress
    this.claimDistributionContractAddress = claimDistributionContractAddress
    this.wormholeContractAddress = wormholeContractAddress
    this.registryAddress = registryAddress
    this.isServer = isServer
    this.logger = logger
    this.isDebug = isDebug
    this.expectedServiceVersions = null

    this.AudiusTokenClient = new AudiusTokenClient(
      this.ethWeb3Manager,
      AudiusTokenABI,
      this.tokenContractAddress
    )
    this.RegistryClient = new RegistryClient(
      this.ethWeb3Manager,
      RegistryABI,
      this.registryAddress
    )
    this.getRegistryAddressForContract =
      this.getRegistryAddressForContract.bind(this)

    this.StakingProxyClient = new StakingProxyClient(
      this.ethWeb3Manager,
      StakingABI,
      StakingProxyKey,
      this.getRegistryAddressForContract,
      this.AudiusTokenClient,
      this.logger
    )

    this.GovernanceClient = new GovernanceClient(
      this.ethWeb3Manager,
      GovernanceABI,
      GovernanceRegistryKey,
      this.getRegistryAddressForContract,
      this.AudiusTokenClient,
      this.StakingProxyClient,
      this.logger
    )

    this.ClaimsManagerClient = new ClaimsManagerClient(
      this.ethWeb3Manager,
      ClaimsManagerABI,
      ClaimsManagerProxyKey,
      this.getRegistryAddressForContract,
      this.logger
    )

    this.EthRewardsManagerClient = new EthRewardsManagerClient(
      this.ethWeb3Manager,
      EthRewardsManagerABI,
      EthRewardsManagerProxyKey,
      this.getRegistryAddressForContract,
      this.logger
    )

    this.ServiceTypeManagerClient = new ServiceTypeManagerClient(
      this.ethWeb3Manager,
      ServiceTypeManagerABI,
      ServiceTypeManagerProxyKey,
      this.getRegistryAddressForContract,
      this.GovernanceClient,
      this.logger
    )

    this.ServiceProviderFactoryClient = new ServiceProviderFactoryClient(
      this.ethWeb3Manager,
      ServiceProviderFactoryABI,
      ServiceProviderFactoryRegistryKey,
      this.getRegistryAddressForContract,
      this.AudiusTokenClient,
      this.StakingProxyClient,
      this.GovernanceClient,
      this.logger,
      this.isDebug
    )

    this.DelegateManagerClient = new DelegateManagerClient(
      this.ethWeb3Manager,
      DelegateManagerABI,
      DelegateManagerRegistryKey,
      this.getRegistryAddressForContract,
      this.AudiusTokenClient,
      this.StakingProxyClient,
      this.GovernanceClient,
      this.logger
    )

    if (this.claimDistributionContractAddress) {
      this.ClaimDistributionClient = new ClaimDistributionClient(
        this.ethWeb3Manager,
        ClaimDistributionABI,
        ClaimDistributionRegistryKey,
        this.getRegistryAddressForContract,
        this.logger,
        this.claimDistributionContractAddress
      )
    }

    this.WormholeClient = new WormholeClient(
      this.ethWeb3Manager,
      WormholeClientABI,
      this.wormholeContractAddress,
      this.AudiusTokenClient
    )

    this.TrustedNotifierManagerClient = new TrustedNotifierManagerClient(
      this.ethWeb3Manager,
      TrustedNotifierManagerABI,
      TrustedNotifierManagerProxyKey,
      this.getRegistryAddressForContract,
      this.GovernanceClient,
      this.logger
    )

    this.contractClients = [
      this.ServiceTypeManagerClient,
      this.StakingProxyClient,
      this.ServiceProviderFactoryClient
    ]

    // Whether or not we are running in `regressed` mode, meaning we were
    // unable to select a discovery provider that was up-to-date. Clients may
    // want to consider blocking writes.
    this._regressedMode = false
  }

  async init() {
    if (
      !this.ethWeb3Manager ||
      !this.tokenContractAddress ||
      !this.registryAddress
    )
      throw new Error('Failed to initialize EthContracts')

    if (this.isServer) {
      await Promise.all(
        this.contractClients.map(async (client) => await client.init())
      )
    }
  }

  /**
   * Estabilishes that connection to discovery providers has regressed
   */
  enterRegressedMode() {
    console.info('Entering regressed mode')
    this._regressedMode = true
    setTimeout(() => {
      console.info('Leaving regressed mode')
      this._regressedMode = false
    }, TWO_MINUTES)
  }

  isInRegressedMode() {
    return this._regressedMode
  }

  async getRegistryAddressForContract(contractName: string) {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#Computed_property_names
    this.contracts = this.contracts ?? { [this.registryAddress]: 'registry' }
    this.contractAddresses = this.contractAddresses ?? {
      registry: this.registryAddress
    }
    if (!this.contractAddresses[contractName]) {
      const address = await this.RegistryClient.getContract(contractName)
      this.contracts[address] = contractName
      this.contractAddresses[contractName] = address
    }

    return this.contractAddresses[contractName] as string
  }

  async getCurrentVersion(serviceType: string) {
    try {
      const version = await this.ServiceTypeManagerClient.getCurrentVersion(
        serviceType
      )
      return version
    } catch (e) {
      console.log(`Error retrieving version for ${serviceType}`)
      return ''
    }
  }

  /*
   * Determine the latest version for deployed services such as discovery provider and cache
   */
  async getExpectedServiceVersions() {
    const versions = await Promise.all(
      serviceTypeList.map(
        async (serviceType) => await this.getCurrentVersion(serviceType)
      )
    )
    const expectedVersions = serviceTypeList.reduce<
      Record<string, string | null | undefined>
    >((map, serviceType, i) => {
      if (versions[i]) {
        map[serviceType] = versions[i]
      }
      return map
    }, {})
    return expectedVersions
  }

  /**
   * Determine whether major and minor versions match for two version strings
   * Version string 2 must have equivalent major/minor versions and a patch >= version1
   * @param version1 string 1
   * @param version2 string 2
   */
  isValidSPVersion(version1: string, version2: string) {
    return (
      semver.major(version1) === semver.major(version2) &&
      semver.minor(version1) === semver.minor(version2) &&
      semver.patch(version2) >= semver.patch(version1)
    )
  }

  /**
   * Determines whether the major and minor versions are equal
   * @param version1 string 1
   * @param version2 string 2
   */
  hasSameMajorAndMinorVersion(version1: string, version2: string) {
    return (
      semver.major(version1) === semver.major(version2) &&
      semver.minor(version1) === semver.minor(version2)
    )
  }

  async getServiceProviderList(spType: string) {
    return await this.ServiceProviderFactoryClient.getServiceProviderList(
      spType
    )
  }

  async getNumberOfVersions(spType: string) {
    return await this.ServiceTypeManagerClient.getNumberOfVersions(spType)
  }

  async getVersion(spType: string, queryIndex: number) {
    return await this.ServiceTypeManagerClient.getVersion(spType, queryIndex)
  }

  async getServiceTypeInfo(spType: string) {
    return await this.ServiceTypeManagerClient.getServiceTypeInfo(spType)
  }
}
