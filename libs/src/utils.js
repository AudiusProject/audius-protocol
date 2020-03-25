const bs58 = require('bs58')
const Web3 = require('web3')
const axios = require('axios')

class Utils {
  static importDataContractABI (pathStr) {
    // need to specify part of path here because of https://github.com/webpack/webpack/issues/4921#issuecomment-357147299
    const importFile = require(`../data-contracts/ABIs/${pathStr}`)

    if (importFile) return importFile
    else throw new Error(`Data contract ABI not found ${pathStr}`)
  }

  static importEthContractABI (pathStr) {
    // need to specify part of path here because of https://github.com/webpack/webpack/issues/4921#issuecomment-357147299
    const importFile = require(`../eth-contracts/ABIs/${pathStr}`)

    if (importFile) return importFile
    else throw new Error(`Eth contract ABI not found ${pathStr}`)
  }

  static utf8ToHex (utf8Str) {
    return Web3.utils.utf8ToHex(utf8Str)
  }

  static padRight (hexStr, size) {
    return Web3.utils.padRight(hexStr, size)
  }

  static hexToUtf8 (hexStr) {
    return Web3.utils.hexToUtf8(hexStr)
  }

  static keccak256 (utf8Str) {
    return Web3.utils.keccak256(utf8Str)
  }

  static checkStrLen (str, maxLen, minLen = 1) {
    if (str === undefined || str === null || str.length > maxLen || str.length < minLen) {
      throw new Error(`String must be between ${minLen}-${maxLen} characters`)
    }
  }

  static async wait (milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  // Regular expression to check if endpoint is a FQDN. https://regex101.com/r/kIowvx/2
  static isFQDN (url) {
    let FQDN = new RegExp(/(?:^|[ \t])((https?:\/\/)?(?:localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?(\/\S*)?)/gm)
    return FQDN.test(url)
  }

  // Function to check if the endpont/health_check returns JSON object [ {'healthy':true} ]
  static async isHealthy (url) {
    try {
      let response = await axios.get(url + '/health_check')
      return response.data.healthy
    } catch (error) {
      return false
    }
  }

  static formatOptionalMultihash (multihash) {
    if (multihash) {
      return this.decodeMultihash(multihash).digest
    } else {
      return this.utf8ToHex('')
    }
  }

  static decodeMultihash (multihash) {
    const base16Multihash = bs58.decode(multihash)
    return {
      digest: `0x${base16Multihash.slice(2).toString('hex')}`,
      hashFn: parseInt(base16Multihash[0]),
      size: parseInt(base16Multihash[1])
    }
  }

  static parseDataFromResponse (response) {
    if (!response || !response.data) return null

    let obj = response.data

    // adapted from https://github.com/jashkenas/underscore/blob/master/underscore.js _.isEmpty function
    if (obj == null) return null
    if ((Array.isArray(obj) || typeof (obj) === 'string') && obj.length === 0) return null
    if (Object.keys(obj).length === 0) return null

    return obj
  }

  static async configureWeb3 (web3Provider, chainNetworkId, requiresAccount = true) {
    const web3Instance = new Web3(web3Provider)

    try {
      const networkId = await web3Instance.eth.net.getId()
      if (chainNetworkId && networkId.toString() !== chainNetworkId) {
        return false
      }
      if (requiresAccount) {
        const accounts = await web3Instance.eth.getAccounts()
        if (!accounts || accounts.length < 1) {
          return false
        }
      }
    } catch (e) {
      return false
    }

    return web3Instance
  }

  /**
   * Given an array of promises, it returns the first resolved promise as soon as it finishes
   * @param {Array<Promise>} promises
   * @return {Promise<T>} A promise that resolves with the first promise that resolves
   */
  static async promiseFight (promises) {
    return Promise.all(promises.map(p => {
      return p.then(
        val => Promise.reject(val),
        err => Promise.resolve(err)
      )
    })).then(
      errors => Promise.reject(errors),
      val => Promise.resolve(val)
    )
  }

  /**
  * Fetches a url and times how long it took the request to complete.
  * @param {Object} request {id, url}
  * @returns { request, response, millis }
  */
  static async timeRequest (request) {
    // This is non-perfect because of the js event loop, but enough
    // of a proximation. Don't use for mission-critical timing.
    const startTime = new Date().getTime()
    const response = await axios.get(request.url)
    const millis = new Date().getTime() - startTime
    return { request, response, millis }
  }

  /**
   * Fetches multiple urls and times each request and returns the results sorted by
   * lowest-latency.
   * @param {Array<Object>} requests [{id, url}, {id, url}]
   * @returns { Array<{url, response, millis}> }
   */
  static async timeRequests (requests) {
    let timings = await Promise.all(requests.map(async request =>
      Utils.timeRequest(request)
    ))

    return timings.sort((a, b) => a.millis - b.millis)
  }

  // Races requests for file content
  /**
   * Races multiple requests
   * @param {*} urls
   * @param {*} callback invoked with the first successful url
   * @param {object} axiosConfig extra axios config for each request
   */
  static async raceRequests (
    urls,
    callback,
    axiosConfig,
    timeout = 3000
  ) {
    const CancelToken = axios.CancelToken

    const sources = []
    const requests = urls.map(async (url, i) => {
      const source = CancelToken.source()
      sources.push(source)

      // Slightly offset requests by their order, so:
      // 1. We try public gateways first
      // 2. We give requests the opportunity to get canceled if other's are very fast
      await Utils.wait(100 * i)

      return new Promise((resolve, reject) => {
        axios({
          method: 'get',
          url,
          cancelToken: source.token,
          ...axiosConfig
        })
          .then(response => {
            resolve({
              blob: response,
              url
            })
          })
          .catch((thrown) => {
            reject(thrown)
            // no-op.
            // If debugging `axios.isCancel(thrown)`
            // can be used to check if the throw was from a cancel.
          })
      })
    })
    requests.push(Utils.wait(timeout))
    const response = await Utils.promiseFight(requests)
    sources.forEach(source => {
      source.cancel('Fetch already succeeded')
    })

    if (response.url && response.blob) {
      callback(response.url)
      return response.blob
    }

    throw new Error(`All requests timed out for URLs ${urls}`)
  }
}

module.exports = Utils
