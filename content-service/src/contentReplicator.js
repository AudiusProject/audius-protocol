const { logger } = require('./logging')
const models = require('./models')

const trackIdWindowSize = 5
const userIdWindowSize = 5
const ipfsRepoMaxUsagePercent = 90
const config = require('./config')

class ContentReplicator {
  constructor (ipfsHandle, audiusLibs, pollInterval = 5) {
    this.ipfs = ipfsHandle
    this.audiusLibs = audiusLibs
    this.replicating = false
    this.interval = null
    this.pollInterval = pollInterval
  }

  async start () {
    logger.info('Starting content replicator!')
    this.interval = setInterval(
      () => this.replicate(),
      this.pollInterval * 1000)
    this.peerInterval = setInterval(() => this.refreshPeers(), this.pollInterval * 10 * 1000)
  }

  async _replicateTrackMultihash (pinTrackId, pinMultihash) {
    // TODO(roneilr): remove outdated CIDs associated with a given track ID
    let start = Date.now()
    const file = await models.File.findOne({ where: { multihash: pinMultihash, trackId: pinTrackId } })
    if (!file) {
      logger.info(`TrackID ${pinTrackId} - Pinning ${pinMultihash}`)
      try {
        await this.ipfs.pin.add(pinMultihash)
      } catch (e) {
        logger.error(`Error pinning ${pinMultihash} - ${e}`)
        throw e
      }
      let duration = Date.now() - start
      logger.info(`TrackID ${pinTrackId} - Pinned ${pinMultihash} in ${duration}ms`)
      await models.File.create({
        multihash: pinMultihash,
        trackId: pinTrackId
      })
    }
  }

  async _replicateUserMultihash (pinUserId, pinMultihash) {
    // TODO(roneilr): remove outdated CIDs associated with a given track ID
    let start = Date.now()
    const file = await models.File.findOne({ where: { multihash: pinMultihash, userId: pinUserId } })
    if (!file) {
      logger.info(`UserID ${pinUserId} - Pinning ${pinMultihash}`)
      await this.ipfs.pin.add(pinMultihash)
      let duration = Date.now() - start
      logger.info(`UserID ${pinUserId} - Pinned ${pinMultihash} in ${duration}ms`)
      await models.File.create({
        multihash: pinMultihash,
        userId: pinUserId
      })
    }
  }

  async queryHighestBlockNumber (type) {
    let highestVal = await models.Block.max('blocknumber', { where: { 'type': type } })
    if (Number.isNaN(highestVal)) {
      highestVal = 0
    }
    return highestVal
  }

  async monitorDiscoveryProviderConnection () {
    let currentDiscProv = this.audiusLibs.discoveryProvider.discoveryProviderEndpoint
    let retries = 5
    while (!currentDiscProv && retries > 0) {
      logger.info(`Reselecting discovery provider`)
      await this.audiusLibs.init()
      currentDiscProv = this.audiusLibs.discoveryProvider.discoveryProviderEndpoint
      retries-- 
    }
    if (!currentDiscProv) {
      throw new Exception('Failed to select valid provider...') 
    }
    logger.info(`Selected ${currentDiscProv}`)
  }

  async replicate () {
    if (!this.replicating) {
      this.replicating = true
      try {
        // Confirm a discovery provider connection is active, reset if not
        await this.monitorDiscoveryProviderConnection()

        let start = Date.now()
        // Retrieve stored highest block values for track and user
        let currentTrackBlockNumber = await this.queryHighestBlockNumber('track')
        let currentUserBlockNumber = await this.queryHighestBlockNumber('user')

        // Query track and user with blocknumber ascending
        // Sets the minimum blocknumber as the current highest blocknumber
        // Limit the number of results to configured window - by default this is set to 5
        const tracks = await this.audiusLibs.Track.getTracks(
          trackIdWindowSize,
          0,
          null,
          null,
          'blocknumber:asc',
          currentTrackBlockNumber + 1)

        let users = await this.audiusLibs.User.getUsers(
          userIdWindowSize,
          0,
          null,
          null,
          null,
          null,
          currentUserBlockNumber + 1)

        let numMultihashes = 0

        // For each track and user, pin any associatd multihash
        // This includes track segments, cover photos, profile pictures, and metadata
        // Any record that has a higher block number is stored in the Blocks table for subsequent discovery provider queries
        await Promise.all(
          tracks.map(async (track) => {
            const blocknumber = parseInt(track.blocknumber)
            const trackPinPromises = []
            if (track.track_segments) {
              track.track_segments.forEach((segment) => {
                if (segment.multihash) {
                  trackPinPromises.push(this._replicateTrackMultihash(track.track_id, segment.multihash, true))
                  numMultihashes++
                }
              })
            }
            if (track.cover_art) {
              trackPinPromises.push(this._replicateTrackMultihash(track.track_id, track.cover_art, true))
              numMultihashes++
            }
            if (track.metadata_multihash) {
              trackPinPromises.push(this._replicateTrackMultihash(track.track_id, track.metadata_multihash, true))
              numMultihashes++
            }
            await Promise.all(trackPinPromises)
            let currentHighestTrackBlock = await this.queryHighestBlockNumber('track')
            if (blocknumber > currentHighestTrackBlock) {
              await models.Block.create({
                blocknumber: blocknumber,
                type: 'track'
              })
            }
          }),
          users.map(async (user) => {
            const blocknumber = parseInt(user.blocknumber)
            let currentHighestUserBlock = await this.queryHighestBlockNumber('user')
            const userPinPromises = []
            if (user.profile_picture) {
              userPinPromises.push(this._replicateUserMultihash(user.user_id, user.profile_picture))
              numMultihashes++
            }
            if (user.cover_photo) {
              userPinPromises.push(this._replicateUserMultihash(user.user_id, user.cover_photo))
              numMultihashes++
            }
            if (user.metadata_multihash) {
              userPinPromises.push(this._replicateUserMultihash(user.user_id, user.metadata_multihash))
              numMultihashes++
            }
            await Promise.all(userPinPromises)
            if (blocknumber > currentHighestUserBlock) {
              await models.Block.create({
                blocknumber: blocknumber,
                type: 'user'
              })
            }
          })
        )

        let end = Date.now()
        let duration = end - start
        logger.info(`Replication complete. ${numMultihashes} multihashes in ${duration}ms`)
      } catch (e) {
        logger.error(`ERROR IN ALL`)
        logger.error(e)
      } finally {
        // if this does not get reset we will become stuck
        this.replicating = false
        // Query information and cleanup maximum usage of ipfs repo
        await this.monitorDiskUsage()
      }
    } else {
      logger.info('Replicator job already in progress. Waiting for next interval.')
    }
  }

  async maxUsageExceeded () {
    try {
      let ipfsStats = await this.getIPFSRepoStats()
      return ipfsStats.usagePercent > ipfsRepoMaxUsagePercent
    } catch (e) {
      logger.error('Error retrieving IPFS stats:')
      logger.error(e)
      throw e
    }
  }

  async getIPFSRepoStats () {
    let ipfsRepoStats = await this.ipfs.repo.stat()
    let usagePercent = (ipfsRepoStats.repoSize / ipfsRepoStats.storageMax) * 100
    logger.info(usagePercent + '% IPFS repo usage. Max :' + ipfsRepoMaxUsagePercent + '%')
    return {
      usagePercent: usagePercent,
      stats: ipfsRepoStats
    }
  }

  async initBootstrapPeers () {
    logger.info('Initializing Bootstrap Peers:')
    let ipfsPeerAddrConfig = config.get('ipfsPeerAddresses')
    let ipfsPeerAddresses = ipfsPeerAddrConfig.split(',').filter(Boolean)
    for (let peer of ipfsPeerAddresses) {
      try {
        // Add to list of bootstrap peers
        let results = await this.ipfs.bootstrap.add(peer)
        logger.info(results)
      } catch (e) {
        console.log(e)
      }
    }
  }

  async refreshPeers () {
    let ipfsPeerAddrConfig = config.get('ipfsPeerAddresses')
    let ipfsPeerAddresses = ipfsPeerAddrConfig.split(',').filter(Boolean)
    for (let peer of ipfsPeerAddresses) {
      try {
        // Manually connect to peer
        let results = await this.ipfs.swarm.connect(peer)
        logger.info(results.Strings[0])
      } catch (e) {
        console.log(e)
      }
    }
  }

  async monitorDiskUsage () {
    logger.info('Monitoring disk usage:')

    // No operation necessary if usage threshold is not reached
    if (!(await this.maxUsageExceeded())) {
      return
    }

    models.sequelize.query('select array_agg("multihash") as "trackSegments", "trackId", min("createdAt") as "time" from "Files" group by "trackId" order by "time" asc').then(async ([results, metadata]) => {
      logger.info(results)
      for (let trackEntry of results) {
        // Exit loop if usage is below threshold
        if (!(await this.maxUsageExceeded())) {
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

  async stop () {
    if (this.interval) {
      logger.info('Stopping content replicator!')
      clearInterval(this.interval)
    } else {
      logger.info('Replicator never started!')
    }
  }
}

module.exports = ContentReplicator
