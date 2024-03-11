import type { AxiosResponse } from 'axios'
import semver from 'semver'

import {
  Backup,
  Decision,
  ServiceSelection,
  ServiceSelectionConfig
} from '../../service-selection'
import type { Maybe, Nullable } from '../../utils'
import type { LocalStorage } from '../../utils/localStorage'
import { EthContracts, isVersionAtLeastSameMajorMinor } from '../ethContracts'
import type { MonitoringCallbacks } from '../types'

import {
  DISCOVERY_PROVIDER_TIMESTAMP,
  DISCOVERY_SERVICE_NAME,
  DEFAULT_UNHEALTHY_BLOCK_DIFF,
  DISCOVERY_PROVIDER_RESELECT_TIMEOUT,
  REGRESSED_MODE_TIMEOUT
} from './constants'

const PREVIOUS_VERSIONS_TO_CHECK = 5

export type DiscoveryProviderSelectionConfig = Omit<
  ServiceSelectionConfig,
  'getServices'
> & {
  reselectTimeout?: number
  selectionCallback?: (endpoint: string, decisionTree: Decision[]) => void
  monitoringCallbacks?: MonitoringCallbacks
  unhealthySlotDiffPlays?: number
  unhealthyBlockDiff?: number
  localStorage?: LocalStorage
}

export class DiscoveryProviderSelection extends ServiceSelection {
  currentVersion: string
  ethContracts: EthContracts
  reselectTimeout: Maybe<number>
  selectionCallback: Maybe<
    DiscoveryProviderSelectionConfig['selectionCallback']
  >

  monitoringCallbacks:
    | NonNullable<DiscoveryProviderSelectionConfig['monitoringCallbacks']>
    | {}

  unhealthySlotDiffPlays: Nullable<number>
  unhealthyBlockDiff: number
  _regressedMode: boolean
  validVersions: Nullable<string[]>
  localStorage?: LocalStorage

  constructor(
    config: DiscoveryProviderSelectionConfig,
    ethContracts: Nullable<EthContracts>
  ) {
    super({
      /**
       * Gets the "current" expected service version as well as
       * the list of registered providers from chain
       */
      getServices: async ({ verbose = false } = {}) => {
        this.currentVersion = await ethContracts!.getCurrentVersion(
          DISCOVERY_SERVICE_NAME
        )
        const services = await this.ethContracts.getServiceProviderList(
          DISCOVERY_SERVICE_NAME
        )
        return verbose ? services : services.map((e) => e.endpoint)
      },
      ...config
    })
    this.ethContracts = ethContracts!
    this.currentVersion = ''
    this.reselectTimeout = config.reselectTimeout
    this.selectionCallback = config.selectionCallback
    this.monitoringCallbacks = config.monitoringCallbacks ?? {}
    this.unhealthySlotDiffPlays = config.unhealthySlotDiffPlays ?? null
    this.unhealthyBlockDiff =
      config.unhealthyBlockDiff ?? DEFAULT_UNHEALTHY_BLOCK_DIFF
    this.localStorage = config.localStorage

    // Whether or not we are running in `regressed` mode, meaning we were
    // unable to select a discovery provider that was up-to-date. Clients may
    // want to consider blocking writes.
    this._regressedMode = false

    // List of valid past discovery provider versions registered on chain
    this.validVersions = null
  }

  /** Retrieves a cached discovery provider from localstorage */
  async getCached() {
    if (this.localStorage) {
      try {
        return 'isaac.sandbox.audius.co'
      } catch (e) {
        console.error(
          'Could not retrieve cached discovery endpoint from localStorage',
          e
        )
      }
    }
    return null
  }

  /** Clears any cached discovery provider from localstorage */
  async clearCached() {
    if (this.localStorage) {
      await this.localStorage.removeItem(DISCOVERY_PROVIDER_TIMESTAMP)
    }
  }

  /** Sets a cached discovery provider in localstorage */
  async setCached(endpoint: string) {
    if (this.localStorage) {
      await this.localStorage.setItem(
        DISCOVERY_PROVIDER_TIMESTAMP,
        JSON.stringify({ endpoint, timestamp: Date.now() })
      )
    }
  }

  /** Allows the selection take a shortcut if there's a cached provider */
  override async shortcircuit() {
    return await this.getCached()
  }

  override async select() {
    const endpoint = await super.select()
    if (endpoint) {
      this.setCached(endpoint)
    }
    console.info(`Selected discprov ${endpoint}`, this.decisionTree)
    if (this.selectionCallback) {
      this.selectionCallback(endpoint, this.decisionTree)
    }
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
   * @param response axios response
   * @param urlMap health check urls mapped to their cannonical url
   * e.g. https://discoveryprovider.audius.co/health_check => https://discoveryprovider.audius.co
   */
  override isHealthy(response: AxiosResponse, urlMap: Record<string, string>) {
    const { status, data } = response
    const { block_difference: blockDiff, service, version, plays } = data.data
    let slotDiffPlays = null
    if (plays?.tx_info) {
      slotDiffPlays = plays.tx_info.slot_diff
    }

    if ('healthCheck' in this.monitoringCallbacks) {
      const url = new URL(response.config.url as string)
      try {
        this.monitoringCallbacks.healthCheck?.({
          endpoint: url.origin,
          pathname: url.pathname,
          queryString: url.search,
          version,
          git: data.data.git,
          blockDifference: blockDiff,
          slotDifferencePlays: slotDiffPlays,
          databaseBlockNumber: data.data.db.number,
          webBlockNumber: data.data.web.blocknumber,
          databaseSize: data.data.database_size,
          databaseConnections: data.data.database_connections,
          totalMemory: data.data.total_memory,
          usedMemory: data.data.used_memory,
          totalStorage: data.data.filesystem_size,
          usedStorage: data.data.filesystem_used,
          receivedBytesPerSec: data.received_bytes_per_sec,
          transferredBytesPerSec: data.transferred_bytes_per_sec,
          challengeLastEventAgeSec: data.challenge_last_event_age_sec
        })
      } catch (e) {
        // Swallow errors -- this method should not throw generally
        console.error(e)
      }
    }

    if (status !== 200) return false
    if (service !== DISCOVERY_SERVICE_NAME) return false
    if (!semver.valid(version)) return false

    // If this service is not at least the version on chain, reject
    if (!isVersionAtLeastSameMajorMinor(this.currentVersion, version)) {
      return false
    }

    // If this service is behind, add it as a backup and reject
    if (semver.lt(version, this.currentVersion)) {
      this.addBackup(urlMap[response.config.url as string] as string, data.data)
      return false
    }

    // If this service is an unhealthy block diff behind, add it as a backup and reject
    if (blockDiff > this.unhealthyBlockDiff) {
      this.addBackup(urlMap[response.config.url as string] as string, data.data)
      return false
    }

    // If this service is an unhealthy slot diff behind on the plays table, add it
    // as a backup and reject
    if (
      slotDiffPlays !== null &&
      this.unhealthySlotDiffPlays !== null &&
      slotDiffPlays > this.unhealthySlotDiffPlays
    ) {
      this.addBackup(urlMap[response.config.url as string] as string, data.data)
      return false
    }

    return true
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
    }, REGRESSED_MODE_TIMEOUT)
  }

  setUnhealthyBlockDiff(updatedDiff = DEFAULT_UNHEALTHY_BLOCK_DIFF) {
    this.unhealthyBlockDiff = updatedDiff
  }

  setUnhealthySlotDiffPlays(updatedDiff: number) {
    this.unhealthySlotDiffPlays = updatedDiff
  }

  isInRegressedMode() {
    return this._regressedMode
  }

  /**
   * In the case of no "healthy" services, we resort to backups in the following order:
   * 1. Pick the most recent (patch) version that's not behind
   * 2. Pick the least behind provider that is a valid patch version and enter "regressed mode"
   * 3. Pick `null`
   */
  override async selectFromBackups() {
    const versions: string[] = []
    const blockDiffs: number[] = []

    const versionMap: Record<string, string[]> = {}
    const blockDiffMap: Record<string, string[]> = {}

    // Go backwards in time on chain and get the registered versions up to PREVIOUS_VERSIONS_TO_CHECK.
    // Record those versions in a set and validate any backups against that set.
    // TODO: Clean up this logic when we can validate a specific version rather
    // than traversing backwards through all the versions
    if (!this.validVersions) {
      this.validVersions = [this.currentVersion]
      const numberOfVersions = await this.ethContracts.getNumberOfVersions(
        DISCOVERY_SERVICE_NAME
      )
      for (
        let i = 0;
        i < Math.min(PREVIOUS_VERSIONS_TO_CHECK, numberOfVersions - 1);
        ++i
      ) {
        const pastServiceVersion = await this.ethContracts.getVersion(
          DISCOVERY_SERVICE_NAME,
          // Exclude the latest version when querying older versions
          // Latest index is numberOfVersions - 1, so 2nd oldest version starts at numberOfVersions - 2
          numberOfVersions - 2 - i
        )
        this.validVersions.push(pastServiceVersion)
      }
    }

    // Go through each backup and create two keyed maps:
    // { semver => [provider] }
    // { blockdiff => [provider] }
    Object.keys(this.backups).forEach((backup) => {
      const { block_difference: blockDiff, version } = this.backups[
        backup
      ] as Backup

      let isVersionOk = false
      for (let i = 0; i < (this.validVersions as string[]).length; ++i) {
        if (
          isVersionAtLeastSameMajorMinor(
            this.validVersions?.[i] as string,
            version
          )
        ) {
          isVersionOk = true
          break
        }
      }
      // Filter out any version that wasn't valid given what's registered on chain
      if (!isVersionOk) return

      versions.push(version)
      blockDiffs.push(blockDiff)

      if (version in versionMap) {
        versionMap[version]?.push(backup)
      } else {
        versionMap[version] = [backup]
      }

      if (blockDiff in blockDiffMap) {
        blockDiffMap[blockDiff]?.push(backup)
      } else {
        blockDiffMap[blockDiff] = [backup]
      }
    })

    // Sort the versions by desc semver
    const sortedVersions = versions.sort(semver.rcompare)

    // Select the closest version that's a healthy # of blocks behind
    let selected: string = ''
    for (const version of sortedVersions) {
      const endpoints = versionMap[version] as string[]
      for (let i = 0; i < endpoints.length; ++i) {
        if (
          (this.backups[endpoints[i] as string]?.block_difference as number) <
          this.unhealthyBlockDiff
        ) {
          selected = endpoints[i] as string
          break
        }
      }
      if (selected) return selected
    }

    // Select the best block diff provider
    // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
    const bestBlockDiff = blockDiffs.sort()[0] as number

    selected = blockDiffMap[bestBlockDiff]?.[0] as string
    this.enterRegressedMode()

    return selected
  }
}
