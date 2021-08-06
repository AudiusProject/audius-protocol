const semver = require('semver')
let urlJoin = require('proper-url-join')

const AudiusTokenClient = require('./audiusTokenClient')
const RegistryClient = require('./registryClient')
const { GovernanceClient } = require('./governanceClient')
const ServiceTypeManagerClient = require('./serviceTypeManagerClient')
const ServiceProviderFactoryClient = require('./serviceProviderFactoryClient')
const StakingProxyClient = require('./stakingProxyClient')
const DelegateManagerClient = require('./delegateManagerClient')
const ClaimsManagerClient = require('./claimsManagerClient')
const ClaimDistributionClient = require('./claimDistributionClient')
const WormholeClient = require('./wormholeClient')
const EthRewardsManagerClient = require('./ethRewardsManagerClient')
const Utils = require('../../utils')

const AudiusTokenABI = Utils.importEthContractABI('AudiusToken.json').abi
const RegistryABI = Utils.importEthContractABI('Registry.json').abi
const GovernanceABI = Utils.importEthContractABI('Governance.json').abi
const ServiceTypeManagerABI = Utils.importEthContractABI('ServiceTypeManager.json').abi
const ServiceProviderFactoryABI = Utils.importEthContractABI('ServiceProviderFactory.json').abi
const StakingABI = Utils.importEthContractABI('Staking.json').abi
const DelegateManagerABI = Utils.importEthContractABI('DelegateManager.json').abi
const ClaimsManagerABI = Utils.importEthContractABI('ClaimsManager.json').abi
const ClaimDistributionABI = Utils.importEthContractABI('AudiusClaimDistributor.json').abi
const WormholeABI = Utils.importEthContractABI('BridgeImplementation.json').abi
const EthRewardsManagerABI = Utils.importEthContractABI('EthRewardsManager.json').abi

const GovernanceRegistryKey = 'Governance'
const ServiceTypeManagerProxyKey = 'ServiceTypeManagerProxy'
const ServiceProviderFactoryRegistryKey = 'ServiceProviderFactory'
const StakingProxyKey = 'StakingProxy'
const DelegateManagerRegistryKey = 'DelegateManager'
const ClaimsManagerProxyKey = 'ClaimsManagerProxy'
const ClaimDistributionRegistryKey = 'ClaimDistribution'
const EthRewardsManagerProxyKey = 'EthRewardsManagerProxy'

const TWO_MINUTES = 2 * 60 * 1000

const serviceType = Object.freeze({
  DISCOVERY_PROVIDER: 'discovery-node',
  CREATOR_NODE: 'content-node'
})
const serviceTypeList = Object.values(serviceType)
if (urlJoin && urlJoin.default) urlJoin = urlJoin.default

class EthContracts {
  constructor (
    ethWeb3Manager,
    tokenContractAddress,
    registryAddress,
    claimDistributionContractAddress,
    wormholeContractAddress,
    isServer,
    isDebug = false
  ) {
    this.ethWeb3Manager = ethWeb3Manager
    this.tokenContractAddress = tokenContractAddress
    this.claimDistributionContractAddress = claimDistributionContractAddress
    this.wormholeContractAddress = wormholeContractAddress
    this.registryAddress = registryAddress
    this.isServer = isServer
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
    this.getRegistryAddressForContract = this.getRegistryAddressForContract.bind(this)

    this.StakingProxyClient = new StakingProxyClient(
      this.ethWeb3Manager,
      StakingABI,
      StakingProxyKey,
      this.getRegistryAddressForContract,
      this.AudiusTokenClient
    )

    this.GovernanceClient = new GovernanceClient(
      this.ethWeb3Manager,
      GovernanceABI,
      GovernanceRegistryKey,
      this.getRegistryAddressForContract,
      this.AudiusTokenClient,
      this.StakingProxyClient
    )

    this.ClaimsManagerClient = new ClaimsManagerClient(
      this.ethWeb3Manager,
      ClaimsManagerABI,
      ClaimsManagerProxyKey,
      this.getRegistryAddressForContract
    )

    this.EthRewardsManagerClient = new EthRewardsManagerClient(
      this.ethWeb3Manager,
      EthRewardsManagerABI,
      EthRewardsManagerProxyKey,
      this.getRegistryAddressForContract
    )

    this.ServiceTypeManagerClient = new ServiceTypeManagerClient(
      this.ethWeb3Manager,
      ServiceTypeManagerABI,
      ServiceTypeManagerProxyKey,
      this.getRegistryAddressForContract,
      this.GovernanceClient
    )

    this.ServiceProviderFactoryClient = new ServiceProviderFactoryClient(
      this.ethWeb3Manager,
      ServiceProviderFactoryABI,
      ServiceProviderFactoryRegistryKey,
      this.getRegistryAddressForContract,
      this.AudiusTokenClient,
      this.StakingProxyClient,
      this.GovernanceClient,
      this.isDebug
    )

    this.DelegateManagerClient = new DelegateManagerClient(
      this.ethWeb3Manager,
      DelegateManagerABI,
      DelegateManagerRegistryKey,
      this.getRegistryAddressForContract,
      this.AudiusTokenClient,
      this.StakingProxyClient,
      this.GovernanceClient
    )

    if (this.claimDistributionContractAddress) {
      this.ClaimDistributionClient = new ClaimDistributionClient(
        this.ethWeb3Manager,
        ClaimDistributionABI,
        ClaimDistributionRegistryKey,
        this.getRegistryAddressForContract,
        this.claimDistributionContractAddress
      )
    }

    this.WormholeClient = new WormholeClient(
      this.ethWeb3Manager,
      WormholeABI,
      this.wormholeContractAddress,
      this.AudiusTokenClient
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

  async init () {
    if (!this.ethWeb3Manager || !this.tokenContractAddress || !this.registryAddress) throw new Error('Failed to initialize EthContracts')

    if (this.isServer) {
      await Promise.all(this.contractClients.map(client => client.init()))
    }
  }

  /**
   * Estabilishes that connection to discovery providers has regressed
   */
  enterRegressedMode () {
    console.info('Entering regressed mode')
    this._regressedMode = true
    setTimeout(() => {
      console.info('Leaving regressed mode')
      this._regressedMode = false
    }, TWO_MINUTES)
  }

  isInRegressedMode () {
    return this._regressedMode
  }

  async getRegistryAddressForContract (contractName) {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#Computed_property_names
    this.contracts = this.contracts || { [this.registryAddress]: 'registry' }
    this.contractAddresses = this.contractAddresses || { 'registry': this.registryAddress }
    if (!this.contractAddresses[contractName]) {
      const address = await this.RegistryClient.getContract(contractName)
      this.contracts[address] = contractName
      this.contractAddresses[contractName] = address
    }
    return this.contractAddresses[contractName]
  }

  async getCurrentVersion (serviceType) {
    try {
      const version = await this.ServiceTypeManagerClient.getCurrentVersion(serviceType)
      return version
    } catch (e) {
      console.log(`Error retrieving version for ${serviceType}`)
      return null
    }
  }

  /*
   * Determine the latest version for deployed services such as discovery provider and cache
   */
  async getExpectedServiceVersions () {
    const versions = await Promise.all(
      serviceTypeList.map(serviceType => this.getCurrentVersion(serviceType))
    )
    const expectedVersions = serviceTypeList.reduce((map, serviceType, i) => {
      if (versions[i]) {
        map[serviceType] = versions[i]
      }
      return map
    }, {})
    return expectedVersions
  }

  /*
   * Determine whether major and minor versions match for two version strings
   * Version string 2 must have equivalent major/minor versions and a patch >= version1
   * @param {string} version string 1
   * @param {string} version string 2
   */
  isValidSPVersion (version1, version2) {
    return (
      semver.major(version1) === semver.major(version2) &&
      semver.minor(version1) === semver.minor(version2) &&
      semver.patch(version2) >= semver.patch(version1)
    )
  }

  /**
   * Determines whether the major and minor versions are equal
   * @param {string} version string 1
   * @param {string} version string 2
   */
  hasSameMajorAndMinorVersion (version1, version2) {
    return (
      semver.major(version1) === semver.major(version2) &&
      semver.minor(version1) === semver.minor(version2)
    )
  }

  async getServiceProviderList (spType) {
    return this.ServiceProviderFactoryClient.getServiceProviderList(spType)
  }

  async getNumberOfVersions (spType) {
    return this.ServiceTypeManagerClient.getNumberOfVersions(spType)
  }

  async getVersion (spType, queryIndex) {
    return this.ServiceTypeManagerClient.getVersion(spType, queryIndex)
  }

  async getServiceTypeInfo (spType) {
    return this.ServiceTypeManagerClient.getServiceTypeInfo(spType)
  }
}

module.exports = EthContracts
module.exports.serviceType = serviceType
