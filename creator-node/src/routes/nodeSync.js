const axios = require('axios')

const models = require('../models')
const { saveFileForMultihash } = require('../fileManager')
const { handleResponse, successResponse, errorResponse } = require('../apiHelpers')
const { getNodeSyncRedisKey } = require('../redis')

const syncs = {}
const DEBOUNCE_TIME = 5000 // 30s = 30,000ms

module.exports = function (app) {
  /**
   * Exports all db data (not files) associated with walletPublicKey[] as JSON.
   * Returns IPFS node ID object, so importing nodes can peer manually for optimized file transfer.
   * @return {
   *  cnodeUsers Map Object containing all db data keyed on cnodeUserUUID
   *  ipfsIDObj Object containing IPFS Node's peer ID
   * }
   */
  app.get('/export', handleResponse(async (req, res) => {
    const walletPublicKeys = req.query.wallet_public_key // array

    const t = await models.sequelize.transaction()

    // Fetch cnodeUser for each walletPublicKey.
    const cnodeUsers = await models.CNodeUser.findAll({ where: { walletPublicKey: walletPublicKeys }, transaction: t })
    const cnodeUserUUIDs = cnodeUsers.map((cnodeUser) => cnodeUser.cnodeUserUUID)

    // Fetch all data for cnodeUserUUIDs: audiusUsers, tracks, files.
    const [audiusUsers, tracks, files] = await Promise.all([
      models.AudiusUser.findAll({ where: { cnodeUserUUID: cnodeUserUUIDs }, transaction: t }),
      models.Track.findAll({ where: { cnodeUserUUID: cnodeUserUUIDs }, transaction: t }),
      models.File.findAll({ where: { cnodeUserUUID: cnodeUserUUIDs }, transaction: t })
    ])
    await t.commit()

    /** Bundle all data into cnodeUser objects to maximize import speed. */

    const cnodeUsersDict = {}
    cnodeUsers.forEach(cnodeUser => {
      // Convert sequelize object to plain js object to allow adding additional fields.
      const cnodeUserDictObj = cnodeUser.toJSON()

      // Add cnodeUserUUID data fields.
      cnodeUserDictObj['audiusUsers'] = []
      cnodeUserDictObj['tracks'] = []
      cnodeUserDictObj['files'] = []

      cnodeUsersDict[cnodeUser.cnodeUserUUID] = cnodeUserDictObj
    })

    audiusUsers.forEach(audiusUser => {
      const audiusUserDictObj = audiusUser.toJSON()
      cnodeUsersDict[audiusUserDictObj['cnodeUserUUID']]['audiusUsers'].push(audiusUserDictObj)
    })
    tracks.forEach(track => {
      let trackDictObj = track.toJSON()
      cnodeUsersDict[trackDictObj['cnodeUserUUID']]['tracks'].push(trackDictObj)
    })
    files.forEach(file => {
      let fileDictObj = file.toJSON()
      cnodeUsersDict[fileDictObj['cnodeUserUUID']]['files'].push(fileDictObj)
    })

    // Expose ipfs node's peer ID.
    const ipfs = req.app.get('ipfsAPI')
    let ipfsIDObj = await ipfs.id()

    return successResponse({ cnodeUsers: cnodeUsersDict, ipfsIDObj: ipfsIDObj })
  }))

  /**
   * Given walletPublicKeys array and target creatorNodeEndpoint, will request export
   * of all user data, update DB state accordingly, fetch all files and make them available.
   */
  app.post('/sync', handleResponse(async (req, res) => {
    const walletPublicKeys = req.body.wallet // array
    const creatorNodeEndpoint = req.body.creator_node_endpoint // string
    const immediate = (req.body.immediate === true || req.body.immediate === 'true')

    if (!immediate) {
      // Debounce nodeysnc op
      for (let wallet of walletPublicKeys) {
        if (wallet in syncs) {
          clearTimeout(syncs[wallet])
          req.logger.info('clear timeout for', wallet, 'time', Date.now())
        }
        syncs[wallet] = setTimeout(
          async () => _nodesync(req, [wallet], creatorNodeEndpoint),
          DEBOUNCE_TIME
        )
        req.logger.info('set timeout for', wallet, 'time', Date.now())
      }
    } else {
      await _nodesync(req, walletPublicKeys, creatorNodeEndpoint)
    }
    return successResponse()
  }))

  /** Checks if node sync is in progress for wallet. */
  app.get('/sync_status/:walletPublicKey', handleResponse(async (req, res) => {
    const walletPublicKey = req.params.walletPublicKey
    const redisLock = req.app.get('redisClient').lock
    const redisKey = getNodeSyncRedisKey(walletPublicKey)
    const lockHeld = await redisLock.getLock(redisKey)
    if (lockHeld) {
      return errorResponse(423, `Cannot change state of wallet ${walletPublicKey}. Node sync currently in progress.`)
    }

    // Get & return latestBlockNumber for wallet
    const cnodeUser = await models.CNodeUser.findOne({ where: { walletPublicKey } })
    const latestBlockNumber = cnodeUser ? cnodeUser.latestBlockNumber : -1

    return successResponse({ walletPublicKey, latestBlockNumber })
  }))
}

async function _nodesync (req, walletPublicKeys, creatorNodeEndpoint) {
  const start = Date.now()
  req.logger.info('begin nodesync for ', walletPublicKeys, 'time', start)

  // ensure access to each wallet, then acquire it for sync.
  const redisLock = req.app.get('redisClient').lock
  // TODO - redisKey will be inaccurate when /sync is called with more than 1 walletPublicKey
  let redisKey
  for (let wallet of walletPublicKeys) {
    redisKey = getNodeSyncRedisKey(wallet)
    let lockHeld = await redisLock.getLock(redisKey)
    if (lockHeld) {
      throw new Error(`Cannot change state of wallet ${wallet}. Node sync currently in progress.`)
    }
    await redisLock.setLock(redisKey)
  }

  try {
    // Fetch data export from creatorNodeEndpoint for given walletPublicKeys.
    const resp = await axios({
      method: 'get',
      baseURL: creatorNodeEndpoint,
      url: '/export',
      params: { wallet_public_key: walletPublicKeys },
      responseType: 'json'
    })
    if (resp.status !== 200) throw new Error(resp.data['error'])
    if (!resp.data.hasOwnProperty('cnodeUsers')) {
      throw new Error(`Malformed response from ${creatorNodeEndpoint}. "cnodeUsers" property not found on response object.`)
    }

    // Attempt to connect directly to target CNode's IPFS node.
    if (resp.data.hasOwnProperty('ipfsIDObj') && resp.data.ipfsIDObj.hasOwnProperty('addresses')) {
      await _initBootstrapAndRefreshPeers(req, resp.data.ipfsIDObj.addresses, redisKey)
    } else {
      throw new Error(`Malformed response from ${creatorNodeEndpoint}. Malformatted or missing "ipfsIDObj" property.`)
    }
    req.logger.info(redisKey, 'IPFS Nodes connected + data export received')

    // For each CNodeUser, replace local DB state with retrieved data + fetch + save missing files.
    for (const fetchedCNodeUser of Object.values(resp.data.cnodeUsers)) {
      // Since different nodes may assign different cnodeUserUUIDs to a given walletPublicKey,
      // retrieve local cnodeUserUUID from fetched walletPublicKey and delete all associated data.
      if (!fetchedCNodeUser.hasOwnProperty('walletPublicKey')) {
        throw new Error(`Malformed response received from ${creatorNodeEndpoint}. "walletPublicKey" property not found on CNodeUser in response object`)
      }
      const fetchedWalletPublicKey = fetchedCNodeUser.walletPublicKey
      if (!walletPublicKeys.includes(fetchedWalletPublicKey)) {
        throw new Error(`Malformed response from ${creatorNodeEndpoint}. Returned data for walletPublicKey that was not requested.`)
      }
      const fetchedCnodeUserUUID = fetchedCNodeUser.cnodeUserUUID

      const t = await models.sequelize.transaction()

      const cnodeUser = await models.CNodeUser.findOne({
        where: { walletPublicKey: fetchedWalletPublicKey },
        transaction: t
      })

      // Ensure imported data has higher blocknumber than already stored.
      const latestBlockNumber = cnodeUser.latestBlockNumber
      const fetchedLatestBlockNumber = fetchedCNodeUser.latestBlockNumber
      if ((fetchedLatestBlockNumber == -1 && latestBlockNumber != -1) ||
        (fetchedLatestBlockNumber != -1 && fetchedLatestBlockNumber <= latestBlockNumber)
      ) {
        throw new Error(`Imported data is outdated, will not sync.`)
      }

      // Delete any previously stored data for cnodeUser in reverse table dependency order (cannot be parallelized).
      if (cnodeUser) {
        const cnodeUserUUID = cnodeUser.cnodeUserUUID
        req.logger.info(redisKey, `beginning delete ops for cnodeUserUUID ${cnodeUserUUID}`)

        const numAudiusUsersDeleted = await models.AudiusUser.destroy({
          where: { cnodeUserUUID: cnodeUserUUID },
          transaction: t
        })
        req.logger.info(redisKey, `numAudiusUsersDeleted ${numAudiusUsersDeleted}`)
        // TrackFiles must be deleted before associated Tracks can be deleted.
        const numTrackFilesDeleted = await models.File.destroy({
          where: {
            cnodeUserUUID: cnodeUserUUID,
            trackUUID: { [models.Sequelize.Op.ne]: null } // Op.ne = notequal
          },
          transaction: t
        })
        req.logger.info(redisKey, `numTrackFilesDeleted ${numTrackFilesDeleted}`)
        const numTracksDeleted = await models.Track.destroy({
          where: { cnodeUserUUID: cnodeUserUUID },
          transaction: t
        })
        req.logger.info(redisKey, `numTracksDeleted ${numTracksDeleted}`)
        // Delete all remaining files (image / metadata files).
        const numNonTrackFilesDeleted = await models.File.destroy({
          where: { cnodeUserUUID: cnodeUserUUID },
          transaction: t
        })
        req.logger.info(redisKey, `numNonTrackFilesDeleted ${numNonTrackFilesDeleted}`)
      }

      /* Populate all new data for fetched cnodeUser. */

      req.logger.info(redisKey, `beginning add ops for cnodeUserUUID ${fetchedCnodeUserUUID}`)

      // Upsert cnodeUser row.
      await models.CNodeUser.upsert({
        cnodeUserUUID: fetchedCnodeUserUUID,
        walletPublicKey: fetchedWalletPublicKey,
        latestBlockNumber: fetchedLatestBlockNumber,
        lastLogin: fetchedCNodeUser.lastLogin
      }, { transaction: t })
      req.logger.info(redisKey, `upserted nodeUser for cnodeUserUUID ${fetchedCnodeUserUUID}`)

      // Make list of all track Files to add after track creation.

      // Files with trackUUIDs cannot be created until tracks have been created,
      // but tracks cannot be created until metadata and cover art files have been created.
      const trackFiles = fetchedCNodeUser.files.filter(file => file.trackUUID != null)
      const nonTrackFiles = fetchedCNodeUser.files.filter(file => file.trackUUID == null)
      await models.File.bulkCreate(nonTrackFiles.map(file => ({
        fileUUID: file.fileUUID,
        trackUUID: null,
        cnodeUserUUID: fetchedCnodeUserUUID,
        multihash: file.multihash,
        sourceFile: file.sourceFile,
        storagePath: file.storagePath,
        type: file.type
      })), { transaction: t })
      req.logger.info(redisKey, 'created all non-track files')

      await models.Track.bulkCreate(fetchedCNodeUser.tracks.map(track => ({
        trackUUID: track.trackUUID,
        blockchainId: track.blockchainId,
        cnodeUserUUID: fetchedCnodeUserUUID,
        metadataJSON: track.metadataJSON,
        metadataFileUUID: track.metadataFileUUID,
        coverArtFileUUID: track.coverArtFileUUID
      })), { transaction: t })
      req.logger.info(redisKey, 'created all tracks')

      // Save all track files to disk
      await Promise.all(trackFiles.map(trackFile => saveFileForMultihash(req, trackFile.multihash, trackFile.storagePath)))
      req.logger.info('save all track files to disk/ipfs')

      // Save all track files to db
      await models.File.bulkCreate(trackFiles.map(trackFile => ({
        fileUUID: trackFile.fileUUID,
        trackUUID: trackFile.trackUUID,
        cnodeUserUUID: fetchedCnodeUserUUID,
        multihash: trackFile.multihash,
        sourceFile: trackFile.sourceFile,
        storagePath: trackFile.storagePath,
        type: trackFile.type
      })), { transaction: t })
      req.logger.info('saved all track files to db')

      await models.AudiusUser.bulkCreate(fetchedCNodeUser.audiusUsers.map(audiusUser => ({
        audiusUserUUID: audiusUser.audiusUserUUID,
        cnodeUserUUID: fetchedCnodeUserUUID,
        blockchainId: audiusUser.blockchainId,
        metadataJSON: audiusUser.metadataJSON,
        metadataFileUUID: audiusUser.metadataFileUUID,
        coverArtFileUUID: audiusUser.coverArtFileUUID,
        profilePicFileUUID: audiusUser.profilePicFileUUID
      })), { transaction: t })
      req.logger.info('saved all audiususer data to db')

      try {
        await t.commit()
        req.logger.info(redisKey, `Transaction successfully committed for cnodeUserUUID ${fetchedCnodeUserUUID}`)
        redisKey = getNodeSyncRedisKey(fetchedWalletPublicKey)
        await redisLock.removeLock(redisKey)
      } catch (e) {
        req.logger.error(redisKey, `Transaction failed for cnodeUserUUID ${fetchedCnodeUserUUID}`, e)
        await t.rollback()
        redisKey = getNodeSyncRedisKey(fetchedWalletPublicKey)
        await redisLock.removeLock(redisKey)
        throw new Error(e)
      }
    }
  } catch (e) {
    req.logger.error('Sync Error', e)
  } finally {
    // Release all redis locks
    for (let wallet of walletPublicKeys) {
      let redisKey = getNodeSyncRedisKey(wallet)
      await redisLock.removeLock(redisKey)
      delete (syncs[wallet])
    }
    req.logger.info(`DURATION SYNC ${Date.now() - start}`)
  }
}

/** Given IPFS node peer addresses, add to bootstrap peers list and manually connect. */
async function _initBootstrapAndRefreshPeers (req, targetIPFSPeerAddresses, redisKey) {
  req.logger.info(redisKey, 'Initializing Bootstrap Peers:')
  const ipfs = req.app.get('ipfsAPI')

  // Get own IPFS node's peer addresses
  const ipfsID = await ipfs.id()
  if (!ipfsID.hasOwnProperty('addresses')) {
    throw new Error('failed to retrieve ipfs node addresses')
  }
  const ipfsPeerAddresses = ipfsID.addresses

  // For each targetPeerAddress, add to trusted peer list and open connection.
  for (let targetPeerAddress of targetIPFSPeerAddresses) {
    if (targetPeerAddress.includes('ip6') || targetPeerAddress.includes('127.0.0.1')) continue
    if (ipfsPeerAddresses.includes(targetPeerAddress)) {
      req.logger.info(redisKey, 'ipfs addresses are same - do not connect')
      continue
    }

    // Add to list of bootstrap peers.
    let results = await ipfs.bootstrap.add(targetPeerAddress)
    req.logger.info(redisKey, 'ipfs bootstrap add results:', results)

    // Manually connect to peer.
    results = await ipfs.swarm.connect(targetPeerAddress)
    req.logger.info(redisKey, 'peer connection results:', results.Strings[0])
  }
}
