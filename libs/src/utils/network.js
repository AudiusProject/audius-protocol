const axios = require('axios')
const semver = require('semver')

const Utils = require('./utils.js')
const { promiseFight } = require('./promiseFight')

/**
* Fetches a url and times how long it took the request to complete.
* @param {Object} request {id, url}
* @param {number?} timeout
* @returns { request, response, millis }
*/
async function timeRequest (request, timeout = null) {
  // This is non-perfect because of the js event loop, but enough
  // of a proximation. Don't use for mission-critical timing.
  const startTime = new Date().getTime()
  const config = {}
  if (timeout) {
    config.timeout = timeout
  }
  let response
  try {
    response = await axios.get(request.url, config)
  } catch (e) {
    console.debug(`Error with request for ${request.url}: ${e}`)
    return { request, response: null, millis: null }
  }
  const millis = new Date().getTime() - startTime
  return { request, response, millis }
}

/**
 * Custom sort for `serviceTimings`, the response from `timeRequest()` function above
 * @param {Array<Object>} serviceTimings array of objects { request, response, millis }
 * @param {Boolean} sortByVersion whether or not to sort by version
 * @param {string | null} currentVersion current on-chain service version - only required if `sortByVersion` = false
 * @param {number? | null} equivalencyDelta
 *  the number of milliseconds at which we consider services to be equally as fast
 *  and pick randomly between them. Default of null implies that the faster service
 *  (even if by 1ms) will be picked always.
 * @returns { Array<{url, response, millis}> }
 */
function sortServiceTimings ({
  serviceTimings,
  sortByVersion,
  currentVersion = null, // only required if `sortByVersion` = false
  equivalencyDelta = null
}) {
  return serviceTimings.sort((a, b) => {
    // If health check failed, send to back of timings
    if (!a.response) return 1
    if (!b.response) return -1

    const aVersion = a.response.data.data.version
    const bVersion = b.response.data.data.version

    if (sortByVersion) {
      // Always sort by version desc
      if (semver.gt(aVersion, bVersion)) return -1
      if (semver.lt(aVersion, bVersion)) return 1
    } else {
      // Only sort by version if behind current on-chain version
      if (semver.gt(currentVersion, aVersion) && semver.gt(currentVersion, bVersion)) {
        if (semver.gt(aVersion, bVersion)) return -1
        if (semver.lt(aVersion, bVersion)) return 1
      } else if (semver.gt(currentVersion, aVersion)) {
        return 1
      } else if (semver.gt(currentVersion, bVersion)) {
        return -1
      }
    }

    // If same version and transcode queue load, do a tie breaker on the response time
    // If the requests are near eachother (delta < equivalencyDelta), pick randomly
    const delta = a.millis - b.millis
    if (equivalencyDelta !== null && delta < equivalencyDelta) {
      return 1 - 2 * Math.random() // [-1, 1]
    }
    return delta
  })
}

/**
 * Fetches multiple urls and times each request and returns the results sorted
 * first by version and then by lowest-latency.
 * @param {Array<Object>} requests [{id, url}, {id, url}]
 * @param {Boolean} sortByVersion whether or not to sort by version
 * @param {Boolean} filterNonResponsive whether or not to filter out nonresponsive services
 * @param {string | null} currentVersion current on-chain service version - only required if `sortByVersion` = false
 * @param {number? | null} timeout ms applied to each individual request
 * @param {number? | null} equivalencyDelta
 *  the number of milliseconds at which we consider services to be equally as fast
 *  and pick randomly between them. Default of null implies that the faster service
 *  (even if by 1ms) will be picked always.
 * @returns { Array<{url, response, millis}> }
 */
async function timeRequests ({
  requests,
  sortByVersion,
  currentVersion = null, // only required if `sortByVersion` = false
  filterNonResponsive = false,
  timeout = null,
  equivalencyDelta = null
}) {
  let serviceTimings = await Promise.all(requests.map(async request =>
    timeRequest(request, timeout)
  ))

  if (filterNonResponsive) {
    serviceTimings = serviceTimings.filter(timing => timing.response !== null)
  }

  return sortServiceTimings({
    serviceTimings,
    currentVersion,
    sortByVersion,
    equivalencyDelta
  })
}

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
  let hasFinished = false
  const requests = urls.map(async (url, i) => {
    const source = CancelToken.source()
    sources.push(source)

    // Slightly offset requests by their order, so:
    // 1. We try creator node gateways first
    // 2. We give requests the opportunity to get canceled if other's are very fast
    await Utils.wait(timeBetweenRequests * i)
    if (hasFinished) return
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
            hasFinished = true
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
  if (timeout !== null) {
    requests.push(Utils.wait(timeout))
  }
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
  allRequests,
  sortServiceTimings
}
