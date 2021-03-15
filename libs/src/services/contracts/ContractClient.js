const ProviderSelection = require('./ProviderSelection')
const Web3Manager = require('../web3Manager/index')
const retry = require('async-retry')

const CONTRACT_INITIALIZING_INTERVAL = 100
const CONTRACT_INITIALIZING_TIMEOUT = 10000
const METHOD_CALL_MAX_RETRIES = 5

/*
 * Base class for instantiating contracts.
 * Performs a single init of the eth contract the first
 * time a method on the contract is invoked.
 */
class ContractClient {
  constructor (web3Manager, contractABI, contractRegistryKey, getRegistryAddress, contractAddress = null) {
    this.web3Manager = web3Manager
    this.contractABI = contractABI
    this.contractRegistryKey = contractRegistryKey
    this.getRegistryAddress = getRegistryAddress

    // Once initialized, contract address and contract are set up
    this._contractAddress = contractAddress
    this._contract = null

    // Initialization setup
    this._isInitialized = false
    this._isInitializing = false

    // Initializing this.providerSelector for POA provider fallback logic
    if (this.web3Manager instanceof Web3Manager && !this.web3Manager.web3Config.useExternalWeb3) {
      const providerEndpoints = this.web3Manager.web3Config.internalWeb3Config.web3ProviderEndpoints
      this.providerSelector = new ProviderSelection(providerEndpoints)
    } else {
      this.providerSelector = null
    }
  }

  /** Inits the contract if necessary */
  async init (selectNewEndpointOnRetry = true) {
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

    this._isInitializing = true
    try {
      if (!this._contractAddress) {
        this._contractAddress = await this.getRegistryAddress(this.contractRegistryKey)
        if (this._contractAddress === '0x0000000000000000000000000000000000000000') {
          this._isInitializing = false
          throw new Error(`Failed retrieve address for ${this.contractRegistryKey}`)
        }
      }
      const web3 = this.web3Manager.getWeb3()
      this._contract = new web3.eth.Contract(
        this.contractABI,
        this._contractAddress
      )
      this._isInitializing = false
      this._isInitialized = true
    } catch (e) {
      // If using ethWeb3Manager or useExternalWeb3 is true, do not do reselect provider logic and fail
      if (!this.providerSelector) {
        console.error(`Failed to initialize ${this.contractRegistryKey} contract`, e)
        return
      }

      await this.retryInit(selectNewEndpointOnRetry)
    }
  }

  async retryInit (selectNewEndpoint = true) {
    try {
      if (selectNewEndpoint) {
        await this.selectNewEndpoint()
      }
      await this.init()
    } catch (e) {
      console.error(e.message)
    }
  }

  /** Adds current provider into unhealthy set and selects the next healthy provider */
  async selectNewEndpoint () {
    this.providerSelector.addUnhealthy(this.web3Manager.getWeb3().currentProvider.host)

    if (this.providerSelector.getUnhealthySize() === this.providerSelector.getServicesSize()) {
      throw new Error(`No available, healthy providers to init contract ${this.contractRegistryKey}`)
    }

    // Reset _isInitializing to false to retry init logic and avoid the _isInitialzing check
    this._isInitializing = false
    await this.providerSelector.select(this)
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
    const method = await this._contract.methods[methodName](...args)

    // Override method.call (chain reads) with built in retry logic
    const call = method.call
    method.call = async (...args) => {
      return retry(async (bail, number) => {
        return call(...args)
      }, {
        // Retry function 5x by default
        // 1st retry delay = 500ms, 2nd = 1500ms, 3rd...nth retry = 4000 ms (capped)
        minTimeout: 500,
        maxTimeout: 4000,
        factor: 3,
        retries: METHOD_CALL_MAX_RETRIES,
        onRetry: (err, i) => {
          if (err) {
            console.log(`Retry error for ${methodName} : ${err}`)
          }
        }
      })
    }

    return method
  }

  async getEthNetId () {
    await this.init()
    const netId = await this.web3Manager.getWeb3().eth.net.getId()

    return netId
  }

  async getContract () {
    await this.init()
    return this._contract
  }
}

module.exports = ContractClient
