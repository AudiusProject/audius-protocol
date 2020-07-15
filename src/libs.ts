import AudiusLibs from '@audius/libs'

const E = process.env
const DISCOVERY_PROVIDER_WHITELIST = E.DISCOVERY_PROVIDER_WHITELIST
  ? new Set(E.DISCOVERY_PROVIDER_WHITELIST.split(','))
  : null

/**
 * Singleton wrapper for Audius Libs.
 * Initialized in the server start-up.
 */
const libs = new AudiusLibs({
  ethWeb3Config: AudiusLibs.configEthWeb3(
    E.TOKEN_ADDRESS,
    E.ETH_REGISTRY_ADDRESS,
    E.ETH_PROVIDER_URL,
    E.ETH_OWNER_WALLET
  ),
  discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(
    DISCOVERY_PROVIDER_WHITELIST
  )
})

export default libs
