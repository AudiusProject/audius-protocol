const { logger } = require('./logging')
const config = require('./config')
const models = require('./models')
const redis = require('./redis')

const BlacklistInterval = 3000 // 10000ms

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
    return redis.get(`BLACKLIST.USERID.${userId}`)
  }

  static async trackIdIsInBlacklist (trackId) {
    return redis.get(`BLACKLIST.TRACKID.${trackId}`)
  }

  static async CIDIsInBlacklist (CID) {
    return redis.get(`BLACKLIST.SEGMENT.CID.${CID}`)
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

  // Add all trackIds, artistIds, and CIDs to redis blacklist
  // TODO - try-catch etc logic / what to do on failure
  for (const trackId of trackIdsToBlacklist) {
    const resp = await redis.set(`BLACKLIST.TRACKID.${trackId}`, true)
    logger.info(`redis resp track id ${resp}`)
  }
  for (const artistId of artistIdsToBlacklist) {
    const resp = await redis.set(`BLACKLIST.USERID.${artistId}`, true)
    logger.info(`redis resp artist id ${resp}`)
  }
  for (const CID of segmentCIDsToBlacklist) {
    const resp = await redis.set(`BLACKLIST.SEGMENT.CID.${CID}`, true)
    logger.info(`redis resp CID ${resp}`)
  }
}

module.exports = BlacklistManager
