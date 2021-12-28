import EthContracts from "../../../../src/services/ethContracts"
import Web3Manager from "../../../../src/services/web3Manager"
import UserStateManager from "../../../../src/userStateManager"
import { RequestArgs } from "../../../base"
import { DiscoveryProviderSelector } from './DiscoveryProviderSelector'
import axios from 'axios'

const Utils = require('../../utils')

const {
  UNHEALTHY_BLOCK_DIFF,
  REQUEST_TIMEOUT_MS
} = require('./constants')

const Requests = require('./requests')

// TODO - webpack workaround. find a way to do this without checkout for .default property
let urlJoin = require('proper-url-join')
const DiscoveryProviderSelection = require('./DiscoveryProviderSelection')
if (urlJoin && urlJoin.default) urlJoin = urlJoin.default

const MAX_MAKE_REQUEST_RETRY_COUNT = 5

/**
 * Constructs a service class for a discovery node
 * @param {Set<string>?} whitelist whether or not to only include specified nodes in selection
 * @param {UserStateManager} userStateManager singleton UserStateManager instance
 * @param {EthContracts} ethContracts singleton EthContracts instance
 * @param {number?} reselectTimeout timeout to clear locally cached discovery providers
 * @param {function} selectionCallback invoked when a discovery node is selected
 * @param {object?} monitoringCallbacks callbacks to be invoked with metrics from requests sent to a service
 *  @param {function} monitoringCallbacks.request
 *  @param {function} monitoringCallbacks.healthCheck
 * @param {number?} selectionRequestTimeout the amount of time (ms) an individual request should take before reselecting
 * @param {number?} selectionRequestRetries the number of retries to a given discovery node we make before reselecting
 * @param {number?} unhealthySlotDiffPlays the number of slots we would consider a discovery node unhealthy
 */
class DiscoveryProvider {

    private whitelist: Set<string>
    private blacklist: Set<string>
    private userStateManager: UserStateManager
    private ethContracts: EthContracts
    private web3Manager: Web3Manager
    private serviceSelector: DiscoveryProviderSelector

    private selectionRequestTimeout: number
    private selectionRequestRetries: number
    private unhealthySlotDiffPlays: number
    private monitoringCallbacks: {request?: (args: any) => void, health_check?: (args: any) => void}

    private discoveryProviderEndpoint: string

  constructor (
    whitelist,
    blacklist,
    userStateManager,
    ethContracts,
    web3Manager,
    reselectTimeout,
    selectionCallback,
    monitoringCallbacks = {},
    selectionRequestTimeout,
    selectionRequestRetries,
    unhealthySlotDiffPlays
  ) {
    this.whitelist = whitelist
    this.blacklist = blacklist
    this.userStateManager = userStateManager
    this.ethContracts = ethContracts
    this.web3Manager = web3Manager

    this.serviceSelector = new DiscoveryProviderSelection({
      whitelist: this.whitelist,
      blacklist: this.blacklist,
      reselectTimeout,
      selectionCallback,
      monitoringCallbacks,
      requestTimeout: selectionRequestTimeout,
      unhealthySlotDiffPlays: unhealthySlotDiffPlays
    }, this.ethContracts)
    this.selectionRequestTimeout = selectionRequestTimeout || REQUEST_TIMEOUT_MS
    this.selectionRequestRetries = selectionRequestRetries || MAX_MAKE_REQUEST_RETRY_COUNT
    this.unhealthySlotDiffPlays = unhealthySlotDiffPlays

    this.monitoringCallbacks = monitoringCallbacks
  }

  async init () {
    const endpoint = await this.serviceSelector.select()
    this.setEndpoint(endpoint)
  }

  setEndpoint (endpoint: string) {
    this.discoveryProviderEndpoint = endpoint
  }

  /* ------- INTERNAL FUNCTIONS ------- */

  /**
   * Performs a single request, defined in the request, via axios, calling any
   * monitoring callbacks as needed.
   *
   * @param {{
     endpoint: string,
     urlParams: string,
     queryParams: object,
     method: string,
     headers: object,
   }} requestObj
   * @param {string} discoveryProviderEndpoint
   * @returns
   * @memberof DiscoveryProvider
   */
  async _performRequestWithMonitoring (axiosArgs: RequestArgs, discoveryProviderEndpoint: string) {
    let response
    let parsedResponse
    const axiosRequestArgs = {...axiosArgs.options, url: discoveryProviderEndpoint + axiosArgs.url};
    const url = new URL(axiosRequestArgs.url)
    const start = Date.now()
    try {
      response = await axios.request(axiosRequestArgs)
      const duration = Date.now() - start
      parsedResponse = Utils.parseDataFromResponse(response)

      // Fire monitoring callbacks for request success case
      if (this.monitoringCallbacks.request) {
        try {
          this.monitoringCallbacks.request({
            endpoint: url.origin,
            pathname: url.pathname,
            queryString: url.search,
            signer: response.data.signer,
            signature: response.data.signature,
            requestMethod: axiosRequestArgs.method,
            status: response.status,
            responseTimeMillis: duration
          })
        } catch (e) {
          // Swallow errors -- this method should not throw generally
          console.error(e)
        }
      }
    } catch (e) {
      const resp = e.response || {}
      const duration = Date.now() - start
      const errMsg = e.response && e.response.data ? e.response.data : e

      // Fire monitoring callbaks for request failure case
      if (this.monitoringCallbacks.request) {
        try {
          this.monitoringCallbacks.request({
            endpoint: url.origin,
            pathname: url.pathname,
            queryString: url.search,
            requestMethod: axiosRequestArgs.method,
            status: resp.status,
            responseTimeMillis: duration
          })
        } catch (e) {
          // Swallow errors -- this method should not throw generally
          console.error(e)
        }
      }
      throw errMsg
    }
    return parsedResponse
  }

  /**
   * Gets how many blocks behind a discovery node is.
   * If this method throws (missing data in health check response),
   * return an unhealthy number of blocks
   * @param {Object} parsedResponse health check response object
   * @returns {number | null} a number of blocks if behind or null if not behind
   */
  async _getBlocksBehind (parsedResponse) {
    try {
      const {
        latest_indexed_block: indexedBlock,
        latest_chain_block: chainBlock
      } = parsedResponse

      const blockDiff = chainBlock - indexedBlock
      if (blockDiff > UNHEALTHY_BLOCK_DIFF) {
        return blockDiff
      }
      return null
    } catch (e) {
      console.error(e)
      return UNHEALTHY_BLOCK_DIFF
    }
  }

  /**
   * Gets how many plays slots behind a discovery node is.
   * If this method throws (missing data in health check response),
   * return an unhealthy number of slots
   * @param {Object} parsedResponse health check response object
   * @returns {number | null} a number of slots if behind or null if not behind
   */
  async _getPlaysSlotsBehind (parsedResponse) {
    if (!this.unhealthySlotDiffPlays) return null

    try {
      const {
        latest_indexed_slot_plays: indexedSlotPlays,
        latest_chain_slot_plays: chainSlotPlays
      } = parsedResponse

      const slotDiff = chainSlotPlays - indexedSlotPlays
      if (slotDiff > this.unhealthySlotDiffPlays) {
        return slotDiff
      }
      return null
    } catch (e) {
      console.error(e)
      return this.unhealthySlotDiffPlays
    }
  }

  /**
   * Makes a request to a discovery node, reselecting if necessary
   * @param {{
   *  endpoint: string
   *  urlParams: object
   *  queryParams: object
   *  method: string
   *  headers: object
   * }} {
   *  endpoint: the base route
   *  urlParams: string of URL params to be concatenated after base route
   *  queryParams: URL query (search) params
   *  method: string HTTP method
   * }
   * @param {boolean?} retry whether to retry on failure
   * @param {number?} attemptedRetries number of attempted retries (stops retrying at max)
   */
  async _makeRequest (requestObj, retry = true, attemptedRetries = 0) {
    try {
      const newDiscProvEndpoint = await this.getHealthyDiscoveryProviderEndpoint(attemptedRetries)

      // If new DP endpoint is selected, update disc prov endpoint and reset attemptedRetries count
      if (this.discoveryProviderEndpoint !== newDiscProvEndpoint) {
        let updateDiscProvEndpointMsg = `Current Discovery Provider endpoint ${this.discoveryProviderEndpoint} is unhealthy. `
        updateDiscProvEndpointMsg += `Switching over to the new Discovery Provider endpoint ${newDiscProvEndpoint}!`
        console.info(updateDiscProvEndpointMsg)
        this.discoveryProviderEndpoint = newDiscProvEndpoint
        attemptedRetries = 0
      }
    } catch (e) {
      console.error(e)
      return
    }
    let parsedResponse
    try {
      parsedResponse = await this._performRequestWithMonitoring(requestObj, this.discoveryProviderEndpoint)
    } catch (e) {
      const fullErrString = `Failed to make Discovery Provider request at attempt #${attemptedRetries}, error ${JSON.stringify(e.message)}, request: ${JSON.stringify(requestObj)}`
      console.error(fullErrString)
      if (retry) {
        return this._makeRequest(requestObj, retry, attemptedRetries + 1)
      }
      return null
    }

    // Validate health check response

    // Regressed mode signals we couldn't find a node that wasn't behind by some measure
    // so we should should pick something
    const notInRegressedMode = this.ethContracts && !this.ethContracts.isInRegressedMode()

    const blockDiff = await this._getBlocksBehind(parsedResponse)
    if (notInRegressedMode && blockDiff) {
      if (retry) {
        console.info(
          `${this.discoveryProviderEndpoint} is too far behind [block diff: ${blockDiff}]. Retrying request at attempt #${attemptedRetries}...`
        )
        return this._makeRequest(requestObj, retry, attemptedRetries + 1)
      }
      return null
    }

    const playsSlotDiff = await this._getPlaysSlotsBehind(parsedResponse)
    if (notInRegressedMode && playsSlotDiff) {
      if (retry) {
        console.info(
          `${this.discoveryProviderEndpoint} is too far behind [slot diff: ${playsSlotDiff}]. Retrying request at attempt #${attemptedRetries}...`
        )
        return this._makeRequest(requestObj, retry, attemptedRetries + 1)
      }
      return null
    }

    // Everything looks good, return the data!
    return parsedResponse.data
  }

  /**
   * Gets the healthy discovery provider endpoint used in creating the axios request later.
   * If the number of retries is over the max count for retires, clear the cache and reselect
   * another healthy discovery provider. Else, return the current discovery provider endpoint
   * @param {number} attemptedRetries the number of attempted requests made to the current disc prov endpoint
   */
  async getHealthyDiscoveryProviderEndpoint (attemptedRetries) {
    let endpoint = this.discoveryProviderEndpoint
    if (attemptedRetries > this.selectionRequestRetries) {
      // Add to unhealthy list if current disc prov endpoint has reached max retry count
      console.info(`Attempted max retries with endpoint ${endpoint}`)
      this.serviceSelector.addUnhealthy(endpoint)
      endpoint = await this.serviceSelector.select()
    }

    // If there are no more available backups, throw error
    if (!endpoint) {
      throw new Error('All Discovery Providers are unhealthy and unavailable.')
    }

    return endpoint
  }
}
