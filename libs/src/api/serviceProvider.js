const { Base } = require('./base')

const CREATOR_NODE_SERVICE_NAME = 'creator-node'
const DISCOVERY_PROVIDER_SERVICE_NAME = 'discovery-provider'

/**
 * API methods to interact with Audius service providers.
 * Types of services include:
 *    - Creator Node (host creator content)
 *    - Discovery Provider (index and make content queryable)
 * Retrieving lists of available services, etc. are found here.
 */
class ServiceProvider extends Base {
  async listCreatorNodes () {
    return this.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(CREATOR_NODE_SERVICE_NAME)
  }

  async listDiscoveryProviders () {
    return this.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(DISCOVERY_PROVIDER_SERVICE_NAME)
  }
}

module.exports = ServiceProvider
