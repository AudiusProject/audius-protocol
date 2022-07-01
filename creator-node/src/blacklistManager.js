const { logger } = require('./logging')
const models = require('./models')
const redis = require('./redis')
const config = require('./config')

const CID_WHITELIST = new Set(config.get('cidWhitelist').split(','))

const REDIS_SET_BLACKLIST_TRACKID_KEY = 'BM.SET.BLACKLIST.TRACKID'
const REDIS_SET_BLACKLIST_USERID_KEY = 'BM.SET.BLACKLIST.USERID'
const REDIS_SET_BLACKLIST_SEGMENTCID_KEY = 'BM.SET.BLACKLIST.SEGMENTCID'
const REDIS_MAP_TRACKID_TO_SEGMENTCIDS_KEY = 'BM.MAP.TRACKID.SEGMENTCIDS'
const REDIS_SET_INVALID_TRACKIDS_KEY = 'BM.SET.INVALID.TRACKIDS'

const SEGMENTCID_TO_TRACKID_EXPIRATION_SECONDS =
  14 /* days */ * 24 /* hours */ * 60 /* minutes */ * 60 /* seconds */
const INVALID_TRACKID_EXPIRATION_SECONDS =
  1 /* hour */ * 60 /* minutes */ * 60 /* seconds */

const PROCESS_TRACKS_BATCH_SIZE = 200

const types = models.ContentBlacklist.Types

class BlacklistManager {
  constructor() {
    this.initialized = false
  }

  static async init() {
    try {
      this.log('Initializing BlacklistManager...')

      const { trackIdsToBlacklist, userIdsToBlacklist, segmentsToBlacklist } =
        await this.getDataToBlacklist()
      await this.fetchCIDsAndAddToRedis({
        trackIdsToBlacklist,
        userIdsToBlacklist,
        segmentsToBlacklist
      })

      this.initialized = true

      this.log('Initialized BlacklistManager')
    } catch (e) {
      throw new Error(`Could not init BlacklistManager: ${e.message}`)
    }
  }

  /** Return list of trackIds, userIds, and CIDs to be blacklisted. */
  static async getDataToBlacklist() {
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

    const segmentsToBlacklist = segmentsFromCBL.map((entry) => entry.value)
    const userIdsToBlacklist = usersFromCBL.map((entry) =>
      parseInt(entry.value)
    )
    const trackIdsToBlacklist = tracksFromCBL.map((entry) =>
      parseInt(entry.value)
    )

    return { trackIdsToBlacklist, userIdsToBlacklist, segmentsToBlacklist }
  }

  /**
   * 1. Given trackIds and userIds to blacklist, fetch all segmentCIDs, and then add the ultimate set of segments to redis.
   * 2. Add the trackIds and userIds to redis as sets.
   * 3. Create mapping of explicitly blacklisted tracks with the structure <blacklisted-segmentCIDs : set of trackIds> in redis.
   */
  static async fetchCIDsAndAddToRedis({
    trackIdsToBlacklist = [],
    userIdsToBlacklist = [],
    segmentsToBlacklist = []
  }) {
    // Get all tracks from users and combine with explicit trackIds to BL
    const tracksFromUsers = await this.getTracksFromUsers(userIdsToBlacklist)
    const allTrackIdsToBlacklist = trackIdsToBlacklist.concat(
      tracksFromUsers.map((track) => track.blockchainId)
    )

    // Dedupe trackIds
    const allTrackIdsToBlacklistSet = new Set(allTrackIdsToBlacklist)

    try {
      await this.addToRedis(
        REDIS_SET_BLACKLIST_TRACKID_KEY,
        allTrackIdsToBlacklist
      )
      await this.addToRedis(REDIS_SET_BLACKLIST_USERID_KEY, userIdsToBlacklist)
      await this.addToRedis(
        REDIS_SET_BLACKLIST_SEGMENTCID_KEY,
        segmentsToBlacklist
      )
    } catch (e) {
      throw new Error(
        `[fetchCIDsAndAddToRedis] - Failed to add track ids, user ids, or explicitly blacklisted segments to blacklist: ${e.message}`
      )
    }

    await BlacklistManager.addAggregateCIDsToRedis([
      ...allTrackIdsToBlacklistSet
    ])
  }

  /**
   * Helper method to batch adding CIDs from tracks and users to the blacklist
   * @param {number[]} allTrackIdsToBlacklist aggregate list of track ids to blacklist from explicit track id blacklist and tracks from blacklisted users
   */
  static async addAggregateCIDsToRedis(allTrackIdsToBlacklist) {
    const transaction = await models.sequelize.transaction()

    let i
    for (
      i = 0;
      i < allTrackIdsToBlacklist.length;
      i = i + PROCESS_TRACKS_BATCH_SIZE
    ) {
      try {
        const tracksSlice = allTrackIdsToBlacklist.slice(
          i,
          i + PROCESS_TRACKS_BATCH_SIZE
        )

        this.logDebug(
          `[addAggregateCIDsToRedis] - tracks slice size: ${tracksSlice.length}`
        )

        const segmentsFromTrackIdsToBlacklist =
          await BlacklistManager.getCIDsToBlacklist(tracksSlice, transaction)

        this.logDebug(
          `[addAggregateCIDsToRedis] - number of segments: ${segmentsFromTrackIdsToBlacklist.length}`
        )

        await BlacklistManager.addToRedis(
          REDIS_SET_BLACKLIST_SEGMENTCID_KEY,
          segmentsFromTrackIdsToBlacklist
        )
      } catch (e) {
        await transaction.rollback()
        throw new Error(
          `[addAggregateCIDsToRedis] - Could not add tracks slice ${i} to ${
            i + PROCESS_TRACKS_BATCH_SIZE
          }: ${e.message}`
        )
      }
    }

    await transaction.commit()
  }

  /**
   * Given trackIds and userIds to remove from blacklist, fetch all segmentCIDs.
   * Also remove the trackIds, userIds, and segmentCIDs from redis blacklist sets to prevent future interaction.
   */
  static async fetchCIDsAndRemoveFromRedis({
    trackIdsToRemove = [],
    userIdsToRemove = [],
    segmentsToRemove = []
  }) {
    // Get all tracks from users and combine with explicit trackIds to BL
    const tracksFromUsers = await this.getTracksFromUsers(userIdsToRemove)
    const allTrackIdsToBlacklist = trackIdsToRemove.concat(
      tracksFromUsers.map((track) => track.blockchainId)
    )

    // Dedupe trackIds
    const allTrackIdsToBlacklistSet = new Set(allTrackIdsToBlacklist)

    // Retrieves CIDs from deduped trackIds
    const segmentsFromTrackIds = await this.getCIDsToBlacklist([
      ...allTrackIdsToBlacklistSet
    ])

    let segmentCIDsToRemove = segmentsFromTrackIds.concat(segmentsToRemove)
    const segmentCIDsToRemoveSet = new Set(segmentCIDsToRemove)
    segmentCIDsToRemove = [...segmentCIDsToRemoveSet]

    try {
      await this.removeFromRedis(
        REDIS_SET_BLACKLIST_TRACKID_KEY,
        allTrackIdsToBlacklist
      )
      await this.removeFromRedis(
        REDIS_SET_BLACKLIST_USERID_KEY,
        userIdsToRemove
      )
      await this.removeFromRedis(
        REDIS_SET_BLACKLIST_SEGMENTCID_KEY,
        segmentCIDsToRemove
      )
    } catch (e) {
      throw new Error(`Failed to remove from blacklist: ${e}`)
    }
  }

  /**
   * Retrieves track objects from specified users
   * @param {int[]} userIdsBlacklist
   */
  static async getTracksFromUsers(userIdsBlacklist) {
    let tracks = []

    if (userIdsBlacklist.length > 0) {
      tracks = (
        await models.sequelize.query(
          'select "blockchainId" from "Tracks" where "cnodeUserUUID" in (' +
            'select "cnodeUserUUID" from "AudiusUsers" where "blockchainId" in (:userIdsBlacklist)' +
            ');',
          { replacements: { userIdsBlacklist } }
        )
      )[0]
    }
    return tracks
  }

  /**
   * Retrieves all CIDs from input trackIds from db
   * @param {number[]} trackIds
   * @param {Object} transaction
   * @returns {Object[]} array of track model objects from table
   */
  static async getAllCIDsFromTrackIdsInDb(trackIds, transaction) {
    return models.Track.findAll({
      where: { blockchainId: trackIds },
      transaction
    })
  }

  /**
   * Retrieves all the deduped CIDs from the params and builds a mapping to <trackId: segments> for explicit trackIds (i.e. trackIds from table, not tracks belonging to users).
   * @param {number[]} allTrackIds all the trackIds to find CIDs for (explictly blacklisted tracks and tracks from blacklisted users)
   * @returns {string[]} all CIDs that are blacklisted from input track ids
   */
  static async getCIDsToBlacklist(inputTrackIds, transaction) {
    const tracks = await this.getAllCIDsFromTrackIdsInDb(
      inputTrackIds,
      transaction
    )

    const segmentCIDs = new Set()

    // Retrieve CIDs from the track metadata and build mapping of <trackId: segments>
    for (const track of tracks) {
      if (!track.metadataJSON || !track.metadataJSON.track_segments) continue

      for (const segment of track.metadataJSON.track_segments) {
        if (!segment.multihash || CID_WHITELIST.has(segment.multihash)) continue

        segmentCIDs.add(segment.multihash)
      }
    }

    // also retrieves the CID's directly from the files table so we get copy320
    if (inputTrackIds.length > 0) {
      const files = await models.File.findAll({
        where: {
          trackBlockchainId: inputTrackIds
        },
        transaction
      })

      for (const file of files) {
        if (
          file.type === 'track' ||
          file.type === 'copy320' ||
          !CID_WHITELIST.has(file.multihash)
        ) {
          segmentCIDs.add(file.multihash)
        }
      }
    }

    return [...segmentCIDs]
  }

  static async add({ values, type }) {
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

  static async remove({ values, type }) {
    await this.removeFromDb({ values, type })

    switch (type) {
      case 'USER':
        // Remove user ids from redis under userid key + its associated track segments
        await this.fetchCIDsAndRemoveFromRedis({ userIdsToRemove: values })
        break
      case 'TRACK':
        // Remove track ids from redis under trackid key + its associated track segments
        await this.fetchCIDsAndRemoveFromRedis({ trackIdsToRemove: values })
        break
      case 'CID':
        // Remove segments from redis under segment key
        await this.fetchCIDsAndRemoveFromRedis({ segmentsToRemove: values })
        break
    }
  }

  /**
   * Adds ids and types as individual entries to ContentBlacklist table
   * @param {number} id user or track id
   * @param {'USER'|'TRACK'|'CID'} type
   */
  static async addToDb({ values, type }) {
    try {
      await models.ContentBlacklist.bulkCreate(
        values.map((value) => ({
          value,
          type
        })),
        { ignoreDuplicates: true }
      ) // if dupes found, do not update any columns
    } catch (e) {
      throw new Error(`Error with adding to ContentBlacklist: ${e}`)
    }

    this.log(
      `Sucessfully added entries with type (${type}) and values (${values}) to the ContentBlacklist table!`
    )
    return { type, values }
  }

  /**
   * Removes entry from Contentblacklist table
   * @param {number} id user or track id
   * @param {'USER'|'TRACK'|'CID'} type
   */
  static async removeFromDb({ values, type }) {
    let numRowsDestroyed
    try {
      numRowsDestroyed = await models.ContentBlacklist.destroy({
        where: {
          value: { [models.Sequelize.Op.in]: values }, // todo: might need to convert this to string before where clause
          type
        }
      })
    } catch (e) {
      throw new Error(
        `Error with removing entry with type [${type}] and id [${values.toString()}]: ${e}`
      )
    }

    if (numRowsDestroyed > 0) {
      this.logDebug(
        `Removed entry with type [${type}] and values [${values.toString()}] to the ContentBlacklist table!`
      )
      return { type, values }
    }

    this.logDebug(
      `Entry with type [${type}] and id [${values.toString()}] does not exist in ContentBlacklist.`
    )
    return null
  }

  /**
   * Helper function to chunk redis sadd calls. There's a max limit of 1024 * 1024 items
   * so break this up into multiple redis add calls
   * https://github.com/StackExchange/StackExchange.Redis/issues/201
   * @param {string} redisKey key
   * @param {number[] | string[] | Object} data either array of userIds, trackIds, CIDs, or <trackId: [CIDs]>
   */
  static async _addToRedisChunkHelper(redisKey, data) {
    const redisAddMaxItemsSize = 100000
    try {
      this.logDebug(
        `About to call _addToRedisChunkHelper for ${redisKey} with data of length ${data.length}`
      )
      for (let i = 0; i < data.length; i += redisAddMaxItemsSize) {
        await redis.sadd(redisKey, data.slice(i, i + redisAddMaxItemsSize))
      }
    } catch (e) {
      this.logError(
        `Unable to call _addToRedisChunkHelper for ${redisKey}: ${e.message}`
      )
    }
  }

  /**
   * Adds key with value to redis.
   * @param {string} redisKey type of value
   * @param {number[] | string[] | Object} data either array of userIds, trackIds, CIDs, or <trackId: [CIDs]>
   * @param {number?} expirationSec number of seconds for entry in redis to expire
   */
  static async addToRedis(redisKey, data, expirationSec = null) {
    switch (redisKey) {
      case REDIS_MAP_TRACKID_TO_SEGMENTCIDS_KEY: {
        // Add "MAP.TRACKID.SEGMENTCIDS:::<trackId>" to set of cids into redis
        const errors = []
        for (let [trackId, cids] of Object.entries(data)) {
          trackId = parseInt(trackId)
          const redisTrackIdToCIDsKey = this.getRedisTrackIdToCIDsKey(trackId)
          try {
            await this._addToRedisChunkHelper(redisTrackIdToCIDsKey, cids)
            if (expirationSec) {
              await redis.expire(redisTrackIdToCIDsKey, expirationSec)
            }
          } catch (e) {
            errors.push(
              `Unable to add ${redisTrackIdToCIDsKey}:${trackId}: ${e.toString()}`
            )
          }
        }

        if (errors.length > 0) {
          this.logWarn(errors.toString())
        }
        break
      }
      case REDIS_SET_INVALID_TRACKIDS_KEY:
      case REDIS_SET_BLACKLIST_SEGMENTCID_KEY:
      case REDIS_SET_BLACKLIST_TRACKID_KEY:
      case REDIS_SET_BLACKLIST_USERID_KEY:
      default: {
        if (!data || data.length === 0) return
        try {
          await this._addToRedisChunkHelper(redisKey, data)
          this.logDebug(`redis set add ${redisKey} successful`)
        } catch (e) {
          throw new Error(`Unable to add ${redisKey}:${data}: ${e.toString()}`)
        }
        break
      }
    }
  }

  /**
   * Removes key with value to redis. If value does not exist, redis should ignore.
   * @param {string} redisKey type of value
   * @param {number[] | string[] | Object} data either array of userIds, trackIds, CIDs, or <trackId: [CIDs]>
   */
  static async removeFromRedis(redisKey, data) {
    switch (redisKey) {
      case REDIS_SET_BLACKLIST_SEGMENTCID_KEY:
      case REDIS_SET_BLACKLIST_TRACKID_KEY:
      case REDIS_SET_BLACKLIST_USERID_KEY:
      default: {
        if (!data || data.length === 0) return
        try {
          const resp = await redis.srem(redisKey, data)
          this.logDebug(`redis set remove ${redisKey} response ${resp}`)
        } catch (e) {
          throw new Error(
            `Unable to remove ${redisKey}:${data}: ${e.toString()}`
          )
        }
        break
      }
    }
  }

  static async isServable(cid, trackId = null) {
    try {
      // if the trackId is on the blacklist, do not serve
      const trackIdIsInBlacklist =
        trackId && Number.isInteger(trackId)
          ? await this.trackIdIsInBlacklist(trackId)
          : false
      if (trackIdIsInBlacklist) return false

      // If the CID is not in the blacklist, allow serve
      const CIDIsInBlacklist = await this.CIDIsInBlacklist(cid)
      if (!CIDIsInBlacklist) return true

      // If the CID is in the blacklist and an invalid trackId was passed in, do not serve
      // Also, if the CID is not of track type and is in the blacklist, do not serve anyway
      if (
        !trackId ||
        isNaN(trackId) ||
        trackId < 0 ||
        !Number.isInteger(trackId)
      )
        return false

      trackId = parseInt(trackId)

      // Check to see if CID belongs to input trackId from redis.
      let cidsOfInputTrackId = await this.getAllCIDsFromTrackIdInRedis(trackId)

      // If nothing is found, check redis to see if track is valid.
      // If valid, add the <trackId:[cids]> mapping redis for quick lookup later.
      // Else, add to invalid trackIds set
      if (cidsOfInputTrackId.length === 0) {
        const invalid = await this.trackIdIsInvalid(trackId)

        // If track has been marked as invalid before, do not serve
        if (invalid) {
          return false
        }

        // Check the db for the segments
        const track = (await this.getAllCIDsFromTrackIdsInDb([trackId]))[0]

        // If segments are not found, add to invalid trackIds set
        if (!track) {
          await this.addToRedis(
            REDIS_SET_INVALID_TRACKIDS_KEY,
            [trackId],
            // Set expiry in case track with this trackId eventually gets uploaded to CN
            INVALID_TRACKID_EXPIRATION_SECONDS
          )
          return false
        }

        if (track.metadataJSON && track.metadataJSON.track_segments) {
          // Track is found. Add <trackId:[cids]> to redis for quick lookup later
          cidsOfInputTrackId = track.metadataJSON.track_segments.map(
            (s) => s.multihash
          )

          await this.addToRedis(
            REDIS_MAP_TRACKID_TO_SEGMENTCIDS_KEY,
            { [trackId]: cidsOfInputTrackId },
            SEGMENTCID_TO_TRACKID_EXPIRATION_SECONDS
          )
        }
      }

      cidsOfInputTrackId = new Set(cidsOfInputTrackId)

      // CID belongs to input trackId and the track is not blacklisted; allow serve.
      if (cidsOfInputTrackId.has(cid)) return true

      // CID does not belong to passed in trackId; do not serve
      return false
    } catch (e) {
      // Error in checking CID. Default to false.
      this.logError(
        `Error in checking if CID=${cid} is servable: ${e.toString()}`
      )
      return false
    }
  }

  static getTypes() {
    return types
  }

  /** Retrieves redis keys */

  static getRedisTrackIdKey() {
    return REDIS_SET_BLACKLIST_TRACKID_KEY
  }

  static getRedisUserIdKey() {
    return REDIS_SET_BLACKLIST_USERID_KEY
  }

  static getRedisSegmentCIDKey() {
    return REDIS_SET_BLACKLIST_SEGMENTCID_KEY
  }

  static getRedisTrackIdToCIDsKey(trackId) {
    return `${REDIS_MAP_TRACKID_TO_SEGMENTCIDS_KEY}:::${trackId}`
  }

  static getInvalidTrackIdsKey() {
    return REDIS_SET_INVALID_TRACKIDS_KEY
  }

  /** Checks if userId, trackId, and CID exists in redis  */

  static async userIdIsInBlacklist(userId) {
    return redis.sismember(REDIS_SET_BLACKLIST_USERID_KEY, userId)
  }

  static async trackIdIsInBlacklist(trackId) {
    return redis.sismember(REDIS_SET_BLACKLIST_TRACKID_KEY, trackId)
  }

  // Checks if the input CID is blacklisted from USER, TRACK, or SEGMENT type
  static async CIDIsInBlacklist(cid) {
    return redis.sismember(REDIS_SET_BLACKLIST_SEGMENTCID_KEY, cid)
  }

  // Check if the input CID belongs to the track with the input trackId in redis.
  static async CIDIsInTrackRedis(trackId, cid) {
    const redisKey = this.getRedisTrackIdToCIDsKey(trackId)
    return redis.sismember(redisKey, cid)
  }

  // Check to see if the input trackId is invalid
  static async trackIdIsInvalid(trackId) {
    return redis.sismember(REDIS_SET_INVALID_TRACKIDS_KEY, trackId)
  }

  // Retrieves all CIDs in redis
  static async getAllCIDs() {
    return redis.smembers(REDIS_SET_BLACKLIST_SEGMENTCID_KEY)
  }

  // Retrieves all user ids in redis
  static async getAllUserIds() {
    return redis.smembers(REDIS_SET_BLACKLIST_USERID_KEY)
  }

  // Retrieves all track ids in redis
  static async getAllTrackIds() {
    return redis.smembers(REDIS_SET_BLACKLIST_TRACKID_KEY)
  }

  static async getAllInvalidTrackIds() {
    return redis.smembers(REDIS_SET_INVALID_TRACKIDS_KEY)
  }

  /**
   * Retrieve all the relevant CIDs from the input trackId in redis.
   * @param {number} trackId
   * @returns {string[]} cids associated with trackId
   */
  static async getAllCIDsFromTrackIdInRedis(trackId) {
    const redisKey = this.getRedisTrackIdToCIDsKey(trackId)
    return redis.smembers(redisKey)
  }

  // Logger wrapper methods

  static logDebug(msg) {
    logger.debug(`BlacklistManager DEBUG: ${msg}`)
  }

  static log(msg) {
    logger.info(`BlacklistManager: ${msg}`)
  }

  static logWarn(msg) {
    logger.warn(`BlacklistManager WARNING: ${msg}`)
  }

  static logError(msg) {
    logger.error(`BlacklistManager ERROR: ${msg}`)
  }
}

module.exports = BlacklistManager
