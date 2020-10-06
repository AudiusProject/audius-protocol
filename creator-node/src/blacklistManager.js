const { logger } = require('./logging')
const models = require('./models')
const redis = require('./redis')

const REDIS_SET_BLACKLIST_TRACKID_KEY = 'SET.BLACKLIST.TRACKID'
const REDIS_SET_BLACKLIST_USERID_KEY = 'SET.BLACKLIST.USERID'
const REDIS_SET_BLACKLIST_SEGMENTCID_KEY = 'SET.BLACKLIST.SEGMENTCID'

const types = Object.freeze({
  track: 'TRACK',
  user: 'USER'
})

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
        type: types.track
      },
      raw: true
    })

    const userIdObjsBlacklist = await models.ContentBlacklist.findAll({
      attributes: ['id'],
      where: {
        type: types.user
      },
      raw: true
    })

    const trackIdsBlacklist = trackIdObjsBlacklist.map(entry => entry.id)
    const userIdsBlacklist = userIdObjsBlacklist.map(entry => entry.id)

    const trackIds = new Set(trackIdsBlacklist)

    // Fetch all tracks created by users in userBlacklist
    let tracks = await this.getTracksFromUsers(userIdsBlacklist)
    for (const track of tracks) {
      trackIds.add(parseInt(track.blockchainId))
    }

    return { trackIdsToBlacklist: [...trackIds], userIdsToBlacklist: userIdsBlacklist }
  }

  /**
  * Given trackIds and userIds to blacklist, fetch all segmentCIDs.
  * Also add the trackIds, userIds, and segmentCIDs to redis blacklist sets to prevent future interaction.
  */
  static async add (trackIdsToBlacklist = [], userIdsToBlacklist = []) {
    // Get tracks from param and by parsing through user tracks
    const tracks = await this.getTracksFromUsers(userIdsToBlacklist)
    trackIdsToBlacklist = [...tracks.map(track => track.blockchainId), ...trackIdsToBlacklist]

    // Dedupe trackIds
    const trackIds = new Set(trackIdsToBlacklist)

    // Retrieves CIDs from deduped trackIds
    const segmentCIDsToBlacklist = await this.getCIDsFromTrackIds([...trackIds])

    try {
      await this.addToRedis(REDIS_SET_BLACKLIST_TRACKID_KEY, trackIdsToBlacklist)
      await this.addToRedis(REDIS_SET_BLACKLIST_USERID_KEY, userIdsToBlacklist)
      await this.addToRedis(REDIS_SET_BLACKLIST_SEGMENTCID_KEY, segmentCIDsToBlacklist)
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
    trackIdsToRemove = [...tracks.map(track => track.blockchainId), ...trackIdsToRemove]

    // Dedupe trackIds
    const trackIds = new Set(trackIdsToRemove)

    // Retrieves CIDs from deduped trackIds
    const segmentCIDsToRemove = await this.getCIDsFromTrackIds([...trackIds])

    try {
      await this.removeFromRedis(REDIS_SET_BLACKLIST_TRACKID_KEY, trackIdsToRemove)
      await this.removeFromRedis(REDIS_SET_BLACKLIST_USERID_KEY, userIdsToRemove)
      await this.removeFromRedis(REDIS_SET_BLACKLIST_SEGMENTCID_KEY, segmentCIDsToRemove)
    } catch (e) {
      throw new Error(`Failed to remove from blacklist: ${e}`)
    }
  }

  /**
   * Retrieves track objects from specified users
   * @param {int[]} userIdsBlacklist
   */
  static async getTracksFromUsers (userIdsBlacklist) {
    let tracks = []
    if (userIdsBlacklist.length > 0) {
      tracks = (await models.sequelize.query(
        'select "blockchainId" from "Tracks" where "cnodeUserUUID" in (' +
        'select "cnodeUserUUID" from "AudiusUsers" where "blockchainId" in (:userIdsBlacklist)' +
        ');',
        { replacements: { userIdsBlacklist } }
      ))[0]
    }
    return tracks
  }

  /**
   * Retrieves the CIDs for each trackId in trackIds and returns a deduped list of segments CIDs
   * @param {int[]} trackIds
   */
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

  /**
   * Adds entry to ContentBlacklist table
   * @param {int} id user or track id
   * @param {enum} type ['USER', 'TRACK']
   */
  static async addToDb ({ id, type }) {
    let resp
    try {
      resp = await models.ContentBlacklist.create({ id, type })
    } catch (e) {
      if (!e.message.includes('Validation error')) {
        throw new Error(`Error with adding entry with type (${type}) and id (${id}): ${e}`)
      }
      console.log(`Entry with type (${type}) and id (${id}) already exists!`)
    }

    if (resp) {
      console.log(`Added entry with type (${type}) and id (${id}) to the ContentBlacklist table!`)
    }

    return { type, id }
  }

  /**
   * Removes entry from Contentblacklist table
   * @param {int} id user or track id
   * @param {enum} type ['USER', 'TRACK']
   */
  static async removeFromDb ({ id, type }) {
    let numRowsDestroyed
    try {
      numRowsDestroyed = await models.ContentBlacklist.destroy({
        where: {
          id,
          type
        }
      })
    } catch (e) {
      throw new Error(`Error with removing entry with type (${type}) and id (${id}): ${e}`)
    }

    if (numRowsDestroyed) {
      console.log(`Removed entry with type (${type}) and id (${id}) to the ContentBlacklist table!`)
      return { type, id }
    }

    console.log(`Entry with type (${type}) and id (${id}) does not exist in ContentBlacklist.`)
    return null
  }

  /**
   * Adds key with value to redis
   * @param {string} key
   * @param {int[]} value
   */
  static async addToRedis (key, value) {
    if (!value || value.length === 0) return
    try {
      const resp = await redis.sadd(key, value)
      logger.info(`redis set add ${key} response ${resp}`)
    } catch (e) {
      throw new Error(`Unable to add [${value.toString()}] to redis`)
    }
  }

  /**
   * Removes key with value to redis
   * @param {string} key
   * @param {int[]} value
   */
  static async removeFromRedis (key, value) {
    if (!value || value.length === 0) return
    try {
      const resp = await redis.srem(key, value)
      logger.info(`redis set remove ${key} response: ${resp}`)
    } catch (e) {
      throw new Error(`Unable to remove [${value.toString()}] from redis`)
    }
  }

  /** Retrieves the types {USER, TRACK} */
  static getTypes () {
    return types
  }

  /** Checks if userid, trackId, and CID exists in redis  */

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
