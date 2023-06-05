import semver from 'semver'
import {
  ApiHealthResponseData,
  HealthCheckResponseData,
  HealthCheckStatus,
  HealthCheckStatusReason,
  HealthCheckThresholds
} from './healthCheckTypes'
import { DISCOVERY_SERVICE_NAME } from './constants'
import fetch from 'cross-fetch'

const isIndexerHealthy = ({
  data,
  maxBlockDiff
}: {
  data: HealthCheckResponseData
  maxBlockDiff: number
}) =>
  data.block_difference === undefined ||
  data.block_difference === null ||
  data.block_difference <= maxBlockDiff

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
  data.latest_chain_block - data.latest_indexed_block <= maxBlockDiff

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
  !maxSlotDiffPlays ||
  !data.latest_chain_slot_plays ||
  !data.latest_indexed_slot_plays ||
  data.latest_chain_slot_plays - data.latest_indexed_slot_plays <=
    maxSlotDiffPlays

export const parseApiHealthStatusReason = ({
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
    return { health: HealthCheckStatus.UNHEALTHY, reason: 'name' }
  }
  if (minVersion) {
    if (data.version && !data.version.version) {
      return {
        health: HealthCheckStatus.UNHEALTHY,
        reason: 'version'
      }
    }

    if (data.version && semver.lt(data.version.version, minVersion)) {
      return { health: HealthCheckStatus.BEHIND, reason: 'version' }
    }
  }
  if (!isApiIndexerHealthy({ data, maxBlockDiff })) {
    return { health: HealthCheckStatus.BEHIND, reason: 'block diff' }
  }
  if (!isApiSolanaIndexerHealthy({ data, maxSlotDiffPlays })) {
    return { health: HealthCheckStatus.BEHIND, reason: 'slot diff' }
  }
  return { health: HealthCheckStatus.HEALTHY }
}

const getHealthCheckData = async (
  endpoint: string,
  fetchOptions?: RequestInit
) => {
  const healthCheckURL = `${endpoint}/health_check`
  let data = null
  const response = await fetch(healthCheckURL, fetchOptions)
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  const json = await response.json()
  data = json.data as HealthCheckResponseData
  if (!data) {
    throw new Error('data')
  }
  return data
}

export const parseHealthStatusReason = ({
  data,
  healthCheckThresholds: { minVersion, maxBlockDiff, maxSlotDiffPlays }
}: {
  data: HealthCheckResponseData | null
  healthCheckThresholds: HealthCheckThresholds
}): HealthCheckStatusReason => {
  if (data === null) {
    return {
      health: HealthCheckStatus.UNHEALTHY,
      reason: 'data'
    }
  }
  if (data.service !== DISCOVERY_SERVICE_NAME) {
    return {
      health: HealthCheckStatus.UNHEALTHY,
      reason: 'name'
    }
  }

  if (minVersion) {
    if (!data.version) {
      return {
        health: HealthCheckStatus.UNHEALTHY,
        reason: 'version'
      }
    }

    if (semver.lt(data.version, minVersion)) {
      return { health: HealthCheckStatus.BEHIND, reason: 'version' }
    }
  }
  if (!isIndexerHealthy({ data, maxBlockDiff })) {
    return { health: HealthCheckStatus.BEHIND, reason: 'block diff' }
  }
  if (!isSolanaIndexerHealthy({ data, maxSlotDiffPlays })) {
    return { health: HealthCheckStatus.BEHIND, reason: 'slot diff' }
  }

  return { health: HealthCheckStatus.HEALTHY }
}

export const getDiscoveryNodeHealthCheck = async ({
  endpoint,
  healthCheckThresholds,
  fetchOptions,
  timeoutMs
}: {
  endpoint: string
  healthCheckThresholds: HealthCheckThresholds
  fetchOptions?: RequestInit
  timeoutMs?: number
}) => {
  const timeoutPromises = []
  if (timeoutMs !== undefined) {
    const timeoutPromise = new Promise<never>((_resolve, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeoutMs)
    )
    timeoutPromises.push(timeoutPromise)
  }
  try {
    const data = await Promise.race([
      getHealthCheckData(endpoint, fetchOptions),
      ...timeoutPromises
    ])
    const reason = parseHealthStatusReason({
      data,
      healthCheckThresholds
    })
    return { ...reason, data }
  } catch (e) {
    return {
      health: HealthCheckStatus.UNHEALTHY,
      reason: (e as Error)?.message,
      data: null
    }
  }
}
