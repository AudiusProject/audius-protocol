import retry from 'async-retry'
import type { HttpProvider } from 'web3-core'
import type { Contract } from 'web3-eth-contract'

import type { ContractABI, Nullable, Logger } from '../../utils'
import type { EthWeb3Manager } from '../ethWeb3Manager'
import { Web3Manager } from '../web3Manager'

import { ProviderSelection } from './ProviderSelection'

const CONTRACT_INITIALIZING_INTERVAL = 100
const CONTRACT_INITIALIZING_TIMEOUT = 10000
const CONTRACT_INIT_MAX_ATTEMPTS = 5
const METHOD_CALL_MAX_RETRIES = 5

export type GetRegistryAddress = (key: string) => Promise<string>

/*
 * Base class for instantiating contracts.
 * Performs a single init of the eth contract the first
 * time a method on the contract is invoked.
 */
export class ContractClient {
  web3Manager: Web3Manager | EthWeb3Manager
  contractABI: ContractABI['abi']
  contractRegistryKey: string
  getRegistryAddress: GetRegistryAddress
  _contractAddress: Nullable<string>
  _nethermindContractAddress: Nullable<string>
  _contract: Nullable<Contract>
  _isInitialized: boolean
  _isInitializing: boolean
  _initAttempts: number
  providerSelector: Nullable<ProviderSelection>
  logger: Logger

  constructor(
    web3Manager: Web3Manager | EthWeb3Manager,
    contractABI: ContractABI['abi'],
    contractRegistryKey: string,
    getRegistryAddress: GetRegistryAddress,
    logger: Logger = console,
    contractAddress: Nullable<string> = null
  ) {
    this.web3Manager = web3Manager
    this.contractABI = contractABI
    this.contractRegistryKey = contractRegistryKey
    this.getRegistryAddress = getRegistryAddress
    this.logger = logger

    // Once initialized, contract address and contract are set up

    // contractAddress: <entity manager POA>, <entity manager nethermind>
    // this is backwards compatible so clients may pass in one address
    // or both POA and nethermind
    const contractAddresses = contractAddress ? contractAddress.split(',') : []
    this._contractAddress = contractAddresses[0] ?? null
    this._nethermindContractAddress = contractAddresses[1] ?? null
    this._contract = null

    // Initialization setup
    this._isInitialized = false
    this._isInitializing = false
    this._initAttempts = 0

    // Initializing this.providerSelector for POA provider fallback logic
    if (
      this.web3Manager instanceof Web3Manager &&
      !this.web3Manager.web3Config.useExternalWeb3
    ) {
      const providerEndpoints =
        this.web3Manager.web3Config.internalWeb3Config.web3ProviderEndpoints
      this.providerSelector = new ProviderSelection(providerEndpoints)
    } else {
      this.providerSelector = null
    }
  }

  /** Inits the contract if necessary */
  async init() {
    // No-op if we are already initted
    if (this._isInitialized) return

    // If we are already initting, wait until we are initted and return
    if (this._isInitializing) {
      let interval
      await new Promise<void>((resolve, reject) => {
        interval = setInterval(() => {
          if (this._isInitialized) resolve()
        }, CONTRACT_INITIALIZING_INTERVAL)
        setTimeout(() => {
          reject(new Error('[ContractClient:init()] Initialization timeout'))
        }, CONTRACT_INITIALIZING_TIMEOUT)
      })
      clearInterval(interval)
      return
    }

    this._isInitializing = true
    try {
      if (!this._contractAddress) {
        this._contractAddress = await this.getRegistryAddress(
          this.contractRegistryKey
        )
        if (
          this._contractAddress === '0x0000000000000000000000000000000000000000'
        ) {
          this._isInitializing = false
          throw new Error(
            `Failed retrieve address for ${this.contractRegistryKey}`
          )
        }
      }
      const web3 = this.web3Manager.getWeb3()
      this._contract = new web3.eth.Contract(
        this.contractABI,
        this._contractAddress
      )
      this._isInitializing = false
      this._isInitialized = !!this._contractAddress
    } catch (e) {
      if (++this._initAttempts >= CONTRACT_INIT_MAX_ATTEMPTS) {
        this.logger.error(
          `Failed to initialize ${this.contractRegistryKey}. Max attempts exceeded.`
        )
        return
      }

      const selectNewEndpoint = !!this.providerSelector
      this.logger.error(
        `Failed to initialize ${this.contractRegistryKey} on attempt #${this._initAttempts}. Retrying with selectNewEndpoint=${selectNewEndpoint}`
      )
      this._isInitializing = false
      await this.retryInit(selectNewEndpoint)
    }
  }

  async retryInit(selectNewEndpoint = true) {
    try {
      if (selectNewEndpoint) {
        await this.selectNewEndpoint()
      }
      await this.init()
    } catch (e: any) {
      this.logger.error(e?.message)
    }
  }

  /**
   * Adds current provider into unhealthy set and selects the next healthy provider
   */
  async selectNewEndpoint() {
    const currentProviderUrl = (
      this.web3Manager.getWeb3().currentProvider as HttpProvider
    ).host
    this.providerSelector?.addUnhealthy(currentProviderUrl)

    if (
      this.providerSelector?.getUnhealthySize() ===
      this.providerSelector?.getServicesSize()
    ) {
      this.logger.warn(
        'No healthy providers available - resetting ProviderSelection and selecting.'
      )
      this.providerSelector?.clearUnhealthy()
      this.providerSelector?.clearBackups()
    }

    // Reset _isInitializing to false to retry init logic and avoid the _isInitialzing check
    this._isInitializing = false
    await this.providerSelector?.select(this)
  }

  /** Gets the contract address and ensures that the contract has initted. */
  async getAddress() {
    await this.init()
    // calling init first ensures _contactAddress is present
    return this._contractAddress as string
  }

  async getNethermindAddress() {
    await this.init()
    // calling init first ensures _contactAddress is present
    return this._nethermindContractAddress as string
  }

  /**
   * Gets a contract method and ensures that the contract has initted
   * The contract can then be invoked with .call() or be passed to a sendTransaction.
   * @param methodName the name of the contract method
   */
  async getMethod(methodName: string, ...args: any[]) {
    await this.init()
    if (!this._contract || !(methodName in this._contract.methods)) {
      throw new Error(
        `Contract method ${methodName} not found in ${Object.keys(
          this._contract?.methods
        )}`
      )
    }
    const method = await this._contract.methods[methodName](...args)

    // Override method.call (chain reads) with built in retry logic
    const call = method.call
    method.call = async (...args: unknown[]) => {
      return await retry(
        async () => {
          return call(...args)
        },
        {
          // Retry function 5x by default
          // 1st retry delay = 500ms, 2nd = 1500ms, 3rd...nth retry = 4000 ms (capped)
          minTimeout: 500,
          maxTimeout: 4000,
          factor: 3,
          retries: METHOD_CALL_MAX_RETRIES,
          onRetry: (err) => {
            if (err) {
              // eslint-disable-next-line @typescript-eslint/no-base-to-string
              this.logger.warn(`Retry error for ${methodName} : ${err}`)
            }
          }
        }
      )
    }

    return method
  }

  async getEthChainId() {
    await this.init()
    const netId = await this.web3Manager.getWeb3().eth.getChainId()

    return netId
  }

  async getContract() {
    await this.init()
    // init ensures _contract is set
    return this._contract as Contract
  }
}
