import Web3 from 'web3'
import { ServiceSelection } from '../../service-selection'
import type { EthWeb3Manager } from '../ethWeb3Manager'
import type { Web3Manager } from '../web3Manager'

/**
 * This class provides the logic to select a healthy gateway
 */
export class ProviderSelection extends ServiceSelection {
  services: string[]

  constructor(services: string[] = []) {
    super({
      whitelist: new Set(),
      getServices: async () => this.services
    })

    this.services = services
  }

  /**
   * Filters out previously tried providers, and then initializes the client
   * (ContractClient, RegistryClient) with a healthy POA provider.
   *
   * @param client object used for making transaction calls
   */
  override async select(client: { web3Manager: Web3Manager | EthWeb3Manager }) {
    const web3Manager = client.web3Manager as Web3Manager
    const filteredServices = this.filterOutKnownUnhealthy(
      await this.getServices()
    )
    const web3 = new Web3(
      web3Manager.provider(filteredServices[0] as string, 10000)
    )

    web3Manager.setWeb3(web3)
  }

  getServicesSize() {
    return this.services.length
  }
}
