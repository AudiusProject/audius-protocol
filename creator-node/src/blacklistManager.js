const { logger } = require('./logging')
const config = require('./config')
const models = require('./models')
const redis = require('./redis')

const REDIS_SET_BLACKLIST_TRACKID_KEY = "SET.BLACKLIST.TRACKID"
const REDIS_SET_BLACKLIST_USERID_KEY = "SET.BLACKLIST.USERID"
const REDIS_SET_BLACKLIST_SEGMENTCID_KEY = "SET.BLACKLIST.SEGMENTCID"

/** TODOS
 * - move queries into transaction?
 */
class BlacklistManager {
  /** COMMENT */
  static async blacklist (ipfs) {
    try {
      const { trackIdsToBlacklist, artistIdsToBlacklist } = await _buildBlacklist()
      await _processBlacklist(ipfs, trackIdsToBlacklist, artistIdsToBlacklist)
    } catch (e) {
      logger.error('PROCESSING ERROR ', e)
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

/** build list of trackIds and artistIds to be blacklisted, from configs */
async function _buildBlacklist () {
  const trackBlacklist = config.get('trackBlacklist') === "" ? [] : config.get('trackBlacklist').split(',')
  const artistBlacklist = config.get('artistBlacklist') === "" ? [] : config.get('artistBlacklist').split(',')
  
  const trackIds = new Set(trackBlacklist)

  // Fetch all tracks created by artists in artistBlacklist
  let trackBlockchainIds = []
  if (artistBlacklist.length > 0) {
    trackBlockchainIds = (await models.sequelize.query('\
      select "blockchainId" from "Tracks" where "cnodeUserUUID" in (\
        select "cnodeUserUUID" from "AudiusUsers" where "blockchainId" in (:artistBlacklist)\
      );\
    ', { replacements: { artistBlacklist } }
    ))[0]
  }
  if (trackBlockchainIds) {
    // todo - change to map
    for (const trackObj of trackBlockchainIds) {
      if (!trackObj.blockchainId) {
        throw new Error("no")
      }
      trackIds.add(trackObj.blockchainId)
    }
  }

  return { trackIdsToBlacklist: [...trackIds], artistIdsToBlacklist: artistBlacklist }
}

async function _processBlacklist (ipfs, trackIdsToBlacklist, artistIdsToBlacklist) {
  // fetch all tracks from DB
  const tracks = await models.Track.findAll({ where: { blockchainId: trackIdsToBlacklist } })

  const segmentCIDsToBlacklist = new Set()

  for (const track of tracks) {
    if (!track.metadataJSON || !track.metadataJSON.track_segments) continue

    for (const segment of track.metadataJSON.track_segments) {
      const CID = segment.multihash
      if (!CID) continue
      // unpin from IPFS
      try {
        await ipfs.pin.rm(CID)
      }
      catch (e) {
        if (e.message.indexOf('not pinned') === -1) {
          throw new Error(e)
        }
      }
      logger.info(`unpinned ${CID}`)
      segmentCIDsToBlacklist.add(CID)
    }
  }

  // Add all trackIds, artistIds, and CIDs to redis blacklist sets
  try {
    if (trackIdsToBlacklist.length > 0) {
      const resp = await redis.sadd('SET.BLACKLIST.TRACKID', trackIdsToBlacklist)
      logger.info(`redis set add SET.BLACKLIST.TRACKID response: ${resp}.`)
    }
    if (artistIdsToBlacklist.length > 0) {
      const resp = await redis.sadd('SET.BLACKLIST.USERID', artistIdsToBlacklist)
      logger.info(`redis set add SET.BLACKLIST.USERID response: ${resp}.`)
    }
    if (segmentCIDsToBlacklist.length > 0) {
      const resp = await redis.sadd('SET.BLACKLIST.SEGMENTCID', segmentCIDsToBlacklist)
      logger.info(`redis set add SET.BLACKLIST.SEGMENTCID response: ${resp}.`)
    }
    logger.info('Completed Processing trackId, userId, and segmentCid blacklists.')
  } catch (e) {
    throw new Error('Failed to process blacklist.', e)
  }
}

module.exports = BlacklistManager
