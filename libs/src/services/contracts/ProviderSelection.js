
const Web3 = require('web3')

const ServiceSelection = require('../../service-selection/ServiceSelection')
const EthWeb3Manager = require('../../../src/services/ethWeb3Manager/index')

/**
 * This class provides the logic in selecting the proper gateway
 */
// TODO: use env vars idk how to use env vars lol
const gatewayProvidersList = ['https://poa-gateway.audius.co', 'https://core.poa.network']

class ProviderSelection extends ServiceSelection {
  constructor (whitelist = gatewayProvidersList) {
    super({
      whitelist,
      // TODO: return env vars
      getServices: async () => { return whitelist }
    })
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
   * @param {*} contractClient object used for making transaction calls
   */
  async setContractClientProvider (contractClient) {
    contractClient.setIsInitializing(true)

    try {
      const contractAddress = await contractClient.getRegistryAddress(contractClient.contractRegistryKey)
      contractClient.setContractAddress(contractAddress)

      const contract = contractClient.createWeb3EthContractInstance()
      contractClient.setWeb3EthContractInstance(contract)
      contractClient.setIsInitialzed(true)
    } catch (e) {
      // If error, current provider is unhealthy; add to unhealthy
      this.addUnhealthy(contractClient.web3Manager.getWeb3().currentProvider.host)
      const servicesSize = await this.getServicesSize()

      // If web3Manager is instance of EthWeb3Manager, do not do retry logic
      // If all providers have been tested and are unhealthy, log the error
      if (contractClient.web3Manager instanceof EthWeb3Manager || this.getUnhealthySize() === servicesSize) {
        console.error(`Failed to initialize contract ${JSON.stringify(contractClient.getContractABI())}`, e)
        return
      }

      // Try again with other unused gateways
      await this.select(contractClient)
      await this.setContractClientProvider(contractClient)
    }

    contractClient.setIsInitializing(false)
  }

  async select (contractClient) {
    const web3Manager = contractClient.web3Manager
    let services = await this.getServices()

    const filteredServices = this.filterOutKnownUnhealthy(services)

    // Set new web3 with another provider URL
    try {
      const web3 = new Web3(web3Manager.provider(filteredServices[0], 10000))
      web3Manager.setWeb3(web3)
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = ProviderSelection
