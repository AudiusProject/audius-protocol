const { logger } = require('./logging')
const models = require('./models')
const config = require('./config')

const TrackIdWindowSize = 5
const UserIdWindowSize = 5
const IpfsRepoMaxUsagePercent = 90
const DefaultPollInterval = 5000 // 5000ms = 5s
const TrackAddConcurrencyLimit = 10
const TrackType = 'track'
const UserType = 'user'

class ContentReplicator {
  constructor (ipfs, audiusLibs, pollInterval = DefaultPollInterval) {
    this.ipfs = ipfs
    this.audiusLibs = audiusLibs
    this.pollInterval = pollInterval
    this.replicating = false
    this.interval = null
  }

  /** Kicks off recurring content replication. */
  async start () {
    logger.info('Starting content replicator!')
    this.interval = setInterval(() => this._replicate(), this.pollInterval)
    // Refresh peers at a slower interval than replication
    this.peerInterval = setInterval(() => this.refreshPeers(), this.pollInterval * 10)
  }

  /** Stops recurring content replication. */
  async stop () {
    if (this.interval) {
      logger.info('Stopping content replicator!')
      clearInterval(this.interval)
    } else {
      logger.info('Replicator never started!')
    }
  }

  async initBootstrapPeers () {
    logger.info('Initializing Bootstrap Peers:')
    const ipfsPeerAddrConfig = config.get('ipfsPeerAddresses')
    const ipfsPeerAddresses = ipfsPeerAddrConfig.split(',').filter(Boolean)
    for (let peer of ipfsPeerAddresses) {
      try {
        // Add to list of bootstrap peers
        const results = await this.ipfs.bootstrap.add(peer)
        logger.info(results)
      } catch (e) {
        console.error(e)
      }
    }
  }

  async refreshPeers () {
    const ipfsPeerAddrConfig = config.get('ipfsPeerAddresses')
    const ipfsPeerAddresses = ipfsPeerAddrConfig.split(',').filter(Boolean)
    for (let peer of ipfsPeerAddresses) {
      try {
        // Manually connect to peer
        const results = await this.ipfs.swarm.connect(peer)
        logger.info(results.Strings[0])
      } catch (e) {
        console.error(e)
      }
    }
  }

  /** INTERNAL FUNCTIONS */

  async _replicate () {
    if (this.replicating) {
      logger.info('Replicator job already in progress. Waiting for next interval.')
      return
    }

    this.replicating = true
    try {
      // Retrieve stored highest block values for track and user
      const currentTrackBlockNumber = await this._queryHighestBlockNumber(TrackType)
      const currentUserBlockNumber = await this._queryHighestBlockNumber(UserType)

      // Query track and user with blocknumber ascending
      // Sets the minimum blocknumber as the current highest blocknumber
      // Limit the number of results to configured window
      const tracks = await this.audiusLibs.Track.getTracks(
        TrackIdWindowSize,
        0,
        null,
        null,
        'blocknumber:asc',
        currentTrackBlockNumber + 1 /** minBlockNumber */
      )
      const users = await this.audiusLibs.User.getUsers(
        UserIdWindowSize,
        0,
        null,
        null,
        null,
        null,
        currentUserBlockNumber + 1 /** minBlockNumber */
      )

      logger.info(`Beginning replication task for ${tracks.length} tracks, ${users.length} users.`)

      // For each track and user, add all associated multihashes
      // This includes track segments, cover photos, profile pictures, and metadata
      // Any record that has a higher block number is stored in the Blocks table for subsequent discovery provider queries
      await Promise.all(
        tracks.map(async track => this._replicateTrack(track)),
        users.map(async user => this._replicateUser(user))
      )
      logger.info(`Replication task complete.`)
    } catch (e) {
      logger.error('REPLICATION ERROR', e)
    } finally {
      // if this does not get reset we will become stuck
      this.replicating = false
      // Query information and cleanup maximum usage of ipfs repo
      // await this._monitorDiskUsage()
    }
  }

  async _replicateTrack (track) {
    try {
      const start = Date.now()
      const trackId = track.track_id
      const blocknumber = parseInt(track.blocknumber)
      logger.info(`Replicating track with trackId ${trackId} at blocknumber ${blocknumber}.`)
      let numMultihashes = 0

      /** Add all track metadata. */
      const pinPromises = []
      if (track.cover_art) {
        pinPromises.push(this._replicateMultihash(track.cover_art, trackId, TrackType))
        numMultihashes++
      }
      if (track.metadata_multihash) {
        pinPromises.push(this._replicateMultihash(track.metadata_multihash, trackId, TrackType))
        numMultihashes++
      }
      await Promise.all(pinPromises)

      /** Add all track segments. */
      if (track.track_segments) {
        let segments = track.track_segments
        logger.info(`TrackID ${trackId} - ${segments.length} total segments`)
        for (let i = 0; i < segments.length; i += TrackAddConcurrencyLimit) {
          const slice = segments.slice(i, i + TrackAddConcurrencyLimit)
          logger.info(`TrackID ${trackId} - Processing segments ${i} to ${i + TrackAddConcurrencyLimit}`)
          await Promise.all(
            slice.map(segment => {
              return this._replicateMultihash(segment.multihash, trackId, TrackType)
            })
          )
          numMultihashes += slice.length
        }
      }

      /** Update blocknumber in DB */
      let currentHighestTrackBlock = await this._queryHighestBlockNumber(TrackType)
      if (blocknumber > currentHighestTrackBlock) {
        await models.Block.create({ blocknumber, type: TrackType })
      }

      if (numMultihashes > 0) {
        logger.info(`TrackID ${trackId} - Replication complete. ${numMultihashes} multihashes in ${Date.now() - start}ms`)
      }
    } catch (e) {
      logger.error(`TrackID ${track.track_id} - ERROR PROCESSING ${e}`)
      throw e
    }
  }

  async _replicateUser (user) {
    try {
      const start = Date.now()
      const userId = user.user_id
      const blocknumber = parseInt(user.blocknumber)
      logger.info(`Replicating user with userId ${userId} at blocknumber ${blocknumber}.`)
      let numMultihashes = 0

      /** Add all user metadata. */
      const pinPromises = []
      if (user.profile_picture) {
        pinPromises.push(this._replicateMultihash(user.profile_picture, userId, UserType))
        numMultihashes++
      }
      if (user.cover_photo) {
        pinPromises.push(this._replicateMultihash(user.cover_photo, userId, UserType))
        numMultihashes++
      }
      if (user.metadata_multihash) {
        pinPromises.push(this._replicateMultihash(user.metadata_multihash, userId, UserType))
        numMultihashes++
      }
      await Promise.all(pinPromises)

      /** Update blocknumber in DB. */
      const currentHighestUserBlock = await this._queryHighestBlockNumber(UserType)
      if (blocknumber > currentHighestUserBlock) {
        await models.Block.create({ blocknumber, type: UserType })
      }

      if (numMultihashes > 0) {
        logger.info(`User ${userId} - Replication complete. ${numMultihashes} multihashes in ${Date.now() - start}ms`)
      }
    } catch (e) {
      logger.info(`UserID ${user.user_id} - ERROR PROCESSING ${e}`)
      throw e
    }
  }

  /** Add multihash to IPFS if not already present. */
  async _replicateMultihash (multihash, objectID, objectType) {
    // TODO: remove outdated CIDs if no longer associated with object
    const start = Date.now()
    const type = (objectType === UserType) ? UserType : TrackType

    const file = await models.File.findOne({
      where: (type === UserType)
        ? { multihash, userId: objectID }
        : { multihash, trackId: objectID }
    })

    // If file not found in DB, add to IPFS and store in DB.
    if (!file) {
      logger.info(`${type}ID ${objectID} - Adding ${multihash}...`)
      try {
        let multihashCat = await this.ipfs.cat(multihash)
        logger.info(`${type}ID ${objectID} - Adding ${multihash}...`)
        await this.ipfs.add(multihashCat, { pin: false })
      } catch (e) {
        logger.error(`Error adding ${multihash} - ${e}`)
      }
      logger.info(`${type}ID ${objectID} - Added ${multihash} in ${Date.now() - start}ms.`)
      await models.File.create(
        (type === UserType)
          ? { multihash, userId: objectID }
          : { multihash, trackId: objectID }
      )
    }
  }

  /** Return highest blocknumber that content service has replicated for type. */
  async _queryHighestBlockNumber (type) {
    return ((await models.Block.max('blocknumber', { where: { type } })) || 0)
  }

  /** Returns true if ipfs repo maxUsage is exceeded, else false. */
  async _maxUsageExceeded () {
    try {
      let ipfsStats = await this._getIPFSRepoStats()
      return ipfsStats.usagePercent > IpfsRepoMaxUsagePercent
    } catch (e) {
      logger.error('Error retrieving IPFS stats:', e)
      throw e
    }
  }

  async _getIPFSRepoStats () {
    let ipfsRepoStats = await this.ipfs.repo.stat()
    let usagePercent = (ipfsRepoStats.repoSize / ipfsRepoStats.storageMax) * 100
    logger.info(`IPFS repo usage ${usagePercent}% used of max ${IpfsRepoMaxUsagePercent}%.`)
    return {
      usagePercent: usagePercent,
      stats: ipfsRepoStats
    }
  }

  async _monitorDiskUsage () {
    logger.info('DISABLED - Monitoring disk usage:')

    // No operation necessary if usage threshold is not reached
    if (!(await this._maxUsageExceeded())) {
      logger.info('IPFS repo usage within acceptable range.')
      return
    }

    models.sequelize.query(
      'select array_agg("multihash") as "trackSegments", "trackId", min("createdAt") as "time" from "Files" group by "trackId" order by "time" asc'
    )
      .then(async ([results, metadata]) => {
        logger.info(results)
        for (let trackEntry of results) {
        // Exit loop if usage is below threshold
          if (!(await this._maxUsageExceeded())) {
            break
          }

          let trackSegments = trackEntry.trackSegments
          logger.info('Removing content..')
          logger.info('track ' + trackEntry.trackId)

          // Remove all DB entries corresponding to this track
          await models.File.destroy({ where: { trackId: trackEntry.trackId } })

          // Unpin all track segments as necessary until usage threshold is reached
          for (let segment of trackSegments) {
            let removedHashes = await this.ipfs.pin.rm(segment)
            logger.info('Unpinned: ', removedHashes)
          }

          // Perform repo GC to clear unpinned objects
          await this.ipfs.repo.gc()
        }
      })
    logger.info('Monitoring complete')
  }
}

module.exports = ContentReplicator
