
const Web3 = require('web3')
const ServiceSelection = require('../../service-selection/ServiceSelection')

/**
 * This class provides the logic to select a healthy gateway
 */
class ProviderSelection extends ServiceSelection {
  constructor (services = []) {
    super({
      whitelist: [],
      getServices: () => { return this.services }
    })
    this.services = services
  }

  /**
   * Filters out previously tried providers, and then initializes the client
   * (ContractClient, RegistryClient) with a healthy POA provider.
   *
   * @param {Object} client object used for making transaction calls
   */
  async select (client) {
    const web3Manager = client.web3Manager
    const filteredServices = this.filterOutKnownUnhealthy(this.getServices())
    const web3 = new Web3(web3Manager.provider(filteredServices[0], 10000))
    web3Manager.setWeb3(web3)
  }

  getServicesSize () {
    return this.services.length
  }
}

module.exports = ProviderSelection
