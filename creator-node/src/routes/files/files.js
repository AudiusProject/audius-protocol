const express = require('express')
const Redis = require('ioredis')
const contentDisposition = require('content-disposition')

const config = require('../../config')
const models = require('../../models')
const { serviceRegistry } = require('../../serviceRegistry')
const RehydrateIpfsQueue = require('../../RehydrateIpfsQueue')
const { ipfsStat, findCIDInNetwork } = require('../../utils')

const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))
const {
  handleResponse,
  sendResponse,
  errorResponseBadRequest,
  errorResponseServerError,
  errorResponseForbidden,
  errorResponseRangeNotSatisfiable,
  successResponse,
  errorResponseNotFound
} = require('../../apiHelpers')

// Components
const getCID = require('./components/getCID')

const router = express.Router()

// Gets a CID, streaming from the filesystem if available and falling back to IPFS if not
const getCIDController = async (req, res) => {
  if (!req.params || !req.params.CID) {
    return sendResponse(req, res, errorResponseBadRequest(`Invalid request, no CID provided`))
  }

  const BlacklistManager = serviceRegistry.blacklistManager
  const cid = req.params.CID
  const trackId = parseInt(req.query.trackId)

  const isServable = await BlacklistManager.isServable(cid, trackId)
  if (!isServable) {
    return sendResponse(req, res, errorResponseForbidden(`CID=${cid} has been blacklisted by this node`))
  }

  const {storagePath, statusCode, errorMsg} = await getCID.getFileStoragePathFromDb({ cid, redisClient, models })
  
  if (statusCode === 404) {
    return sendResponse(req, res, errorResponseNotFound(errorMsg))
  }
  if (statusCode === 400) {
    return sendResponse(req, res, errorResponseBadRequest(errorMsg)) 
  }

  const totalStandaloneIpfsReqs = await getCID.updateRedisCache({ cid, redisClient, storagePath })

  req.logger.info(`IPFS Standalone Request - ${cid}`)
  req.logger.info(`IPFS Stats - Standalone Requests: ${totalStandaloneIpfsReqs}`)

  // If client has provided filename, set filename in header to be auto-populated in download prompt.
  if (req.query && req.query.filename) {
    res.setHeader('Content-Disposition', contentDisposition(req.query.filename))
  }

  // Set the CID cache-control so that client cache the response for 30 days
  res.setHeader('cache-control', 'public, max-age=2592000, immutable')

  const libs = serviceRegistry.libs || req.app.get('libs')
  try {
    return await getCID.serveCID({
      cid,
      libs,
      RehydrateIpfsQueue,
      ipfsStat,
      storagePath,
      req,
      res,
      ipfsAPI: req.app.get('ipfsClient'),
      trackId,
      findCIDInNetwork
    })
  } catch (e) {
    if (res.statusCode === 416) {
      return sendResponse(req, res, errorResponseRangeNotSatisfiable(e.message))
    }

    // If the file cannot be retrieved through fs nor IPFS, return 500 without attempting to stream file.
    return sendResponse(req, res, errorResponseServerError(e.message))
  }
}

// Routes

/**
 * Serve IPFS data hosted by creator node and create download route using query string pattern
 * `...?filename=<file_name.mp3>`.
 * @param req
 * @param req.query
 * @param {string} req.query.filename filename to set as the content-disposition header
 * @param {boolean} req.query.fromFS whether or not to retrieve directly from the filesystem and
 * rehydrate IPFS asynchronously
 * @dev This route does not handle responses by design, so we can pipe the response to client.
 * TODO: It seems like handleResponse does work with piped responses, as seen from the track/stream endpoint.
 */
router.get('/ipfs/:CID', getCIDController)

module.exports = router