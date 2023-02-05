import semver from 'semver'
import type {
  ApiHealthResponseData,
  HealthCheckResponseData,
  HealthCheckThresholds
} from './healthCheckTypes'
import { DISCOVERY_SERVICE_NAME } from './constants'

const hasSameMajorAndMinorVersion = (version1: string, version2: string) => {
  return (
    semver.major(version1) === semver.major(version2) &&
    semver.minor(version1) === semver.minor(version2)
  )
}

const isIndexerHealthy = ({
  data,
  maxBlockDiff
}: {
  data: HealthCheckResponseData
  maxBlockDiff: number
}) =>
  data.block_difference === null ||
  data.block_difference === undefined ||
  data.block_difference > maxBlockDiff

const isApiIndexerHealthy = ({
  data,
  maxBlockDiff
}: {
  data: ApiHealthResponseData
  maxBlockDiff: number
}) =>
  data.latest_chain_block === null ||
  data.latest_indexed_block === null ||
  data.latest_chain_block === undefined ||
  data.latest_indexed_block === undefined ||
  data.latest_chain_block - data.latest_indexed_block > maxBlockDiff

const isSolanaIndexerHealthy = ({
  data,
  maxSlotDiffPlays
}: {
  data: HealthCheckResponseData
  maxSlotDiffPlays: number | null
}) =>
  !data.plays?.is_unhealthy &&
  !data.rewards_manager?.is_unhealthy &&
  !data.spl_audio_info?.is_unhealthy &&
  !data.user_bank?.is_unhealthy &&
  (!data.plays?.tx_info?.slot_diff ||
    maxSlotDiffPlays === null ||
    data.plays?.tx_info?.slot_diff <= maxSlotDiffPlays)

const isApiSolanaIndexerHealthy = ({
  data,
  maxSlotDiffPlays
}: {
  data: ApiHealthResponseData
  maxSlotDiffPlays: number | null
}) =>
  maxSlotDiffPlays &&
  data.latest_chain_slot_plays &&
  data.latest_indexed_slot_plays &&
  data.latest_chain_slot_plays - data.latest_indexed_slot_plays >
    maxSlotDiffPlays

export const getDiscoveryNodeApiHealth = ({
  data,
  healthCheckThresholds: { minVersion, maxBlockDiff, maxSlotDiffPlays }
}: {
  data: ApiHealthResponseData
  healthCheckThresholds: HealthCheckThresholds
}) => {
  if (
    data.version?.service &&
    data.version.service !== DISCOVERY_SERVICE_NAME
  ) {
    return { health: DiscoveryNodeHealth.UNHEALTHY, reason: 'name' }
  }
  if (minVersion) {
    if (
      !data.version ||
      !data.version.version ||
      !hasSameMajorAndMinorVersion(data.version.version, minVersion)
    ) {
      return {
        health: DiscoveryNodeHealth.UNHEALTHY,
        reason: 'version'
      }
    }

    if (semver.lt(data.version.version, minVersion)) {
      return { health: DiscoveryNodeHealth.BEHIND, reason: 'version' }
    }
  }
  if (!isApiIndexerHealthy({ data, maxBlockDiff })) {
    return { health: DiscoveryNodeHealth.BEHIND, reason: 'block diff' }
  }
  if (!isApiSolanaIndexerHealthy({ data, maxSlotDiffPlays })) {
    return { health: DiscoveryNodeHealth.BEHIND, reason: 'slot diff' }
  }
  return { health: DiscoveryNodeHealth.HEALTHY }
}

export enum DiscoveryNodeHealth {
  UNHEALTHY = 'unhealthy',
  BEHIND = 'behind',
  HEALTHY = 'healthy'
}

export const getHealthCheck = async (
  endpoint: string,
  fetchOptions?: RequestInit
) => {
  const healthCheckURL = `${endpoint}/health_check`
  let data = null
  try {
    // Don't use context.fetch to bypass middleware
    const response = await fetch(healthCheckURL, fetchOptions)
    if (!response.ok) {
      throw new Error(response.statusText)
    }
    const json = await response.json()
    data = json.data as HealthCheckResponseData
    if (!data) {
      throw new Error('Empty data')
    }
    return data
  } catch (e) {
    return null
  }
}

export const getDiscoveryNodeHealth = async ({
  data,
  healthCheckThresholds: { minVersion, maxBlockDiff, maxSlotDiffPlays }
}: {
  data: HealthCheckResponseData | null
  healthCheckThresholds: HealthCheckThresholds
}) => {
  if (data === null) {
    return {
      health: DiscoveryNodeHealth.UNHEALTHY,
      reason: 'data'
    }
  }
  if (data.service !== DISCOVERY_SERVICE_NAME) {
    return {
      health: DiscoveryNodeHealth.UNHEALTHY,
      reason: 'name'
    }
  }

  if (minVersion) {
    if (
      !data.version ||
      !hasSameMajorAndMinorVersion(data.version, minVersion)
    ) {
      return {
        health: DiscoveryNodeHealth.UNHEALTHY,
        reason: 'version'
      }
    }

    if (semver.lt(data.version, minVersion)) {
      return { health: DiscoveryNodeHealth.BEHIND, reason: 'version' }
    }
  }
  if (!isIndexerHealthy({ data, maxBlockDiff })) {
    return { health: DiscoveryNodeHealth.BEHIND, reason: 'block diff' }
  }
  if (!isSolanaIndexerHealthy({ data, maxSlotDiffPlays })) {
    return { health: DiscoveryNodeHealth.BEHIND, reason: 'slot diff' }
  }

  return { health: DiscoveryNodeHealth.HEALTHY }
}
