const { Base, Services } = require('./base')
const axios = require('axios')

const DEFAULT_TIMEOUT = 250

// Public gateways to send requests to, ordered by precidence.
const publicGateways = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/'
]

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

    let gateways = publicGateways
      .concat(creatorNodeGateways)
      .concat([this.ipfsGateway])

    for (let i = 0; i < gateways.length; ++i) {
      const gateway = gateways[i]
      if (gateway) {
        const url = `${gateway}${cid}`
        // No timeout if this is the last request.
        const timeout = i === gateways.length - 1 ? 0 : DEFAULT_TIMEOUT
        try {
          const response = await axios({
            method: 'get',
            url: url,
            responseType: 'blob',
            timeout: timeout
          })
          // We serve json error messages when the content on IPFS is not resolved
          // properly. This is a stop-gap but axios will only let us retrieve the
          // response as either blob or json and we need to pass the blob through for
          // image/file processing.
          if (response.data.type === 'application/json') {
            throw new Error() // continue on to the next gateway
          }
          if (callback) callback(gateway, true)
          return response
        } catch (e) {
          if (callback) callback(gateway, false)
        }
      }
    }

    throw new Error(`Failed to retrieve ${cid}`)
  }

  /**
   * Uploads an image to the connected creator node.
   * @param {File} file
   */
  async uploadImage (file, square) {
    this.REQUIRES(Services.CREATOR_NODE)
    this.FILE_IS_VALID(file)
    return this.creatorNode.uploadImage(file, square)
  }
}

module.exports = File
