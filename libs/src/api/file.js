let urlJoin = require('proper-url-join')
if (urlJoin && urlJoin.default) urlJoin = urlJoin.default

const axios = require('axios')
const { Base, Services } = require('./base')
const { raceRequests } = require('../utils/network')
const retry = require('async-retry')

// Public gateways to send requests to, ordered by precidence.
const publicGateways = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/'
]

/**
 * Downloads a file using an element in the DOM
 * @param {*} url
 * @param {*} filename
 */
const downloadURL = (url, filename) => {
  if (document) {
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.download = filename
    link.click()
    return
  }
  throw new Error('No body document found')
}

class File extends Base {
  constructor (user, ...args) {
    super(...args)

    this.User = user
  }

  /**
   * Fetches a file from IPFS with a given CID. Public gateways are tried first, then
   * fallback to a specified gateway and then to the default gateway.
   * @param {string} cid IPFS content identifier
   * @param {Array<string>} creatorNodeGateways fallback ipfs gateways from creator nodes
   * @param {?function} callback callback called on each successful/failed fetch with
   *  [String, Bool](gateway, succeeded)
   *  Can be used for tracking metrics on which gateways were used.
   */
  async fetchCID (
    cid,
    creatorNodeGateways,
    callback = null,
    responseType = 'blob',
    trackId = null
  ) {
    const urls = []

    creatorNodeGateways.forEach(gateway => {
      let gatewayWithCid = urlJoin(gateway, cid)
      if (trackId) gatewayWithCid = urlJoin(gatewayWithCid, { query: { trackId } })
      urls.push(gatewayWithCid)
    })

    publicGateways.forEach(gateway => {
      urls.push(urlJoin(gateway, cid))
    })

    const gateways = creatorNodeGateways.concat(publicGateways)

    return retry(async () => {
      try {
        const { response } = await raceRequests(urls, callback, {
          method: 'get',
          responseType
        }, /* timeout */ null)
        if (!response) throw new Error(`Could not fetch ${cid}`)
        return response
      } catch (e) {
        // TODO: Remove this fallback logic when no more users/tracks/playlists
        // contain "legacy" image formats (no dir cid)
        if (cid.includes('/')) { // dirCID -- an image
          console.debug(`Attempted to fetch image ${cid} via legacy method`)
          // Try legacy image format
          // Lop off anything like /480x480.jpg in the CID
          const legacyUrls = gateways.map(gateway => urlJoin(gateway, cid.split('/')[0]))
          try {
            const { response } = await raceRequests(legacyUrls, callback, {
              method: 'get',
              responseType
            }, /* timeout */ null)
            if (!response) throw new Error(`Could not fetch ${cid} via legacy method`)
            return response
          } catch (e) {
            throw new Error(`Failed to retrieve ${cid} by legacy method`)
          }
        }

        // Throw so we can retry
        throw new Error(`Failed to retrieve ${cid}`)
      }
    }, {
      minTimeout: 500,
      maxTimeout: 4000,
      factor: 3,
      retries: 5,
      onRetry: (err, i) => {
        // eslint-disable-next-line no-console
        console.log(`FetchCID attempt ${i} error: ${err}`)
      }
    })
  }

  /**
   * Fetches a file from IPFS with a given CID. Follows the same pattern
   * as fetchCID, but resolves with a download of the file rather than
   * returning the response content.
   * @param {string} cid IPFS content identifier
   * @param {Array<string>} creatorNodeGateways fallback ipfs gateways from creator nodes
   * @param {string?} filename optional filename for the download
   * @param {boolean?} usePublicGateways
   */
  async downloadCID (cid, creatorNodeGateways, filename, usePublicGateways = false) {
    const gateways = usePublicGateways ? publicGateways.concat(creatorNodeGateways) : creatorNodeGateways
    const urls = gateways.map(gateway => urlJoin(gateway, cid, { query: { filename } }))

    try {
      // Races requests and fires the download callback for the first endpoint to
      // respond with a valid response to a `head` request.
      const { response } = await raceRequests(urls, (url) => downloadURL(url, filename), {
        method: 'head'
      }, /* timeout */ 10000)
      return response
    } catch (e) {
      throw new Error(`Failed to retrieve ${cid}`)
    }
  }

  /**
   * Checks if a cid exists in an IPFS node. Public gateways are tried first, then
   * fallback to a specified gateway and then to the default gateway.
   * @param {string} cid IPFS content identifier
   * @param {Array<string>} creatorNodeGateways fallback ipfs gateways from creator nodes
   * Eg. creatorNodeGateways = ["https://creatornode.audius.co/ipfs/", "https://creatornode2.audius.co/ipfs/"]
   */
  async checkIfCidAvailable (cid, creatorNodeGateways) {
    const gateways = creatorNodeGateways.concat(publicGateways)
    const exists = {}

    await Promise.all(gateways.map(async (gateway) => {
      try {
        const { status } = await axios({ url: urlJoin(gateway, cid), method: 'head' })
        exists[gateway] = status === 200
      } catch (err) {
        exists[gateway] = false
      }
    }))

    return exists
  }

  /**
   * Uploads an image to the connected creator node.
   * @param {File} file
   */
  async uploadImage (file, square, timeoutMs = null) {
    this.REQUIRES(Services.CREATOR_NODE)
    this.FILE_IS_VALID(file)

    // Assign a creator_node_endpoint to the user if necessary
    await this.User.assignReplicaSetIfNecessary()

    const resp = await this.creatorNode.uploadImage(file, square, /* onProgress */ undefined, timeoutMs)
    return resp
  }
}

module.exports = File
