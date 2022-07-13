/**
 * Resolves requestPromise with a timeout, either resolving with
 * the response from the request or with an error
 * @param {Promise} requestPromise
 * @param {number} timeout
 */
export const withTimeout = async (requestPromise, timeout) => {
  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Timeout')), timeout)
  })
  return Promise.race([requestPromise, timeoutPromise])
}

/**
 * Fetches a url and checks whether that url responds without throwing in
 * timeout ms.
 * @param {Object} url url to fetch
 * @param {number} timeout millis
 */
export const testURL = async (url, timeout = 500) => {
  let isHealthy = false
  try {
    const result = await withTimeout(await (await fetch(url)).json(), timeout)
    isHealthy = !result.error
  } catch (e) {
    // no-op
  }
  return { url, isHealthy }
}

/**
 * Filters an array of services down to those that are healthy according
 * to whether pinging a url doesn't time out.
 * @param {Array<Object>} services the array of services to filter
 * @param {function} endpointSelector a field on each service that is the endpoint to test
 * @param {number} timeout millis
 */
export const filterHealthy = async (
  services,
  endpointSelector,
  timeout = 500
) => {
  const healthy = (
    await Promise.all(
      services.map(async (request) => {
        const res = await testURL(endpointSelector(request))
        if (res.isHealthy) return request
        return false
      })
    )
  ).filter(Boolean)
  return healthy
}

/**
 * Fetches a url and times how long it took the request to complete.
 * @param {Object} request {id, url}
 * @returns { request, response, millis }
 */
export const timeRequest = async (request) => {
  // This is non-perfect because of the js-event loop, but it is probably a good
  // enough approximation.
  const startTime = new Date().getTime()
  const response = await (await fetch(request.url)).json()
  const millis = new Date().getTime() - startTime
  return { request, response, millis }
}

/**
 * Fetches multiple urls and times each request and returns the results sorted by
 * lowest-latency.
 * @param {Array<Object>} requests [{id, url}, {id, url}]
 * @returns { Array<{url, response, millis}> }
 */
export const timeRequests = async (requests) => {
  const timings = await Promise.all(
    requests.map(async (request) => timeRequest(request))
  )

  return timings.sort((a, b) => a.millis - b.millis)
}
