const Utils = require('../../utils')

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

  /* -------------- */

  constructor (web3Manager, creatorNodeEndpoint, isServer, userStateManager, lazyConnect) {
    this.web3Manager = web3Manager
    this.creatorNodeEndpoint = creatorNodeEndpoint
    this.isServer = isServer
    this.userStateManager = userStateManager

    this.lazyConnect = lazyConnect
    this.connected = false

    this.authToken = null
  }

  async init () {
    if (!this.web3Manager) throw new Error('Failed to initialize CreatorNode')
    if (!this.lazyConnect) {
      await this.connect()
    }
  }

  /** Establishes a connection to a creator node endpoint */
  async connect () {
    await this._signupNodeUser(this.web3Manager.getWalletAddress())
    await this._loginNodeUser()
    this.connected = true
  }

  /** Checks if connected, otherwise establishing a connection */
  async ensureConnected () {
    if (!this.connected) {
      await this.connect()
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
   * Creates a new Audius creator entity on the creator node, making the user's metadata
   * available on IPFS.
   * @param {Object} metadata for new user
   * @returns {Object}
   *  {
   *    cid: cid of user metadata on IPFS,
   *    id: id of user to be used with associate function
   *  }
   */
  async addCreator (metadata) {
    // for now, we only support one user per creator node / libs instance
    const user = this.userStateManager.getCurrentUser()
    if (user && user.is_creator) {
      throw new Error('User already created for creator node / libs instance')
    }

    return this._makeRequest({
      url: '/audius_users',
      method: 'post',
      data: metadata
    })
  }

  /**
   * Updates a creator at the provided userId.
   * @param {number} userId
   * @param {Object} metadata
   */
  async updateCreator (userId, metadata) {
    return this._makeRequest({
      url: `/audius_users/${userId}`,
      method: 'put',
      data: metadata
    })
  }

  async uploadCreatorMetadata (metadata) {
    return this._makeRequest({
      url: `/metadata`,
      method: 'post',
      data: metadata
    }, true, false)
  }

  async uploadImage (file, square = true) {
    const resp = await this._uploadFile(file, '/image_upload', { 'square': square })
    return resp
  }

  async uploadTrackContent (file) {
    return this._uploadFile(file, '/track_content')
  }

  /**
   * Associates the two user IDs, completing the user creation process.
   * @param {int} nodeUserId parameter returned at creation time by createUser function
   * @param {int} audiusUserId returned by user creation on-blockchain
   * @param {bool} syncSecondaries whether or not to sync the secondary creator nodes
   */
  async associateAudiusUser (nodeUserId, audiusUserId, syncSecondaries = true) {
    await this._makeRequest({
      url: `/audius_users/associate/${nodeUserId}`,
      method: 'post',
      data: { userId: audiusUserId }
    }, true, syncSecondaries)
  }

  async uploadTrack (file, metadata) {
    if (!this.userStateManager.getCurrentUserId()) {
      throw new Error('No users loaded for this wallet')
    }
    metadata.creator_id = this.userStateManager.getCurrentUserId()

    const trackContentResp = await this.uploadTrackContent(file)
    metadata.track_segments = trackContentResp.track_segments

    // Creates new track entity on creator node, making track's metadata available on IPFS
    // @returns {Object} {cid: cid of track metadata on IPFS, id: id of track to be used with associate function}
    return this._makeRequest({
      url: '/tracks',
      method: 'post',
      data: metadata
    }, true, false)
  }

  /**
   * Associates nodeTrackID (returned by createTrack) with audiusTrackId from blockchain.
   * Completes the track creation process.
   * @param {nodeTrackId} id returned at creation time by createTrack function
   * @param {audiusTrackId} id returned by track creation on-blockchain
   */
  async associateTrack (nodeTrackId, audiusTrackId) {
    await this._makeRequest({
      url: `/tracks/associate/${nodeTrackId}`,
      method: 'post',
      data: { blockchainTrackId: audiusTrackId }
    })
  }

  async updateTrack (trackId, metadata) {
    return this._makeRequest({
      url: `/tracks/${trackId}`,
      method: 'put',
      data: metadata
    })
  }

  async uploadTrackMetadata (metadata) {
    return this._makeRequest({
      url: '/metadata',
      method: 'post',
      data: metadata
    })
  }

  async listTracks () {
    return this._makeRequest({
      url: '/tracks',
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
      return axios(req)
    }
    throw new Error(`No current user`)
  }

  /**
   * Forces a secondary to sync from the current creator node.
   * @param {string} secondary url
   */
  async forceSync (secondary) {
    if (!secondary || !Utils.isFQDN(secondary)) {
      throw new Error(`Invalid secondary ${secondary}`)
    }
    const user = this.userStateManager.getCurrentUser()
    const req = {
      baseURL: secondary,
      url: '/sync',
      method: 'post',
      data: {
        wallet: [user.wallet],
        creator_node_endpoint: this.getEndpoint()
      }
    }
    return axios(req)
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
    }, false, false)
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
    }, false, false)
    this.authToken = resp.sessionToken
  }

  async _logoutNodeUser () {
    if (!this.authToken) {
      return
    }
    await this._makeRequest({
      url: '/users/logout',
      method: 'post'
    }, false, false)
    this.authToken = null
  }

  /**
   * Makes an axios request to the connected creator node.
   * @param {Object} axiosRequestObj
   * @param {bool} requiresConnection if set, the currently configured creator node
   * is connected to before the request is made.
   * @param {bool} syncSecondaries if set, causes secondary creator nodes to sync the
   * changes made in the primary instance.
   */
  async _makeRequest (axiosRequestObj, requiresConnection = true, syncSecondaries = true) {
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
      // Sync the secondaries, but don't block on it
      // if (syncSecondaries) this._syncSecondaries()
      return resp.data
    } else {
      throw new Error(`Server returned error: ${resp.status.toString()} ${resp.data['error']}`)
    }
  }

  /**
   * Syncs the current user's (according to the user state manager) secondary creator nodes.
   */
  async _syncSecondaries () {
    const user = this.userStateManager.getCurrentUser()
    if (user && user.creator_node_endpoint) {
      const [primary, ...secondaries] = user.creator_node_endpoint.split(',')
      if (primary) {
        await Promise.all(secondaries.map(secondary => {
          if (!secondary || !Utils.isFQDN(secondary)) return
          const req = {
            baseURL: secondary,
            url: '/sync',
            method: 'post',
            data: {
              wallet: [user.wallet],
              creator_node_endpoint: primary
            }
          }
          return axios(req)
        }))
      }
    }
  }

  /**
   * Uploads a file to the connected creator node.
   * @param {File} file
   * @param {string} route route to handle upload (image_upload, track_upload, etc.)
   * @param {Object<string, any>} extraFormDataOptions extra FormData fields passed to the upload
   */
  async _uploadFile (file, route, extraFormDataOptions = {}) {
    await this.ensureConnected()

    // form data is from browser, not imported npm module
    let formData = new FormData()
    formData.append('file', file)
    Object.keys(extraFormDataOptions).forEach(key => {
      formData.append(key, extraFormDataOptions[key])
    })

    // TODO: figure out why this._makeRequest does not work with formData
    let headers = {}
    if (this.isServer) {
      headers = formData.getHeaders()
    }
    headers['X-Session-ID'] = this.authToken

    const resp = await axios.post(
      this.creatorNodeEndpoint + route,
      formData,
      { headers: headers }
    )
    return resp.data
  }
}

module.exports = CreatorNode
