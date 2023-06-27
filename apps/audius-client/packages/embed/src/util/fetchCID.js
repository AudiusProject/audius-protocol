import { getCreatorNodeWhitelist } from './getEnv'
import { logError } from './logError'

const axios = require('axios')

const CancelToken = axios.CancelToken

const creatorNodes = getCreatorNodeWhitelist()
const creatorNodeWhitelist = new Set(
  creatorNodes.split(',').map((c) => `${c}/ipfs/`)
)

// Stolen from libs :)

const wait = async (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

/**
 * Given an array of promises, it returns the first resolved promise as soon as it finishes
 * @param {Array<Promise>} promises
 * @return {Promise<T>} A promise that resolves with the first promise that resolves
 */
const promiseFight = async (promises) => {
  return Promise.all(
    promises.map((p) => {
      return p.then(
        (val) => Promise.reject(val),
        (err) => Promise.resolve(err)
      )
    })
  ).then(
    (errors) => Promise.reject(errors),
    (val) => Promise.resolve(val)
  )
}

// Races requests for file content
async function raceRequests(urls, callback) {
  const sources = []
  const requests = urls.map(async (url, i) => {
    const source = CancelToken.source()
    sources.push(source)

    // Slightly offset requests by their order, so:
    // 1. We try public gateways first
    // 2. We give requests the opportunity to get canceled if other's are very fast
    await wait(100 * i)

    return new Promise((resolve, reject) => {
      axios({
        method: 'get',
        url,
        responseType: 'blob',
        cancelToken: source.token
      })
        .then((response) => {
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
  const response = await promiseFight(requests)
  sources.forEach((source) => {
    source.cancel('Fetch already succeeded')
  })
  callback(response.url)
  return response.blob
}

export const fetchCID = async (cid) => {
  const allGateways = creatorNodeWhitelist

  try {
    const image = await _fetchCID(cid, allGateways)
    const url = URL.createObjectURL(image.data)
    return url
  } catch (e) {
    logError(e)
    return ''
  }
}

export const fetchJsonFromCID = async (cid) => {
  const allGateways = creatorNodeWhitelist

  try {
    const image = await _fetchCID(cid, allGateways)
    return JSON.parse(await image.data.text())
  } catch (e) {
    logError(e)
    return null
  }
}

/**
 * Fetches a file from IPFS with a given CID. Public gateways are tried first, then
 * fallback to a specified gateway and then to the default gateway.
 * @param {string} cid IPFS content identifier
 * @param {Set<string>} creatorNodeGateways fallback ipfs gateways from creator nodes
 * @param {?function} callback callback called on each successful/failed fetch with
 *  [String, Bool](gateway, succeeded)
 *  Can be used for tracking metrics on which gateways were used.
 */
const _fetchCID = async (cid, creatorNodeGateways, callback = () => {}) => {
  const gateways = [...creatorNodeGateways]
  const urls = gateways.map((gateway) => `${gateway}${cid}`)

  try {
    return raceRequests(urls, callback)
  } catch (e) {
    throw new Error(`Failed to retrieve ${cid}`)
  }
}

export default fetchCID
