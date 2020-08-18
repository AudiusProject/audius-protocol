const Utils = require('../utils')
const axios = require('axios')
const promiseFight = require('./promiseFight')

/**
* Fetches a url and times how long it took the request to complete.
* @param {Object} request {id, url}
* @returns { request, response, millis }
*/
async function timeRequest (request) {
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
async function timeRequests (requests) {
  let timings = await Promise.all(requests.map(async request =>
    timeRequest(request)
  ))

  return timings.sort((a, b) => a.millis - b.millis)
}

// Races requests for file content
/**
 * Races multiple requests
 * @param {*} urls
 * @param {*} callback invoked with the first successful url
 * @param {object} axiosConfig extra axios config for each request
 * @param {number} timeout timeout for any requests to be considered bad
 * @param {number} timeBetweenRequests time between requests being dispatched to free up client network interface
 */
async function raceRequests (
  urls,
  callback,
  axiosConfig,
  timeout = 3000,
  timeBetweenRequests = 100,
  validationCheck = (response) => true
) {
  const CancelToken = axios.CancelToken

  const sources = []
  const requests = urls.map(async (url, i) => {
    const source = CancelToken.source()
    sources.push(source)

    // Slightly offset requests by their order, so:
    // 1. We try public gateways first
    // 2. We give requests the opportunity to get canceled if other's are very fast
    await Utils.wait(timeBetweenRequests * i)

    return new Promise((resolve, reject) => {
      axios({
        method: 'get',
        url,
        cancelToken: source.token,
        ...axiosConfig
      })
        .then(response => {
          const isValid = validationCheck(response)
          if (isValid) {
            resolve({
              blob: response,
              url
            })
          } else {
            // Invalid because of validity check
            reject(response)
          }
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
  let response
  let errored
  try {
    const { val, errored: e } = await promiseFight(requests, /* captureErrorred */ true)
    response = val
    errored = e
  } catch (e) {
    response = null
    errored = e
  }
  sources.forEach(source => {
    source.cancel('Fetch already succeeded')
  })

  if (response && response.url && response.blob) {
    callback(response.url)
    return { response: response.blob, errored }
  }

  return { respone: null, errored }
}

/**
 * Gets the response for many requests with a timeout to each
 * @param {object} urlMap
 * @param {string} urlMap.key the actual URL to hit (e.g. https://resource/endpoint)
 * @param {string} urlMap.value the identifying value (e.g. https://resource)
 *
 * @param {number} timeout timeout for any request to be considered bad
 * @param {function} validationCheck a check invoked for each response.
 *  If invalid, the response is filtered out.
 *  (response: any) => boolean
 */
async function allRequests ({
  urlMap,
  timeout,
  validationCheck
}) {
  const urls = Object.keys(urlMap)
  const requests = urls.map(async (url, i) => {
    return new Promise((resolve) => {
      axios({
        method: 'get',
        timeout,
        url
      })
        .then(response => {
          const isValid = validationCheck(response)
          if (isValid) {
            resolve(urlMap[url])
          } else {
            resolve(null)
          }
        })
        .catch((thrown) => {
          resolve(null)
        })
    })
  })
  const responses = (await Promise.all(requests)).filter(Boolean)
  return responses
}

module.exports = {
  timeRequest,
  timeRequests,
  raceRequests,
  allRequests
}
