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

    this.minTrackBlockNumber = 0
  }

  async start () {
    logger.info('Starting content replicator!')
    this.interval = setInterval(
      () => this.replicate(),
      this.pollInterval * 1000)
    this.peerInterval = setInterval(() => this.refreshPeers(), this.pollInterval * 10 * 1000)
    this.highestReplicatedTrackId = 0
  }

  async _replicateTrackMultihash (pinTrackId, pinMultihash, updateMemory = false) {
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

  async _replicateUser (user) {
    let pinUserId = user.user_id
    let pinPromises = []
    if (user.profile_picture) {
      pinPromises.push(this._replicateUserMultihash(user.user_id, user.profile_picture))
    }
    if (user.cover_photo) {
      pinPromises.push(this._replicateUserMultihash(user.user_id, user.cover_photo))
    }
    if (!user.cover_photo && !user.profile_picture) {
      // Add empty DB entry for this user who has no multihashes to pin
      pinPromises.push(
        models.File.create(
          {
            trackId: pinUserId
          }
        )
      )
    }

    return pinPromises
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

  async getUserIdsArray () {
    return this.getIdsArray('userId', userIdWindowSize)
  }

  async getTrackIdsArray () {
    return this.getIdsArray('trackId', trackIdWindowSize)
  }

  async getIdsArray (type, arraySize) {
    if (type !== 'trackId' && type !== 'userId') {
      throw new Error('Invalid type of id requested')
    }

    let highestIdFromDB = this.highestReplicatedTrackId // await models.File.max(type)
    if (Number.isNaN(highestIdFromDB)) {
      highestIdFromDB = 1
    }
    if (Number.isNaN(highestIdFromDB)) {
      throw new Error('Invalid query state')
    }
    let idLow = highestIdFromDB
    let idHigh = idLow + arraySize
    logger.info(`Highest id: ${highestIdFromDB}, ${type}`)
    logger.info(`idlow: ${idLow}, ${type}`)
    logger.info(`idhigh id: ${idHigh}, ${type}`)
    let ids = []
    let iter = idLow
    while (iter < idHigh) {
      ids.push(iter)
      iter++
    }
    return ids
  }

  async queryHighestTrackId () {
    const newestTrack = (await this.audiusLibs.discoveryProvider.getTracks(1, 0, null, null, 'created_at:desc'))[0]
    const highestTrackId = newestTrack.track_id
    logger.info(highestTrackId)
    return highestTrackId
  }

  async replicate () {
    if (!this.replicating) {
      this.replicating = true
      try {
        let start = Date.now()
        // await this.monitorDiskUsage()
        const tracks = (await this.audiusLibs.Track.getTracks(
          trackIdWindowSize,
          0,
          null,
          null,
          'blocknumber:asc',
          this.minTrackBlockNumber + 1))

        /*
        let userIds = await this.getUserIdsArray()
        logger.info(userIds)
        let users = await this.audiusLibs.User.getUsers(userIdWindowSize, userIds)
        */
        // logger.info(users)
        // TODO(hareeshn): sort users by blocknumber or other metric once enabled in disc prov
        let numMultihashes = 0

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
            logger.info(`TrackID - ${track.track_id} processed `)
            if (blocknumber >= this.minTrackBlockNumber) {
              this.minTrackBlockNumber = blocknumber
            }
          })
        )

        /*
        users.forEach(user => {
          pinPromises.push(this._replicateUser(user))
        })
        */

        let end = Date.now()
        let duration = end - start

        logger.info(`Replication complete. ${numMultihashes} multihashes in ${duration}ms`)
      } catch (e) {
        logger.error(`ERROR IN ALL`)
        logger.error(e)
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
