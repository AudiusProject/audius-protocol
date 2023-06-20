const express = require('express')
const Redis = require('ioredis')
const fs = require('fs-extra')
const contentDisposition = require('content-disposition')

const { logger: genericLogger } = require('../logging')
const { getRequestRange, formatContentRange } = require('../utils/requestRange')
const { uploadTempDiskStorage } = require('../fileManager')
const {
  handleResponse,
  sendResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponseServerError,
  errorResponseNotFound,
  errorResponseRangeNotSatisfiable,
  handleResponseWithHeartbeat
} = require('../apiHelpers')

const models = require('../models')
const config = require('../config.js')
const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))
const {
  authMiddleware,
  ensurePrimaryMiddleware,
  issueAndWaitForSecondarySyncRequests,
  ensureStorageMiddleware
} = require('../middlewares')
const { timeout } = require('../utils')
const DBManager = require('../dbManager')
const { libs } = require('@audius/sdk')
const { sequelize } = require('../models')
const Utils = libs.Utils

const BATCH_CID_ROUTE_LIMIT = 500
const BATCH_CID_EXISTS_CONCURRENCY_LIMIT = 50
const BATCH_TRACKID_ROUTE_LIMIT = 250_000

const router = express.Router()

/**
 * Helper method to stream file from file system on creator node
 * Serves partial content if specified using range requests
 * By default, checks path for file existence before proceeding
 * If not provided, checks fs stats for path
 */
const streamFromFileSystem = async (
  req,
  res,
  path,
  checkExistence = true,
  fsStats = null
) => {
  try {
    if (checkExistence) {
      // If file cannot be found on disk, throw error
      if (!(await fs.pathExists(path))) {
        throw new Error(`File could not be found on disk, path=${path}`)
      }
    }

    // Stream file from file system
    let fileStream

    const stat = fsStats || (await fs.stat(path))
    // Add 'Accept-Ranges' if streamable
    if (req.params.streamable) {
      res.set('Accept-Ranges', 'bytes')
    }

    // If a range header is present, use that to create the readstream
    // otherwise, stream the whole file.
    const range = getRequestRange(req)

    // TODO - route doesn't support multipart ranges.
    if (stat && range) {
      let { start, end } = range
      if (end >= stat.size) {
        // Set "Requested Range Not Satisfiable" header and exit
        res.status(416)
        return sendResponse(
          req,
          res,
          errorResponseRangeNotSatisfiable('Range not satisfiable')
        )
      }

      // set end in case end is undefined or null
      end = end || stat.size - 1

      fileStream = fs.createReadStream(path, { start, end })

      // Add a content range header to the response
      res.set('Content-Range', formatContentRange(start, end, stat.size))
      res.set('Content-Length', end - start + 1)
      // set 206 "Partial Content" success status response code
      res.status(206)
    } else {
      fileStream = fs.createReadStream(path)
      res.set('Content-Length', stat.size)
    }

    // If client has provided filename, set filename in header to be auto-populated in download prompt.
    if (req.query.filename) {
      res.setHeader(
        'Content-Disposition',
        contentDisposition(req.query.filename)
      )
    }

    // If content is gated, set cache-control to no-cache.
    // Otherwise, set the CID cache-control so that client caches the response for 30 days.
    if (req.shouldCache) {
      res.setHeader('cache-control', 'public, max-age=2592000, immutable')
    } else {
      res.setHeader('cache-control', 'no-cache')
    }

    await new Promise((resolve, reject) => {
      fileStream
        .on('open', () => fileStream.pipe(res))
        .on('end', () => {
          res.end()
          resolve()
        })
        .on('error', (e) => {
          genericLogger.error(
            'streamFromFileSystem - error trying to stream from disk',
            e
          )
          reject(e)
        })
    })
  } catch (e) {
    // Unset the cache-control header so that a bad response is not cached
    res.removeHeader('cache-control')

    // Unable to stream from file system. Throw a server error message
    throw e
  }
}

/**
 * Verify that content matches its hash using the IPFS deterministic content hashing algorithm.
 * @param {Object} req
 * @param {File[]} resizeResp resizeImage.js response; should be a File[] of resized images
 * @param {string} dirCID the directory CID from `resizeResp`
 */
const _verifyContentMatchesHash = async function (req, resizeResp, dirCID) {
  const logger = genericLogger.child(req.logContext)
  const content = await _generateContentToHash(resizeResp, dirCID)

  // Re-compute dirCID from all image files to ensure it matches dirCID returned above
  const multihashes = await Utils.fileHasher.generateImageCids(
    content,
    genericLogger.child(req.logContext)
  )

  // Ensure actual and expected dirCIDs match
  const computedDirCID = multihashes[multihashes.length - 1].cid.toString()
  if (computedDirCID !== dirCID) {
    const errMsg = `Image file validation failed - dirCIDs do not match for dirCID=${dirCID} computedDirCID=${computedDirCID}.`
    logger.error(errMsg)
    throw new Error(errMsg)
  }
}

/**
 * Helper fn to generate the input for `generateImageCids()`
 * @param {File[]} resizeResp resizeImage.js response; should be a File[] of resized images
 * @param {string} dirCID the directory CID from `resizeResp`
 * @returns {Object[]} follows the structure [{path: <string>, cid: <string>}, ...] with the same number of elements
 * as the size of `resizeResp`
 */
async function _generateContentToHash(resizeResp, dirCID) {
  const contentToHash = []
  try {
    await Promise.all(
      resizeResp.files.map(async function (file) {
        const fileBuffer = await fs.readFile(file.storagePath)
        contentToHash.push({
          path: file.sourceFile,
          content: fileBuffer
        })
      })
    )
  } catch (e) {
    throw new Error(`Failed to build hashing array for dirCID ${dirCID} ${e}`)
  }

  return contentToHash
}

router.get(
  '/async_processing_status',
  handleResponse(async (req, _res) => {
    const AsyncProcessingQueue =
      req.app.get('serviceRegistry').asyncProcessingQueue

    const redisKey = AsyncProcessingQueue.constructAsyncProcessingKey(
      req.query.uuid
    )
    const value = (await redisClient.get(redisKey)) || '{}'

    return successResponse(JSON.parse(value))
  })
)

/**
 * Store image in multiple-resolutions on disk + DB
 */
router.post(
  '/image_upload',
  authMiddleware,
  ensurePrimaryMiddleware,
  ensureStorageMiddleware,
  uploadTempDiskStorage.single('file'),
  handleResponseWithHeartbeat(async (req, _res) => {
    if (
      !req.body.square ||
      !(req.body.square === 'true' || req.body.square === 'false')
    ) {
      return errorResponseBadRequest(
        'Must provide square boolean param in request body'
      )
    }
    if (!req.file) {
      return errorResponseBadRequest('Must provide image file in request body.')
    }
    const imageProcessingQueue =
      req.app.get('serviceRegistry').imageProcessingQueue

    const routestart = Date.now()
    const imageBufferOriginal = req.file.path
    const originalFileName = req.file.originalname
    const cnodeUserUUID = req.session.cnodeUserUUID

    // Resize the images and add them to filestorage
    let resizeResp
    try {
      if (req.body.square === 'true') {
        resizeResp = await imageProcessingQueue.resizeImage({
          file: imageBufferOriginal,
          fileName: originalFileName,
          sizes: {
            '150x150.jpg': 150,
            '480x480.jpg': 480,
            '1000x1000.jpg': 1000
          },
          square: true,
          logContext: req.logContext
        })
      } /** req.body.square == 'false' */ else {
        resizeResp = await imageProcessingQueue.resizeImage({
          file: imageBufferOriginal,
          fileName: originalFileName,
          sizes: {
            '640x.jpg': 640,
            '2000x.jpg': 2000
          },
          square: false,
          logContext: req.logContext
        })
      }

      req.logger.debug('ipfs add resp', resizeResp)
    } catch (e) {
      return errorResponseServerError(e)
    }

    const dirCID = resizeResp.dir.dirCID

    // Ensure image files written to disk match dirCID returned from resizeImage
    await _verifyContentMatchesHash(req, resizeResp, dirCID)

    // Record image file entries in DB
    const transaction = await models.sequelize.transaction()
    try {
      // Record dir file entry in DB
      const createDirFileQueryObj = {
        multihash: dirCID,
        sourceFile: null,
        storagePath: resizeResp.dir.dirDestPath,
        type: 'dir' // TODO - replace with models enum
      }
      await DBManager.createNewDataRecord(
        createDirFileQueryObj,
        cnodeUserUUID,
        models.File,
        transaction
      )

      // Record all image res file entries in DB
      // Must be written sequentially to ensure clock values are correctly incremented and populated
      for (const file of resizeResp.files) {
        const createImageFileQueryObj = {
          multihash: file.multihash,
          sourceFile: file.sourceFile,
          storagePath: file.storagePath,
          type: 'image', // TODO - replace with models enum
          dirMultihash: dirCID,
          fileName: file.sourceFile.split('/').slice(-1)[0]
        }
        await DBManager.createNewDataRecord(
          createImageFileQueryObj,
          cnodeUserUUID,
          models.File,
          transaction
        )
      }

      req.logger.info(`route time = ${Date.now() - routestart}`)
      await transaction.commit()
    } catch (e) {
      await transaction.rollback()
      return errorResponseServerError(e)
    }

    // Discovery only indexes metadata and not files, so we eagerly replicate data but don't await it
    issueAndWaitForSecondarySyncRequests(req, true)

    return successResponse({ dirCID })
  })
)

/**
 * Serves information on existence of given cids
 * @param req
 * @param req.body
 * @param {string[]} req.body.cids the cids to check existence for, these cids can also be directories
 * @dev This route can have a large number of CIDs as input, therefore we use a POST request.
 */
router.post(
  '/batch_cids_exist',
  handleResponse(async (req, _res) => {
    const { cids } = req.body

    if (cids && cids.length > BATCH_CID_ROUTE_LIMIT) {
      return errorResponseBadRequest(
        `Too many CIDs passed in, limit is ${BATCH_CID_ROUTE_LIMIT}`
      )
    }

    const queryResults = await models.File.findAll({
      attributes: ['multihash', 'storagePath'],
      raw: true,
      where: {
        multihash: {
          [models.Sequelize.Op.in]: cids
        }
      }
    })

    const cidExists = {}

    // Check if hash exists in disk in batches (to limit concurrent load)
    for (
      let i = 0;
      i < queryResults.length;
      i += BATCH_CID_EXISTS_CONCURRENCY_LIMIT
    ) {
      const batch = queryResults.slice(
        i,
        i + BATCH_CID_EXISTS_CONCURRENCY_LIMIT
      )
      const exists = await Promise.all(
        batch.map(({ storagePath }) => fs.pathExists(storagePath))
      )
      batch.map(({ multihash }, idx) => {
        cidExists[multihash] = exists[idx]
      })

      await timeout(250)
    }

    const cidExistanceMap = {
      cids: cids.map((cid) => ({ cid, exists: cidExists[cid] || false }))
    }

    return successResponse(cidExistanceMap)
  })
)

router.post(
  '/batch_id_to_cid',
  handleResponse(async (req, _res) => {
    const { trackIds } = req.body
    if (trackIds && trackIds.length > BATCH_TRACKID_ROUTE_LIMIT) {
      return errorResponseBadRequest(
        `Too many track IDs passed in, limit is ${BATCH_TRACKID_ROUTE_LIMIT}`
      )
    }

    const queryResults = await models.File.findAll({
      attributes: ['multihash', 'trackBlockchainId'],
      raw: true,
      where: {
        trackBlockchainId: {
          [models.Sequelize.Op.in]: trackIds
        },
        type: 'copy320'
      }
    })

    const trackIdMapping = Object.fromEntries(
      queryResults.map(({ trackBlockchainId, multihash }) => [
        trackBlockchainId,
        multihash
      ])
    )

    // return results
    return successResponse(trackIdMapping)
  })
)

router.post(
  '/segment_to_cid',
  handleResponse(async (req, _res) => {
    const { cid, wallet } = req.body
    if (!cid || !wallet) {
      return errorResponseBadRequest(`cid or wallet is missing`)
    }

    const cnodeUser = await models.CNodeUser.findOne({
      attributes: ['cnodeUserUUID'],
      raw: true,
      where: {
        walletPublicKey: wallet
      }
    })

    if (!cnodeUser) {
      return errorResponseNotFound(
        `could not find the user uuid with the wallet provided`
      )
    }

    const { cnodeUserUUID } = cnodeUser

    req.logger.debug(
      `requesting copy320 for segment ${cid} and wallet ${cnodeUserUUID}`
    )

    const queryResults = await sequelize.query(
      `
      SELECT multihash, "trackBlockchainId", "sourceFile"
      FROM "Files" 
      WHERE "sourceFile" in (
        SELECT "sourceFile" 
        FROM "Files" 
        WHERE "multihash" = :trackSegmentCid
      )
      AND "type" = 'copy320'
      AND "cnodeUserUUID" = :cnodeUserUUID
    `,
      {
        replacements: {
          trackSegmentCid: cid,
          cnodeUserUUID
        }
      }
    )

    const copy320Cid = queryResults

    return successResponse(copy320Cid)
  })
)

/**
 * Serves information on existence of given image cids
 * @param req
 * @param req.body
 * @param {string[]} req.body.cids the cids to check existence for, these cids should be directories containing original.jpg
 * @dev This route can have a large number of CIDs as input, therefore we use a POST request.
 */
router.post(
  '/batch_image_cids_exist',
  handleResponse(async (req, _res) => {
    const { cids } = req.body

    if (cids && cids.length > BATCH_CID_ROUTE_LIMIT) {
      return errorResponseBadRequest(
        `Too many CIDs passed in, limit is ${BATCH_CID_ROUTE_LIMIT}`
      )
    }

    const queryResults = await models.File.findAll({
      attributes: ['dirMultihash', 'storagePath'],
      raw: true,
      where: {
        dirMultihash: {
          [models.Sequelize.Op.in]: cids
        },
        fileName: 'original.jpg'
      }
    })

    const cidExists = {}

    // Check if hash exists in disk in batches (to limit concurrent load)
    for (
      let i = 0;
      i < queryResults.length;
      i += BATCH_CID_EXISTS_CONCURRENCY_LIMIT
    ) {
      const batch = queryResults.slice(
        i,
        i + BATCH_CID_EXISTS_CONCURRENCY_LIMIT
      )
      const exists = await Promise.all(
        batch.map(({ storagePath }) => fs.pathExists(storagePath))
      )
      batch.map(({ dirMultihash }, idx) => {
        cidExists[dirMultihash] = exists[idx]
      })

      await timeout(250)
    }

    const cidExistanceMap = {
      cids: cids.map((cid) => ({ cid, exists: cidExists[cid] || false }))
    }

    return successResponse(cidExistanceMap)
  })
)

module.exports = router
module.exports.streamFromFileSystem = streamFromFileSystem
