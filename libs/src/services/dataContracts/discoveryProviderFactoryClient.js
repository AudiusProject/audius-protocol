class DiscoveryProviderFactoryClient {
  constructor (web3Manager, contractABI, contractRegistryKey, getRegistryAddress) {
    this.web3Manager = web3Manager
    this.contractABI = contractABI
    this.contractRegistryKey = contractRegistryKey
    this.getRegistryAddress = getRegistryAddress

    this.web3 = this.web3Manager.getWeb3()
  }

  async init () {
    this.contractAddress = await this.getRegistryAddress(this.contractRegistryKey)
    this.DiscoveryProviderFactory = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
  }

  /* ------- GETTERS ------- */

  async getDiscoveryProvider (id) {
    return this.DiscoveryProviderFactory.methods.getDiscoveryProvider(id).call()
  }

  async getTotalNumberOfProviders () {
    return this.DiscoveryProviderFactory.methods.getTotalNumberOfProviders().call()
  }

  async getDiscoveryProviderList () {
    const totalNumberOfProviders = await this.getTotalNumberOfProviders()
    let providers = []
    for (let i = 0; i < totalNumberOfProviders; i++) {
      providers[i] = this.getDiscoveryProvider(i + 1)
    }
    let providerList = await Promise.all(providers)
    return providerList.map((provider) => provider[1])
  }

  /* ------- SETTERS ------- */

  async register (endpoint) {
    const contractMethod = this.DiscoveryProviderFactory.methods.register(endpoint)
    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
    return tx
  }
}

module.exports = DiscoveryProviderFactoryClient
