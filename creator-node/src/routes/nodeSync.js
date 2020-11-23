const axios = require('axios')

const models = require('../models')
const { saveFileForMultihashToFS } = require('../fileManager')
const { handleResponse, successResponse, errorResponse, errorResponseServerError, errorResponseBadRequest } = require('../apiHelpers')
const config = require('../config')
const middlewares = require('../middlewares')
const { getIPFSPeerId } = require('../utils')

// Dictionary tracking currently queued up syncs with debounce
const syncQueue = {}
const TrackSaveConcurrencyLimit = 10
const NonTrackFileSaveConcurrencyLimit = 10

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
    const start = Date.now()

    const walletPublicKeys = req.query.wallet_public_key // array
    const sourceEndpoint = req.query.source_endpoint || '' // string

    const maxExportClockValueRange = config.get('maxExportClockValueRange')

    const requestedClockRangeMin = parseInt(req.query.clock_range_min) || 0
    const requestedClockRangeMax = requestedClockRangeMin + (maxExportClockValueRange - 1)

    const transaction = await models.sequelize.transaction()
    try {
      // Fetch cnodeUser for each walletPublicKey.
      const cnodeUsers = await models.CNodeUser.findAll({ where: { walletPublicKey: walletPublicKeys }, transaction, raw: true })
      const cnodeUserUUIDs = cnodeUsers.map((cnodeUser) => cnodeUser.cnodeUserUUID)

      // Fetch all data for cnodeUserUUIDs: audiusUsers, tracks, files, clockRecords.

      const [audiusUsers, tracks, files, clockRecords] = await Promise.all([
        models.AudiusUser.findAll({
          where: {
            cnodeUserUUID: cnodeUserUUIDs,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          transaction,
          raw: true
        }),
        models.Track.findAll({
          where: {
            cnodeUserUUID: cnodeUserUUIDs,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          transaction,
          raw: true
        }),
        models.File.findAll({
          where: {
            cnodeUserUUID: cnodeUserUUIDs,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          transaction,
          raw: true
        }),
        models.ClockRecord.findAll({
          where: {
            cnodeUserUUID: cnodeUserUUIDs,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          transaction,
          raw: true
        })
      ])

      await transaction.commit()

      /** Bundle all data into cnodeUser objects to maximize import speed. */

      const cnodeUsersDict = {}
      cnodeUsers.forEach(cnodeUser => {
        // Add cnodeUserUUID data fields
        cnodeUser['audiusUsers'] = []
        cnodeUser['tracks'] = []
        cnodeUser['files'] = []
        cnodeUser['clockRecords'] = []

        cnodeUsersDict[cnodeUser.cnodeUserUUID] = cnodeUser
        const curCnodeUserClockVal = cnodeUser.clock

        // Resets cnodeUser clock value to requestedClockRangeMax to ensure consistency with clockRecords data
        // Also ensures secondary knows there is more data to sync
        if (cnodeUser.clock > requestedClockRangeMax) {
          // since clockRecords are returned by clock ASC, clock val at last index is largest clock val
          cnodeUser.clock = requestedClockRangeMax
          req.logger.info(`nodeSync.js#export - cnodeUser clock val ${curCnodeUserClockVal} is higher than requestedClockRangeMax, reset to ${requestedClockRangeMax}`)
        }

        cnodeUser['clockInfo'] = {
          requestedClockRangeMin,
          requestedClockRangeMax,
          localClockMax: cnodeUser.clock
        }
      })

      audiusUsers.forEach(audiusUser => {
        cnodeUsersDict[audiusUser.cnodeUserUUID]['audiusUsers'].push(audiusUser)
      })
      tracks.forEach(track => {
        cnodeUsersDict[track.cnodeUserUUID]['tracks'].push(track)
      })
      files.forEach(file => {
        cnodeUsersDict[file.cnodeUserUUID]['files'].push(file)
      })
      clockRecords.forEach(clockRecord => {
        cnodeUsersDict[clockRecord.cnodeUserUUID]['clockRecords'].push(clockRecord)
      })

      // Expose ipfs node's peer ID.
      const ipfs = req.app.get('ipfsAPI')
      const ipfsIDObj = await getIPFSPeerId(ipfs)

      req.logger.info(`Successful export for wallets ${walletPublicKeys} to source endpoint ${sourceEndpoint} for clock value range [${requestedClockRangeMin},${requestedClockRangeMax}] || route duration ${Date.now() - start} ms`)
      return successResponse({ cnodeUsers: cnodeUsersDict, ipfsIDObj })
    } catch (e) {
      req.logger.error(`Error in /export for wallets ${walletPublicKeys} to source endpoint ${sourceEndpoint} for clock value range [${requestedClockRangeMin},${requestedClockRangeMax}] || route duration ${Date.now() - start} ms ||`, e)
      await transaction.rollback()
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
    const immediate = (req.body.immediate === true || req.body.immediate === 'true') // boolean

    // Disable multi wallet syncs for now since in below redis logic is broken for multi wallet case
    if (walletPublicKeys.length === 0) {
      return errorResponseBadRequest(`Must provide one wallet param`)
    } else if (walletPublicKeys.length > 1) {
      return errorResponseBadRequest(`Multi wallet syncs are temporarily disabled`)
    }

    // Log syncType
    const syncType = req.body.sync_type
    if (syncType) {
      req.logger.info(`SnapbackSM sync of type: ${syncType} initiated for ${walletPublicKeys} from ${creatorNodeEndpoint}`)
    }

    if (immediate) {
      let errorObj = await _nodesync(req, walletPublicKeys, creatorNodeEndpoint)
      if (errorObj) {
        return errorResponseServerError(errorObj)
      } else {
        return successResponse()
      }
    }

    // Trigger nodesync operation with debounce
    const debounceTime = config.get('debounceTime')
    for (let wallet of walletPublicKeys) {
      if (wallet in syncQueue) {
        clearTimeout(syncQueue[wallet])
        req.logger.info('clear timeout for', wallet, 'time', Date.now())
      }
      syncQueue[wallet] = setTimeout(
        async function () {
          return _nodesync(req, [wallet], creatorNodeEndpoint)
        },
        debounceTime
      )
      req.logger.info('set timeout for', wallet, 'time', Date.now())
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
    const latestBlockNumber = (cnodeUser) ? cnodeUser.latestBlockNumber : -1
    const clockValue = (cnodeUser) ? cnodeUser.clock : -1

    return successResponse({ walletPublicKey, latestBlockNumber, clockValue })
  }))
}

async function _nodesync (req, walletPublicKeys, creatorNodeEndpoint) {
  const start = Date.now()
  req.logger.info('begin nodesync for ', walletPublicKeys, 'time', start)

  let errorObj = null // object to track if the function errored, returned at the end of the function

  // ensure access to each wallet, then acquire redis lock for duration of sync
  const redisClient = req.app.get('redisClient')
  const redisLock = redisClient.lock

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
    // Query own latest clockValue and call export with that value + 1; export from 0 for first time sync
    const cnodeUser = await models.CNodeUser.findOne({
      where: { walletPublicKey: walletPublicKeys[0] }
    })
    const localMaxClockVal = (cnodeUser) ? cnodeUser.clock : -1

    // Fetch data export from creatorNodeEndpoint for given walletPublicKeys and clock value range
    const exportQueryParams = {
      wallet_public_key: walletPublicKeys,
      clock_range_min: (localMaxClockVal + 1)
    }
    if (config.get('creatorNodeEndpoint')) {
      exportQueryParams.source_endpoint = config.get('creatorNodeEndpoint')
    }

    const resp = await axios({
      method: 'get',
      baseURL: creatorNodeEndpoint,
      url: '/export',
      params: exportQueryParams,
      responseType: 'json',
      /** @notice - this request timeout is arbitrarily large for now until we find an appropriate value */
      timeout: 300000 /* 5m = 300000ms */
    })

    if (resp.status !== 200) {
      req.logger.error(redisKey, `Failed to retrieve export from ${creatorNodeEndpoint} for wallets`, walletPublicKeys)
      throw new Error(resp.data['error'])
    }

    // TODO - explain patch
    if (!resp.data) {
      if (resp.request && resp.request.responseText) {
        resp.data = JSON.parse(resp.request.responseText)
      } else throw new Error(`Malformed response from ${creatorNodeEndpoint}.`)
    }
    if (!resp.data.hasOwnProperty('cnodeUsers') || !resp.data.hasOwnProperty('ipfsIDObj') || !resp.data.ipfsIDObj.hasOwnProperty('addresses')) {
      throw new Error(`Malformed response from ${creatorNodeEndpoint}.`)
    }
    req.logger.info(redisKey, `Successful export from ${creatorNodeEndpoint} for wallets ${walletPublicKeys} and requested min clock ${localMaxClockVal + 1}`)

    // Attempt to connect directly to target CNode's IPFS node.
    await _initBootstrapAndRefreshPeers(req, resp.data.ipfsIDObj.addresses, redisKey)
    req.logger.info(redisKey, 'IPFS Nodes connected + data export received')

    /**
     * For each CNodeUser, replace local DB state with retrieved data + fetch + save missing files.
     */

    for (const fetchedCNodeUser of Object.values(resp.data.cnodeUsers)) {
      // Since different nodes may assign different cnodeUserUUIDs to a given walletPublicKey,
      // retrieve local cnodeUserUUID from fetched walletPublicKey and delete all associated data.
      if (!fetchedCNodeUser.hasOwnProperty('walletPublicKey')) {
        throw new Error(`Malformed response received from ${creatorNodeEndpoint}. "walletPublicKey" property not found on CNodeUser in response object`)
      }
      const fetchedWalletPublicKey = fetchedCNodeUser.walletPublicKey

      // Build user replica set array for use in file fetch + save
      // TODO move this logic to right before file save ops...
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
        req.logger.error(redisKey, `Couldn't get user's replica sets, can't use cnode gateways in saveFileForMultihashToFS - ${e.message}`)
      }

      if (!walletPublicKeys.includes(fetchedWalletPublicKey)) {
        throw new Error(`Malformed response from ${creatorNodeEndpoint}. Returned data for walletPublicKey that was not requested.`)
      }

      const {
        latestBlockNumber: fetchedLatestBlockNumber,
        clock: fetchedLatestClockVal,
        clockRecords: fetchedClockRecords
      } = fetchedCNodeUser

      // Error if returned data is not within requested range
      if (fetchedLatestClockVal < localMaxClockVal) {
        throw new Error(`Cannot sync for localMaxClockVal ${localMaxClockVal} - imported data has max clock val ${fetchedLatestClockVal}`)
      } else if (fetchedLatestClockVal === localMaxClockVal) {
        // Already up to date, no sync necessary
        req.logger.info(redisKey, `User ${fetchedWalletPublicKey} already up to date! Both nodes have latest clock value ${localMaxClockVal}`)
        continue
      } else if (localMaxClockVal !== -1 && fetchedClockRecords[0] && fetchedClockRecords[0].clock !== localMaxClockVal + 1) {
        throw new Error(`Cannot sync - imported data is not contiguous. Local max clock val = ${localMaxClockVal} and imported min clock val ${fetchedClockRecords[0].clock}`)
      }

      // All DB updates must happen in single atomic tx - partial state updates will lead to data loss
      const transaction = await models.sequelize.transaction()

      try {
        req.logger.info(redisKey, `beginning add ops for cnodeUser wallet ${fetchedWalletPublicKey}`)

        // Update CNodeUser entry if exists else create
        // Cannot use upsert since it fails to use default value for cnodeUserUUID per this issue https://github.com/sequelize/sequelize/issues/3247
        const cnodeUserRecord = await models.CNodeUser.findOne({
          where: { walletPublicKey: fetchedWalletPublicKey },
          transaction
        })
        let cnodeUser
        if (cnodeUserRecord) {
          cnodeUser = await cnodeUserRecord.update(
            {
              lastLogin: fetchedCNodeUser.lastLogin,
              latestBlockNumber: fetchedLatestBlockNumber,
              clock: fetchedCNodeUser.clock,
              createdAt: fetchedCNodeUser.createdAt
            },
            { transaction }
          )
        } else {
          cnodeUser = await models.CNodeUser.create(
            {
              walletPublicKey: fetchedWalletPublicKey,
              lastLogin: fetchedCNodeUser.lastLogin,
              latestBlockNumber: fetchedLatestBlockNumber,
              clock: fetchedCNodeUser.clock,
              createdAt: fetchedCNodeUser.createdAt
            },
            { transaction }
          )
        }
        const cnodeUserUUID = cnodeUser.cnodeUserUUID
        req.logger.info(redisKey, `Inserted CNodeUser for cnodeUser wallet ${fetchedWalletPublicKey}`)

        /**
         * Populate all new data for fetched cnodeUser
         * Always use local cnodeUserUUID in favor of cnodeUserUUID in exported dataset to ensure consistency
         */

        // Save all clockRecords to DB
        await models.ClockRecord.bulkCreate(fetchedCNodeUser.clockRecords.map(clockRecord => ({
          ...clockRecord,
          cnodeUserUUID
        })), { transaction })
        req.logger.info(redisKey, 'Recorded all ClockRecord entries in DB')

        /*
         * Make list of all track Files to add after track creation
         *
         * Files with trackBlockchainIds cannot be created until tracks have been created,
         *    but tracks cannot be created until metadata and cover art files have been created.
         */

        const trackFiles = fetchedCNodeUser.files.filter(file => models.File.TrackTypes.includes(file.type))
        const nonTrackFiles = fetchedCNodeUser.files.filter(file => models.File.NonTrackTypes.includes(file.type))

        // Save all track files to disk in batches (to limit concurrent load)
        for (let i = 0; i < trackFiles.length; i += TrackSaveConcurrencyLimit) {
          const trackFilesSlice = trackFiles.slice(i, i + TrackSaveConcurrencyLimit)
          req.logger.info(redisKey, `TrackFiles saveFileForMultihashToFS - processing trackFiles ${i} to ${i + TrackSaveConcurrencyLimit} out of total ${trackFiles.length}...`)

          await Promise.all(trackFilesSlice.map(
            trackFile => saveFileForMultihashToFS(req, trackFile.multihash, trackFile.storagePath, userReplicaSet)
          ))
        }
        req.logger.info(redisKey, 'Saved all track files to disk.')

        // Save all non-track files to disk in batches (to limit concurrent load)
        for (let i = 0; i < nonTrackFiles.length; i += NonTrackFileSaveConcurrencyLimit) {
          const nonTrackFilesSlice = nonTrackFiles.slice(i, i + NonTrackFileSaveConcurrencyLimit)
          req.logger.info(redisKey, `NonTrackFiles saveFileForMultihashToFS - processing files ${i} to ${i + NonTrackFileSaveConcurrencyLimit} out of total ${nonTrackFiles.length}...`)
          await Promise.all(nonTrackFilesSlice.map(
            nonTrackFile => {
              // Skip over directories since there's no actual content to sync
              // The files inside the directory are synced separately
              if (nonTrackFile.type !== 'dir') {
                // if it's an image file, we need to pass in the actual filename because the gateway request is /ipfs/Qm123/<filename>
                // need to also check fileName is not null to make sure it's a dir-style image. non-dir images won't have a 'fileName' db column
                if (nonTrackFile.type === 'image' && nonTrackFile.fileName !== null) {
                  return saveFileForMultihashToFS(req, nonTrackFile.multihash, nonTrackFile.storagePath, userReplicaSet, nonTrackFile.fileName)
                } else {
                  return saveFileForMultihashToFS(req, nonTrackFile.multihash, nonTrackFile.storagePath, userReplicaSet)
                }
              }
            }
          ))
        }
        req.logger.info(redisKey, 'Saved all non-track files to disk.')

        await models.File.bulkCreate(nonTrackFiles.map(file => ({
          ...file,
          trackBlockchainId: null,
          cnodeUserUUID
        })), { transaction })
        req.logger.info(redisKey, 'created all non-track files')

        await models.Track.bulkCreate(fetchedCNodeUser.tracks.map(track => ({
          ...track,
          cnodeUserUUID
        })), { transaction })
        req.logger.info(redisKey, 'created all tracks')

        await models.File.bulkCreate(trackFiles.map(trackFile => ({
          ...trackFile,
          cnodeUserUUID
        })), { transaction })
        req.logger.info(redisKey, 'saved all track files to db')

        await models.AudiusUser.bulkCreate(fetchedCNodeUser.audiusUsers.map(audiusUser => ({
          ...audiusUser,
          cnodeUserUUID
        })), { transaction })
        req.logger.info(redisKey, 'saved all audiususer data to db')

        await transaction.commit()
        await redisLock.removeLock(redisKey)

        req.logger.info(redisKey, `Transaction successfully committed for cnodeUser wallet ${fetchedWalletPublicKey}`)
      } catch (e) {
        req.logger.error(redisKey, `Transaction failed for cnodeUser wallet ${fetchedWalletPublicKey}`, e)

        await transaction.rollback()
        await redisLock.removeLock(redisKey)

        throw new Error(e)
      }
    }
  } catch (e) {
    req.logger.error(redisKey, 'Sync Error for wallets ', walletPublicKeys, `|| from endpoint ${creatorNodeEndpoint} ||`, e)
    errorObj = e
  } finally {
    // Release all redis locks
    for (let wallet of walletPublicKeys) {
      let redisKey = redisClient.getNodeSyncRedisKey(wallet)
      await redisLock.removeLock(redisKey)
      delete (syncQueue[wallet])
    }
    req.logger.info(redisKey, `DURATION SYNC ${Date.now() - start}`)
  }

  return errorObj
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
