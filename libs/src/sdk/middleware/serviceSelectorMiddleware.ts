import type {
  Middleware,
  RequestContext,
  ResponseContext
} from '../api/generated/default'
import { DISCOVERY_SERVICE_NAME } from '../../services/discoveryProvider/constants'
import type { DiscoveryProviderSelection } from '../../services/discoveryProvider/DiscoveryProviderSelection'
import fetch from 'cross-fetch'
import semver from 'semver'

type HealthCheckParams = {
  healthCheckData: any
  discoveryProviderSelector: DiscoveryProviderSelection
}

const isHealthyVersion = ({
  healthCheckData,
  discoveryProviderSelector
}: HealthCheckParams) => {
  return semver.gte(
    healthCheckData.version,
    discoveryProviderSelector.currentVersion
  )
}

const isHealthyIndexerPOA = ({
  healthCheckData,
  discoveryProviderSelector
}: HealthCheckParams) => {
  return (
    healthCheckData.block_difference <
    discoveryProviderSelector.unhealthyBlockDiff
  )
}

const isHealthyIndexerSolana = ({
  healthCheckData,
  discoveryProviderSelector
}: HealthCheckParams) => {
  return (
    !healthCheckData.plays?.is_unhealthy &&
    !healthCheckData.rewards_manager?.is_unhealthy &&
    !healthCheckData.spl_audio_info.is_unhealthy &&
    !healthCheckData.user_bank.is_unhealthy &&
    (!healthCheckData.plays?.tx_info?.slot_diff ||
      !discoveryProviderSelector.unhealthySlotDiffPlays ||
      healthCheckData.plays?.tx_info?.slot_diff <
        discoveryProviderSelector.unhealthySlotDiffPlays)
  )
}

const isHealthyIndexerJetstream = (_: HealthCheckParams) => {
  return true
}

const getHealth = async ({
  endpoint,
  discoveryProviderSelector
}: {
  endpoint: string
  discoveryProviderSelector: DiscoveryProviderSelection
}) => {
  const healthCheckURL = `${endpoint}/health_check`
  let healthCheckData = null
  try {
    // Don't use context.fetch to bypass middleware
    const response = (await fetch(healthCheckURL)) as Response
    if (response.status !== 200) {
      throw new Error()
    }
    const json = await response.json()
    healthCheckData = json.data
    if (!healthCheckData) {
      throw new Error()
    }
  } catch {
    console.warn('Audius SDK discovery provider health_check unhealthy', {
      endpoint
    })
    return false
  }
  if (healthCheckData.service !== DISCOVERY_SERVICE_NAME) {
    console.warn('Audius SDK discovery provider service name unhealthy', {
      endpoint
    })
    return false
  }
  if (!isHealthyVersion({ healthCheckData, discoveryProviderSelector })) {
    console.warn('Audius SDK discovery provider version unhealthy', {
      endpoint
    })
    return false
  }
  if (!isHealthyIndexerPOA({ healthCheckData, discoveryProviderSelector })) {
    console.warn('Audius SDK discovery provider POA indexing unhealthy', {
      endpoint
    })
    return false
  }
  if (!isHealthyIndexerSolana({ healthCheckData, discoveryProviderSelector })) {
    console.warn('Audius SDK discovery provider Solana indexing unhealthy', {
      endpoint
    })
    return false
  }
  if (
    !isHealthyIndexerJetstream({ healthCheckData, discoveryProviderSelector })
  ) {
    console.warn('Audius SDK discovery provider Jetstream indexing unhealthy', {
      endpoint
    })
    return false
  }

  return true
}

/**
 * Uses a discovery provider selector to select a discovery node,
 * and prepends the request URL with the discovery provider endpoint.
 * On failed requests, checks to make sure the currently selected endpoint is still healthy,
 * and if not, selects a new discovery provider.
 * @param options the middleware options
 * @param {DiscoveryProviderSelection} options.discoveryProviderSelector - the DiscoveryProviderSelection instance to use to select a discovery provider
 */
export const selectDiscoveryProviderMiddleware = ({
  discoveryProviderSelector
}: {
  discoveryProviderSelector: DiscoveryProviderSelection
}): Middleware => {
  let selectionPromise = discoveryProviderSelector.select() as Promise<
    string | undefined
  >
  return {
    pre: async (context: RequestContext) => {
      // Select discovery using legacy method
      const endpoint = await selectionPromise
      if (!endpoint) {
        throw new Error(
          'All Discovery Providers are unhealthy and unavailable.'
        )
      }
      return {
        url: `${endpoint}${context.url}`,
        init: context.init ?? {}
      }
    },
    post: async (context: ResponseContext) => {
      const response = context.response as Response
      // Check health and reselect if unhealthy on request failure
      if (!response?.ok) {
        const endpoint = await selectionPromise
        if (!endpoint) {
          throw new Error(
            'All Discovery Providers are unhealthy and unavailable.'
          )
        }
        const path = context.url.substring(endpoint.length)
        console.warn('Audius SDK request failed:', {
          endpoint,
          path,
          init: context.init
        })
        const isHealthy = await getHealth({
          endpoint,
          discoveryProviderSelector
        })
        if (!isHealthy) {
          discoveryProviderSelector.addUnhealthy(endpoint)
          discoveryProviderSelector.clearCached()
          selectionPromise = discoveryProviderSelector.select()
          const newEndpoint = await selectionPromise
          console.warn(
            'Audius SDK discovery provider endpoint unhealthy, reselecting discovery provider and retrying:',
            {
              endpoint,
              newEndpoint
            }
          )
          // Don't use context.fetch to bypass middleware
          return await fetch(`${newEndpoint}${path}`, context.init)
        }
      }
      return response
    }
  }
}
