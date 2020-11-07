const { logger } = require('./logging')
const models = require('./models')
const redis = require('./redis')

const REDIS_SET_BLACKLIST_TRACKID_KEY = 'SET.BLACKLIST.TRACKID'
const REDIS_SET_BLACKLIST_USERID_KEY = 'SET.BLACKLIST.USERID'
const REDIS_SET_BLACKLIST_SEGMENTCID_KEY = 'SET.BLACKLIST.SEGMENTCID'

const types = models.ContentBlacklist.Types

class BlacklistManager {
  static async init () {
    try {
      const contentToBlacklist = await this.getTrackAndUserIdsToBlacklist()
      await this.fetchCIDsAndAddToRedis(contentToBlacklist)
    } catch (e) {
      throw new Error(`BLACKLIST ERROR ${e}`)
    }
  }

  /** Return list of trackIds and userIds to be blacklisted. */
  static async getTrackAndUserIdsToBlacklist () {
    // CBL = ContentBlacklist
    const tracksFromCBL = await models.ContentBlacklist.findAll({
      attributes: ['value'],
      where: {
        type: types.track
      },
      raw: true
    })
    const usersFromCBL = await models.ContentBlacklist.findAll({
      attributes: ['value'],
      where: {
        type: types.user
      },
      raw: true
    })
    const segmentsFromCBL = await models.ContentBlacklist.findAll({
      attributes: ['value'],
      where: {
        type: types.cid
      },
      raw: true
    })

    const segmentsToBlacklist = segmentsFromCBL.map(entry => entry.value)
    const userIdsToBlacklist = usersFromCBL.map(entry => parseInt(entry.value))
    let trackIdsToBlacklist = tracksFromCBL.map(entry => parseInt(entry.value))
    trackIdsToBlacklist = new Set(trackIdsToBlacklist)

    // Fetch all tracks created by users in userBlacklist
    let userTracks = await this.getTracksFromUsers(userIdsToBlacklist)
    for (const userTrack of userTracks) {
      trackIdsToBlacklist.add(parseInt(userTrack.blockchainId))
    }

    return { trackIdsToBlacklist: [...trackIdsToBlacklist], userIdsToBlacklist, segmentsToBlacklist }
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
  * Given trackIds and userIds to blacklist, fetch all segmentCIDs.
  * Also add the trackIds, userIds, and segmentCIDs to redis blacklist sets to prevent future interaction.
  */
  static async fetchCIDsAndAddToRedis ({ trackIdsToBlacklist = [], userIdsToBlacklist = [], segmentsToBlacklist = [] }) {
    // Get tracks from param and by parsing through user tracks
    const tracks = await this.getTracksFromUsers(userIdsToBlacklist)
    trackIdsToBlacklist = [...tracks.map(track => track.blockchainId), ...trackIdsToBlacklist]

    // Dedupe trackIds
    const trackIds = new Set(trackIdsToBlacklist)

    // Retrieves CIDs from deduped trackIds
    const segmentsFromTrackIds = await this.getCIDsFromTrackIds([...trackIds])
    const segmentCIDsToBlacklist = [...segmentsFromTrackIds, ...segmentsToBlacklist] // filter out empty strings? why is there an empty string

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
  static async fetchCIDsAndRemoveFromRedis ({ trackIdsToBlacklist = [], userIdsToBlacklist = [], segmentsToBlacklist = [] }) {
    // Get tracks from param and by parsing through user tracks
    const tracks = await this.getTracksFromUsers(userIdsToBlacklist)
    trackIdsToBlacklist = [...tracks.map(track => track.blockchainId), ...trackIdsToBlacklist]

    // Dedupe trackIds
    const trackIds = new Set(trackIdsToBlacklist)

    // Retrieves CIDs from deduped trackIds
    const segmentsFromTrackIds = await this.getCIDsFromTrackIds([...trackIds])
    const segmentCIDsToRemove = [...segmentsFromTrackIds, ...segmentsToBlacklist]

    try {
      await this.removeFromRedis(REDIS_SET_BLACKLIST_TRACKID_KEY, trackIdsToBlacklist)
      await this.removeFromRedis(REDIS_SET_BLACKLIST_USERID_KEY, userIdsToBlacklist)
      await this.removeFromRedis(REDIS_SET_BLACKLIST_SEGMENTCID_KEY, segmentCIDsToRemove)
    } catch (e) {
      throw new Error(`Failed to remove from blacklist: ${e}`)
    }
  }

  /**
   * Retrieves the CIDs for each trackId in trackIds and returns a deduped list of segments CIDs
   * @param {number[]} trackIds
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
   * Adds ids and types as individual entries to ContentBlacklist table
   * @param {number} id user or track id
   * @param {'USER'|'TRACK'} type
   */
  static async addIdsToDb ({ ids, type }) {
    const errs = []
    try {
      await models.ContentBlacklist.bulkCreate(ids.map(id => ({
        value: id, // todo: do i need to convert this to a string
        type
      })), { ignoreDuplicates: true }) // if dupes found, do not update any columns
    } catch (e) {
      errs.push(e)
    }

    if (errs.length > 0) {
      throw new Error(`Error with adding to ContentBlacklist: ${errs.toString()}`)
    }

    console.log(`Sucessfully added entries with type (${type}) and ids (${ids}) to the ContentBlacklist table!`)
    return { type, ids }
  }

  static async addCIDsToDb ({ cids, type }) {
    const errs = []
    try {
      await models.ContentBlacklist.bulkCreate(cids.map(cid => ({
        value: cid,
        type
      })), { ignoreDuplicates: true }) // if dupes found, do not update any columns
    } catch (e) {
      errs.push(e)
    }

    if (errs.length > 0) {
      throw new Error(`Error with adding to ContentBlacklist: ${errs.toString()}`)
    }

    console.log(`Sucessfully added cids [${cids}] to the ContentBlacklist table!`)
    return cids
  }

  /**
   * Removes entry from Contentblacklist table
   * @param {number} id user or track id
   * @param {'USER'|'TRACK'} type
   */
  static async removeIdsFromDb ({ ids, type }) {
    let numRowsDestroyed
    try {
      numRowsDestroyed = await models.ContentBlacklist.destroy({
        where: {
          value: { [models.Sequelize.Op.in]: ids }, // todo: might need to convert this to string before where clause
          type
        }
      })
    } catch (e) {
      throw new Error(`Error with removing entry with type [${type}] and id [${ids.toString()}]: ${e}`)
    }

    if (numRowsDestroyed > 0) {
      console.debug(`Removed entry with type [${type}] and ids [${ids.toString()}] to the ContentBlacklist table!`)
      return { type, ids }
    }

    console.debug(`Entry with type [${type}] and id [${ids.toString()}] does not exist in ContentBlacklist.`)
    return null
  }

  static async removeCIDsFromDb ({ cids, type }) {
    let numRowsDestroyed
    try {
      numRowsDestroyed = await models.ContentBlacklist.destroy({
        where: {
          value: { [models.Sequelize.Op.in]: cids },
          type
        }
      })
    } catch (e) {
      throw new Error(`Error with removing entries with cids [${cids.toString()}]: ${e}`)
    }

    if (numRowsDestroyed > 0) {
      console.debug(`Removed entries with cids [${cids.toString()}] to the ContentBlacklist table!`)
      return cids
    }

    console.debug(`Entries with cid [${cids.toString()}]  does not exist in ContentBlacklist.`)
    return null
  }

  /**
   * Adds key with value to redis.
   * @param {string} key
   * @param {number[]} value
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
   * Removes key with value to redis. If value does not exist, redis should ignore.
   * @param {string} key
   * @param {number[]} value
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

  /** Retrieves redis keys */

  static getRedisTrackIdKey () {
    return REDIS_SET_BLACKLIST_TRACKID_KEY
  }

  static getRedisUserIdKey () {
    return REDIS_SET_BLACKLIST_USERID_KEY
  }

  static getRedisSegmentCIDKey () {
    return REDIS_SET_BLACKLIST_SEGMENTCID_KEY
  }

  /** Checks if userId, trackId, and CID exists in redis  */

  static async userIdIsInBlacklist (userId) {
    return redis.sismember(REDIS_SET_BLACKLIST_USERID_KEY, userId)
  }

  static async trackIdIsInBlacklist (trackId) {
    return redis.sismember(REDIS_SET_BLACKLIST_TRACKID_KEY, trackId)
  }

  static async CIDIsInBlacklist (CID) {
    return redis.sismember(REDIS_SET_BLACKLIST_SEGMENTCID_KEY, CID)
  }

  // Retrieves all CIDs in redis
  static async getAllCIDs () {
    return redis.smembers(REDIS_SET_BLACKLIST_SEGMENTCID_KEY)
  }

  // Retrieves all user ids in redis
  static async getAllUserIds () {
    return redis.smembers(REDIS_SET_BLACKLIST_USERID_KEY)
  }

  // Retrieves all track ids in redis
  static async getAllTrackIds () {
    return redis.smembers(REDIS_SET_BLACKLIST_TRACKID_KEY)
  }
}

module.exports = BlacklistManager
