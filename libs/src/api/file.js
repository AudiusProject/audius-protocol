const { Base, Services } = require('./base')
const axios = require('axios')
const Utils = require('../utils')

const DEFAULT_TIMEOUT = 250

// Public gateways to send requests to, ordered by precidence.
const publicGateways = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/'
]

async function batchRace (
  urls,
  batchSize,
  batchTimeout = DEFAULT_TIMEOUT,
  callback = () => {},
  batch = 0
) {
  if (batch >= urls.length) throw new Error('Failed to get result')

  const requests = urls.slice(batch, batch + batchSize).map(async url =>
    axios({
      method: 'get',
      url,
      responseType: 'blob',
      timeout
    }).then(response => ({
      blob: response,
      url
    }))
  )

  let response
  try {
    response = await Utils.promiseFight(requests)
  } catch (e) {
    // Continue to next batch
    return batchRace(urls, batchSize, batchTimeout, callback, batch + batchSize)
  }
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
    this.REQUIRES(Services.IPFS_GATEWAY)

    const gateways = publicGateways
      .concat(creatorNodeGateways)
      .concat([this.ipfsGateway])
    const urls = gateways.map(gateway => `${gateway}${cid}`)
    
    try {
      return batchRace(urls, 3, DEFAULT_TIMEOUT, callback)
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
