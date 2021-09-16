const { logger } = require('./logging')
const models = require('./models')
const redis = require('./redis')
const config = require('./config')

const CID_WHITELIST = new Set(config.get('cidWhitelist').split(','))

const REDIS_SET_BLACKLIST_TRACKID_KEY = 'SET.BLACKLIST.TRACKID'
const REDIS_SET_BLACKLIST_USERID_KEY = 'SET.BLACKLIST.USERID'
const REDIS_SET_BLACKLIST_SEGMENTCID_KEY = 'SET.BLACKLIST.SEGMENTCID'
const REDIS_MAP_BLACKLIST_SEGMENTCID_TO_TRACKID_KEY = 'MAP.BLACKLIST.SEGMENTCID.TRACKID'
const REDIS_MAP_TRACKID_TO_SEGMENTCIDS_KEY = 'MAP.TRACKID.SEGMENTCID'

const SEGMENTCID_TO_TRACKID_EXPIRATION_SECONDS = 14 /* days */ * 24 /* hours */ * 60 /* minutes */ * 60 /* seconds */

const types = models.ContentBlacklist.Types

class BlacklistManager {
  constructor () {
    this.initialized = false
  }

  static async init () {
    try {
      // Clear existing redis keys
      await this.deleteRedisKeys()

      const { trackIdsToBlacklist, userIdsToBlacklist, segmentsToBlacklist } = await this.getDataToBlacklist()
      await this.fetchCIDsAndAddToRedis({ trackIdsToBlacklist, userIdsToBlacklist, segmentsToBlacklist })
      this.initialized = true
    } catch (e) {
      throw new Error(`BLACKLIST ERROR ${e}`)
    }
  }

  /** Return list of trackIds, userIds, and CIDs to be blacklisted. */
  static async getDataToBlacklist () {
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
    const trackIdsToBlacklist = tracksFromCBL.map(entry => parseInt(entry.value))

    return { trackIdsToBlacklist, userIdsToBlacklist, segmentsToBlacklist }
  }

  /**
  * 1. Given trackIds and userIds to blacklist, fetch all segmentCIDs, and then add the ultimate set of segments to redis.
  * 2. Add the trackIds and userIds to redis as sets.
  * 3. Create mapping of explicitly blacklisted tracks with the structure <blacklisted-segmentCIDs : set of trackIds> in redis.
  */
  static async fetchCIDsAndAddToRedis ({ trackIdsToBlacklist = [], userIdsToBlacklist = [], segmentsToBlacklist = [] }) {
    // Get all tracks from users and combine with explicit trackIds to BL
    const tracksFromUsers = await this.getTracksFromUsers(userIdsToBlacklist)
    let allTrackIdsToBlacklist = trackIdsToBlacklist.concat(tracksFromUsers.map(track => track.blockchainId))

    // Dedupe trackIds
    const allTrackIdsToBlacklistSet = new Set(allTrackIdsToBlacklist)

    // Retrieves CIDs from deduped trackIds
    const { segmentCIDs: segmentsFromTrackIds, trackIdToSegments } = await this.getCIDsToBlacklist({
      allTrackIds: [...allTrackIdsToBlacklistSet],
      explicitTrackIds: new Set(trackIdsToBlacklist)
    })
    let segmentCIDsToBlacklist = segmentsFromTrackIds.concat(segmentsToBlacklist)
    let segmentCIDsToBlacklistSet = new Set(segmentCIDsToBlacklist)
    // Filter out whitelisted CID's from the segments to remove
    ;[...CID_WHITELIST].forEach(cid => segmentCIDsToBlacklistSet.delete(cid))

    segmentCIDsToBlacklist = [...segmentCIDsToBlacklistSet]
    try {
      await this.addToRedis(REDIS_SET_BLACKLIST_TRACKID_KEY, allTrackIdsToBlacklist)
      await this.addToRedis(REDIS_SET_BLACKLIST_USERID_KEY, userIdsToBlacklist)
      await this.addToRedis(REDIS_SET_BLACKLIST_SEGMENTCID_KEY, segmentCIDsToBlacklist)

      // Creates a mapping of CID to blacklisted trackIds in redis. This should not include the trackIds from users.
      await this.addToRedis(REDIS_MAP_BLACKLIST_SEGMENTCID_TO_TRACKID_KEY, trackIdToSegments)
    } catch (e) {
      this.logError(e, e.stack)
      throw new Error(`[fetchCIDsAndAddToRedis] - Failed to add to blacklist: ${e}`)
    }
  }

  /**
  * Given trackIds and userIds to remove from blacklist, fetch all segmentCIDs.
  * Also remove the trackIds, userIds, and segmentCIDs from redis blacklist sets to prevent future interaction.
  */
  static async fetchCIDsAndRemoveFromRedis ({ trackIdsToRemove = [], userIdsToRemove = [], segmentsToRemove = [] }) {
    // Get all tracks from users and combine with explicit trackIds to BL
    const tracksFromUsers = await this.getTracksFromUsers(userIdsToRemove)
    let allTrackIdsToBlacklist = trackIdsToRemove.concat(tracksFromUsers.map(track => track.blockchainId))

    // Dedupe trackIds
    const allTrackIdsToBlacklistSet = new Set(allTrackIdsToBlacklist)

    // Retrieves CIDs from deduped trackIds
    const { segmentCIDs: segmentsFromTrackIds, trackIdToSegments } = await this.getCIDsToBlacklist({
      allTrackIds: [...allTrackIdsToBlacklistSet],
      explicitTrackIds: new Set(trackIdsToRemove)
    })

    let segmentCIDsToRemove = segmentsFromTrackIds.concat(segmentsToRemove)
    let segmentCIDsToRemoveSet = new Set(segmentCIDsToRemove)
    segmentCIDsToRemove = [...segmentCIDsToRemoveSet]

    try {
      await this.removeFromRedis(REDIS_SET_BLACKLIST_TRACKID_KEY, trackIdsToRemove)
      await this.removeFromRedis(REDIS_SET_BLACKLIST_USERID_KEY, userIdsToRemove)
      await this.removeFromRedis(REDIS_SET_BLACKLIST_SEGMENTCID_KEY, segmentCIDsToRemove)

      // TODO: implement this removal
      // await this.addToRedis(REDIS_MAP_SEGMENTCID_TO_TRACKID_KEY, trackIdToSegments)
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
   * Retrieves all the deduped CIDs from the params and builds a mapping to <trackId: segments> for explicit trackIds (i.e. trackIds from table, not tracks belonging to users).
   * @param {Object} param
   * @param {number[]} param.allTrackIds all the trackIds to find CIDs for
   * @param {Set<number>} param.explicitTrackIds explicit trackIds from table. Used to create mapping of <trackId: segments> in redis
   * @returns
   * {
   *    segmentCIDs: <string[]> all CIDs that are BL'd
   *    trackIdToSegments: {Object<number, string[]>} trackId : CIDs
   * }
   */
  static async getCIDsToBlacklist ({ allTrackIds, explicitTrackIds }) {
    const tracks = await this.getAllCIDsFromTrackIdsInDb(allTrackIds)

    let segmentCIDs = new Set()
    let trackIdToSegments = {}

    // Retrieve CIDs from the track metadata and build mapping of <trackId: segments>
    for (const track of tracks) {
      if (!track.metadataJSON || !track.metadataJSON.track_segments) continue

      // If the current track is from the track BL and not user BL, create mapping
      if (explicitTrackIds.has(track.blockchainId)) {
        trackIdToSegments[track.blockchainId] = []
      }

      for (const segment of track.metadataJSON.track_segments) {
        if (!segment.multihash) continue

        segmentCIDs.add(segment.multihash)
        if (trackIdToSegments[track.blockchainId]) {
          trackIdToSegments[track.blockchainId].push(segment.multihash)
        }
      }
    }

    // also retrieves the CID's directly from the files table so we get copy320
    const files = await models.File.findAll({ where: { trackBlockchainId: allTrackIds } })
    for (const file of files) {
      if (file.type === 'track' || file.type === 'copy320') {
        segmentCIDs.add(file.multihash)
      }
    }

    return { segmentCIDs: [...segmentCIDs], trackIdToSegments }
  }

  static async getAllCIDsFromTrackIdsInDb (trackIds) {
    return models.Track.findAll({ where: { blockchainId: trackIds } })
  }

  static async add ({ values, type }) {
    await this.addToDb({ values, type })

    // add to redis
    switch (type) {
      case 'USER':
        // add user ids to redis under userid key + its associated track segments
        await this.fetchCIDsAndAddToRedis({ userIdsToBlacklist: values })
        break
      case 'TRACK':
        // add track ids to redis under trackid key + its associated track segments
        await this.fetchCIDsAndAddToRedis({ trackIdsToBlacklist: values })
        break
      case 'CID':
        // add segments to redis under segment key
        await this.fetchCIDsAndAddToRedis({ segmentsToBlacklist: values })
        break
    }
  }

  static async remove ({ values, type }) {
    await this.removeFromDb({ values, type })

    // add to redis
    switch (type) {
      case 'USER':
        // add user ids to redis under userid key + its associated track segments
        await this.fetchCIDsAndRemoveFromRedis({ userIdsToRemove: values })
        break
      case 'TRACK':
        // add track ids to redis under trackid key + its associated track segments
        await this.fetchCIDsAndRemoveFromRedis({ trackIdsToRemove: values })
        break
      case 'CID':
        // add segments to redis under segment key
        await this.fetchCIDsAndRemoveFromRedis({ segmentsToRemove: values })
        break
    }
  }

  /**
   * Adds ids and types as individual entries to ContentBlacklist table
   * @param {number} id user or track id
   * @param {'USER'|'TRACK'} type
   */
  static async addToDb ({ values, type }) {
    try {
      await models.ContentBlacklist.bulkCreate(values.map(value => ({
        value,
        type
      })), { ignoreDuplicates: true }) // if dupes found, do not update any columns
    } catch (e) {
      throw new Error(`Error with adding to ContentBlacklist: ${e}`)
    }

    this.log(`Sucessfully added entries with type (${type}) and values (${values}) to the ContentBlacklist table!`)
    return { type, values }
  }

  /**
   * Removes entry from Contentblacklist table
   * @param {number} id user or track id
   * @param {'USER'|'TRACK'} type
   */
  static async removeFromDb ({ values, type }) {
    let numRowsDestroyed
    try {
      numRowsDestroyed = await models.ContentBlacklist.destroy({
        where: {
          value: { [models.Sequelize.Op.in]: values }, // todo: might need to convert this to string before where clause
          type
        }
      })
    } catch (e) {
      throw new Error(`Error with removing entry with type [${type}] and id [${values.toString()}]: ${e}`)
    }

    if (numRowsDestroyed > 0) {
      this.logDebug(`Removed entry with type [${type}] and values [${values.toString()}] to the ContentBlacklist table!`)
      return { type, values }
    }

    this.logDebug(`Entry with type [${type}] and id [${values.toString()}] does not exist in ContentBlacklist.`)
    return null
  }

  /**
   * Adds key with value to redis.
   * @param {string} redisKey type of value
   * @param {number[] | string[] | object} data either array of userIds, trackIds, CIDs, or <track: CIDs mapping>
   * @param {number?} expirationSec number of seconds for entry in redis to expire
   */
  static async addToRedis (redisKey, data, expirationSec = null) {
    switch (redisKey) {
      case REDIS_MAP_TRACKID_TO_SEGMENTCIDS_KEY: {
        // Add "MAP.TRACKID.SEGMENTCIDS:::<trackId>" to set of cids into redis
        const errors = []
        for (let [trackId, cids] of Object.entries(data)) {
          trackId = parseInt(trackId)
          const redisKey = this.getRedisTrackIdToSegmentsKey(trackId)
          try {
            if (expirationSec) {
              await redis.sadd(redisKey, cids, 'EX', expirationSec)
            } else {
              await redis.sadd(redisKey, cids)
            }
          } catch (e) {
            errors.push(`Unable to add ${redisKey}:${trackId}: ${e.toString()}`)
          }
        }

        if (errors.length > 0) { this.logWarn(errors.toString()) }
        break
      }
      case REDIS_MAP_BLACKLIST_SEGMENTCID_TO_TRACKID_KEY: {
        // Add "MAP.BLACKLIST.SEGMENTCID.TRACKID:::<cid>" to set of trackIds to redis
        const errors = []
        for (let [trackId, cids] of Object.entries(data)) {
          trackId = parseInt(trackId)
          for (const cid of cids) {
            const redisCIDKey = this.getRedisBlacklistSegmentToTrackIdKey(cid)
            try {
              await redis.sadd(redisCIDKey, trackId)
            } catch (e) {
              errors.push(`Unable to add ${redisCIDKey}:${trackId}: ${e.toString()}`)
            }
          }
        }

        if (errors.length > 0) { throw new Error(errors.toString()) }
        break
      }
      case REDIS_SET_BLACKLIST_SEGMENTCID_KEY:
      case REDIS_SET_BLACKLIST_TRACKID_KEY:
      case REDIS_SET_BLACKLIST_USERID_KEY:
      default: {
        if (!data || data.length === 0) return
        try {
          const resp = await redis.sadd(redisKey, data)
          this.logDebug(`redis set add ${redisKey} response ${resp}`)
        } catch (e) {
          throw new Error(`Unable to add ${redisKey}:${data}: ${e.toString()}`)
        }
        break
      }
    }
  }

  // iter thru all the cids, add to hset <cid: trackid>

  /**
   * Removes key with value to redis. If value does not exist, redis should ignore.
   * @param {string} redisKey type of value
   * @param {number[] | string[] | object} data either array of userIds, trackIds, CIDs, or <track: CIDs mapping>
   */
  static async removeFromRedis (redisKey, data) {
    switch (redisKey) {
      case REDIS_MAP_BLACKLIST_SEGMENTCID_TO_TRACKID_KEY: {
        const errors = []
        const trackIds = Object.keys(data)
        for (const id of trackIds) {
          try {
            // TODO: FIX THIS
            await redis.hdel(REDIS_MAP_BLACKLIST_SEGMENTCID_TO_TRACKID_KEY, data[id], id)
          } catch (e) {
            this.logWarn(`Could not remove trackId=${id}: ${e.toString()}`)
          }
        }

        if (errors.length > 0) { throw new Error(errors.toString()) }
        break
      }
      case REDIS_SET_BLACKLIST_SEGMENTCID_KEY:
      case REDIS_SET_BLACKLIST_TRACKID_KEY:
      case REDIS_SET_BLACKLIST_USERID_KEY:
      default: {
        if (!data || data.length === 0) return
        try {
          const resp = await redis.srem(redisKey, data)
          this.logDebug(`redis set remove ${redisKey} response ${resp}`)
        } catch (e) {
          throw new Error(`Unable to add ${redisKey}:${data}: ${e.toString()}`)
        }
        break
      }
    }
  }

  static async isServable (cid, trackId = null) {
    // If the CID is not in the blacklist, allow serve
    const CIDIsInBlacklist = await this.CIDIsInBlacklist(cid)
    if (!CIDIsInBlacklist) return true

    // If the CID is in the blacklist and no trackId was passed in, do not serve
    // Also, if the CID is not of track type and is in the blacklist, do not serve anyway
    if (!trackId) return false

    // If the CID belongs to an explicitly blacklisted track, do not serve
    const foundCIDFromExplicitBlacklistedTrack = await this.CIDIsInExplicitlyBlacklistedTrack(trackId, cid)
    if (foundCIDFromExplicitBlacklistedTrack) return false

    // If reached here, CID not found from explicitly blacklisted track.

    // Check to see if CID belongs to input trackId from redis.
    let cidsOfInputTrackId = await this.getAllCIDsFromTrackIdInRedis(trackId)

    // If nothing is found, check the db and add to redis for quick lookup later.
    if (cidsOfInputTrackId.length === 0) {
      // If track is not in db, do not serve
      const track = (await this.getAllCIDsFromTrackIdsInDb([trackId]))[0]
      if (!track) return false

      if (track.metadataJSON && track.metadataJSON.track_segments) {
        // Add <trackId:cids> to redis for quick lookup later
        cidsOfInputTrackId = track.metadataJSON.track_segments.map(s => s.multihash)

        await this.addToRedis(
          REDIS_MAP_TRACKID_TO_SEGMENTCIDS_KEY,
          { trackId: cidsOfInputTrackId },
          SEGMENTCID_TO_TRACKID_EXPIRATION_SECONDS
        )
      }
    }

    cidsOfInputTrackId = new Set(cidsOfInputTrackId)

    // CID belongs to input trackId and the track is not blacklisted; allow serve.
    if (cidsOfInputTrackId.has(cid)) return true

    // CID does not belong to passed in trackId; do not serve
    return false
  }

  static getTypes () { return types }

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

  static getRedisBlacklistSegmentToTrackIdKey (cid) {
    return `${REDIS_MAP_BLACKLIST_SEGMENTCID_TO_TRACKID_KEY}:::${cid}`
  }

  static getRedisTrackIdToSegmentsKey (trackId) {
    return `${REDIS_MAP_TRACKID_TO_SEGMENTCIDS_KEY}:::${trackId}`
  }

  /** Checks if userId, trackId, and CID exists in redis  */

  static async userIdIsInBlacklist (userId) {
    return redis.sismember(REDIS_SET_BLACKLIST_USERID_KEY, userId)
  }

  static async trackIdIsInBlacklist (trackId) {
    return redis.sismember(REDIS_SET_BLACKLIST_TRACKID_KEY, trackId)
  }

  // Checks if the input CID is blacklisted from USER, TRACK, or SEGMENT type
  static async CIDIsInBlacklist (cid) {
    return redis.sismember(REDIS_SET_BLACKLIST_SEGMENTCID_KEY, cid)
  }

  // Check if the input CID is blacklisted from TRACK type
  static async CIDIsInExplicitlyBlacklistedTrack (trackId, cid) {
    const redisCIDKey = this.getRedisBlacklistSegmentToTrackIdKey(cid)
    return redis.sismember(redisCIDKey, trackId)
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

  /**
   * Retrieves all the blacklisted trackIds associated with the cid. This mapping is created by
   * fetching the segments from explicitly blacklisted tracks.
   * @param {string} cid the observed cid
   * @returns {string[]} the trackIds associated with the cid
   */
  static async getRelevantTrackIdsFromCID (cid) {
    const redisCIDKey = this.getRedisBlacklistSegmentToTrackIdKey(cid)
    return redis.smembers(redisCIDKey)
  }

  /**
   * Retrieve all the relevant CIDs from the input trackId in redis.
   * @param {number} trackId
   * @returns {string[]} cids associated with trackId
   */
  static async getAllCIDsFromTrackIdInRedis (trackId) {
    const redisKey = this.getRedisTrackIdToSegmentsKey(trackId)
    return redis.smembers(redisKey)
  }

  // Delete all existing redis keys
  static async deleteRedisKeys () {
    await redis.del(this.getRedisTrackIdKey())
    await redis.del(this.getRedisUserIdKey())
    await redis.del(this.getRedisSegmentCIDKey())
    await redis.del(this.getRedisBlacklistSegmentToTrackIdKey())
  }

  // Logger wrapper methods

  static logDebug (msg) {
    logger.debug(`BlacklistManager DEBUG: ${msg}`)
  }

  static log (msg) {
    logger.info(`BlacklistManager: ${msg}`)
  }

  static logWarn (msg) {
    logger.warn(`BlacklistManager WARNING: ${msg}`)
  }

  static logError (msg) {
    logger.error(`BlacklistManager ERROR: ${msg}`)
  }
}

module.exports = BlacklistManager
