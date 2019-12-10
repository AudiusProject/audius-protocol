const { logger } = require('./logging')
const config = require('./config')
const models = require('./models')
const redis = require('./redis')

const REDIS_SET_BLACKLIST_TRACKID_KEY = 'SET.BLACKLIST.TRACKID'
const REDIS_SET_BLACKLIST_USERID_KEY = 'SET.BLACKLIST.USERID'
const REDIS_SET_BLACKLIST_SEGMENTCID_KEY = 'SET.BLACKLIST.SEGMENTCID'

class BlacklistManager {
  static async blacklist (ipfs) {
    try {
      const { trackIdsToBlacklist, userIdsToBlacklist } = await _buildBlacklist()
      await _processBlacklist(ipfs, trackIdsToBlacklist, userIdsToBlacklist)
    } catch (e) {
      throw new Error(`BLACKLIST ERROR ${e}`)
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

/** Return list of trackIds and userIds to be blacklisted. */
async function _buildBlacklist () {
  const trackBlacklist = config.get('trackBlacklist') === '' ? [] : config.get('trackBlacklist').split(',')
  const userBlacklist = config.get('userBlacklist') === '' ? [] : config.get('userBlacklist').split(',')

  const trackIds = new Set(trackBlacklist)

  // Fetch all tracks created by users in userBlacklist
  let trackBlockchainIds = []
  if (userBlacklist.length > 0) {
    trackBlockchainIds = (await models.sequelize.query(
      'select "blockchainId" from "Tracks" where "cnodeUserUUID" in (' +
        'select "cnodeUserUUID" from "AudiusUsers" where "blockchainId" in (:userBlacklist)' +
      ');'
      , { replacements: { userBlacklist } }
    ))[0]
  }
  if (trackBlockchainIds) {
    for (const trackObj of trackBlockchainIds) {
      if (trackObj.blockchainId) {
        trackIds.add(trackObj.blockchainId)
      }
    }
  }

  return { trackIdsToBlacklist: [...trackIds], userIdsToBlacklist: userBlacklist }
}

/**
 * Given trackIds and userIds to blacklist, fetch all segmentCIDs and unpin from IPFS.
 * Also add all trackIds, userIds, and segmentCIDs to redis blacklist sets to prevent future interaction.
 */
async function _processBlacklist (ipfs, trackIdsToBlacklist, userIdsToBlacklist) {
  const tracks = await models.Track.findAll({ where: { blockchainId: trackIdsToBlacklist } })

  let segmentCIDsToBlacklist = new Set()

  for (const track of tracks) {
    if (!track.metadataJSON || !track.metadataJSON.track_segments) continue

    for (const segment of track.metadataJSON.track_segments) {
      const CID = segment.multihash
      if (!CID) continue

      // unpin from IPFS
      try {
        await ipfs.pin.rm(CID)
      } catch (e) {
        if (e.message.indexOf('not pinned') === -1) {
          throw new Error(e)
        }
      }
      logger.info(`unpinned ${CID}`)
      segmentCIDsToBlacklist.add(CID)
    }
  }
  segmentCIDsToBlacklist = [...segmentCIDsToBlacklist]

  // Add all trackIds, userIds, and CIDs to redis blacklist sets.
  try {
    if (trackIdsToBlacklist.length > 0) {
      const resp = await redis.sadd('SET.BLACKLIST.TRACKID', trackIdsToBlacklist)
      logger.info(`redis set add SET.BLACKLIST.TRACKID response: ${resp}.`)
    }
    if (userIdsToBlacklist.length > 0) {
      const resp = await redis.sadd('SET.BLACKLIST.USERID', userIdsToBlacklist)
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
