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

const {
  DISCOVERY_PROVIDER_TIMESTAMP,
  UNHEALTHY_BLOCK_DIFF,
  DISCOVERY_PROVIDER_TIMESTAMP_INTERVAL,
  DISCOVERY_PROVIDER_RESELECT_TIMEOUT
} = require('../discoveryProvider/constants')

const serviceType = Object.freeze({
  DISCOVERY_PROVIDER: 'discovery-provider',
  CONTENT_SERVICE: 'content-service',
  CREATOR_NODE: 'creator-node'
})
const serviceTypeList = Object.values(serviceType)
if (urlJoin && urlJoin.default) urlJoin = urlJoin.default

class EthContracts {
  constructor (ethWeb3Manager, tokenContractAddress, registryAddress, isServer) {
    this.ethWeb3Manager = ethWeb3Manager
    this.tokenContractAddress = tokenContractAddress
    this.registryAddress = registryAddress
    this.isServer = isServer
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

    this.VersioningFactoryClient = new VersioningFactoryClient(
      this.ethWeb3Manager,
      VersioningFactoryABI,
      VersioningFactoryRegistryKey,
      this.getRegistryAddressForContract
    )

    this.StakingProxyClient = new StakingProxyClient(
      this.ethWeb3Manager,
      StakingABI,
      OwnedUpgradeabilityProxyKey,
      this.getRegistryAddressForContract,
      this.AudiusTokenClient
    )

    this.ServiceProviderFactoryClient = new ServiceProviderFactoryClient(
      this.ethWeb3Manager,
      ServiceProviderFactoryABI,
      ServiceProviderFactoryRegistryKey,
      this.getRegistryAddressForContract,
      this.AudiusTokenClient,
      this.StakingProxyClient
    )

    this.contractClients = [
      this.VersioningFactoryClient,
      this.StakingProxyClient,
      this.ServiceProviderFactoryClient
    ]
  }

  async init () {
    if (!this.ethWeb3Manager || !this.tokenContractAddress || !this.registryAddress) throw new Error('Failed to initialize EthContracts')

    if (this.isServer) {
      await Promise.all(this.contractClients.map(client => client.init()))
    }
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
      const version = await this.VersioningFactoryClient.getCurrentVersion(serviceType)
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
   * Returns a valid service provider url with the fastest response
   * @param {string} spType service provider type: 'discovery-provider' | 'content-service' | 'creator-node'
   * @return {Promise<string>} A valid service provider url with the fastest response
   */
  async selectLatestServiceProvider (spType, whitelist = null) {
    let serviceProviders = await this.ServiceProviderFactoryClient.getServiceProviderList(spType)
    if (whitelist) {
      serviceProviders = serviceProviders.filter(d => whitelist.has(d.endpoint))
    }

    // No discovery providers found.
    if (serviceProviders.length === 0) {
      return null
    }

    // Load expected version information if necessary
    if (!this.expectedServiceVersions) {
      this.expectedServiceVersions = await this.getExpectedServiceVersions()
    }
    if (!this.expectedServiceVersions.hasOwnProperty(spType)) {
      throw new Error(`Invalid service name: ${spType}`)
    }

    let expectedVersion = this.expectedServiceVersions[spType]

    let selectedServiceProvider
    try {
      // Querying all versions
      let foundVersions = new Set()
      let spVersionToEndpoint = {}
      await Promise.all(serviceProviders.map(async (sp) => {
        const {
          data: { service: serviceName, version: serviceVersion }
        } = await axios(
          { url: urlJoin(sp.endpoint, 'version'), method: 'get' }
        )
        // Discovery provider specific validation
        if (spType === 'discovery-provider') {
          await this.validateDiscoveryProviderHealth(sp.endpoint)
        }

        if (serviceName !== spType) {
          throw new Error(`Invalid service type: ${serviceName}. Expected ${spType}`)
        }

        if (!semver.valid(serviceVersion)) {
          throw new Error(`Invalid semver version found - ${serviceVersion}`)
        }

        if (expectedVersion !== serviceVersion) {
          // Confirm this returned value is valid, ignoring patch version in semantic versioning
          let validSPVersion = this.isValidSPVersion(expectedVersion, serviceVersion)
          if (!validSPVersion) {
            throw new Error(`Invalid latest service version: ${serviceName}. Expected ${expectedVersion}, found ${serviceVersion}`)
          }
        }

        foundVersions.add(serviceVersion)
        // Update mapping of version <-> [endpoint], creating array if needed
        if (!spVersionToEndpoint.hasOwnProperty(serviceVersion)) {
          spVersionToEndpoint[serviceVersion] = [sp.endpoint]
        } else {
          spVersionToEndpoint[serviceVersion].push(sp.endpoint)
        }
      }))
      let foundVersionsList = Array.from(foundVersions)
      // Sort found endpoints array by semantic version
      var highestFoundSPVersion = foundVersionsList.sort(semver.rcompare)[0]
      // Randomly select from highest found endpoints
      let highestFoundSPVersionEndpoints = spVersionToEndpoint[highestFoundSPVersion]
      var randomValidSPEndpoint = highestFoundSPVersionEndpoints[Math.floor(Math.random() * highestFoundSPVersionEndpoints.length)]
      selectedServiceProvider = randomValidSPEndpoint
    } catch (err) {
      console.error(`All discovery providers failed for latest ${this.expectedServiceVersions[spType]}`)
      console.error(err)
      selectedServiceProvider = null
    }

    return selectedServiceProvider
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
   * Validate that a provided url is a healthy discovery provider against the `/health_check` endpoint
   * @param {string} discProvUrl
   * @return {Promise<boolean>} If the discovery provider is valid
   */
  async validateDiscoveryProviderHealth (endpoint) {
    const healthResp = await axios(
      {
        url: urlJoin(endpoint, 'health_check'),
        method: 'get',
        timeout: 5000 }
    )
    const { status, block_difference: blockDiff } = healthResp
    if (
      status !== 200 ||
      blockDiff > UNHEALTHY_BLOCK_DIFF
    ) {
      throw new Error(`Disc prov healthcheck failed ${endpoint}`)
    }
  }

  /**
   * Checks if there is a previously used discovery provider endpoint within the last 5 min that is still valid
   * If valid then it returns the endpoint, else it autoselects the fastest responding discovery provider
   * NOTE: Side effect of starting a interval every second to record the discovery provider url & time
   * @param {Set<string>?} whitelist optional whitelist to autoselect from
   * @return {Promise<string>} The selected discovery provider url
   */
  async autoselectDiscoveryProvider (whitelist = null) {
    let endpoint

    const discProvTimestamp = localStorage.getItem(DISCOVERY_PROVIDER_TIMESTAMP)
    if (discProvTimestamp) {
      try {
        const { endpoint: latestEndpoint, timestamp } = JSON.parse(discProvTimestamp)
        const inWhitelist = !whitelist || whitelist.has(latestEndpoint)
        const isNotExpired = (Date.now() - timestamp) < DISCOVERY_PROVIDER_RESELECT_TIMEOUT

        if (inWhitelist && isNotExpired) {
          const isValidDiscProvurl = await this.validateDiscoveryProvider(latestEndpoint)
          if (isValidDiscProvurl) {
            endpoint = latestEndpoint
          }
        }
        if (!inWhitelist) {
          localStorage.removeItem(DISCOVERY_PROVIDER_TIMESTAMP)
        }
      } catch (err) {
        endpoint = await this.selectDiscoveryProvider(whitelist)
      }
    }
    if (!endpoint) {
      endpoint = await this.selectDiscoveryProvider(whitelist)
    }
    if (!this.isServer) {
      clearInterval(this.discProvInterval)
      this.discProvInterval = setInterval(() => {
        if (endpoint) {
          localStorage.setItem(DISCOVERY_PROVIDER_TIMESTAMP, JSON.stringify({ endpoint, timestamp: Date.now() }))
        }
      }, DISCOVERY_PROVIDER_TIMESTAMP_INTERVAL)
    }
    return endpoint
  }

  async selectPriorServiceProvider (spType, whitelist = null) {
    if (!this.expectedServiceVersions) {
      this.expectedServiceVersions = await this.getExpectedServiceVersions()
    }
    let serviceProviders =
      await this.ServiceProviderFactoryClient.getServiceProviderList(spType)
    if (whitelist) {
      serviceProviders = serviceProviders.filter(d => whitelist.has(d.endpoint))
    }

    let numberOfServiceVersions =
      await this.VersioningFactoryClient.getNumberOfVersions(spType)
    // Exclude the latest version when querying older versions
    // Latest index is numberOfServiceVersions - 1, so 2nd oldest version starts at numberOfServiceVersions - 2
    let queryIndex = numberOfServiceVersions - 2
    while (queryIndex >= 0) {
      let pastServiceVersion =
        await this.VersioningFactoryClient.getVersion(spType, queryIndex)

      // Querying all versions
      let foundVersions = new Set()
      let spVersionToEndpoint = {}

      for (const spInfo of serviceProviders) {
        let spEndpoint = spInfo.endpoint
        let requestUrl = urlJoin(spEndpoint, 'version')
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

          // Discovery provider specific validation
          if (spType === 'discovery-provider') {
            await this.validateDiscoveryProviderHealth(spInfo.endpoint)
          }

          if (this.isValidSPVersion(pastServiceVersion, serviceVersion)) {
            // Update set
            foundVersions.add(serviceVersion)
            // Update mapping of version <-> [endpoint], creating array if needed
            if (!spVersionToEndpoint.hasOwnProperty(serviceVersion)) {
              spVersionToEndpoint[serviceVersion] = [spInfo.endpoint]
            } else {
              spVersionToEndpoint[serviceVersion].push(spInfo.endpoint)
            }
          }
        } catch (e) {
          console.error(e.message)
        }
      }
      let foundVersionsList = Array.from(foundVersions)
      if (foundVersionsList.length !== 0) {
        // Sort found endpoints array by semantic version
        var highestFoundSPVersion = foundVersionsList.sort(semver.rcompare)[0]
        // Randomly select from highest found endpoints
        let highestFoundSPVersionEndpoints = spVersionToEndpoint[highestFoundSPVersion]
        var randomValidSPEndpoint = highestFoundSPVersionEndpoints[Math.floor(Math.random() * highestFoundSPVersionEndpoints.length)]
        return randomValidSPEndpoint
      }

      queryIndex--
    }

    return null
  }

  async selectDiscoveryProvider (whitelist = null) {
    if (!this.expectedServiceVersions) {
      this.expectedServiceVersions = await this.getExpectedServiceVersions()
    }
    let discoveryProviderEndpoint = await this.selectLatestServiceProvider(serviceType.DISCOVERY_PROVIDER, whitelist)

    if (discoveryProviderEndpoint == null) {
      console.log(`Failed to select latest discovery provider, falling back to previous version`)
      discoveryProviderEndpoint = await this.selectPriorServiceProvider(serviceType.DISCOVERY_PROVIDER, whitelist)
    }

    if (discoveryProviderEndpoint == null) {
      console.error('No valid discovery provider found, proceeding with limited functionality')
    }

    return discoveryProviderEndpoint
  }
}

module.exports = EthContracts
