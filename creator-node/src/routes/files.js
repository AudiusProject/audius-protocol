const Redis = require('ioredis')
const fs = require('fs-extra')
const path = require('path')
const contentDisposition = require('content-disposition')

const {
  logger: genericLogger,
  logInfoWithDuration,
  getStartTime
} = require('../logging')
const { getRequestRange, formatContentRange } = require('../utils/requestRange')
const { uploadTempDiskStorage } = require('../fileManager')
const {
  handleResponse,
  sendResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponseServerError,
  errorResponseNotFound,
  errorResponseForbidden,
  errorResponseRangeNotSatisfiable,
  errorResponseUnauthorized,
  handleResponseWithHeartbeat
} = require('../apiHelpers')
const { recoverWallet } = require('../apiSigning')

const models = require('../models')
const config = require('../config.js')
const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))
const {
  authMiddleware,
  ensurePrimaryMiddleware,
  syncLockMiddleware,
  issueAndWaitForSecondarySyncRequests,
  ensureStorageMiddleware
} = require('../middlewares')
const {
  getAllRegisteredCNodes,
  findCIDInNetwork,
  timeout
} = require('../utils')
const ImageProcessingQueue = require('../ImageProcessingQueue')
const DBManager = require('../dbManager')
const DiskManager = require('../diskManager')
const { Utils } = require('@audius/libs')

const { promisify } = require('util')

const fsStat = promisify(fs.stat)

const FILE_CACHE_EXPIRY_SECONDS = 5 * 60
const BATCH_CID_ROUTE_LIMIT = 500
const BATCH_CID_EXISTS_CONCURRENCY_LIMIT = 50

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
      if (!fs.existsSync(path)) {
        throw new Error(`File could not be found on disk, path=${path}`)
      }
    }

    // Stream file from file system
    let fileStream

    const stat = fsStats || (await fsStat(path))
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

    await new Promise((resolve, reject) => {
      fileStream
        .on('open', () => fileStream.pipe(res))
        .on('end', () => {
          res.end()
          resolve()
        })
        .on('error', (e) => {
          reject(e)
        })
    })
  } catch (e) {
    // Unable to stream from file system. Throw a server error message
    throw e
  }
}

const getStoragePathQueryCacheKey = (path) => `storagePathQuery:${path}`

/**
 * Checks to see if the path exists and has content on fs. If path turns out to
 * be a directory, not a proper file, or an empty file, mark as error in checking.
 * @param {string} storagePath path to check
 */
const checkStoragePathForFile = async (storagePath) => {
  let fileIsEmpty = false
  try {
    const fsStats = await fs.stat(storagePath)

    if (fsStats.isDirectory()) {
      throw new Error('this dag node is a directory')
    }

    if (!fsStats.isFile()) {
      throw new Error('CID is of invalid file type')
    }

    if (fsStats.size === 0) {
      // Remove file if it is empty and force fetch from CN network
      await fs.unlink(storagePath)
      fileIsEmpty = true
    }

    // Is a valid, non-empty file
    return { fsStats, storagePath, fileIsEmpty }
  } catch (e) {
    throw new Error(
      `Could not check file stat for ${storagePath}: ${e.message}`
    )
  }
}

/**
 * Given a CID, return the appropriate file
 * 1. Check if file exists at expected storage path (current and legacy)
 * 1. If found, stream from FS
 * 2. Else, check if CID exists in DB. If not, return 404 not found error
 * 3. If exists in DB, fetch file from CN network, save to FS, and stream from FS
 * 4. If not avail in CN network, respond with 400 server error
 */
const getCID = async (req, res) => {
  if (!req.params || !req.params.CID) {
    return sendResponse(
      req,
      res,
      errorResponseBadRequest(`Invalid request, no CID provided`)
    )
  }

  const CID = req.params.CID
  const trackId = parseInt(req.query.trackId)
  const BlacklistManager = req.app.get('blacklistManager')

  const logPrefix = `[getCID] [CID=${CID}]`

  let codeBlockTimeStart = getStartTime()
  const isServable = await BlacklistManager.isServable(CID, trackId)
  logInfoWithDuration(
    { logger: req.logger, startTime: codeBlockTimeStart },
    `${logPrefix} Content is servable: ${isServable}`
  )

  if (!isServable) {
    return sendResponse(
      req,
      res,
      errorResponseForbidden(
        `${logPrefix} CID has been blacklisted by this node`
      )
    )
  }

  // Check file existence on fs with new storage path pattern
  const storagePaths = []
  try {
    const storagePath = DiskManager.computeFilePath(CID, false)
    storagePaths.push(storagePath)
  } catch (e) {
    req.logger.warn(`${logPrefix} Could not compute storage path: ${e.message}`)
  }

  try {
    const storagePath = DiskManager.computeLegacyFilePath(CID)
    storagePaths.push(storagePath)
  } catch (e) {
    req.logger.warn(
      `${logPrefix} Could not compute legacy storage path: ${e.message}`
    )
  }

  // Check file existence in storage paths. Exit for-loop immediately when file exists
  const errors = []
  let checkStorageResponse
  for (const storagePath of storagePaths) {
    try {
      checkStorageResponse = await checkStoragePathForFile(storagePath)
      break
    } catch (e) {
      const errorMsg = `Failed attempt with path ${storagePath}: ${e.message}`
      req.logger.warn(`${logPrefix} ${errorMsg}`)
      errors.push(errorMsg)
    }
  }

  if (!errors.length > 0) {
    return sendResponse(req, res, errorResponseBadRequest(errors.toString()))
  }

  let {
    fsStats,
    storagePath: storagePathWhereFileExists,
    fileIsEmpty
  } = checkStorageResponse

  // If client has provided filename, set filename in header to be auto-populated in download prompt.
  if (req.query.filename) {
    res.setHeader('Content-Disposition', contentDisposition(req.query.filename))
  }

  // Set the CID cache-control so that client caches the response for 30 days
  res.setHeader('cache-control', 'public, max-age=2592000, immutable')

  try {
    if (fileIsEmpty) {
      throw new Error('File is empty. Attempting to fetch from CN network..')
    }

    return streamFromFileSystem(
      req,
      res,
      storagePathWhereFileExists,
      false,
      fsStats
    )
  } catch (e) {
    req.logger.warn(`${logPrefix} Could not stream file from fs: ${e.message}`)
  }

  // At this point, the file does not exist in the fs in the new nor legacy storage paths.

  // The DB existence is the source of truth whether content should live in in the node.
  // If found in DB, query the CN network for the content and serve. Else, respond with 404

  try {
    codeBlockTimeStart = getStartTime()
    const queryResults = await models.File.findOne({
      where: {
        multihash: CID
      },
      order: [['clock', 'DESC']]
    })
    logInfoWithDuration(
      { logger: req.logger, startTime: codeBlockTimeStart },
      `${logPrefix} Content query search duration`
    )

    if (!queryResults) {
      return sendResponse(
        req,
        res,
        errorResponseNotFound('No valid file found for provided CID')
      )
    }

    if (queryResults.type === 'dir') {
      return sendResponse(
        req,
        res,
        errorResponseBadRequest('this dag node is a directory')
      )
    }

    storagePathWhereFileExists = queryResults.storagePath
  } catch (e) {
    const errorMsg = `${logPrefix} DB query failed: ${e.message}`
    req.logger.error(errorMsg)
    return sendResponse(req, res, errorResponseServerError(errorMsg))
  }

  try {
    codeBlockTimeStart = getStartTime()
    const found = await findCIDInNetwork(
      storagePathWhereFileExists,
      CID,
      req.logger,
      req.app.get('audiusLibs'),
      trackId
    )
    logInfoWithDuration(
      { logger: req.logger, startTime: codeBlockTimeStart },
      `${logPrefix} Found cid: ${found}`
    )

    if (!found) {
      throw new Error('Not found in network')
    }

    return streamFromFileSystem(req, res, storagePathWhereFileExists, false)
  } catch (e) {
    const errorMsg = `${logPrefix} ${e.message}`
    req.logger.error(errorMsg)
    return sendResponse(req, res, errorResponseServerError(errorMsg))
  }
}

// Gets a CID in a directory, streaming from the filesystem if available
const getDirCID = async (req, res) => {
  if (!(req.params && req.params.dirCID && req.params.filename)) {
    return sendResponse(
      req,
      res,
      errorResponseBadRequest(`Invalid request, no multihash provided`)
    )
  }

  // Do not act as a public gateway. Only serve files that are tracked by this creator node.
  const dirCID = req.params.dirCID
  const filename = req.params.filename
  const path = `${dirCID}/${filename}`

  const cacheKey = getStoragePathQueryCacheKey(path)

  let storagePath = await redisClient.get(cacheKey)
  if (!storagePath) {
    // Don't serve if not found in DB.
    // Query for the file based on the dirCID and filename
    const queryResults = await models.File.findOne({
      where: {
        dirMultihash: dirCID,
        fileName: filename
      },
      order: [['clock', 'DESC']]
    })
    if (!queryResults) {
      return sendResponse(
        req,
        res,
        errorResponseNotFound(
          `No valid file found for provided dirCID: ${dirCID} and filename: ${filename}`
        )
      )
    }
    storagePath = queryResults.storagePath
    redisClient.set(cacheKey, storagePath, 'EX', FILE_CACHE_EXPIRY_SECONDS)
  }

  // Set the CID cache-control so that client cache the response for 30 days
  res.setHeader('cache-control', 'public, max-age=2592000, immutable')

  // Attempt to stream file to client
  try {
    req.logger.info(`Retrieving ${storagePath} directly from filesystem`)
    return await streamFromFileSystem(req, res, storagePath)
  } catch (e) {
    req.logger.info(`Failed to retrieve ${storagePath} from FS`)
  }

  // Attempt to find and stream CID from other content nodes in the network
  try {
    // CID is the file CID, parse it from the storagePath
    const CID = storagePath.split('/').slice(-1).join('')
    const libs = req.app.get('audiusLibs')
    await findCIDInNetwork(storagePath, CID, req.logger, libs)
    return await streamFromFileSystem(req, res, storagePath)
  } catch (e) {
    req.logger.error(
      `Error calling findCIDInNetwork for path ${storagePath}`,
      e
    )
    // Unset the cache-control header so that a bad response is not cached
    res.removeHeader('cache-control')
    return sendResponse(req, res, errorResponseServerError(e.message))
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

module.exports = function (app) {
  app.get(
    '/async_processing_status',
    handleResponse(async (req, res) => {
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
  app.post(
    '/image_upload',
    authMiddleware,
    ensurePrimaryMiddleware,
    ensureStorageMiddleware,
    syncLockMiddleware,
    uploadTempDiskStorage.single('file'),
    handleResponseWithHeartbeat(async (req, res) => {
      if (
        !req.body.square ||
        !(req.body.square === 'true' || req.body.square === 'false')
      ) {
        return errorResponseBadRequest(
          'Must provide square boolean param in request body'
        )
      }
      if (!req.file) {
        return errorResponseBadRequest(
          'Must provide image file in request body.'
        )
      }

      const routestart = Date.now()
      const imageBufferOriginal = req.file.path
      const originalFileName = req.file.originalname
      const cnodeUserUUID = req.session.cnodeUserUUID

      // Resize the images and add them to filestorage
      let resizeResp
      try {
        if (req.body.square === 'true') {
          resizeResp = await ImageProcessingQueue.resizeImage({
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
          resizeResp = await ImageProcessingQueue.resizeImage({
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

      // Must be awaitted and cannot be try-catched, ensuring that error from inside this rejects request
      await issueAndWaitForSecondarySyncRequests(req)

      return successResponse({ dirCID })
    })
  )

  /**
   * Serve data hosted by creator node and create download route using query string pattern
   * `...?filename=<file_name.mp3>`.
   * IPFS is not used anymore -- this route only exists with this name because the client uses it in prod
   * @param req
   * @param req.query
   * @param {string} req.query.filename filename to set as the content-disposition header
   * @dev This route does not handle responses by design, so we can pipe the response to client.
   * TODO: It seems like handleResponse does work with piped responses, as seen from the track/stream endpoint.
   */
  app.get(['/ipfs/:CID', '/content/:CID'], getCID)

  /**
   * Serve images hosted by content node.
   * IPFS is not used anymore -- this route only exists with this name because the client uses it in prod
   * @param req
   * @param req.query
   * @param {string} req.query.filename the actual filename to retrieve w/in the IPFS directory (e.g. 480x480.jpg)
   * @dev This route does not handle responses by design, so we can pipe the gateway response.
   * TODO: It seems like handleResponse does work with piped responses, as seen from the track/stream endpoint.
   */
  app.get(['/ipfs/:dirCID/:filename', '/content/:dirCID/:filename'], getDirCID)

  /**
   * Serves information on existence of given cids
   * @param req
   * @param req.body
   * @param {string[]} req.body.cids the cids to check existence for, these cids can also be directories
   * @dev This route can have a large number of CIDs as input, therefore we use a POST request.
   */
  app.post(
    '/batch_cids_exist',
    handleResponse(async (req, res) => {
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

      const cidExistenceMap = {
        cids: cids.map((cid) => ({ cid, exists: cidExists[cid] || false }))
      }

      return successResponse(cidExistenceMap)
    })
  )

  /**
   * Serves information on existence of given image cids
   * @param req
   * @param req.body
   * @param {string[]} req.body.cids the cids to check existence for, these cids should be directories containing original.jpg
   * @dev This route can have a large number of CIDs as input, therefore we use a POST request.
   */
  app.post(
    '/batch_image_cids_exist',
    handleResponse(async (req, res) => {
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

      const cidExistenceMap = {
        cids: cids.map((cid) => ({ cid, exists: cidExists[cid] || false }))
      }

      return successResponse(cidExistenceMap)
    })
  )

  /**
   * Serve file from FS given a storage path
   * This is a cnode-cnode only route, not to be consumed by clients. It has auth restrictions to only
   * allow calls from cnodes with delegateWallets registered on chain
   * @dev No handleResponse around this route because it doesn't play well with our route handling abstractions,
   * same as the /ipfs route
   * @param req.query.filePath the fs path for the file. should be full path including leading /file_storage
   * @param req.query.delegateWallet the wallet address that signed this request
   * @param req.query.timestamp the timestamp when the request was made
   * @param req.query.signature the hashed signature of the object {filePath, delegateWallet, timestamp}
   * @param {string?} req.query.trackId the trackId of the requested file lookup
   */
  app.get('/file_lookup', async (req, res) => {
    const BlacklistManager = req.app.get('blacklistManager')
    const { filePath, timestamp, signature } = req.query
    let { delegateWallet, trackId } = req.query
    delegateWallet = delegateWallet.toLowerCase()
    trackId = parseInt(trackId)

    // no filePath passed in
    if (!filePath)
      return sendResponse(
        req,
        res,
        errorResponseBadRequest(`Invalid request, no path provided`)
      )

    // check that signature is correct and delegateWallet is registered on chain
    const recoveredWallet = recoverWallet(
      { filePath, delegateWallet, timestamp },
      signature
    ).toLowerCase()
    const libs = req.app.get('audiusLibs')
    const creatorNodes = await getAllRegisteredCNodes(libs)
    const foundDelegateWallet = creatorNodes.some(
      (node) => node.delegateOwnerWallet.toLowerCase() === recoveredWallet
    )
    if (recoveredWallet !== delegateWallet || !foundDelegateWallet) {
      return sendResponse(
        req,
        res,
        errorResponseUnauthorized(`Invalid wallet signature`)
      )
    }
    const filePathNormalized = path.normalize(filePath)

    // check that the regex works and verify it's not blacklisted
    const matchObj = DiskManager.extractCIDsFromFSPath(filePathNormalized)
    if (!matchObj)
      return sendResponse(
        req,
        res,
        errorResponseBadRequest(`Invalid filePathNormalized provided`)
      )

    const { outer, inner } = matchObj
    let isServable = await BlacklistManager.isServable(outer, trackId)
    if (!isServable) {
      return sendResponse(
        req,
        res,
        errorResponseForbidden(
          `CID=${outer} has been blacklisted by this node.`
        )
      )
    }

    res.setHeader('Content-Disposition', contentDisposition(outer))

    // inner will only be set for image dir CID
    // if there's an inner CID, check if CID is blacklisted and set content disposition header
    if (inner) {
      isServable = await BlacklistManager.isServable(inner, trackId)
      if (!isServable) {
        return sendResponse(
          req,
          res,
          errorResponseForbidden(
            `CID=${inner} has been blacklisted by this node.`
          )
        )
      }
      res.setHeader('Content-Disposition', contentDisposition(inner))
    }

    try {
      return await streamFromFileSystem(req, res, filePathNormalized)
    } catch (e) {
      return sendResponse(
        req,
        res,
        errorResponseNotFound(`File with path not found`)
      )
    }
  })
}

module.exports.getCID = getCID
module.exports.streamFromFileSystem = streamFromFileSystem
