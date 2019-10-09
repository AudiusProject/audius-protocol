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
    this._isInitted = false
    this._isInitting = false
  }

  /** Inits the contract if necessary */
  async _init () {
    // No-op if we are already initted
    if (this._isInitted) return

    // If we are already initting, wait until we are initted and return
    if (this._isInitting) {
      let interval
      await new Promise((resolve, reject) => {
        interval = setInterval(() => {
          if (this._isInitted) resolve()
        }, 100)
      })
      clearInterval(interval)
      return
    }

    // Perform init
    this._isInitting = true

    this._contractAddress = await this.getRegistryAddress(this.contractRegistryKey)
    this._contract = new this.web3.eth.Contract(
      this.contractABI,
      this._contractAddress
    )

    this._isInitted = false
    this._isInitted = true
  }

  /** Gets the contract address and ensures that the contract has initted. */
  async getAddress () {
    await this._init()
    return this._contractAddress
  }

  /**
   * Gets a contract method and ensures that the contract has initted
   * The contract can then be invoked with .call() or be passed to a sendTransaction.
   * @param {string} methodName the name of the contract method
   */
  async getMethod (methodName, ...args) {
    await this._init()
    return this._contract.methods[methodName](...args)
  }
}

module.exports = ContractClient
