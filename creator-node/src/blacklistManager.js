const { logger } = require('./logging')
const models = require('./models')
const redis = require('./redis')

const REDIS_SET_BLACKLIST_TRACKID_KEY = 'SET.BLACKLIST.TRACKID'
const REDIS_SET_BLACKLIST_USERID_KEY = 'SET.BLACKLIST.USERID'
const REDIS_SET_BLACKLIST_SEGMENTCID_KEY = 'SET.BLACKLIST.SEGMENTCID'

class BlacklistManager {
  static async init (ipfs) {
    try {
      const { trackIdsToBlacklist, userIdsToBlacklist } = await this.getTrackAndUserIdsToBlacklist()
      await this.add(trackIdsToBlacklist, userIdsToBlacklist)
    } catch (e) {
      throw new Error(`BLACKLIST ERROR ${e}`)
    }
  }

  /** Return list of trackIds and userIds to be blacklisted. */
  static async getTrackAndUserIdsToBlacklist () {
    const trackIdObjsBlacklist = await models.ContentBlacklist.findAll({
      attributes: ['id'],
      where: {
        type: 'TRACK'
      },
      raw: true
    })

    const userIdObjsBlacklist = await models.ContentBlacklist.findAll({
      attributes: ['id'],
      where: {
        type: 'USER'
      },
      raw: true
    })

    const trackIdsBlacklist = trackIdObjsBlacklist.map(entry => entry.id)
    const userIdsBlacklist = userIdObjsBlacklist.map(entry => entry.id)

    console.log('here are the trackids and userids')
    console.log(trackIdsBlacklist)
    console.log(userIdsBlacklist)

    const trackIds = new Set(trackIdsBlacklist)

    // Fetch all tracks created by users in userBlacklist
    let tracks = await this.getTracksFromUsers(userIdsBlacklist)
    for (const track of tracks) {
      trackIds.add(parseInt(track.blockchainId))
    }

    console.log('the resp')
    console.log({ trackIdsToBlacklist: [...trackIds], userIdsToBlacklist: userIdsBlacklist })
    return { trackIdsToBlacklist: [...trackIds], userIdsToBlacklist: userIdsBlacklist }
  }

  /**
  * Given trackIds and userIds to blacklist, fetch all segmentCIDs.
  * Also add the trackIds, userIds, and segmentCIDs to redis blacklist sets to prevent future interaction.
  */
  static async add (trackIdsToBlacklist = [], userIdsToBlacklist = []) {
    // Get tracks from param and by parsing through user tracks
    const tracks = await this.getTracksFromUsers(userIdsToBlacklist)
    trackIdsToBlacklist = [tracks.map(track => track.blockchainId), ...trackIdsToBlacklist]

    // Dedupe trackIds
    const trackIds = new Set(trackIdsToBlacklist)

    // Retrieves CIDs from deduped trackIds
    const segmentCIDsToBlacklist = await this.getCIDsFromTrackIds([...trackIds])

    try {
      await this.addTrackIdsToRedis(trackIdsToBlacklist)
      await this.addUserIdsToRedis(userIdsToBlacklist)
      await this.addCIDsToRedis(segmentCIDsToBlacklist)
    } catch (e) {
      throw new Error(`Failed to add to blacklist: ${e}`)
    }
  }

  /**
  * Given trackIds and userIds to remove from blacklist, fetch all segmentCIDs.
  * Also remove the trackIds, userIds, and segmentCIDs from redis blacklist sets to prevent future interaction.
  */
  static async remove (trackIdsToRemove = [], userIdsToRemove = []) {
    // Get tracks from param and by parsing through user tracks
    const tracks = await this.getTracksFromUsers(userIdsToRemove)
    trackIdsToRemove = [tracks.map(track => track.blockchainId), ...trackIdsToRemove]

    // Dedupe trackIds
    let trackIds = new Set(trackIdsToRemove)

    // Retrieves CIDs from deduped trackIds
    const segmentCIDsToRemove = await this.getCIDsFromTrackIds([...trackIds])

    try {
      await this.removeTrackIdsFromRedis(trackIdsToRemove)
      await this.removeUserIdsFromRedis(userIdsToRemove)
      await this.removeCIDsFromRedis(segmentCIDsToRemove)
    } catch (e) {
      throw new Error(`Failed to remove from blacklist: ${e}`)
    }
  }

  /**
   * Retrieves track objects from specified users
   * @param {[int]} userIdsBlacklist
   */
  static async getTracksFromUsers (userIdsBlacklist) {
    console.log('huh what is thing')
    console.log(userIdsBlacklist)
    let tracks = []
    if (userIdsBlacklist.length > 0) {
      // ? this actually returns the entire track and not just blockchainId
      tracks = (await models.sequelize.query(
        'select "blockchainId" from "Tracks" where "cnodeUserUUID" in (' +
        'select "cnodeUserUUID" from "AudiusUsers" where "blockchainId" in (:userIdsBlacklist)' +
        ');',
        { replacements: { userIdsBlacklist } }
      ))[0]
    }
    return tracks
  }

  /** Retrieves the CIDs for each trackId in trackIds and returns a deduped list of segments CIDs */
  static async getCIDsFromTrackIds (trackIds) {
    const tracks = await models.Track.findAll({ where: { blockchainId: trackIds } })

    let segmentCIDs = new Set()
    for (const track of tracks) {
      if (!track.metadataJSON || !track.metadataJSON.track_segments) continue

      for (const segment of track.metadataJSON.track_segments) {
        if (segment.multihash) {
          segmentCIDs.add(segment.multihash)
        }
      }
    }

    return [...segmentCIDs]
  }

  static async addUserIdsToRedis (userIds) {
    if (!userIds || userIds.length === 0) return
    try {
      const resp = await redis.sadd(REDIS_SET_BLACKLIST_USERID_KEY, userIds)
      logger.info(`redis set add ${REDIS_SET_BLACKLIST_USERID_KEY} response: ${resp}`)
    } catch (e) {
      throw new Error(`Unable to add [${userIds.toString()}] to redis`)
    }
  }

  static async addTrackIdsToRedis (trackIds) {
    if (!trackIds || trackIds.length === 0) return
    try {
      const resp = await redis.sadd(REDIS_SET_BLACKLIST_TRACKID_KEY, trackIds)
      logger.info(`redis set add ${REDIS_SET_BLACKLIST_TRACKID_KEY} response: ${resp}`)
    } catch (e) {
      throw new Error(`Unable to add [${trackIds.toString()}] to redis`)
    }
  }

  static async addCIDsToRedis (CIDs) {
    if (!CIDs || CIDs.length === 0) return
    try {
      const resp = await redis.sadd(REDIS_SET_BLACKLIST_SEGMENTCID_KEY, CIDs)
      logger.info(`redis set add ${REDIS_SET_BLACKLIST_SEGMENTCID_KEY} response: ${resp}.`)
    } catch (e) {
      throw new Error(`Unable to add [${CIDs.toString()}] to redis`)
    }
  }

  static async removeUserIdsFromRedis (userIds) {
    if (!userIds || userIds.length === 0) return
    try {
      const resp = await redis.srem(REDIS_SET_BLACKLIST_USERID_KEY, userIds)
      logger.info(`redis set remove ${REDIS_SET_BLACKLIST_USERID_KEY} response: ${resp}`)
    } catch (e) {
      throw new Error(`Unable to remove [${userIds.toString()}] from redis`)
    }
  }

  static async removeTrackIdsFromRedis (trackIds) {
    if (!trackIds || trackIds.length === 0) return
    try {
      const resp = await redis.srem(REDIS_SET_BLACKLIST_TRACKID_KEY, trackIds)
      logger.info(`redis set remove ${REDIS_SET_BLACKLIST_TRACKID_KEY} response: ${resp}`)
    } catch (e) {
      throw new Error(`Unable to remove [${trackIds.toString()}] from redis`)
    }
  }

  static async removeCIDsFromRedis (CIDs) {
    if (!CIDs || CIDs.length === 0) return
    try {
      const resp = await redis.srem(REDIS_SET_BLACKLIST_SEGMENTCID_KEY, CIDs)
      logger.info(`redis set remove ${REDIS_SET_BLACKLIST_SEGMENTCID_KEY} response: ${resp}`)
    } catch (e) {
      throw new Error(`Unable to remove [${CIDs.toString()}] from redis`)
    }
  }

  static async userIdIsInBlacklist (userId) {
    return redis.sismember(REDIS_SET_BLACKLIST_USERID_KEY, userId)
  }

  static async trackIdIsInBlacklist (trackId) {
    return redis.sismember(REDIS_SET_BLACKLIST_TRACKID_KEY, trackId)
  }

  static async CIDIsInBlacklist (CID) {
    return redis.sismember(REDIS_SET_BLACKLIST_SEGMENTCID_KEY, CID)
  }
}

module.exports = BlacklistManager
