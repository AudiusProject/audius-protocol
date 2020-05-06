const ProviderSelection = require('./ProviderSelection')

const CONTRACT_INITIALIZING_INTERVAL = 100
const CONTRACT_INITIALIZING_TIMEOUT = 10000

/*
 * Base class for instantiating contracts.
 * Performs a single init of the eth contract the first
 * time a method on the contract is invoked.
 */
class ContractClient {
  constructor (web3Manager, contractABI, contractRegistryKey, getRegistryAddress) {
    this.web3Manager = web3Manager
    this.web3 = web3Manager.getWeb3()
    this.contractABI = contractABI
    this.contractRegistryKey = contractRegistryKey
    this.getRegistryAddress = getRegistryAddress

    // Once initialized, contract address and contract are set up
    this._contractAddress = null
    this._contract = null

    // Initialization setup
    this._isInitialized = false
    this._isInitializing = false
  }

  /** Inits the contract if necessary */
  async init () {
    // No-op if we are already initted
    if (this._isInitialized) return

    // If we are already initting, wait until we are initted and return
    if (this._isInitializing) {
      let interval
      await new Promise((resolve, reject) => {
        interval = setInterval(() => {
          if (this._isInitialized) resolve()
        }, CONTRACT_INITIALIZING_INTERVAL)
        setTimeout(() => {
          reject(new Error('Initialization timeout'))
        }, CONTRACT_INITIALIZING_TIMEOUT)
      })
      clearInterval(interval)
      return
    }

    // Perform init by selecting healthy provider
    const providerSelector = new ProviderSelection()
    providerSelector.setContractClientProvider(this)

    // Perform init
    // TODO: update init logic
    // this._isInitializing = true

    // try {
    //   this._contractAddress = await this.getRegistryAddress(this.contractRegistryKey)
    //   this._contract = new this.web3.eth.Contract(
    //     this.contractABI,
    //     this._contractAddress
    //   )
    //   this._isInitialized = true
    // } catch (e) {
    //   console.error(`Failed to initialize contract ${JSON.stringify(this.contractABI)}`, e)
    // }
    // this._isInitializing = false
  }

  setContractAddress (contractAddress) {
    this._contractAddress = contractAddress
  }

  setContract (contract) {
    this._contract = contract
  }

  setIsInitializing (isInitializing) {
    this._isInitializing = isInitializing
  }

  getWeb3Instance () {
    return this.web3
  }

  getWeb3EthContractInstance () {
    return this.web3.eth.Contract(this.contractABI, this._contractAddress)
  }

  getContractABI () {
    return this.contractABI
  }

  /** Gets the contract address and ensures that the contract has initted. */
  async getAddress () {
    await this.init()
    return this._contractAddress
  }

  /**
   * Gets a contract method and ensures that the contract has initted
   * The contract can then be invoked with .call() or be passed to a sendTransaction.
   * @param {string} methodName the name of the contract method
   */
  async getMethod (methodName, ...args) {
    await this.init()
    if (!(methodName in this._contract.methods)) {
      throw new Error(`Contract method ${methodName} not found in ${Object.keys(this._contract.methods)}`)
    }
    return this._contract.methods[methodName](...args)
  }
}

module.exports = ContractClient
