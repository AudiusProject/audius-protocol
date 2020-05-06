const ServiceSelection = require('../../service-selection/ServiceSelection')
const Web3 = require('web3')

/**
 * This class provides the logic in selecting the proper gateway
 */
// TODO: use env vars
const gatewayProvidersList = ['https://poa-gateway.audius.co', 'https://core.poa.network']

class ProviderSelection extends ServiceSelection {
  constructor (whitelist = gatewayProvidersList) {
    super({
      whitelist,
      // TODO: return env vars
      getServices: async () => { return whitelist }
    })
  }

  // TODO: add logic for backups? and stuff
  /**
   * Initializes the ContractClient with a healthy POA provider.
   *
   * First, try to contract logic with currently set provider when web3Manager
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

      const contract = contractClient.getWeb3EthContractInstance()
      contractClient.setContract(contract)
    } catch (e) {
      // If error, current provider is unhealthy; add to unhealthy
      this.addUnhealthy(contractClient.web3Manager.getWeb3().currentProvider)

      const servicesSize = await this.getServicesSize()

      // If all providers have been tested and are unhealthy, log the error
      if (this.getUnhealthySize() === servicesSize) {
        console.error(`Failed to initialize contract ${JSON.stringify(contractClient.getContractABI())}`, e)
      } else {
        // Try again with other unused gateways
        await this.select(contractClient)
        this.setContractClientProvider(contractClient)
      }
    }

    contractClient.setIsInitializing(false)
  }

  async select (contractClient) {
    const web3Manager = contractClient.web3Manager
    console.log('selcting')
    let services = await this.getServices()

    const filteredServices = this.filterOutKnownUnhealthy(services)

    // Set new web3 with another provider URL
    try {
      const web3 = new Web3(web3Manager.provider(filteredServices[0], 10000))
      web3Manager.setWeb3(web3)
      console.log(web3Manager.getWeb3())
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = ProviderSelection
