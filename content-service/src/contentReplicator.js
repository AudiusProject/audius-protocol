const { logger } = require('./logging')
const models = require('./models')

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
    this.interval = setInterval(() => this.replicate(), this.pollInterval * 1000)
    this.peerInterval = setInterval(() => this.refreshPeers(), this.pollInterval * 10 * 1000)
  }

  async _replicateTrackMultihash (pinTrackId, pinMultihash) {
    // TODO(roneilr): remove outdated CIDs associated with a given track ID
    let start = Date.now()
    const file = await models.File.findOne({ where: { multihash: pinMultihash, trackId: pinTrackId } })
    if (!file) {
      logger.info(`Pinning ${pinMultihash}`)
      await this.ipfs.pin.add(pinMultihash)
      let duration = Date.now() - start
      logger.info(`Pinned ${pinMultihash} in ${duration}ms`)
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
      logger.info(`Pinning ${pinMultihash}`)
      await this.ipfs.pin.add(pinMultihash)
      let duration = Date.now() - start
      logger.info(`Pinned ${pinMultihash} in ${duration}ms`)
      await models.File.create({
        multihash: pinMultihash,
        userId: pinUserId
      })
    }
  }

  async replicate () {
    if (!this.replicating) {
      this.replicating = true
      try {
        let start = Date.now()
        await this.monitorDiskUsage()
        // TODO(hareeshn): sort users by blocknumber or other metric once enabled in disc prov
        const users = await this.audiusLibs.discoveryProvider.getUsers()
        const tracks = await this.audiusLibs.discoveryProvider.getTracks(100, 0, null, null, 'blocknumber:desc')
        const pinPromises = []

        tracks.forEach(track => {
          if (track.track_segments) {
            track.track_segments.forEach((segment) => {
              if (segment.multihash) {
                pinPromises.push(this._replicateTrackMultihash(track.track_id, segment.multihash))
              }
            })
          }
          if (track.cover_art) {
            pinPromises.push(this._replicateTrackMultihash(track.track_id, track.cover_art))
          }
          if (track.metadata_multihash) {
            pinPromises.push(this._replicateTrackMultihash(track.track_id, track.metadata_multihash))
          }
        })

        users.forEach(user => {
          if (user.profile_picture) {
            pinPromises.push(this._replicateUserMultihash(user.user_id, user.profile_picture))
          }
          if (user.cover_photo) {
            pinPromises.push(this._replicateUserMultihash(user.user_id, user.cover_photo))
          }
        })

        let numSegments = pinPromises.length
        logger.info(`Replicating ${numSegments} segments`)
        await Promise.all(pinPromises)
        let end = Date.now()
        let duration = end - start
        logger.info(`Replication complete. ${numSegments} segments in ${duration}ms`)
      } finally {
        // if this does not get reset we will become stuck
        this.replicating = false
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
    let ipfsPeerAddresses = ipfsPeerAddrConfig.split(',')
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
    let ipfsPeerAddresses = ipfsPeerAddrConfig.split(',')
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
