import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  CancelTokenSource
} from 'axios'
import semver from 'semver'

import { Utils } from './utils'
import { promiseFight } from './promiseFight'
import type { Nullable } from './types'

export type ServiceName = string
export interface ServiceWithEndpoint {
  endpoint: string
  spID?: string
  owner: string
}
export type Service = ServiceName | ServiceWithEndpoint

interface Request {
  id?: string
  url: string
}

interface TimingConfig {
  timeout?: number
}

export interface Timing {
  request: Request
  response: AxiosResponse | null
  millis: number | null
}

/**
 * Fetches a url and times how long it took the request to complete.
 */
async function timeRequest(
  request: Request,
  timeout?: number | null
): Promise<Timing> {
  // This is non-perfect because of the js event loop, but enough
  // of a proximation. Don't use for mission-critical timing.
  const startTime = new Date().getTime()
  const config: TimingConfig = {}
  if (timeout !== null && timeout !== undefined) {
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

interface SortServiceTimingsConfig {
  serviceTimings: Timing[]
  sortByVersion: boolean
  currentVersion?: string | null
  /*
   *  the number of milliseconds at which we consider services to be equally as fast
   *  and pick randomly between them. Default of null implies that the faster service
   *  (even if by 1ms) will be picked always.
   */
  equivalencyDelta?: number | null
}

/**
 * Custom sort for `serviceTimings`, the response from `timeRequest()` function above
 */
function sortServiceTimings({
  serviceTimings,
  sortByVersion,
  currentVersion = null, // only required if `sortByVersion` = false
  equivalencyDelta = null
}: SortServiceTimingsConfig) {
  return serviceTimings.sort((a, b) => {
    // If health check failed, send to back of timings
    if (a.response == null) return 1
    if (b.response == null) return -1

    const aVersion = a.response.data.data.version
    const bVersion = b.response.data.data.version

    if (sortByVersion) {
      // Always sort by version desc
      if (semver.gt(aVersion, bVersion)) return -1
      if (semver.lt(aVersion, bVersion)) return 1
    } else if (!sortByVersion && currentVersion) {
      // Only sort by version if behind current on-chain version
      if (
        semver.gt(currentVersion, aVersion) &&
        semver.gt(currentVersion, bVersion)
      ) {
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

    const delta = (a.millis ?? 0) - (b.millis ?? 0)
    if (equivalencyDelta !== null && delta < equivalencyDelta) {
      return 1 - 2 * Math.random() // [-1, 1]
    }
    return delta
  })
}

interface TimeRequestsConfig {
  requests: Request[]
  sortByVersion?: boolean
  filterNonResponsive?: boolean
  // current on-chain service version - only required if `sortByVersion` = false
  currentVersion?: string | null
  // ms applied to each individual request
  timeout?: number | null
  /*
   *  the number of milliseconds at which we consider services to be equally as fast
   *  and pick randomly between them. Default of null implies that the faster service
   *  (even if by 1ms) will be picked always.
   */
  equivalencyDelta?: number | null
}

/**
 * Fetches multiple urls and times each request and returns the results sorted
 * first by version and then by lowest-latency.
 */
async function timeRequests({
  requests,
  sortByVersion = false,
  currentVersion = null, // only required if `sortByVersion` = false
  filterNonResponsive = false,
  timeout = null,
  equivalencyDelta = null
}: TimeRequestsConfig) {
  let serviceTimings = await Promise.all(
    requests.map(async (request) => await timeRequest(request, timeout))
  )

  if (filterNonResponsive) {
    serviceTimings = serviceTimings.filter((timing) => timing.response !== null)
  }

  return sortServiceTimings({
    serviceTimings,
    currentVersion,
    sortByVersion,
    equivalencyDelta
  })
}

type RequestResponses =
  | { blob: AxiosResponse; url: string }
  | AxiosResponse
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- this is a return type
  | void

/**
 * Races multiple requests
 * @param urls
 * @param callback invoked with the first successful url
 * @param axiosConfig extra axios config for each request
 * @param timeout timeout for any requests to be considered bad
 * @param timeBetweenRequests time between requests being dispatched to free up client network interface
 */
async function raceRequests(
  urls: string[],
  callback: (url: string) => void,
  axiosConfig: AxiosRequestConfig,
  timeout: Nullable<number> = 3000,
  timeBetweenRequests = 100,
  validationCheck = (_: AxiosResponse) => true
) {
  const CancelToken = axios.CancelToken

  const sources: CancelTokenSource[] = []
  let hasFinished = false
  const requests = urls.map(async (url, i) => {
    const source = CancelToken.source()
    sources.push(source)

    // Slightly offset requests by their order, so:
    // 1. We try creator node gateways first
    // 2. We give requests the opportunity to get canceled if other's are very fast
    await Utils.wait(timeBetweenRequests * i)
    if (hasFinished) return
    return await new Promise<RequestResponses>((resolve, reject) => {
      axios({
        method: 'get',
        url,
        cancelToken: source.token,
        ...axiosConfig
      })
        .then((response) => {
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
  let errored: AxiosResponse[]
  try {
    const { val, errored: e } = await promiseFight<
      RequestResponses,
      AxiosResponse
    >(requests, true)
    response = val
    errored = e
  } catch (e: any) {
    response = null
    errored = e
  }
  sources.forEach((source) => {
    source.cancel('Fetch already succeeded')
  })

  if (response && 'url' in response && 'blob' in response) {
    callback(response.url)
    return { response: response.blob, errored }
  }

  return { response: null, errored }
}

interface AllRequestsConfig {
  /*
   * map of actual URL to hit (e.g. https://resource/endpoint)
   * and identifying value (e.g. https://resource)
   */
  urlMap: Record<string, Service>
  /*
   * timeout for any request to be considered bad
   */
  timeout: number
  /* a check invoked for each response.
   *  If invalid, the response is filtered out.
   *  (response: any) => boolean
   */
  validationCheck: (_: AxiosResponse) => boolean
}

/**
 * Gets the response for many requests with a timeout to each
 */
async function allRequests({
  urlMap,
  timeout,
  validationCheck
}: AllRequestsConfig) {
  const urls = Object.keys(urlMap)
  const requests = urls.map(async (url) => {
    return await new Promise<Service | null>((resolve) => {
      axios({
        method: 'get',
        timeout,
        url
      })
        .then((response) => {
          const isValid = validationCheck(response)
          if (isValid) {
            if (typeof urlMap[url] === 'string') {
              resolve(urlMap[url] as Service)
            } else {
              const serviceWithResponse: Service = {
                ...(urlMap[url] as ServiceWithEndpoint),
                ...response.data.data
              }
              resolve(serviceWithResponse)
            }
          } else {
            resolve(null)
          }
        })
        .catch(() => {
          resolve(null)
        })
    })
  })
  const responses = (await Promise.all(requests)).filter(Boolean)
  return responses
}

export {
  timeRequest,
  timeRequests,
  raceRequests,
  allRequests,
  sortServiceTimings
}
