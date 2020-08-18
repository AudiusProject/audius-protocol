const axios = require('axios')
const semver = require('semver')
let urlJoin = require('proper-url-join')

const AudiusTokenClient = require('./audiusTokenClient')
const RegistryClient = require('./registryClient')
const ServiceTypeManagerClient = require('./serviceTypeManagerClient')
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
const ServiceTypeManagerABI = Utils.importEthContractABI('ServiceTypeManager.json').abi
const ServiceProviderFactoryABI = Utils.importEthContractABI('ServiceProviderFactory.json').abi
const StakingABI = Utils.importEthContractABI('Staking.json').abi

const ServiceTypeManagerProxyKey = 'ServiceTypeManagerProxy'
const ServiceProviderFactoryRegistryKey = 'ServiceProviderFactory'
const StakingProxyKey = 'StakingProxy'

const TWO_MINUTES = 2 * 60 * 1000

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
  constructor (ethWeb3Manager, tokenContractAddress, registryAddress, isServer, isDebug = false) {
    this.ethWeb3Manager = ethWeb3Manager
    this.tokenContractAddress = tokenContractAddress
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

    this.ServiceTypeManagerClient = new ServiceTypeManagerClient(
      this.ethWeb3Manager,
      ServiceTypeManagerABI,
      ServiceTypeManagerProxyKey,
      this.getRegistryAddressForContract
    )

    this.StakingProxyClient = new StakingProxyClient(
      this.ethWeb3Manager,
      StakingABI,
      StakingProxyKey,
      this.getRegistryAddressForContract,
      this.AudiusTokenClient
    )

    this.ServiceProviderFactoryClient = new ServiceProviderFactoryClient(
      this.ethWeb3Manager,
      ServiceProviderFactoryABI,
      ServiceProviderFactoryRegistryKey,
      this.getRegistryAddressForContract,
      this.AudiusTokenClient,
      this.StakingProxyClient,
      this.isDebug
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
    return this.VersioningFactoryClient.getNumberOfVersions(spType)
  }

  async getVersion (spType, queryIndex) {
    return this.VersioningFactoryClient.getVersion(spType, queryIndex)
  }

  /**
   * Returns a valid service provider url with the fastest response
   * @param {string} spType service provider type: 'discovery-provider' | 'content-service' | 'creator-node'
   * @return {Promise<string>} A valid service provider url with the fastest response
   */
  async selectLatestVersionServiceProvider (spType, whitelist = null) {
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

    console.info(`Looking latest for service provider in ${JSON.stringify(serviceProviders)} with version ${JSON.stringify(this.expectedServiceVersions)}`)

    if (!this.expectedServiceVersions.hasOwnProperty(spType)) {
      throw new Error(`Invalid service name: ${spType}`)
    }

    let expectedVersion = this.expectedServiceVersions[spType]

    let selectedServiceProvider
    // If no service is selectable (unhealthy or has an unhealthy block differential),
    // fall back to the provider with the least block diff.
    let fallbackServiceProviders = {}

    try {
      // Querying all versions
      let foundVersions = new Set()
      let spVersionToEndpoint = {}

      await Promise.all(serviceProviders.map(async (sp) => {
        try {
          const { data } = await axios(
            { url: urlJoin(sp.endpoint, 'health_check'), method: 'get' }
          )

          let serviceName
          let serviceVersion

          // if disc prov, get data from data key
          try {
            serviceName = data.data.service
            serviceVersion = data.data.version
          } catch (e) {
            serviceName = data.service
            serviceVersion = data.version
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

          // Discovery provider specific validation
          if (spType === 'discovery-provider') {
            const { healthy, blockDiff } = await this.validateDiscoveryProviderHealth(sp.endpoint)
            if (!healthy) {
              throw new Error(`Discovery provider ${sp.endpoint} is not healthy`)
            }
            if (blockDiff > UNHEALTHY_BLOCK_DIFF) {
              fallbackServiceProviders[sp.endpoint] = blockDiff
              throw new Error(`Discovery provider ${sp.endpoint} is too far behind, adding as a fallback`)
            }
          }

          foundVersions.add(serviceVersion)
          // Update mapping of version <-> [endpoint], creating array if needed
          if (!spVersionToEndpoint.hasOwnProperty(serviceVersion)) {
            spVersionToEndpoint[serviceVersion] = [sp.endpoint]
          } else {
            spVersionToEndpoint[serviceVersion].push(sp.endpoint)
          }
        } catch (e) {
          // Swallow errors for a single sp endpoint to ensure others can proceed
          console.error(`Failed to retrieve information for ${JSON.stringify(sp)}:\n\t${e}`)
        }
      }))

      let foundVersionsList = Array.from(foundVersions)
      if (foundVersionsList.length === 0) {
        // Short-circuit processing if no valid endpoints are found
        throw new Error(`No valid endpoints found for ${spType}`)
      }

      // Sort found endpoints array by semantic version
      var highestFoundSPVersion = foundVersionsList.sort(semver.rcompare)[0]
      // Randomly select from highest found endpoints
      let highestFoundSPVersionEndpoints = spVersionToEndpoint[highestFoundSPVersion]
      var randomValidSPEndpoint = highestFoundSPVersionEndpoints[Math.floor(Math.random() * highestFoundSPVersionEndpoints.length)]
      selectedServiceProvider = randomValidSPEndpoint
    } catch (err) {
      console.error(err)
      console.warn(`All ${spType} failed for latest ${this.expectedServiceVersions[spType]} with healthy block numbers`)
      console.info('Trying to choose most up-to-date discovery provider from', fallbackServiceProviders)

      // Pick a fallback that has the smallest block difference and signal that we are running
      // in regressed mode.
      if (Object.keys(fallbackServiceProviders).length > 0) {
        const sortedByBlockDiff = Object.keys(fallbackServiceProviders).sort(
          (a, b) => fallbackServiceProviders[a] - fallbackServiceProviders[b]
        )
        this.enterRegressedMode()
        return sortedByBlockDiff[0]
      } else {
        selectedServiceProvider = null
      }
    }

    return selectedServiceProvider
  }

  /**
   * Validate that a provided url is a discovery provider by checking the `/health_check` endpoint for the service name
   * @param {string} discProvUrl
   * @return {Promise<boolean>} If the discovery provider is valid
   */
  async validateDiscoveryProvider (discProvUrl) {
    try {
      const { data } = await axios({
        url: urlJoin(discProvUrl, 'health_check'),
        method: 'get',
        timeout: 3000
      })

      const serviceName = data.data.service
      // NOTE/TODO: If the version of ther service is behind, it may become invalid
      return serviceName === serviceType.DISCOVERY_PROVIDER
    } catch (err) {
      return false
    }
  }

  /**
   * Validate that a provided url is a healthy discovery provider against the `/health_check` endpoint
   * @param {string} discProvUrl
   * @return {Promise<{healthy: boolean, blockDiff: number}>} If the discovery provider is valid
   */
  async validateDiscoveryProviderHealth (endpoint) {
    try {
      const healthResp = await axios(
        {
          url: urlJoin(endpoint, 'health_check'),
          method: 'get',
          timeout: 5000
        }
      )
      const { status, data } = healthResp
      const { block_difference: blockDiff } = data.data
      console.info(`${endpoint} responded with status ${status} and block difference ${blockDiff}`)
      return { healthy: status === 200, blockDiff }
    } catch (e) {
      return { healthy: false, blockDiff: null }
    }
  }

  /**
   * Checks if there is a previously used discovery provider endpoint within the last 5 min that is still valid
   * If valid then it returns the endpoint, else it autoselects the fastest responding discovery provider
   * NOTE: Side effect of starting a interval every second to record the discovery provider url & time
   * @param {Set<string>?} whitelist optional whitelist to autoselect from
   * @return {Promise<string>} The selected discovery provider url
   */
  async autoselectDiscoveryProvider (whitelist = null, clearCachedDiscoveryProvider = false) {
    // If under the context of selecting a new DP because of prior failure, do not use the old DP endpoint
    // in local storage by clearing the entry and clearing the interval
    if (clearCachedDiscoveryProvider) {
      localStorage.removeItem(DISCOVERY_PROVIDER_TIMESTAMP)
      clearInterval(this.discProvInterval)
    }

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

  async selectPriorVersionServiceProvider (spType) {
    if (!this.expectedServiceVersions) {
      this.expectedServiceVersions = await this.getExpectedServiceVersions()
    }
    let serviceProviders =
      await this.ServiceProviderFactoryClient.getServiceProviderList(spType)

    let numberOfServiceVersions =
      await this.ServiceTypeManagerClient.getNumberOfVersions(spType)
    // Exclude the latest version when querying older versions
    // Latest index is numberOfServiceVersions - 1, so 2nd oldest version starts at numberOfServiceVersions - 2
    let queryIndex = numberOfServiceVersions - 2
    while (queryIndex >= 0) {
      let pastServiceVersion =
        await this.ServiceTypeManagerClient.getVersion(spType, queryIndex)

      // Querying all versions
      let foundVersions = new Set()
      let spVersionToEndpoint = {}

      for (const spInfo of serviceProviders) {
        let spEndpoint = spInfo.endpoint
        let requestUrl = urlJoin(spEndpoint, 'health_check')
        const axiosRequest = {
          url: requestUrl,
          method: 'get',
          timeout: 1000
        }
        try {
          const { data } = await axios(axiosRequest)
          let serviceName
          let serviceVersion

          // if disc prov, get data from data key
          try {
            serviceName = data.data.service
            serviceVersion = data.data.version
          } catch (e) {
            serviceName = data.service
            serviceVersion = data.version
          }

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
            const { healthy, blockDiff } = await this.validateDiscoveryProviderHealth(spInfo.endpoint)
            if (!healthy || (blockDiff > UNHEALTHY_BLOCK_DIFF)) throw new Error(`${spInfo.endpoint} is not healthy`)
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

  /**
   * Gets a discovery provider in the following precedence:
   *  - Latest version and block diff < `UNHEALTHY_BLOCK_DIFF`
   *  - Latest version with the smallest block diff
   *  - Prior version and block diff < `UNHEALTHY_BLOCK_DIFF`
   *  - null
   * @param {Set<string>?} whitelist optional whitelist to autoselect from
   */
  async selectDiscoveryProvider (whitelist = null) {
    if (!this.expectedServiceVersions) {
      this.expectedServiceVersions = await this.getExpectedServiceVersions()
    }

    let discoveryProviderEndpoint = await this.selectLatestVersionServiceProvider(serviceType.DISCOVERY_PROVIDER, whitelist)

    if (discoveryProviderEndpoint == null) {
      console.log(`Failed to select latest discovery provider, falling back to previous version`)
      discoveryProviderEndpoint = await this.selectPriorVersionServiceProvider(serviceType.DISCOVERY_PROVIDER, whitelist)
    }

    if (discoveryProviderEndpoint == null) {
      console.error('No valid discovery provider found, proceeding with limited functionality')
    }

    return discoveryProviderEndpoint
  }
}

module.exports = EthContracts
module.exports.serviceType = serviceType
