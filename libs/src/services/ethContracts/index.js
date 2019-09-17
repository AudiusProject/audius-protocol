const axios = require('axios')
const semver = require('semver')
let urlJoin = require('proper-url-join')

const AudiusTokenClient = require('./audiusTokenClient')
const RegistryClient = require('./registryClient')
const VersioningFactoryClient = require('./versioningFactoryClient')
const ServiceProviderFactoryClient = require('./serviceProviderFactoryClient')
const StakingProxyClient = require('./stakingProxyClient')
const Utils = require('../../utils')

let localStorage
if (typeof window === 'undefined' || window === null) {
  const LocalStorage = require('node-localstorage').LocalStorage
  localStorage = new LocalStorage('./local-storage')
} else {
  localStorage = window.localStorage
}

const AudiusTokenABI = Utils.importEthContractABI('AudiusToken.json').abi
const RegistryABI = Utils.importEthContractABI('Registry.json').abi
const VersioningFactoryABI = Utils.importEthContractABI('VersioningFactory.json').abi
const ServiceProviderFactoryABI = Utils.importEthContractABI('ServiceProviderFactory.json').abi
const StakingABI = Utils.importEthContractABI('Staking.json').abi

const VersioningFactoryRegistryKey = 'VersioningFactory'
const ServiceProviderFactoryRegistryKey = 'ServiceProviderFactory'
const OwnedUpgradeabilityProxyKey = 'OwnedUpgradeabilityProxy'

const serviceType = Object.freeze({
  DISCOVERY_PROVIDER: 'discovery-provider',
  CONTENT_SERVICE: 'content-service',
  CREATOR_NODE: 'creator-node'
})
const serviceTypeList = Object.values(serviceType)
if (urlJoin && urlJoin.default) urlJoin = urlJoin.default

class EthContracts {
  constructor (ethWeb3Manager, tokenContractAddress, registryAddress) {
    this.ethWeb3Manager = ethWeb3Manager
    this.tokenContractAddress = tokenContractAddress
    this.registryAddress = registryAddress

    this.AudiusTokenClient = new AudiusTokenClient(
      this.ethWeb3Manager,
      AudiusTokenABI,
      this.tokenContractAddress
    )

    this.clients = []
    this.getRegistryAddressForContract = this.getRegistryAddressForContract.bind(this)
  }

  async init () {
    if (!this.ethWeb3Manager || !this.tokenContractAddress || !this.registryAddress) throw new Error('Failed to initialize EthContracts')

    this.RegistryClient = new RegistryClient(
      this.ethWeb3Manager,
      RegistryABI,
      this.registryAddress
    )

    this.VersioningFactoryClient = new VersioningFactoryClient(
      this.ethWeb3Manager,
      VersioningFactoryABI,
      VersioningFactoryRegistryKey,
      this.getRegistryAddressForContract // get contract address from registry
    )
    this.clients.push(this.VersioningFactoryClient)

    this.StakingProxyClient = new StakingProxyClient(
      this.ethWeb3Manager,
      StakingABI,
      OwnedUpgradeabilityProxyKey,
      this.getRegistryAddressForContract,
      this.AudiusTokenClient
    )
    this.clients.push(this.StakingProxyClient)

    this.ServiceProviderFactoryClient = new ServiceProviderFactoryClient(
      this.ethWeb3Manager,
      ServiceProviderFactoryABI,
      ServiceProviderFactoryRegistryKey,
      this.getRegistryAddressForContract,
      this.AudiusTokenClient,
      this.StakingProxyClient
    )
    this.clients.push(this.ServiceProviderFactoryClient)

    await Promise.all(this.clients.map(async c => c.init()))

    this.expectedServiceVersions = await this.getExpectedServiceVersions()
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

  /*
   * Determine the latest version for deployed services such as discovery provider and cache
   */
  async getExpectedServiceVersions () {
    let expectedVersions = {}
    for (const serviceType of serviceTypeList) {
      try {
        let version = await this.VersioningFactoryClient.getCurrentVersion(serviceType)
        expectedVersions[serviceType] = version
      } catch (e) {
        console.log(`Error retrieving ${serviceType}`)
      }
    }
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
   * Returns a valid service provider url with the fastest response
   * * @param {string} A service provider type: 'discovery-provider' | 'content-service' | 'creator-node'
   * @return {Promise<string>} A valid service provider url with the fastest response
   */
  async selectLatestServiceProvider (spType) {
    let discoveryProviders = await this.ServiceProviderFactoryClient.getServiceProviderList(spType)
    // No discovery providers found.
    if (discoveryProviders.length === 0) {
      return null
    }

    let selectedDiscoveryProvider
    try {
      selectedDiscoveryProvider = await Utils.promiseFight(
        discoveryProviders.map(async (discprov) => {
          try {
            const healthResp = await axios({ url: urlJoin(discprov.endpoint, 'health_check'), method: 'get' })
            if (healthResp.status !== 200) throw new Error(`Discprov healthcheck failed ${discprov.endpoint}`)

            const {
              data: { service: serviceName, version: serviceVersion }
            } = await axios({ url: urlJoin(discprov.endpoint, 'version'), method: 'get' })

            // Compare chain service name
            if (!this.expectedServiceVersions.hasOwnProperty(serviceName)) {
              throw new Error(`Invalid service name: ${serviceName}`)
            }

            if (serviceName !== spType) {
              throw new Error(`Invalid service type: ${serviceName}. Expected ${spType}`)
            }

            if (!semver.valid(serviceVersion)) {
              throw new Error(`Invalid semver version found - ${serviceVersion}`)
            }

            let expectedVersion = this.expectedServiceVersions[serviceName]
            if (expectedVersion !== serviceVersion) {
              let validSPVersion = this.isValidSPVersion(expectedVersion, serviceVersion)
              if (!validSPVersion) {
                throw new Error(`Invalid service version: ${serviceName}. Expected ${expectedVersion}, found ${serviceVersion}`)
              }
            }

            return discprov.endpoint
          } catch (err) {
            throw new Error(err)
          }
        })
      )
    } catch (err) {
      console.error(`All discovery providers failed for latest ${this.expectedServiceVersions[spType]}`)
      console.error(err)
      selectedDiscoveryProvider = null
    }
    return selectedDiscoveryProvider
  }

  /**
   * Validate that a provided url is a discovery provider by checking the `/version` endpoint for the service name
   * @param {string} discProvUrl
   * @return {Promise<boolean>} If the discovery provider is valid
   */
  async validateDiscoveryProvider (discProvUrl) {
    try {
      let { data: { service: serviceName } } = await axios({
        url: urlJoin(discProvUrl, 'version'),
        method: 'get',
        timeout: 3000
      })
      // NOTE/TODO: If the version of ther service is behind, it may become invalid
      return serviceName === serviceType.DISCOVERY_PROVIDER
    } catch (err) {
      return false
    }
  }

  /**
   * Checks if there is a previously used discovery provider endpoint within the last 5 min that is still valid
   * If valid then it returns the endpoint, else it autoselects the fastest responding discovery provider
   * NOTE: Side effect of starting a interval every second to record the discovery provider url & time
   * @return {Promise<string>} The selected discovery provider url
   */
  async autoselectDiscoveryProvider () {
    let endpoint
    const DISCOVERY_PROVIDER_TIMESTAMP = '@audius/libs:discovery-provider-timestamp'
    const DISCOVERY_PROVIDER_TIMESTAMP_INTERVAL = 1000

    const discProvTimestamp = localStorage.getItem(DISCOVERY_PROVIDER_TIMESTAMP)
    if (discProvTimestamp) {
      try {
        const { endpoint: latestEndpoint, timestamp } = JSON.parse(discProvTimestamp)
        if ((Date.now() - timestamp) < (5 /* min */ * 60 /* seconds */ * 1000 /* millisec */)) {
          const isValidDiscProvurl = await this.validateDiscoveryProvider(latestEndpoint)
          if (isValidDiscProvurl) {
            endpoint = latestEndpoint
          }
        }
      } catch (err) {
        endpoint = await this.selectDiscoveryProvider()
      }
    }
    if (!endpoint) {
      endpoint = await this.selectDiscoveryProvider()
    }
    if (!this.isServer) {
      this.discProvInterval = setInterval(() => {
        if (endpoint) {
          localStorage.setItem(DISCOVERY_PROVIDER_TIMESTAMP, JSON.stringify({ endpoint, timestamp: Date.now() }))
        }
      }, DISCOVERY_PROVIDER_TIMESTAMP_INTERVAL)
    }
    return endpoint
  }

  async selectPriorServiceProvider (spType) {
    let discoveryProviders =
      await this.ServiceProviderFactoryClient.getServiceProviderList(spType)
    let numberOfServiceVersions =
      await this.VersioningFactoryClient.getNumberOfVersions(spType)
    // Exclude the latest version when querying older versions
    // Latest index is numberOfServiceVersions - 1, so 2nd oldest version starts at numberOfServiceVersions - 2
    let queryIndex = numberOfServiceVersions - 1
    while (queryIndex >= 0) {
      let pastServiceVersion =
        await this.VersioningFactoryClient.getVersion(spType, queryIndex)
      let validPastVersions = []
      for (const discProvInfo of discoveryProviders) {
        let discProvUrl = discProvInfo.endpoint
        let requestUrl = urlJoin(discProvUrl, 'version')
        const axiosRequest = {
          url: requestUrl,
          method: 'get',
          timeout: 1000
        }
        try {
          let response = await axios(axiosRequest)
          let versionInfo = response['data']
          let serviceName = versionInfo['service']
          let serviceVersion = versionInfo['version']
          if (!this.expectedServiceVersions.hasOwnProperty(serviceName)) {
            console.log(`Invalid service name: ${serviceName}`)
            continue
          }

          if (serviceName !== spType) {
            console.log(`Invalid service type: ${serviceName}. Expected ${spType}`)
            continue
          }

          if (!semver.valid(serviceVersion)) {
            throw new Error(`Invalid semver version found - ${serviceVersion}`)
          }

          if (this.isValidSPVersion(pastServiceVersion, serviceVersion)) {
            validPastVersions.push(discProvUrl)
          }
        } catch (e) {
          console.error(e.message)
        }
      }
      // No valid disc prov found with this version
      if (validPastVersions.length !== 0) {
        let randomValidDiscoveryProvider =
          validPastVersions[Math.floor(Math.random() * validPastVersions.length)]
        let discoveryProviderEndpoint = randomValidDiscoveryProvider
        return discoveryProviderEndpoint
      }

      queryIndex--
    }

    return null
  }

  async selectDiscoveryProvider () {
    this.expectedServiceVersions = await this.getExpectedServiceVersions()
    let discoveryProviderEndpoint = await this.selectLatestServiceProvider(serviceType.DISCOVERY_PROVIDER)

    if (discoveryProviderEndpoint == null) {
      discoveryProviderEndpoint = await this.selectPriorServiceProvider(serviceType.DISCOVERY_PROVIDER)
    }

    if (discoveryProviderEndpoint == null) {
      console.error('No valid discovery provider found, proceeding with limited functionality')
    }

    return discoveryProviderEndpoint
  }
}

module.exports = EthContracts
