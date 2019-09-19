const axios = require('axios')
const FormData = require('form-data')

// Currently only supports a single logged-in audius user
class CreatorNode {
  /* Static Utils */

  /**
   * Pulls off the primary creator node from a creator node endpoint string.
   * @param {string} endpoints user.creator_node_endpoint
   */
  static getPrimary (endpoints) { return endpoints ? endpoints.split(',')[0] : '' }

  /**
   * Pulls off the secondary creator nodes from a creator node endpoint string.
   * @param {string} endpoints user.creator_node_endpoint
   */
  static getSecondaries (endpoints) { return endpoints ? endpoints.split(',').slice(1) : [] }

  /* -------------- */

  constructor (web3Manager, creatorNodeEndpoint, isServer, userStateManager, lazyConnect) {
    this.web3Manager = web3Manager
    this.creatorNodeEndpoint = creatorNodeEndpoint
    this.isServer = isServer
    this.userStateManager = userStateManager

    this.lazyConnect = lazyConnect
    this.connected = false
    this.connecting = false
    this.authToken = null
    this.maxBlockNumber = 0
  }

  async init () {
    if (!this.web3Manager) throw new Error('Failed to initialize CreatorNode')
    if (!this.lazyConnect) {
      await this.connect()
    }
  }

  /** Establishes a connection to a creator node endpoint */
  async connect () {
    this.connecting = true
    await this._signupNodeUser(this.web3Manager.getWalletAddress())
    await this._loginNodeUser()
    this.connected = true
    this.connecting = false
  }

  /** Checks if connected, otherwise establishing a connection */
  async ensureConnected () {
    if (!this.connected && !this.connecting) {
      await this.connect()
    } else if (this.connecting) {
      let interval
      // We were already connecting so wait for connection
      await new Promise((resolve, reject) => {
        interval = setInterval(() => {
          if (this.connected) resolve()
        }, 100)
      })
      clearInterval(interval)
    }
  }

  getEndpoint () {
    return this.creatorNodeEndpoint
  }

  async setEndpoint (creatorNodeEndpoint) {
    // If the endpoints are the same, no-op.
    if (this.creatorNodeEndpoint === creatorNodeEndpoint) return

    if (this.connected) {
      try {
        await this._logoutNodeUser()
      } catch (e) {
        console.error(e.message)
      }
    }
    this.connected = false
    this.creatorNodeEndpoint = creatorNodeEndpoint
    if (!this.lazyConnect) {
      await this.connect()
    }
  }

  /**
   * Uploads creator content to a creator node
   * @param {object} metadata the creator metadata
   */
  async uploadCreatorContent (metadata) {
    return this._makeRequest({
      url: '/audius_users/metadata',
      method: 'post',
      data: {
        metadata
      }
    })
  }

  /**
   * Creates a creator on the creator node, associating user id with file content
   * @param {number} audiusUserId returned by user creation on-blockchain
   * @param {string} metadataFileUUID unique ID for metadata file
   * @param {number} blockNumber
   */
  async associateCreator (audiusUserId, metadataFileUUID, blockNumber) {
    this.maxBlockNumber = Math.max(this.maxBlockNumber, blockNumber)
    await this._makeRequest({
      url: `/audius_users`,
      method: 'post',
      data: {
        blockchainUserId: audiusUserId,
        metadataFileUUID,
        blockNumber: this.maxBlockNumber
      }
    })
  }

  /**
   * Uploads a track (including audio and image content) to a creator node
   * @param {File} trackFile the audio content
   * @param {File} coverArtFile the image content
   * @param {object} metadata the metadata for the track
   * @param {function?} onProgress an optional on progerss callback
   */
  async uploadTrackContent (trackFile, coverArtFile, metadata, onProgress = () => {}) {
    let loadedImageBytes = 0
    let loadedTrackBytes = 0
    let totalImageBytes = 0
    let totalTrackBytes = 0
    const onImageProgress = (loaded, total) => {
      loadedImageBytes = loaded
      if (!totalImageBytes) totalImageBytes += total
      if (totalImageBytes && totalTrackBytes) {
        onProgress(loadedImageBytes + loadedTrackBytes, totalImageBytes + totalTrackBytes)
      }
    }
    const onTrackProgress = (loaded, total) => {
      loadedTrackBytes = loaded
      if (!totalTrackBytes) totalTrackBytes += total
      if ((!coverArtFile || totalImageBytes) && totalTrackBytes) {
        onProgress(loadedImageBytes + loadedTrackBytes, totalImageBytes + totalTrackBytes)
      }
    }

    let uploadPromises = []
    uploadPromises.push(this.uploadTrackAudio(trackFile, onTrackProgress))
    if (coverArtFile) uploadPromises.push(this.uploadImage(coverArtFile, true, onImageProgress))

    const [trackContentResp, coverArtResp] = await Promise.all(uploadPromises)
    metadata.track_segments = trackContentResp.track_segments
    if (coverArtResp) metadata.cover_art_sizes = coverArtResp.dirCID
    // Creates new track entity on creator node, making track's metadata available on IPFS
    // @returns {Object} {cid: cid of track metadata on IPFS, id: id of track to be used with associate function}
    return this.uploadTrackMetadata(metadata)
  }

  /**
   * Uploads track metadata to a creator node
   * @param {object} metadata
   */
  async uploadTrackMetadata (metadata) {
    return this._makeRequest({
      url: '/tracks/metadata',
      method: 'post',
      data: {
        metadata
      }
    }, true)
  }

  /**
   * Creates a track on the creator node, associating track id with file content
   * @param {number} audiusTrackId returned by track creation on-blockchain
   * @param {string} metadataFileUUID unique ID for metadata file
   * @param {number} blockNumber
   */
  async associateTrack (audiusTrackId, metadataFileUUID, blockNumber) {
    this.maxBlockNumber = Math.max(this.maxBlockNumber, blockNumber)
    await this._makeRequest({
      url: `/tracks`,
      method: 'post',
      data: {
        blockchainTrackId: audiusTrackId,
        metadataFileUUID,
        blockNumber: this.maxBlockNumber
      }
    })
  }

  async listTracks () {
    return this._makeRequest({
      url: '/tracks',
      method: 'get'
    })
  }

  async uploadImage (file, square = true, onProgress) {
    return this._uploadFile(file, '/image_upload', onProgress, { 'square': square })
  }

  async uploadTrackAudio (file, onProgress) {
    return this._uploadFile(file, '/track_content', onProgress)
  }

  async getHealthy () {
    return this._makeRequest({
      url: '/health_check',
      method: 'get'
    })
  }

  /**
   * Given a particular endpoint to a creator node, check whether
   * this user has a sync in progress on that node.
   * @param {string} endpoint
   */
  async getSyncStatus (endpoint) {
    const user = this.userStateManager.getCurrentUser()
    if (user) {
      const req = {
        baseURL: endpoint,
        url: `/sync_status/${user.wallet}`,
        method: 'get'
      }
      const status = await axios(req)
      return {
        status: status.data,
        userBlockNumber: user.blocknumber,
        trackBlockNumber: user.track_blocknumber,
        // Whether or not the endpoint is behind in syncing
        isBehind: status.data.latestBlockNumber < Math.max(user.blocknumber, user.track_blocknumber),
        isConfigured: status.data.latestBlockNumber !== -1
      }
    }
    throw new Error(`No current user`)
  }

  /**
   * Syncs a secondary creator node for a given user
   * @param {string} secondary
   * @param {string} primary specific primary to use
   * @param {boolean} immediate whether or not this is a blocking request and handled right away
   * @param {boolean} validate whether or not to validate the provided secondary is valid
   */
  async syncSecondary (
    secondary,
    primary = null,
    immediate = false,
    validate = true
  ) {
    const user = this.userStateManager.getCurrentUser()
    if (!primary) {
      primary = CreatorNode.getPrimary(user.creator_node_endpoint)
    }
    const secondaries = new Set(CreatorNode.getSecondaries(user.creator_node_endpoint))
    if (primary && secondary && (!validate || secondaries.has(secondary))) {
      const req = {
        baseURL: secondary,
        url: '/sync',
        method: 'post',
        data: {
          wallet: [user.wallet],
          creator_node_endpoint: primary,
          immediate
        }
      }
      return axios(req)
    }
  }

  /* ------- INTERNAL FUNCTIONS ------- */

  /**
   * Signs up a creator node user with a wallet address
   * @param {string} walletAddress
   */
  async _signupNodeUser (walletAddress) {
    await this._makeRequest({
      url: '/users',
      method: 'post',
      data: { walletAddress }
    }, false)
  }

  /** Logs in a creator node user. */
  async _loginNodeUser () {
    if (this.authToken) {
      return
    }

    const unixTs = Math.round((new Date()).getTime() / 1000) // current unix timestamp (sec)
    const data = `Click sign to authenticate with creator node: ${unixTs}`
    const signature = await this.web3Manager.sign(data)

    // submit signed timestamp to server, receive permanent auth token in return
    const resp = await this._makeRequest({
      url: '/users/login',
      method: 'post',
      data: {
        data: data,
        signature: signature
      }
    }, false)
    this.authToken = resp.sessionToken
  }

  async _logoutNodeUser () {
    if (!this.authToken) {
      return
    }
    await this._makeRequest({
      url: '/users/logout',
      method: 'post'
    }, false)
    this.authToken = null
  }

  /**
   * Makes an axios request to the connected creator node.
   * @param {Object} axiosRequestObj
   * @param {bool} requiresConnection if set, the currently configured creator node
   * is connected to before the request is made.
   */
  async _makeRequest (axiosRequestObj, requiresConnection = true) {
    if (requiresConnection) {
      await this.ensureConnected()
    }

    if (this.authToken) {
      axiosRequestObj.headers = axiosRequestObj.headers || {}
      axiosRequestObj.headers['X-Session-ID'] = this.authToken
    }

    axiosRequestObj.baseURL = this.creatorNodeEndpoint

    const resp = await axios(axiosRequestObj)
    if (resp.status === 200) {
      return resp.data
    } else {
      throw new Error(`Server returned error: ${resp.status.toString()} ${resp.data['error']}`)
    }
  }

  /**
   * Uploads a file to the connected creator node.
   * @param {File} file
   * @param {string} route route to handle upload (image_upload, track_upload, etc.)
   * @param {?function} onProgress called with loaded bytes and total bytes
   * @param {Object<string, any>} extraFormDataOptions extra FormData fields passed to the upload
   */
  async _uploadFile (file, route, onProgress = (loaded, total) => {}, extraFormDataOptions = {}) {
    await this.ensureConnected()

    // form data is from browser, not imported npm module
    let formData = new FormData()
    formData.append('file', file)
    Object.keys(extraFormDataOptions).forEach(key => {
      formData.append(key, extraFormDataOptions[key])
    })

    let headers = {}
    if (this.isServer) {
      headers = formData.getHeaders()
    }
    headers['X-Session-ID'] = this.authToken

    let total
    const resp = await axios.post(
      this.creatorNodeEndpoint + route,
      formData,
      {
        headers: headers,
        // Add a 10% inherit processing time for the file upload.
        onUploadProgress: (progressEvent) => {
          if (!total) total = progressEvent.total
          onProgress(progressEvent.loaded, total)
        }
      }
    )
    onProgress(total, total)
    return resp.data
  }
}

module.exports = CreatorNode
