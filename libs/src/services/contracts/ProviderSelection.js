
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
   * Initializes the ContractClient with a healthy POA provider.
   *
   * First, try the contract logic with currently set provider when web3Manager
   * was initialized. If contract logic fails, add current provider to unhealthy
   * list and retry with the other provided gateways.
   *
   * If all gateways have been tried contract logic fails (gateways are unhealthy),
   * log an error.
   * @param {ContractClient} contractClient object used for making transaction calls
   */
  async select (contractClient) {
    const web3Manager = contractClient.web3Manager
    const filteredServices = this.filterOutKnownUnhealthy(this.getServices())
    // Create another web3 instance with another provider
    const web3 = new Web3(web3Manager.provider(filteredServices[0], 10000))

    web3Manager.setWeb3(web3)
    contractClient.web3 = web3

    return web3
  }

  getServicesSize () {
    return this.services.length
  }
}

module.exports = ProviderSelection
