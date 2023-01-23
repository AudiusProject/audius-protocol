import type {
  Middleware,
  RequestContext,
  ResponseContext
} from '../api/generated/default'
import { DISCOVERY_SERVICE_NAME } from '../../services/discoveryProvider/constants'
import type { DiscoveryProviderSelection } from '../../services/discoveryProvider/DiscoveryProviderSelection'
import fetch from 'cross-fetch'
import semver from 'semver'
import type { HealthCheckResponseData } from '../api/HealthCheckResponseData'

const isSolanaIndexerHealthy = ({
  data,
  unhealthySlotDiffPlays
}: {
  data: HealthCheckResponseData
  unhealthySlotDiffPlays: number | null
}) => {
  return (
    !data.plays?.is_unhealthy &&
    !data.rewards_manager?.is_unhealthy &&
    !data.spl_audio_info?.is_unhealthy &&
    !data.user_bank?.is_unhealthy &&
    (!data.plays?.tx_info?.slot_diff ||
      unhealthySlotDiffPlays === null ||
      data.plays?.tx_info?.slot_diff < unhealthySlotDiffPlays)
  )
}

const isApiResponseHealthy = ({
  data,
  endpoint,
  currentVersion,
  unhealthyBlockDiff,
  unhealthySlotDiffPlays
}: {
  data: any
  endpoint: string
  currentVersion: string
  unhealthyBlockDiff: number
  unhealthySlotDiffPlays: number | null
}) => {
  if (
    data.version?.service &&
    data.version.service !== DISCOVERY_SERVICE_NAME
  ) {
    console.warn('Audius SDK discovery provider service name unhealthy', {
      endpoint
    })
    return false
  }
  if (
    currentVersion &&
    data.version?.version &&
    semver.lt(data.version.version, currentVersion)
  ) {
    console.warn('Audius SDK discovery provider version unhealthy', {
      endpoint
    })
    return false
  }
  if (
    data.latest_chain_block &&
    data.latest_indexed_block &&
    data.latest_chain_block - data.latest_indexed_block > unhealthyBlockDiff
  ) {
    console.warn('Audius SDK discovery provider POA indexing unhealthy', {
      endpoint
    })
    return false
  }
  if (
    unhealthySlotDiffPlays &&
    data.latest_chain_slot_plays &&
    data.latest_indexed_slot_plays &&
    data.latest_chain_slot_plays - data.latest_indexed_slot_plays >
      unhealthySlotDiffPlays
  ) {
    console.warn('Audius SDK discovery provider Solana indexing unhealthy', {
      endpoint
    })
    return false
  }
  return true
}

const isDiscoveryNodeHealthy = async ({
  endpoint,
  currentVersion,
  unhealthyBlockDiff,
  unhealthySlotDiffPlays
}: {
  endpoint: string
  currentVersion: string
  unhealthyBlockDiff: number
  unhealthySlotDiffPlays: number | null
}) => {
  const healthCheckURL = `${endpoint}/health_check`
  let data = null
  try {
    // Don't use context.fetch to bypass middleware
    const response = await fetch(healthCheckURL)
    if (response.status !== 200) {
      throw new Error()
    }
    const json = await response.json()
    data = json.data as HealthCheckResponseData
    if (!data) {
      throw new Error()
    }
  } catch {
    console.warn('Audius SDK discovery provider health_check unhealthy', {
      endpoint
    })
    return false
  }
  if (data.service !== DISCOVERY_SERVICE_NAME) {
    console.warn('Audius SDK discovery provider service name unhealthy', {
      endpoint
    })
    return false
  }
  if (
    currentVersion &&
    (!data.version || semver.lt(data.version, currentVersion))
  ) {
    console.warn('Audius SDK discovery provider version unhealthy', {
      endpoint
    })
    return false
  }
  if (!data.block_difference || data.block_difference > unhealthyBlockDiff) {
    console.warn('Audius SDK discovery provider POA indexing unhealthy', {
      endpoint
    })
    return false
  }
  if (!isSolanaIndexerHealthy({ data, unhealthySlotDiffPlays })) {
    console.warn('Audius SDK discovery provider Solana indexing unhealthy', {
      endpoint
    })
    return false
  }

  return true
}

const reselectAndRetry = async ({
  endpoint,
  discoveryProviderSelector,
  context
}: {
  endpoint: string
  discoveryProviderSelector: DiscoveryProviderSelection
  context: ResponseContext
}) => {
  const path = context.url.substring(endpoint.length)
  discoveryProviderSelector.addUnhealthy(endpoint)
  discoveryProviderSelector.clearCached()
  const newSelectionPromise = discoveryProviderSelector.select()
  const newEndpoint = await newSelectionPromise
  console.warn(
    'Audius SDK discovery provider endpoint unhealthy, reselected discovery provider and retrying:',
    {
      endpoint,
      newEndpoint
    }
  )
  // Don't use context.fetch to bypass middleware
  const response = await fetch(`${newEndpoint}${path}`, context.init)
  return { newSelectionPromise, response }
}

/**
 * Uses a discovery provider selector to select a discovery node
 * and prepends the request URL with the discovery provider endpoint.
 * - On successful requests, checks the _response body_ to make sure the currently selected endpoint is still healthy,
 * and if not, selects a new discovery provider and retries once.
 * - On failed requests, checks the _health check endpoint_ to make sure the currently selected endpoint is still healthy,
 * and if not, selects a new discovery provider and retries once.
 * @param options the middleware options
 * @param {DiscoveryProviderSelection} options.discoveryProviderSelector - the DiscoveryProviderSelection instance to use to select a discovery provider
 */
export const discoveryNodeSelectorMiddleware = ({
  discoveryProviderSelector
}: {
  discoveryProviderSelector: DiscoveryProviderSelection
}): Middleware => {
  let selectionPromise = discoveryProviderSelector.select() as Promise<
    string | undefined
  >
  return {
    pre: async (context: RequestContext) => {
      // Select discovery using service selection method
      const endpoint = await selectionPromise
      if (!endpoint) {
        throw new Error(
          'All Discovery Providers are unhealthy and unavailable.'
        )
      }
      // Prepend discovery endpoint to url
      return {
        url: `${endpoint}${context.url}`,
        init: context.init ?? {}
      }
    },
    post: async (context: ResponseContext) => {
      const response = context.response as Response
      const { currentVersion, unhealthyBlockDiff, unhealthySlotDiffPlays } =
        discoveryProviderSelector
      const endpoint = await selectionPromise
      if (!endpoint) {
        throw new Error(
          'All Discovery Providers are unhealthy and unavailable.'
        )
      }
      if (response.ok) {
        // Even when successful, copy response to read JSON body and check for signs the DN is unhealthy
        // Prevents stale data
        const responseClone = response.clone()
        const json = await responseClone.json()
        if (
          !isApiResponseHealthy({
            data: json,
            endpoint,
            currentVersion,
            unhealthyBlockDiff,
            unhealthySlotDiffPlays
          })
        ) {
          const { newSelectionPromise, response } = await reselectAndRetry({
            endpoint,
            discoveryProviderSelector,
            context
          })
          selectionPromise = newSelectionPromise
          return response
        }
      } else {
        // On request failure, check health_check and reselect if unhealthy
        console.warn('Audius SDK request failed:', context)
        const isHealthy = await isDiscoveryNodeHealthy({
          endpoint,
          currentVersion,
          unhealthyBlockDiff,
          unhealthySlotDiffPlays
        })
        if (!isHealthy) {
          const { newSelectionPromise, response } = await reselectAndRetry({
            endpoint,
            discoveryProviderSelector,
            context
          })
          selectionPromise = newSelectionPromise
          return response
        }
      }
      return response
    }
  }
}
