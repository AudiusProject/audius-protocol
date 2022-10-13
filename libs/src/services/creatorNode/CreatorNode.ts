import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import FormData from 'form-data'
import retry from 'async-retry'
import { Nullable, TrackMetadata, Utils, uuid } from '../../utils'
import {
  userSchemaType,
  trackSchemaType,
  playlistSchemaType,
  Schemas
} from '../schemaValidator/SchemaValidator'
import type { Web3Manager } from '../web3Manager'
import type { CurrentUser, UserStateManager } from '../../userStateManager'
import type { MonitoringCallbacks } from '../types'

const { wait } = Utils

const MAX_TRACK_TRANSCODE_TIMEOUT = 3600000 // 1 hour
const POLL_STATUS_INTERVAL = 3000 // 3s
const BROWSER_SESSION_REFRESH_TIMEOUT = 604800000 // 1 week

type PlaylistTrackId = { time: number; track: number }

type PlaylistContents = {
  track_ids: PlaylistTrackId[]
}

export type PlaylistMetadata = {
  playlist_contents: PlaylistContents
  playlist_id: number
  playlist_name: string
  playlist_image_sizes_multihash: string
  description: string
  is_album: boolean
  is_private: boolean
}

type ProgressCB = (loaded: number, total: number) => void

type ClockValueRequestConfig = {
  user: CurrentUser
  endpoint: string
  timeout?: number
}

type FileUploadResponse = {
  data: { uuid: string; dirCID: string }
  error: Error
}

export type CreatorNodeConfig = {
  web3Manager: Web3Manager
  // fallback creator node endpoint (to be deprecated)
  creatorNodeEndpoint: string
  isServer: boolean
  // singleton UserStateManager instance
  userStateManager: UserStateManager
  // whether or not to lazy connect (sign in) on load
  lazyConnect: boolean
  schemas: Schemas
  // whether or not to include only specified nodes (default null)
  passList: Set<string> | null
  // whether or not to exclude any nodes (default null)
  blockList: Set<string> | null
  // callbacks to be invoked with metrics from requests sent to a service
  monitoringCallbacks: MonitoringCallbacks
  // whether or not to enforce waiting for replication to 2/3 nodes when writing data
  writeQuorumEnabled: boolean
  fallbackUrl: string
}

// Currently only supports a single logged-in audius user
export class CreatorNode {
  /* Static Utils */

  /**
   * Pulls off the primary creator node from a creator node endpoint string.
   * @param endpoints user.creator_node_endpoint
   */
  static getPrimary(endpoints: string) {
    return endpoints ? endpoints.split(',')[0] : ''
  }

  /**
   * Pulls off the secondary creator nodes from a creator node endpoint string.
   * @param endpoints user.creator_node_endpoint
   */
  static getSecondaries(endpoints: string) {
    return endpoints ? endpoints.split(',').slice(1) : []
  }

  /**
   * Pulls the user's creator nodes out of the list
   * @param endpoints user.creator_node_endpoint
   */
  static getEndpoints(endpoints: string) {
    return endpoints ? endpoints.split(',') : []
  }

  /**
   * Builds the creator_node_endpoint value off of a primary and secondaries list
   * @param primary the primary endpoint
   * @param secondaries a list of secondary endpoints
   */
  static buildEndpoint(primary: string, secondaries: string[]) {
    return [primary, ...secondaries].join()
  }

  /**
   * Pulls off the user's clock value from a creator node endpoint and the user's wallet address.
   * @param endpoint content node endpoint
   * @param wallet user wallet address
   * @param timeout max time alloted for clock request
   * @param params optional query string params
   */
  static async getClockValue(
    endpoint: string,
    wallet: string,
    timeout: number,
    params: Record<string, string> = {}
  ) {
    const baseReq: AxiosRequestConfig = {
      url: `/users/clock_status/${wallet}`,
      method: 'get',
      baseURL: endpoint
    }

    if (Object.keys(params).length > 0) {
      baseReq.params = params
    }

    if (timeout) {
      baseReq.timeout = timeout
    }

    try {
      const { data: body } = await axios(baseReq)
      return body.data.clockValue
    } catch (err) {
      throw new Error(
        `Failed to get clock value for endpoint: ${endpoint} and wallet: ${wallet} with ${err}`
      )
    }
  }

  /**
   * Checks if a download is available from provided creator node endpoints
   * @param endpoints creator node endpoints
   * @param trackId
   */
  static async checkIfDownloadAvailable(endpoints: string, trackId: number) {
    const primary = CreatorNode.getPrimary(endpoints)
    if (primary) {
      const req: AxiosRequestConfig = {
        baseURL: primary,
        url: `/tracks/download_status/${trackId}`,
        method: 'get'
      }
      const { data: body } = await axios(req)
      if (body.data.cid) return body.data.cid
    }
    // Download is not available, clients should display "processing"
    return null
  }

  /* -------------- */

  web3Manager: Nullable<Web3Manager>
  creatorNodeEndpoint: string
  isServer: boolean
  userStateManager: UserStateManager
  lazyConnect: boolean
  schemas: Schemas | undefined
  passList: Set<string> | null
  blockList: Set<string> | null
  monitoringCallbacks: MonitoringCallbacks
  writeQuorumEnabled: boolean
  connected: boolean
  connecting: boolean
  authToken: null
  maxBlockNumber: number

  /**
   * Constructs a service class for a creator node
   */
  constructor(
    web3Manager: Nullable<Web3Manager>,
    creatorNodeEndpoint: string,
    isServer: boolean,
    userStateManager: UserStateManager,
    lazyConnect: boolean,
    schemas: Schemas | undefined,
    passList: Set<string> | null = null,
    blockList: Set<string> | null = null,
    monitoringCallbacks: MonitoringCallbacks = {},
    writeQuorumEnabled = false
  ) {
    this.web3Manager = web3Manager
    // This is just 1 endpoint (primary), unlike the creator_node_endpoint field in user metadata
    this.creatorNodeEndpoint = creatorNodeEndpoint
    this.isServer = isServer
    this.userStateManager = userStateManager
    this.schemas = schemas

    this.lazyConnect = lazyConnect
    this.connected = false
    this.connecting = false // a lock so multiple content node requests in parallel won't each try to auth
    this.authToken = null
    this.maxBlockNumber = 0

    this.passList = passList
    this.blockList = blockList
    this.monitoringCallbacks = monitoringCallbacks
    this.writeQuorumEnabled = writeQuorumEnabled
  }

  async init() {
    if (!this.web3Manager) throw new Error('Failed to initialize CreatorNode')
    if (!this.lazyConnect) {
      await this.connect()
    }
  }

  /** Establishes a connection to a content node endpoint */
  async connect() {
    this.connecting = true
    await this._signupNodeUser(this.web3Manager?.getWalletAddress())
    await this._loginNodeUser()
    this.connected = true
    this.connecting = false
  }

  /** Checks if connected, otherwise establishing a connection */
  async ensureConnected() {
    if (!this.connected && !this.connecting) {
      await this.connect()
    } else if (this.connecting) {
      let interval
      // We were already connecting so wait for connection
      await new Promise<void>((resolve) => {
        interval = setInterval(() => {
          if (this.connected) resolve()
        }, 100)
      })
      clearInterval(interval)
    }
  }

  getEndpoint() {
    return this.creatorNodeEndpoint
  }

  /**
   * Switch from one creatorNodeEndpoint to another including logging out from the old node, updating the endpoint and logging into new node */
  async setEndpoint(creatorNodeEndpoint: string) {
    // If the endpoints are the same, no-op.
    if (this.creatorNodeEndpoint === creatorNodeEndpoint) return

    if (this.connected) {
      try {
        await this._logoutNodeUser()
      } catch (e: any) {
        console.error(e.message)
      }
    }
    this.connected = false
    this.creatorNodeEndpoint = creatorNodeEndpoint
    if (!this.lazyConnect) {
      await this.connect()
    }
  }

  /** Clear all connection state in this class by deleting authToken and setting 'connected' = false */
  clearConnection() {
    this.connected = false
    this.authToken = null
  }

  /**
   * Uploads creator content to a creator node
   * @param metadata the creator metadata
   */
  async uploadCreatorContent(metadata: TrackMetadata, blockNumber = null) {
    // this does the actual validation before sending to the creator node
    // if validation fails, validate() will throw an error
    try {
      this.schemas?.[userSchemaType].validate?.(metadata)

      const requestObj: AxiosRequestConfig = {
        url: '/audius_users/metadata',
        method: 'post',
        data: {
          metadata,
          blockNumber
        }
      }

      const { data: body } = await this._makeRequest(requestObj)
      return body
    } catch (e) {
      console.error('Error validating creator metadata', e)
    }
  }

  /**
   * Creates a creator on the creator node, associating user id with file content
   * @param audiusUserId returned by user creation on-blockchain
   * @param metadataFileUUID unique ID for metadata file
   * @param blockNumber
   */
  async associateCreator(
    audiusUserId: number,
    metadataFileUUID: string,
    blockNumber: number
  ) {
    this.maxBlockNumber = Math.max(this.maxBlockNumber, blockNumber)
    await this._makeRequest({
      url: '/audius_users',
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
   * @param trackFile the audio content
   * @param coverArtFile the image content
   * @param metadata the metadata for the track
   * @param onProgress an optional on progress callback
   */
  async uploadTrackContent(
    trackFile: File,
    coverArtFile: File,
    metadata: TrackMetadata,
    onProgress: ProgressCB = () => {}
  ) {
    let loadedImageBytes = 0
    let loadedTrackBytes = 0
    let totalImageBytes = 0
    let totalTrackBytes = 0
    const onImageProgress: ProgressCB = (loaded, total) => {
      loadedImageBytes = loaded
      if (!totalImageBytes) totalImageBytes += total
      if (totalImageBytes && totalTrackBytes) {
        onProgress(
          loadedImageBytes + loadedTrackBytes,
          totalImageBytes + totalTrackBytes
        )
      }
    }
    const onTrackProgress: ProgressCB = (loaded, total) => {
      loadedTrackBytes = loaded
      if (!totalTrackBytes) totalTrackBytes += total
      if ((!coverArtFile || totalImageBytes) && totalTrackBytes) {
        onProgress(
          loadedImageBytes + loadedTrackBytes,
          totalImageBytes + totalTrackBytes
        )
      }
    }

    const uploadPromises = []
    uploadPromises.push(this.uploadTrackAudio(trackFile, onTrackProgress))
    if (coverArtFile)
      uploadPromises.push(this.uploadImage(coverArtFile, true, onImageProgress))

    const [trackContentResp, coverArtResp] = await Promise.all(uploadPromises)
    metadata.track_segments = trackContentResp.track_segments
    if (metadata.download?.is_downloadable) {
      metadata.download.cid = trackContentResp.transcodedTrackCID
    }

    const sourceFile = trackContentResp.source_file
    if (!sourceFile) {
      throw new Error(
        `Invalid or missing sourceFile in response: ${JSON.stringify(
          trackContentResp
        )}`
      )
    }

    if (coverArtResp) {
      metadata.cover_art_sizes = coverArtResp.dirCID
    }
    // Creates new track entity on creator node, making track's metadata available
    // @returns {Object} {cid: CID of track metadata, id: id of track to be used with associate function}
    const metadataResp = await this.uploadTrackMetadata(metadata, sourceFile)
    return { ...metadataResp, ...trackContentResp }
  }

  /**
   * Uploads track metadata to a creator node
   * The metadata object must include a `track_id` field or a
   * source file must be provided (returned from uploading track content).
   * @param metadata
   * @param sourceFile
   */
  async uploadTrackMetadata(metadata: TrackMetadata, sourceFile?: string) {
    // this does the actual validation before sending to the creator node
    // if validation fails, validate() will throw an error
    try {
      this.schemas?.[trackSchemaType].validate?.(metadata)
    } catch (e) {
      console.error('Error validating track metadata', e)
    }

    const { data: body } = await this._makeRequest(
      {
        url: '/tracks/metadata',
        method: 'post',
        data: {
          metadata,
          sourceFile
        }
      },
      true
    )
    return body
  }

  /**
   * Uploads playlist metadata to a creator node
   * source file must be provided (returned from uploading track content).
   * @param metadata
   */
  async uploadPlaylistMetadata(metadata: PlaylistMetadata) {
    // Validate object before sending
    try {
      this.schemas[playlistSchemaType].validate?.(metadata)
    } catch (e) {
      console.error('Error validating playlist metadata', e)
    }

    const { data: body } = await this._makeRequest(
      {
        url: '/playlists/metadata',
        method: 'post',
        data: {
          metadata
        }
      },
      true
    )
    return body
  }

  /**
   * Associate an uploaded playlist metadata file with a blockchainId
   * @param blockchainId - Valid ID assigned to playlist
   * @param metadataFileUUID unique ID for metadata playlist
   * @param blockNumber
   */
  async associatePlaylistMetadata(
    blockchainId: number,
    metadataFileUUID: string,
    blockNumber: number
  ) {
    const { data: body } = await this._makeRequest(
      {
        url: '/playlists',
        method: 'post',
        data: {
          blockchainId,
          metadataFileUUID,
          blockNumber
        }
      },
      true
    )
    return body
  }

  /**
   * Creates a track on the content node, associating track id with file content
   * @param audiusTrackId returned by track creation on-blockchain
   * @param metadataFileUUID unique ID for metadata file
   * @param blockNumber
   * @param transcodedTrackUUID the CID for the transcoded master if this is a first-time upload
   */
  async associateTrack(
    audiusTrackId: number,
    metadataFileUUID: string,
    blockNumber: number,
    transcodedTrackUUID?: string
  ) {
    this.maxBlockNumber = Math.max(this.maxBlockNumber, blockNumber)
    await this._makeRequest({
      url: '/tracks',
      method: 'post',
      data: {
        blockchainTrackId: audiusTrackId,
        metadataFileUUID,
        blockNumber: this.maxBlockNumber,
        transcodedTrackUUID
      }
    })
  }

  /**
   * Uploads an image to the connected content node
   * @param file image to upload
   * @param onProgress called with loaded bytes and total bytes
   * @param timeoutMs timeout in ms axios request to upload file to CN will wait
   * @return response body
   */
  async uploadImage(
    file: File,
    square = true,
    onProgress?: ProgressCB,
    timeoutMs: number | null = null
  ) {
    const { data: body } = await this._uploadFile(
      file,
      '/image_upload',
      onProgress,
      { square },
      /* retries */ undefined,
      timeoutMs
    )
    return body
  }

  /**
   * @param file track to upload
   * @param onProgress called with loaded bytes and total bytes
   * @return response body
   */
  async uploadTrackAudio(file: File, onProgress: ProgressCB) {
    return await this.handleAsyncTrackUpload(file, onProgress)
  }

  async handleAsyncTrackUpload(file: File, onProgress: ProgressCB) {
    const {
      data: { uuid }
    } = await this._uploadFile(file, '/track_content_async', onProgress)
    return await this.pollProcessingStatus(uuid)
  }

  async pollProcessingStatus(uuid: string) {
    const route = this.creatorNodeEndpoint + '/async_processing_status'
    const start = Date.now()
    while (Date.now() - start < MAX_TRACK_TRANSCODE_TIMEOUT) {
      try {
        const { status, resp } = await this.getTrackContentProcessingStatus(
          uuid
        )
        // Should have a body structure of:
        //   { transcodedTrackCID, transcodedTrackUUID, track_segments, source_file }
        if (status && status === 'DONE') return resp
        if (status && status === 'FAILED') {
          await this._handleErrorHelper(
            new Error(
              `Track content async upload failed: uuid=${uuid}, error=${resp}`
            ),
            route,
            uuid
          )
        }
      } catch (e) {
        // Catch errors here and swallow them. Errors don't signify that the track
        // upload has failed, just that we were unable to establish a connection to the node.
        // This allows polling to retry
        console.error(`Failed to poll for processing status, ${e}`)
      }

      await wait(POLL_STATUS_INTERVAL)
    }

    // TODO: update MAX_TRACK_TRANSCODE_TIMEOUT if generalizing this method
    await this._handleErrorHelper(
      new Error(
        `Track content async upload took over ${MAX_TRACK_TRANSCODE_TIMEOUT}ms. uuid=${uuid}`
      ),
      route,
      uuid
    )
  }

  /**
   * Gets the task progress given the task type and uuid associated with the task
   * @param uuid the uuid of the track transcoding task
   * @returns the status, and the success or failed response if the task is complete
   */
  async getTrackContentProcessingStatus(uuid: string) {
    const { data: body } = await this._makeRequest({
      url: '/async_processing_status',
      params: {
        uuid
      },
      method: 'get'
    })

    return body
  }

  /**
   * Given a particular endpoint to a creator node, check whether
   * this user has a sync in progress on that node.
   * @param endpoint
   * @param timeout ms
   */
  async getSyncStatus(endpoint: string, timeout: number | null = null) {
    const user = this.userStateManager.getCurrentUser()
    if (user) {
      const req: AxiosRequestConfig = {
        baseURL: endpoint,
        url: `/sync_status/${user.wallet}`,
        method: 'get'
      }
      if (timeout) req.timeout = timeout
      const { data: body } = await axios(req)
      const status = body.data
      return {
        status,
        userBlockNumber: user.blocknumber,
        trackBlockNumber: user.track_blocknumber,
        // Whether or not the endpoint is behind in syncing
        isBehind:
          status.latestBlockNumber <
          Math.max(user.blocknumber!, user.track_blocknumber!),
        isConfigured: status.latestBlockNumber !== -1
      }
    }
    throw new Error('No current user')
  }

  /**
   * Syncs a secondary creator node for a given user
   * @param secondary
   * @param primary specific primary to use
   * @param immediate whether or not this is a blocking request and handled right away
   * @param validate whether or not to validate the provided secondary is valid
   */
  async syncSecondary(
    secondary: string,
    primary?: string,
    immediate = false,
    validate = true
  ) {
    const user = this.userStateManager.getCurrentUser()
    if (!user) return

    if (!primary) {
      primary = CreatorNode.getPrimary(user.creator_node_endpoint)
    }
    const secondaries = new Set(
      CreatorNode.getSecondaries(user.creator_node_endpoint)
    )
    if (primary && secondary && (!validate || secondaries.has(secondary))) {
      const req: AxiosRequestConfig = {
        baseURL: secondary,
        url: '/sync',
        method: 'post',
        data: {
          wallet: [user.wallet],
          creator_node_endpoint: primary,
          immediate
        }
      }
      return await axios(req)
    }
    return undefined
  }

  /* ------- INTERNAL FUNCTIONS ------- */

  /**
   * Signs up a creator node user with a wallet address
   * @param walletAddress
   */
  async _signupNodeUser(walletAddress: string) {
    await this._makeRequest(
      {
        url: '/users',
        method: 'post',
        data: { walletAddress }
      },
      false
    )
  }

  /**
   * Logs user into cnode, if not already logged in.
   * Requests a challenge from cnode, sends signed challenge response to cn.
   * If successful, receive and set authToken locally.
   */
  async _loginNodeUser() {
    if (this.authToken) {
      return
    }

    const walletPublicKey = this.web3Manager?.getWalletAddress()
    let clientChallengeKey
    let url: string | undefined

    try {
      const challengeResp = await this._makeRequest(
        {
          url: '/users/login/challenge',
          method: 'get',
          params: {
            walletPublicKey
          }
        },
        false
      )

      clientChallengeKey = challengeResp.data.challenge
      url = '/users/login/challenge'
    } catch (e) {
      const requestUrl = this.creatorNodeEndpoint + '/users/login/challenge'
      await this._handleErrorHelper(e as Error, requestUrl)
    }

    const signature = await this.web3Manager?.sign(clientChallengeKey)

    if (url) {
      const resp = await this._makeRequest(
        {
          url,
          method: 'post',
          data: {
            data: clientChallengeKey,
            signature
          }
        },
        false
      )
      this.authToken = resp.data.sessionToken
    }

    setTimeout(() => {
      this.clearConnection()
    }, BROWSER_SESSION_REFRESH_TIMEOUT)
  }

  /** Calls logout on the content node. Needs an authToken for this since logout is an authenticated endpoint */
  async _logoutNodeUser() {
    if (!this.authToken) {
      return
    }
    await this._makeRequest(
      {
        url: '/users/logout',
        method: 'post'
      },
      false
    )
    this.authToken = null
  }

  /**
   * Gets and returns the clock values across the replica set for the wallet in userStateManager.
   * @returns Array of objects with the structure:
   *
   * {
   *  type: 'primary' or 'secondary',
   *  endpoint: <Content Node endpoint>,
   *  clockValue: clock value (should be an integer) or null
   * }
   *
   * 'clockValue' may be null if the request to fetch the clock value fails
   */
  async getClockValuesFromReplicaSet() {
    const user = this.userStateManager.getCurrentUser()
    if (!user || !user.creator_node_endpoint) {
      console.error('No user or Content Node endpoint found')
      return
    }

    const replicaSet = CreatorNode.getEndpoints(user.creator_node_endpoint)
    const clockValueResponses = await Promise.all(
      replicaSet.map(
        async (endpoint) => await this._clockValueRequest({ user, endpoint })
      )
    )

    return clockValueResponses
  }

  /**
   * Wrapper around getClockValue() to return either a proper or null clock value
   * @param {Object} param
   * @param {Object} param.user user metadata object from userStateManager
   * @param {string} param.endpoint the Content Node endpoint to check the clock value for
   * @param {number?} [param.timeout=1000] the max time allotted for a clock request; defaulted to 1000ms
   */
  async _clockValueRequest({
    user,
    endpoint,
    timeout = 1000
  }: ClockValueRequestConfig) {
    const primary = CreatorNode.getPrimary(user.creator_node_endpoint)
    const type = primary === endpoint ? 'primary' : 'secondary'

    try {
      const clockValue = await CreatorNode.getClockValue(
        endpoint,
        user.wallet!,
        timeout
      )
      return {
        type,
        endpoint,
        clockValue
      }
    } catch (e) {
      console.error(
        `Error in getting clock status for ${user.wallet} at ${endpoint}: ${e}`
      )
      return {
        type,
        endpoint,
        clockValue: null
      }
    }
  }

  /**
   * Makes an axios request to the connected creator node.
   * @param requiresConnection if set, the currently configured creator node
   * is connected to before the request is made.
   * @return response body
   */
  async _makeRequest(
    axiosRequestObj: AxiosRequestConfig,
    requiresConnection = true
  ) {
    const work = async () => {
      if (requiresConnection) {
        await this.ensureConnected()
      }

      axiosRequestObj.headers = axiosRequestObj.headers || {}

      axiosRequestObj.headers['Enforce-Write-Quorum'] = this.writeQuorumEnabled

      if (this.authToken) {
        axiosRequestObj.headers['X-Session-ID'] = this.authToken
      }

      const user = this.userStateManager.getCurrentUser()
      if (user?.wallet && user.user_id) {
        axiosRequestObj.headers['User-Wallet-Addr'] = user.wallet
        axiosRequestObj.headers['User-Id'] = user.user_id
      }

      const requestId = uuid()
      axiosRequestObj.headers['X-Request-ID'] = requestId

      axiosRequestObj.baseURL = this.creatorNodeEndpoint

      // Axios throws for non-200 responses
      const url = new URL(`${axiosRequestObj.baseURL}${axiosRequestObj.url}`)
      const start = Date.now()
      try {
        const resp = await axios(axiosRequestObj)
        const duration = Date.now() - start

        if (this.monitoringCallbacks.request) {
          try {
            this.monitoringCallbacks.request({
              endpoint: url.origin,
              pathname: url.pathname,
              queryString: url.search,
              signer: resp.data.signer,
              signature: resp.data.signature,
              requestMethod: axiosRequestObj.method,
              status: resp.status,
              responseTimeMillis: duration
            })
          } catch (e) {
            // Swallow errors -- this method should not throw generally
            console.error(e)
          }
        }
        // Axios `data` field gets the response body
        return resp.data
      } catch (e) {
        const error = e as AxiosError
        const resp = error.response
        const duration = Date.now() - start

        if (this.monitoringCallbacks.request) {
          try {
            this.monitoringCallbacks.request({
              endpoint: url.origin,
              pathname: url.pathname,
              queryString: url.search,
              requestMethod: axiosRequestObj.method,
              status: resp?.status,
              responseTimeMillis: duration
            })
          } catch (e) {
            // Swallow errors -- this method should not throw generally
            console.error(e)
          }
        }

        // if the content node returns an invalid auth token error, clear connection and reconnect
        if (resp?.data?.error?.includes?.('Invalid authentication token')) {
          this.clearConnection()
          try {
            await this.ensureConnected()
          } catch (e) {
            console.error((e as Error).message)
          }
        }

        await this._handleErrorHelper(error, axiosRequestObj.url, requestId)
      }
    }
    return await retry(
      async () => {
        return await work()
      },
      {
        // Retry function 3x
        // 1st retry delay = 500ms, 2nd = 1500ms, 3rd...nth retry = 4000 ms (capped)
        minTimeout: 500,
        maxTimeout: 4000,
        factor: 3,
        retries: 3,
        onRetry: (err) => {
          if (err) {
            console.log('makeRequest retry error: ', err)
          }
        }
      }
    )
  }

  /**
   * Create headers and formData for file upload
   * @param file the file to upload
   * @returns headers and formData in an object
   */
  createFormDataAndUploadHeaders(
    file: File,
    extraFormDataOptions: Record<string, unknown> = {}
  ) {
    // form data is from browser, not imported npm module
    const formData = new FormData()
    formData.append('file', file)
    Object.keys(extraFormDataOptions).forEach((key) => {
      formData.append(key, `${extraFormDataOptions[key]}`)
    })

    let headers: Record<string, string | null> = {}
    if (this.isServer) {
      headers = formData.getHeaders()
    }
    headers['X-Session-ID'] = this.authToken

    const requestId = uuid()
    headers['X-Request-ID'] = requestId

    const user = this.userStateManager.getCurrentUser()
    if (user?.wallet && user.user_id) {
      // TODO change to X-User-Wallet-Address and X-User-Id per convention
      headers['User-Wallet-Addr'] = user.wallet
      headers['User-Id'] = user.user_id as unknown as string
    }

    return { headers, formData }
  }

  /**
   * Uploads a file to the connected creator node.
   * @param file
   * @param route route to handle upload (image_upload, track_upload, etc.)
   * @param onProgress called with loaded bytes and total bytes
   * @param extraFormDataOptions extra FormData fields passed to the upload
   * @param retries max number of attempts made for axios request to upload file to CN before erroring
   * @param timeoutMs timeout in ms axios request to upload file to CN will wait
   */
  async _uploadFile(
    file: File,
    route: string,
    onProgress: ProgressCB = () => {},
    extraFormDataOptions: Record<string, unknown> = {},
    retries = 2,
    timeoutMs: number | null = null
    // @ts-expect-error re-throwing at the end of this function breaks exisiting impl
  ): Promise<FileUploadResponse> {
    await this.ensureConnected()

    const { headers, formData } = this.createFormDataAndUploadHeaders(
      file,
      extraFormDataOptions
    )
    const requestId = headers['X-Request-ID']

    let total: number
    const url = this.creatorNodeEndpoint + route

    try {
      // Hack alert!
      //
      // Axios auto-detects browser vs node based on
      // the existance of XMLHttpRequest at the global namespace, which
      // is imported by a web3 module, causing Axios to incorrectly
      // presume we're in a browser env when we're in a node env.
      // For uploads to work in a node env,
      // axios needs to correctly detect we're in node and use the `http` module
      // rather than XMLHttpRequest. We force that here.
      // https://github.com/axios/axios/issues/1180

      const isBrowser = typeof window !== 'undefined'

      console.debug(`Uploading file to ${url}`)

      const reqParams: AxiosRequestConfig = {
        headers: headers,
        adapter: isBrowser
          ? require('axios/lib/adapters/xhr')
          : require('axios/lib/adapters/http'),
        // Add a 10% inherit processing time for the file upload.
        onUploadProgress: (progressEvent: {
          total: number
          loaded: number
        }) => {
          if (!total) total = progressEvent.total
          console.info(`Upload in progress: ${progressEvent.loaded} / ${total}`)
          onProgress(progressEvent.loaded, total)
        },
        // Set content length headers (only applicable in server/node environments).
        // See: https://github.com/axios/axios/issues/1362
        maxContentLength: Infinity,
        // @ts-expect-error TODO: including even though it's not an axios config. should double check
        maxBodyLength: Infinity
      }

      if (timeoutMs) {
        reqParams.timeout = timeoutMs
      }

      const resp = await axios.post<FileUploadResponse>(
        url,
        formData,
        reqParams
      )

      if (resp.data?.error) {
        throw new Error(JSON.stringify(resp.data.error))
      }

      // @ts-expect-error total should be set in `onUploadProgress` which runs before `onProgress` is called
      onProgress(total, total)
      return resp.data
    } catch (e: any) {
      const error = e as AxiosError
      if (!error.response && retries > 0) {
        console.warn(
          `Network Error in request ${requestId} with ${retries} retries... retrying`
        )
        console.warn(error)
        // eslint-disable-next-line @typescript-eslint/return-await -- possible issue with return await
        return this._uploadFile(
          file,
          route,
          onProgress,
          extraFormDataOptions,
          retries - 1
        )
      } else if (
        error.response?.data?.error?.includes?.('Invalid authentication token')
      ) {
        // if the content node returns an invalid auth token error, clear connection and reconnect
        this.clearConnection()
        try {
          await this.ensureConnected()
        } catch (e: any) {
          console.error(e.message)
        }
      }

      await this._handleErrorHelper(error, url, requestId)
    }
  }

  async _handleErrorHelper(
    e: Error | AxiosError,
    requestUrl?: string,
    requestId: string | null = null
  ) {
    if ('response' in e && e.response?.data?.error) {
      const cnRequestID = e.response.headers['cn-request-id']
      // cnRequestID will be the same as requestId if it receives the X-Request-ID header
      const errMessage = `Server returned error: [${e.response.status.toString()}] [${
        e.response.data.error
      }] for request: [${cnRequestID}, ${requestId}]`

      console.error(errMessage)
      throw new Error(errMessage)
    } else if (!('response' in e)) {
      // delete headers, may contain tokens
      if ('config' in e && e.config.headers) delete e.config.headers

      const errorMsg = `Network error while making request ${requestId} to ${requestUrl}:\nStringified Error:${JSON.stringify(
        e
      )}\n`
      console.error(errorMsg, e)

      try {
        const newRequestId = uuid()
        const endpoint = `${this.creatorNodeEndpoint}/health_check`
        const res = await axios(endpoint, {
          headers: {
            'X-Request-ID': newRequestId
          }
        })
        console.log(
          `Successful health check for ${requestId}: ${JSON.stringify(
            res.data
          )}`
        )
      } catch (e) {
        console.error(
          `Failed health check immediately after network error ${requestId}`,
          e
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-base-to-string -- TODO
      throw new Error(`${errorMsg}${e}`)
    } else {
      const errorMsg = `Unknown error while making request ${requestId} to ${requestUrl}:\nStringified Error:${JSON.stringify(
        e
      )}\n`
      console.error(errorMsg, e)
      throw e
    }
  }
}
