import semver from 'semver'

import type { CommsResponse } from '../../../sdk/api/chats/serverTypes'
import fetch from '../../utils/fetch'

import {
  ApiHealthResponseData,
  FlaskFullResponse,
  HealthCheckComms,
  HealthCheckResponseData,
  HealthCheckStatus,
  HealthCheckStatusReason,
  HealthCheckThresholds
} from './healthCheckTypes'

/**
 * The name of the service for Discovery Node
 */
const DISCOVERY_SERVICE_NAME = 'discovery-node'

export const isFullFlaskResponse = (
  data: ApiHealthResponseData
): data is FlaskFullResponse => {
  return (data as FlaskFullResponse).version !== undefined
}

export const isCommsResponse = (
  data: ApiHealthResponseData
): data is CommsResponse => {
  return (data as CommsResponse).health !== undefined
}

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
  data: FlaskFullResponse
  maxBlockDiff: number
}) =>
  data.latest_chain_block === null ||
  data.latest_indexed_block === null ||
  data.latest_chain_block === undefined ||
  data.latest_indexed_block === undefined ||
  data.latest_chain_block - data.latest_indexed_block <= maxBlockDiff

const isApiSolanaIndexerHealthy = ({
  data,
  maxSlotDiffPlays
}: {
  data: FlaskFullResponse
  maxSlotDiffPlays: number | null
}) =>
  !maxSlotDiffPlays ||
  !data.latest_chain_slot_plays ||
  !data.latest_indexed_slot_plays ||
  data.latest_chain_slot_plays - data.latest_indexed_slot_plays <=
    maxSlotDiffPlays

// const isApiCommsHealthy = ({ data }: { data: CommsResponse }) => {
//   return data.health?.is_healthy
// }

export const parseApiHealthStatusReason = ({
  data,
  healthCheckThresholds: { minVersion, maxBlockDiff, maxSlotDiffPlays }
}: {
  data: ApiHealthResponseData
  healthCheckThresholds: HealthCheckThresholds
}) => {
  if (isFullFlaskResponse(data)) {
    if (data.version?.service !== DISCOVERY_SERVICE_NAME) {
      return { health: HealthCheckStatus.UNHEALTHY, reason: 'name' }
    }
    if (minVersion) {
      if (!data.version.version) {
        return {
          health: HealthCheckStatus.UNHEALTHY,
          reason: 'version'
        }
      }

      if (semver.lt(data.version.version, minVersion)) {
        return { health: HealthCheckStatus.BEHIND, reason: 'version' }
      }
    }
    if (!isApiIndexerHealthy({ data, maxBlockDiff })) {
      return { health: HealthCheckStatus.BEHIND, reason: 'block diff' }
    }
    if (!isApiSolanaIndexerHealthy({ data, maxSlotDiffPlays })) {
      return { health: HealthCheckStatus.BEHIND, reason: 'slot diff' }
    }
  } else if (isCommsResponse(data)) {
    // TODO: Re-enable once is_healthy is correctly reporting
    // if (!isApiCommsHealthy({ data })) {
    //   return { health: HealthCheckStatus.UNHEALTHY, reason: 'comms' }
    // }
  }

  return { health: HealthCheckStatus.HEALTHY }
}

const getHealthCheckData = async (
  endpoint: string,
  fetchOptions?: RequestInit
) => {
  const healthCheckURL = `${endpoint}/health_check`
  let data = null
  let comms = null
  const response = await fetch(healthCheckURL, fetchOptions)
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  const json = await response.json()
  data = json.data as HealthCheckResponseData
  comms = json.comms as HealthCheckComms
  if (!data) {
    throw new Error('data')
  }
  if (!comms) {
    throw new Error('comms')
  }
  return { data, comms }
}

export const parseHealthStatusReason = ({
  data,
  comms,
  healthCheckThresholds: { minVersion, maxBlockDiff }
}: {
  data: HealthCheckResponseData | null
  comms: HealthCheckComms | null
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

  if (!comms?.healthy) {
    return {
      health: HealthCheckStatus.UNHEALTHY,
      reason: 'comms'
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

  if (data.chain_health?.status === 'Unhealthy') {
    return {
      health: HealthCheckStatus.UNHEALTHY,
      reason: 'chain'
    }
  }

  if (!isIndexerHealthy({ data, maxBlockDiff })) {
    return { health: HealthCheckStatus.BEHIND, reason: 'block diff' }
  }

  if (!data.discovery_provider_healthy) {
    return {
      health: HealthCheckStatus.UNHEALTHY,
      reason: data.errors?.join(', ')
    }
  }

  return { health: HealthCheckStatus.HEALTHY }
}

const delay = async (ms: number, options?: { signal: AbortSignal }) => {
  const signal = options?.signal
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('aborted'))
    }
    const listener = () => {
      clearTimeout(timer)
      reject(new Error('aborted'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', listener)
      resolve()
    }, ms)
    signal?.addEventListener('abort', listener)
  })
}

const createTimeoutPromise = async (ms: number, signal: AbortSignal) => {
  await delay(ms, { signal })
  if (!signal.aborted) {
    throw new Error('timeout')
  }
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
  const ac = new AbortController()
  const timeoutPromises = []
  if (timeoutMs !== undefined) {
    timeoutPromises.push(createTimeoutPromise(timeoutMs, ac.signal))
  }
  try {
    const res = await Promise.race([
      getHealthCheckData(endpoint, { ...fetchOptions, signal: ac.signal }),
      ...timeoutPromises
    ])
    if (!res) {
      throw new Error('timeout')
    }
    const { data, comms } = res
    const reason = parseHealthStatusReason({
      data,
      comms,
      healthCheckThresholds
    })
    return { ...reason, data }
  } catch (e) {
    return {
      health: HealthCheckStatus.UNHEALTHY,
      reason: (e as Error)?.message,
      data: null
    }
  } finally {
    ac.abort()
  }
}
