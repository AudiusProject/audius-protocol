const axios = require('axios')

const models = require('../models')
const { saveFileForMultihash } = require('../fileManager')
const { handleResponse, successResponse, errorResponse, errorResponseServerError } = require('../apiHelpers')
const config = require('../config')
const middlewares = require('../middlewares')
const { getIPFSPeerId } = require('../utils')
const RehydrateIpfsQueue = require('../RehydrateIpfsQueue')

// Dictionary tracking currently queued up syncs with debounce
const syncQueue = {}
const TrackSaveConcurrencyLimit = 10
const NonTrackFileSaveConcurrencyLimit = 10
const RehydrateIPFSConcurrencyLimit = 10

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
    const redisClient = req.app.get('redisClient')
    const walletPublicKeys = req.query.wallet_public_key // array

    const t = await models.sequelize.transaction()
    try {
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
      const TTL = config.get('redisRehydrateCacheTTL')

      const cnodeUserUUIDsOfFilesToRehydrateArray = cnodeUsers.map(async cnodeUser => {
        // Convert sequelize object to plain js object to allow adding additional fields.
        const cnodeUserDictObj = cnodeUser.toJSON()

        // Add cnodeUserUUID data fields.
        cnodeUserDictObj['audiusUsers'] = []
        cnodeUserDictObj['tracks'] = []
        cnodeUserDictObj['files'] = []

        cnodeUsersDict[cnodeUser.cnodeUserUUID] = cnodeUserDictObj

        // Use redis cache to check if user with associated wallet has had its files recently rehydrated
        // If so, do not rehydrate
        const entry = await redisClient.get(`recently_rehydrated_wallet_${cnodeUser.walletPublicKey}`)
        if (!entry) {
          // expires in 60s
          await redisClient.set(`recently_rehydrated_wallet_${cnodeUser.walletPublicKey}`, cnodeUser.cnodeUserUUID, 'EX', TTL)
          return Promise.resolve(cnodeUser.cnodeUserUUID)
        }
      })

      const cnodeUserUUIDsOfFilesToRehydrateSet = new Set(await Promise.all(cnodeUserUUIDsOfFilesToRehydrateArray))

      audiusUsers.forEach(audiusUser => {
        const audiusUserDictObj = audiusUser.toJSON()
        cnodeUsersDict[audiusUserDictObj['cnodeUserUUID']]['audiusUsers'].push(audiusUserDictObj)
      })
      tracks.forEach(track => {
        let trackDictObj = track.toJSON()
        cnodeUsersDict[trackDictObj['cnodeUserUUID']]['tracks'].push(trackDictObj)
      })

      const filesToRehydrate = []
      files.forEach(file => {
        let fileDictObj = file.toJSON()
        cnodeUsersDict[fileDictObj['cnodeUserUUID']]['files'].push(fileDictObj)

        if (cnodeUserUUIDsOfFilesToRehydrateSet.has(fileDictObj.cnodeUserUUID)) {
          filesToRehydrate.push(fileDictObj)
        }
      })

      // Expose ipfs node's peer ID.
      const ipfs = req.app.get('ipfsAPI')
      let ipfsIDObj = await getIPFSPeerId(ipfs, config)

      for (let i = 0; i < filesToRehydrate.length; i += RehydrateIPFSConcurrencyLimit) {
        const exportFilesSlice = filesToRehydrate.slice(i, i + RehydrateIPFSConcurrencyLimit)
        req.logger.info(`Export rehydrateIpfs processing files ${i} to ${i + RehydrateIPFSConcurrencyLimit}`)
        // Ensure all relevant files are available through IPFS at export time
        await Promise.all(exportFilesSlice.map(async (file) => {
          try {
            if (
              (file.type === 'track' || file.type === 'metadata' || file.type === 'copy320') ||
              // to address legacy single-res image rehydration where images are stored directly under its file CID
              (file.type === 'image' && file.sourceFile === null)
            ) {
              RehydrateIpfsQueue.addRehydrateIpfsFromFsIfNecessaryTask(file.multihash, file.storagePath, { logContext: req.logContext })
            } else if (file.type === 'dir') {
              RehydrateIpfsQueue.addRehydrateIpfsDirFromFsIfNecessaryTask(file.multihash, { logContext: req.logContext })
            }
          } catch (e) {
            req.logger.info(`Export rehydrateIpfs processing files ${i} to ${i + RehydrateIPFSConcurrencyLimit}, ${e}`)
          }
        }))
      }
      return successResponse({ cnodeUsers: cnodeUsersDict, ipfsIDObj: ipfsIDObj })
    } catch (e) {
      await t.rollback()
      return errorResponseServerError(e.message)
    }
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
      req.logger.info('debounce time', config.get('debounceTime'))
      // Debounce nodeysnc op
      for (let wallet of walletPublicKeys) {
        if (wallet in syncQueue) {
          clearTimeout(syncQueue[wallet])
          req.logger.info('clear timeout for', wallet, 'time', Date.now())
        }
        syncQueue[wallet] = setTimeout(
          async () => _nodesync(req, [wallet], creatorNodeEndpoint),
          config.get('debounceTime')
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
    const redisClient = req.app.get('redisClient')
    const lockHeld = await redisClient.lock.getLock(redisClient.getNodeSyncRedisKey(walletPublicKey))
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
  const redisClient = req.app.get('redisClient')
  const redisLock = redisClient.lock
  // TODO - redisKey will be inaccurate when /sync is called with more than 1 walletPublicKey
  let redisKey
  for (let wallet of walletPublicKeys) {
    redisKey = redisClient.getNodeSyncRedisKey(wallet)
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
    // TODO - explain patch
    if (!resp.data) {
      if (resp.request && resp.request.responseText) {
        resp.data = JSON.parse(resp.request.responseText)
      } else throw new Error(`Malformed response from ${creatorNodeEndpoint}.`)
    }
    if (!resp.data.hasOwnProperty('cnodeUsers') || !resp.data.hasOwnProperty('ipfsIDObj') || !resp.data.ipfsIDObj.hasOwnProperty('addresses')) {
      throw new Error(`Malformed response from ${creatorNodeEndpoint}.`)
    }

    // Attempt to connect directly to target CNode's IPFS node.
    await _initBootstrapAndRefreshPeers(req, resp.data.ipfsIDObj.addresses, redisKey)
    req.logger.info(redisKey, 'IPFS Nodes connected + data export received')

    // For each CNodeUser, replace local DB state with retrieved data + fetch + save missing files.
    for (const fetchedCNodeUser of Object.values(resp.data.cnodeUsers)) {
      // Since different nodes may assign different cnodeUserUUIDs to a given walletPublicKey,
      // retrieve local cnodeUserUUID from fetched walletPublicKey and delete all associated data.
      if (!fetchedCNodeUser.hasOwnProperty('walletPublicKey')) {
        throw new Error(`Malformed response received from ${creatorNodeEndpoint}. "walletPublicKey" property not found on CNodeUser in response object`)
      }
      const fetchedWalletPublicKey = fetchedCNodeUser.walletPublicKey
      let userReplicaSet = []
      try {
        const myCnodeEndpoint = await middlewares.getOwnEndpoint(req)
        userReplicaSet = await middlewares.getCreatorNodeEndpoints(req, fetchedWalletPublicKey)

        // push user metadata node to user's replica set if defined
        if (config.get('userMetadataNodeUrl')) userReplicaSet.push(config.get('userMetadataNodeUrl'))

        // filter out current node from user's replica set
        userReplicaSet = userReplicaSet.filter(url => url !== myCnodeEndpoint)

        // Spread + set uniq's the array
        userReplicaSet = [...new Set(userReplicaSet)]
      } catch (e) {
        req.logger.error(`Couldn't get user's replica sets, can't use cnode gateways in saveFileForMultihash`)
      }

      if (!walletPublicKeys.includes(fetchedWalletPublicKey)) {
        throw new Error(`Malformed response from ${creatorNodeEndpoint}. Returned data for walletPublicKey that was not requested.`)
      }
      const fetchedCnodeUserUUID = fetchedCNodeUser.cnodeUserUUID

      const t = await models.sequelize.transaction()

      try {
        const cnodeUser = await models.CNodeUser.findOne({
          where: { walletPublicKey: fetchedWalletPublicKey },
          transaction: t
        })
        const fetchedLatestBlockNumber = fetchedCNodeUser.latestBlockNumber

        // Delete any previously stored data for cnodeUser in reverse table dependency order (cannot be parallelized).
        if (cnodeUser) {
          // Ensure imported data has higher blocknumber than already stored.
          const latestBlockNumber = cnodeUser.latestBlockNumber
          if ((fetchedLatestBlockNumber === -1 && latestBlockNumber !== -1) ||
            (fetchedLatestBlockNumber !== -1 && fetchedLatestBlockNumber <= latestBlockNumber)
          ) {
            throw new Error(`Imported data is outdated, will not sync. Imported latestBlockNumber \
              ${fetchedLatestBlockNumber} Self latestBlockNumber ${latestBlockNumber}`)
          }

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
        const trackFiles = fetchedCNodeUser.files.filter(file => models.File.TrackTypes.includes(file.type))
        const nonTrackFiles = fetchedCNodeUser.files.filter(file => models.File.NonTrackTypes.includes(file.type))

        // Save all track files to disk in batches (to limit concurrent load)
        for (let i = 0; i < trackFiles.length; i += TrackSaveConcurrencyLimit) {
          const trackFilesSlice = trackFiles.slice(i, i + TrackSaveConcurrencyLimit)
          req.logger.info(`TrackFiles saveFileForMultihash - processing trackFiles ${i} to ${i + TrackSaveConcurrencyLimit}...`)
          await Promise.all(trackFilesSlice.map(
            trackFile => saveFileForMultihash(req, trackFile.multihash, trackFile.storagePath, userReplicaSet)
          ))
        }

        req.logger.info('Saved all track files to disk.')

        // Save all non-track files to disk in batches (to limit concurrent load)
        for (let i = 0; i < nonTrackFiles.length; i += NonTrackFileSaveConcurrencyLimit) {
          const nonTrackFilesSlice = nonTrackFiles.slice(i, i + NonTrackFileSaveConcurrencyLimit)
          req.logger.info(`NonTrackFiles saveFileForMultihash - processing files ${i} to ${i + NonTrackFileSaveConcurrencyLimit}...`)
          await Promise.all(nonTrackFilesSlice.map(
            nonTrackFile => {
              // Skip over directories since there's no actual content to sync
              // The files inside the directory are synced separately
              if (nonTrackFile.type !== 'dir') {
                // if it's an image file, we need to pass in the actual filename because the gateway request is /ipfs/Qm123/<filename>
                // need to also check fileName is not null to make sure it's a dir-style image. non-dir images won't have a 'fileName' db column
                if (nonTrackFile.type === 'image' && nonTrackFile.fileName !== null) {
                  return saveFileForMultihash(req, nonTrackFile.multihash, nonTrackFile.storagePath, userReplicaSet, nonTrackFile.fileName)
                } else {
                  return saveFileForMultihash(req, nonTrackFile.multihash, nonTrackFile.storagePath, userReplicaSet)
                }
              }
            }
          ))
        }
        req.logger.info('Saved all non-track files to disk.')

        await models.File.bulkCreate(nonTrackFiles.map(file => ({
          fileUUID: file.fileUUID,
          trackUUID: null,
          cnodeUserUUID: fetchedCnodeUserUUID,
          multihash: file.multihash,
          sourceFile: file.sourceFile,
          storagePath: file.storagePath,
          type: file.type,
          fileName: file.fileName,
          dirMultihash: file.dirMultihash
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

        // Save all track files to db
        await models.File.bulkCreate(trackFiles.map(trackFile => ({
          fileUUID: trackFile.fileUUID,
          trackUUID: trackFile.trackUUID,
          cnodeUserUUID: fetchedCnodeUserUUID,
          multihash: trackFile.multihash,
          sourceFile: trackFile.sourceFile,
          storagePath: trackFile.storagePath,
          type: trackFile.type,
          fileName: trackFile.fileName,
          dirMultihash: trackFile.dirMultihash
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

        await t.commit()
        req.logger.info(redisKey, `Transaction successfully committed for cnodeUserUUID ${fetchedCnodeUserUUID}`)
        redisKey = redisClient.getNodeSyncRedisKey(fetchedWalletPublicKey)
        await redisLock.removeLock(redisKey)
      } catch (e) {
        req.logger.error(redisKey, `Transaction failed for cnodeUserUUID ${fetchedCnodeUserUUID}`, e)
        await t.rollback()
        redisKey = redisClient.getNodeSyncRedisKey(fetchedWalletPublicKey)
        await redisLock.removeLock(redisKey)
        throw new Error(e)
      }
    }
  } catch (e) {
    req.logger.error('Sync Error', e)
  } finally {
    // Release all redis locks
    for (let wallet of walletPublicKeys) {
      let redisKey = redisClient.getNodeSyncRedisKey(wallet)
      await redisLock.removeLock(redisKey)
      delete (syncQueue[wallet])
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
