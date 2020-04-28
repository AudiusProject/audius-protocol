const ServiceSelection = require('../../service-selection/ServiceSelection')
const {
  DISCOVERY_PROVIDER_TIMESTAMP,
  DISCOVERY_SERVICE_NAME,
  UNHEALTHY_BLOCK_DIFF,
  DISCOVERY_PROVIDER_RESELECT_TIMEOUT,
  REGRESSED_MODE_TIMEOUT
} = require('./constants')
const semver = require('semver')

let localStorage
if (typeof window === 'undefined' || window === null) {
  const LocalStorage = require('node-localstorage').LocalStorage
  localStorage = new LocalStorage('./local-storage')
} else {
  localStorage = window.localStorage
}

class DiscoveryProviderSelection extends ServiceSelection {
  constructor (config, ethContracts) {
    super({
      /**
       * Gets the "current" expected service version as well as
       * the list of registered providers from chain
       */
      getServices: async () => {
        this.currentVersion = await ethContracts.getCurrentVersion(DISCOVERY_SERVICE_NAME)
        return this.ethContracts.getServiceProviderList(DISCOVERY_SERVICE_NAME)
      },
      ...config
    })
    this.ethContracts = ethContracts
    this.currentVersion = null

    // Whether or not we are running in `regressed` mode, meaning we were
    // unable to select a discovery provider that was up-to-date. Clients may
    // want to consider blocking writes.
    this._regressedMode = false
  }

  /** Retrieves a cached discovery provider from localstorage */
  getCached () {
    if (localStorage) {
      const discProvTimestamp = localStorage.getItem(DISCOVERY_PROVIDER_TIMESTAMP)
      if (discProvTimestamp) {
        const { endpoint: latestEndpoint, timestamp } = JSON.parse(discProvTimestamp)
        const inWhitelist = !this.whitelist || this.whitelist.has(latestEndpoint)
        const isExpired = (Date.now() - timestamp) > DISCOVERY_PROVIDER_RESELECT_TIMEOUT
        if (!inWhitelist || isExpired) {
          this.clearCached()
        } else {
          return latestEndpoint
        }
      }
    }
    return null
  }

  /** Clears any cached discovery provider from localstorage */
  clearCached () {
    if (localStorage) {
      localStorage.removeItem(DISCOVERY_PROVIDER_TIMESTAMP)
    }
  }

  /** Sets a cached discovery provider in localstorage */
  setCached (endpoint) {
    localStorage.setItem(DISCOVERY_PROVIDER_TIMESTAMP, JSON.stringify({ endpoint, timestamp: Date.now() }))
  }

  /** Allows the selection take a shortcut if there's a cached provider */
  shortcircuit () {
    return this.getCached()
  }

  async select () {
    const endpoint = await super.select()
    this.setCached(endpoint)
    return endpoint
  }

  /**
   * Checks whether a given response is healthy:
   * - Not behind in blocks
   * - 200 response
   * - Current version
   *
   * Other responses are collected in `this.backups` if
   * - Behind by only a patch version
   *
   * @param {Response} response axios response
   * @param {{ [key: string]: string}} urlMap health check urls mapped to their cannonical url
   * e.g. https://discoveryprovider.audius.co/health_check => https://discoveryprovider.audius.co
   */
  isHealthy (response, urlMap) {
    const { status, data } = response
    const { block_difference: blockDiff, service, version } = data
    if (status !== 200) return false
    if (service !== DISCOVERY_SERVICE_NAME) return false
    if (!semver.valid(version)) return false
    if (!this.ethContracts.isValidSPVersion(version, this.currentVersion)) return false

    if (
      blockDiff > UNHEALTHY_BLOCK_DIFF ||
      version !== this.currentVersion
    ) {
      this.addBackup(urlMap[response.config.url], response.data)
      return false
    }

    return true
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
    }, REGRESSED_MODE_TIMEOUT)
  }

  isInRegressedMode () {
    return this._regressedMode
  }

  /**
   * In the case of no "healthy" services, we resort to backups.
   * 1. Pick the most recent version that's not behind
   * 2. Pick the least behind provider and enter "regressed mode"
   */
  selectFromBackups () {
    const versions = []
    const blockDiffs = []

    const versionMap = {}
    const blockDiffMap = {}

    // Go through each backup and record version and block diff maps
    Object.keys(this.backups).forEach(backup => {
      const { block_difference: blockDiff, version } = this.backups[backup]
      versions.push(version)
      blockDiffs.push(blockDiff)

      if (version in versionMap) {
        versionMap[version].push(backup)
      } else {
        versionMap[version] = [backup]
      }

      if (blockDiff in blockDiffMap) {
        blockDiffMap[blockDiff].push(backup)
      } else {
        blockDiffMap[blockDiff] = [backup]
      }
    })

    // Sort the versions by desc semver
    const sortedVersions = versions.sort(semver.rcompare)

    // Select the closest version that's a healthy # of blocks behind
    let selected = null
    for (const version of sortedVersions) {
      const endpoints = versionMap[version]
      for (let i = 0; i < endpoints.length; ++i) {
        if (this.backups[endpoints[i]].block_difference < UNHEALTHY_BLOCK_DIFF) {
          selected = endpoints[i]
          break
        }
      }
      if (selected) return selected
    }

    // Select the best block diff provider
    const bestBlockDiff = blockDiffs.sort().reverse()[0]

    selected = blockDiffMap[bestBlockDiff][0]
    this.enterRegressedMode()

    return selected
  }
}

module.exports = DiscoveryProviderSelection
