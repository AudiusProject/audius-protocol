const { Base, Services } = require('./base')
const axios = require('axios')
const Utils = require('../utils')

const CancelToken = axios.CancelToken

// Public gateways to send requests to, ordered by precidence.
const publicGateways = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/'
]

// Races requests for file content
async function raceRequests (
  urls,
  callback
) {
  const sources = []
  const requests = urls.map(async url => {
    const source = CancelToken.source()
    sources.push(source)

    return axios({
      method: 'get',
      url,
      responseType: 'blob',
      cancelToken: source.token
    })
      .then(response => ({
        blob: response,
        url
      }))
      .catch((thrown) => {
        // no-op.
        // If debugging `axios.isCancel(thrown)`
        // can be used to check if the throw was from a cancel.
      })
  })
  const response = await Utils.promiseFight(requests)
  sources.forEach(source => {
    source.cancel('Fetch already succeeded')
  })
  callback(response.url)
  return response.blob
}

class File extends Base {
  /**
   * Fetches a file from IPFS with a given CID. Public gateways are tried first, then
   * fallback to a specified gateway and then to the default gateway.
   * @param {string} cid IPFS content identifier
   * @param {Array<string>} creatorNodeGateways fallback ipfs gateways from creator nodes
   * @param {?function} callback callback called on each successful/failed fetch with
   *  [String, Bool](gateway, succeeded)
   *  Can be used for tracking metrics on which gateways were used.
   */
  async fetchCID (cid, creatorNodeGateways, callback = null) {
    const gateways = publicGateways
      .concat(creatorNodeGateways)
    const urls = gateways.map(gateway => `${gateway}${cid}`)

    try {
      return raceRequests(urls, callback)
    } catch (e) {
      throw new Error(`Failed to retrieve ${cid}`)
    }
  }

  /**
   * Uploads an image to the connected creator node.
   * @param {File} file
   */
  async uploadImage (file, square) {
    this.REQUIRES(Services.CREATOR_NODE)
    this.FILE_IS_VALID(file)
    const resp = await this.creatorNode.uploadImage(file, square)
    return resp
  }
}

module.exports = File
