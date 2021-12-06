const Redis = require('ioredis')
const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))

const models = require('../models')
const { serviceRegistry } = require('./serviceRegistry')
const { logger: genericLogger } = require('../../logging')
const RehydrateIpfsQueue = require('../RehydrateIpfsQueue')
const { getIPFSPeerId, ipfsSingleByteCat, ipfsStat, getAllRegisteredCNodes, findCIDInNetwork, timeout } = require('../utils')

// rename this... lol
const getCID = require('./components/getCID')

// Gets a CID, streaming from the filesystem if available and falling back to IPFS if not
const getCIDController = async (req) => {
  if (!req.params || !req.params.CID) {
    return sendResponse(req, res, errorResponseBadRequest(`Invalid request, no CID provided`))
  }
  
  const BlacklistManager = serviceRegistry.blacklistManager
  const cid = req.params.CID
  const trackId = parseInt(req.query.trackId)

  const isServable = await BlacklistManager.isServable(CID, trackId)
  if (!isServable) {
    return sendResponse(req, res, errorResponseForbidden(`CID=${CID} has been blacklisted by this node`))
  }

  const storagePath = await getCID.findDbFileWithCID({cid, redisClient, models})
  const totalStandaloneIpfsReqs = await getCID.updateRedisCache(cid)

  req.logger.info(`IPFS Standalone Request - ${CID}`)
  req.logger.info(`IPFS Stats - Standalone Requests: ${totalStandaloneIpfsReqs}`)

  // If client has provided filename, set filename in header to be auto-populated in download prompt.
  if (req.query && req.query.filename) {
    res.setHeader('Content-Disposition', contentDisposition(req.query.filename))
  }

  // Set the CID cache-control so that client cache the response for 30 days
  res.setHeader('cache-control', 'public, max-age=2592000, immutable')

  const libs = serviceRegistry.libs || req.app.get('libs')
  try {
    const cid = await getCID.serveCID({
      cid,
      RehydrateIpfsQueue,
      libs,
      ipfsStat,
      req,
      res,
      ipfsAPI: req.app.get('ipfsClient')
    })
  } catch (e) {
    if (res.statusCode === 416) {
        return sendResponse(req, res, errorResponseRangeNotSatisfiable(e.message))
    }

    // If the file cannot be retrieved through fs nor IPFS, return 500 without attempting to stream file.
    return sendResponse(req, res, errorResponseServerError(e.message))
  }
}
