import AudiusLibs from '@audius/libs'
import Web3 from 'web3'

const E = process.env

/**
 * Singleton wrapper for Audius Libs.
 * Initialized in the server start-up.
 */
const libs = new AudiusLibs({
  ethWeb3Config: AudiusLibs.configEthWeb3(
    E.TOKEN_ADDRESS,
    E.ETH_REGISTRY_ADDRESS,
    new Web3(new Web3.providers.HttpProvider(E.ETH_PROVIDER_URL!)),
    E.ETH_OWNER_WALLET
  ),
  discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(true)
})

export default libs
