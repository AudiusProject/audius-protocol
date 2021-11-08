const Redis = require('ioredis')
const fs = require('fs-extra')
const path = require('path')
var contentDisposition = require('content-disposition')

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
const { getIPFSPeerId, ipfsSingleByteCat, ipfsStat, getAllRegisteredCNodes, findCIDInNetwork, timeout } = require('../utils')
const ImageProcessingQueue = require('../ImageProcessingQueue')
const RehydrateIpfsQueue = require('../RehydrateIpfsQueue')
const DBManager = require('../dbManager')
const DiskManager = require('../diskManager')
const { constructProcessKey, PROCESS_NAMES } = require('../FileProcessingQueue')
const { ipfsAddImages } = require('../ipfsAdd')

const { promisify } = require('util')

const fsStat = promisify(fs.stat)

const FILE_CACHE_EXPIRY_SECONDS = 5 * 60
const BATCH_CID_ROUTE_LIMIT = 500
const BATCH_CID_EXISTS_CONCURRENCY_LIMIT = 50
const IMAGE_UPLOAD_IPFS_VERIFICATION_RETRY_COUNT = 5

/**
 * Helper method to stream file from file system on creator node
 * Serves partial content using range requests
 */
const streamFromFileSystem = async (req, res, path) => {
  try {
    // If file cannot be found on disk, throw error
    if (!fs.existsSync(path)) {
      throw new Error('File could not be found on disk.')
    }

    // Stream file from file system
    let fileStream

    let stat
    stat = await fsStat(path)
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
        return sendResponse(req, res, errorResponseRangeNotSatisfiable('Range not satisfiable'))
      }

      // set end in case end is undefined or null
      end = end || (stat.size - 1)

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
        .on('end', () => { res.end(); resolve() })
        .on('error', e => { reject(e) })
    })
  } catch (e) {
    // Unable to stream from file system. Throw a server error message
    throw e
  }
}

const getStoragePathQueryCacheKey = (path) => `storagePathQuery:${path}`

// Gets a CID, streaming from the filesystem if available and falling back to IPFS if not
const getCID = async (req, res) => {
  if (!(req.params && req.params.CID)) {
    return sendResponse(req, res, errorResponseBadRequest(`Invalid request, no CID provided`))
  }

  // Do not act as a public gateway. Only serve IPFS files that are hosted by this creator node.
  const BlacklistManager = req.app.get('blacklistManager')
  const CID = req.params.CID
  const trackId = parseInt(req.query.trackId)

  const isServable = await BlacklistManager.isServable(CID, trackId)
  if (!isServable) {
    return sendResponse(req, res, errorResponseForbidden(`CID=${CID} has been blacklisted by this node`))
  }

  const cacheKey = getStoragePathQueryCacheKey(CID)

  let storagePath = await redisClient.get(cacheKey)
  if (!storagePath) {
    // Don't serve if not found in DB.
    const queryResults = await models.File.findOne({
      where: {
        multihash: CID
      },
      order: [['clock', 'DESC']]
    })
    if (!queryResults) {
      return sendResponse(req, res, errorResponseNotFound(`No valid file found for provided CID: ${CID}`))
    }

    if (queryResults.type === 'dir') {
      return sendResponse(req, res, errorResponseBadRequest('this dag node is a directory'))
    }

    storagePath = queryResults.storagePath
    redisClient.set(cacheKey, storagePath, 'EX', FILE_CACHE_EXPIRY_SECONDS)
  }

  redisClient.incr('ipfsStandaloneReqs')
  const totalStandaloneIpfsReqs = parseInt(await redisClient.get('ipfsStandaloneReqs'))
  req.logger.info(`IPFS Standalone Request - ${CID}`)
  req.logger.info(`IPFS Stats - Standalone Requests: ${totalStandaloneIpfsReqs}`)

  // If client has provided filename, set filename in header to be auto-populated in download prompt.
  if (req.query.filename) {
    res.setHeader('Content-Disposition', contentDisposition(req.query.filename))
  }

  // Set the CID cache-control so that client cache the response for 30 days
  res.setHeader('cache-control', 'public, max-age=2592000, immutable')

  try {
    // Add a rehydration task to the queue to be processed in the background
    RehydrateIpfsQueue.addRehydrateIpfsFromFsIfNecessaryTask(CID, storagePath, { logContext: req.logContext })
    // Attempt to stream file to client.
    req.logger.info(`Retrieving ${storagePath} directly from filesystem`)
    return await streamFromFileSystem(req, res, storagePath)
  } catch (e) {
    req.logger.info(`Failed to retrieve ${storagePath} from FS`)

    // ugly nested try/catch but don't want findCIDInNetwork to stop execution of the rest of the route
    try {
      const libs = req.app.get('audiusLibs')
      await findCIDInNetwork(storagePath, CID, req.logger, libs, trackId)
      return await streamFromFileSystem(req, res, storagePath)
    } catch (e) {
      req.logger.error(`Error calling findCIDInNetwork for path ${storagePath}`, e)
    }
  }

  try {
    // Add content length headers
    // If the IPFS stat call fails or timesout, an error is thrown
    const stat = await ipfsStat(CID, req.logContext, 500)
    res.set('Accept-Ranges', 'bytes')

    // Stream file from ipfs if cat one byte takes under 500ms
    // If catReadableStream() promise is rejected, throw an error and stream from file system
    await new Promise((resolve, reject) => {
      let stream
      // If a range header is present, use that to create the ipfs stream
      const range = getRequestRange(req)

      if (req.params.streamable && range) {
        let { start, end } = range
        if (end >= stat.size) {
          // Set "Requested Range Not Satisfiable" header and exit
          res.status(416)
          return sendResponse(req, res, errorResponseRangeNotSatisfiable('Range not satisfiable'))
        }

        // set end in case end is undefined or null
        end = end || (stat.size - 1)

        // Set length to be end - start + 1 so it matches behavior of fs.createReadStream
        const length = end - start + 1
        stream = req.app.get('ipfsAPI').catReadableStream(
          CID, { offset: start, length }
        )
        // Add a content range header to the response
        res.set('Content-Range', formatContentRange(start, end, stat.size))
        res.set('Content-Length', end - start + 1)
        // set 206 "Partial Content" success status response code
        res.status(206)
      } else {
        stream = req.app.get('ipfsAPI').catReadableStream(CID)
        res.set('Content-Length', stat.size)
      }

      stream
        .on('data', streamData => { res.write(streamData) })
        .on('end', () => { res.end(); resolve() })
        .on('error', e => { reject(e) })
    })
  } catch (e) {
    // Unset the cache-control header so that a bad response is not cached
    res.removeHeader('cache-control')

    // If the file cannot be retrieved through IPFS, return 500 without attempting to stream file.
    return sendResponse(req, res, errorResponseServerError(e.message))
  }
}

// Gets a CID in a directory, streaming from the filesystem if available and
// falling back to IPFS if not
const getDirCID = async (req, res) => {
  if (!(req.params && req.params.dirCID && req.params.filename)) {
    return sendResponse(req, res, errorResponseBadRequest(`Invalid request, no multihash provided`))
  }

  // Do not act as a public gateway. Only serve IPFS files that are tracked by this creator node.
  const dirCID = req.params.dirCID
  const filename = req.params.filename
  const ipfsPath = `${dirCID}/${filename}`

  const cacheKey = getStoragePathQueryCacheKey(ipfsPath)

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
        errorResponseNotFound(`No valid file found for provided dirCID: ${dirCID} and filename: ${filename}`)
      )
    }
    storagePath = queryResults.storagePath
    redisClient.set(cacheKey, storagePath, 'EX', FILE_CACHE_EXPIRY_SECONDS)
  }

  // Lop off the last bit of the storage path (the child CID)
  // to get the parent storage path for IPFS rehydration
  const parentStoragePath = storagePath.split('/').slice(0, -1).join('/')

  redisClient.incr('ipfsStandaloneReqs')
  const totalStandaloneIpfsReqs = parseInt(await redisClient.get('ipfsStandaloneReqs'))
  req.logger.info(`IPFS Standalone Request - ${ipfsPath}`)
  req.logger.info(`IPFS Stats - Standalone Requests: ${totalStandaloneIpfsReqs}`)

  // Set the CID cache-control so that client cache the response for 30 days
  res.setHeader('cache-control', 'public, max-age=2592000, immutable')

  try {
    // Add rehydrate task to queue to be processed in background
    RehydrateIpfsQueue.addRehydrateIpfsFromFsIfNecessaryTask(dirCID, parentStoragePath, { logContext: req.logContext }, filename)
    // Attempt to stream file to client.
    req.logger.info(`Retrieving ${storagePath} directly from filesystem`)
    return await streamFromFileSystem(req, res, storagePath)
  } catch (e) {
    req.logger.info(`Failed to retrieve ${storagePath} from FS`)

    // ugly nested try/catch but don't want findCIDInNetwork to stop execution of the rest of the route
    try {
      // CID is the file CID, parse it from the storagePath
      const CID = storagePath.split('/').slice(-1).join('')
      const libs = req.app.get('audiusLibs')
      await findCIDInNetwork(storagePath, CID, req.logger, libs)
      return await streamFromFileSystem(req, res, storagePath)
    } catch (e) {
      req.logger.error(`Error calling findCIDInNetwork for path ${storagePath}`, e)
    }
  }

  try {
    // For files not found on disk, attempt to stream from IPFS
    // Cat 1 byte of CID in ipfs to determine if file exists
    // If the request takes under 500ms, stream the file from ipfs
    // else if the request takes over 500ms, throw an error
    await ipfsSingleByteCat(ipfsPath, req.logContext, 500)

    await new Promise((resolve, reject) => {
      req.app.get('ipfsAPI').catReadableStream(ipfsPath)
        .on('data', streamData => { res.write(streamData) })
        .on('end', () => { res.end(); resolve() })
        .on('error', e => { reject(e) })
    })
  } catch (e) {
    // Unset the cache-control header so that a bad response is not cached
    res.removeHeader('cache-control')
    return sendResponse(req, res, errorResponseServerError(e.message))
  }
}

/**
 * Perform IPFS verification with retries
 *
 * Use retries because for some reason IPFS (very rarely) fails due to some non-deterministic error. Seems to be with the verification step; the files are correct.
 * Wait fixed timeout between each retry, hopefully addresses IPFS non-deterministic errors
 * @param {Object} req
 * @param {File[]} resizeResp resizeImage.js response; should be a File[] of resized images
 * @param {string} dirCID the directory CID from `resizeResp`
 * @param {number?} maxRetries the max number of retries for ipfs verification
 * @param {boolean?} enableIPFSAdd flag to enable or disable ipfs daemon add
 */
const _dirCIDIPFSVerificationWithRetries = async function (req, resizeResp, dirCID, maxRetries = IMAGE_UPLOAD_IPFS_VERIFICATION_RETRY_COUNT, enableIPFSAdd = false) {
  let ipfsAddContent = await _generateIpfsAddContent(resizeResp, dirCID)

  // Re-compute dirCID from all image files to ensure it matches dirCID returned above
  await _addToIpfsWithRetries({
    content: ipfsAddContent,
    enableIPFSAdd,
    dirCID,
    retriesLeft: maxRetries,
    maxRetries,
    logContext: req.logContext
  })
}

/**
 * Helper fn to generate the input for `ipfsAddImages()`
 * @param {File[]} resizeResp resizeImage.js response; should be a File[] of resized images
 * @param {string} dirCID the directory CID from `resizeResp`
 * @returns {Object[]} follows the structure [{path: <string>, cid: <string>}, ...] with the same number of elements
 * as the size of `resizeResp`
 */
async function _generateIpfsAddContent (resizeResp, dirCID) {
  let ipfsAddContent = []
  try {
    await Promise.all(resizeResp.files.map(async function (file) {
      const fileBuffer = await fs.readFile(file.storagePath)
      ipfsAddContent.push({
        path: file.sourceFile,
        content: fileBuffer
      })
    }))
  } catch (e) {
    throw new Error(`Failed to build ipfs add array for dirCID ${dirCID} ${e}`)
  }

  return ipfsAddContent
}

/**
 * Helper fn that recurisvely calls itself `maxRetries` amount of times. Will throw if inconsistency still
 * occurs after `maxRetries` attempts.
 * @param {Object[]} content content to add to ipfs. Has the structure [{path: <string>, content: <Buffer>}, ...]
 * @param {boolean} enableIPFSAdd flag to enable adding to ipfs daemon
 * @param {string} dirCID the directory CID from `resizeResp`
 * @param {number} retriesLeft the number of retires left for ipfs verification
 * @param {number} maxRetries the max number of retries for ipfs verification
 * @param {Object} logContext
 */
async function _addToIpfsWithRetries ({ content, enableIPFSAdd, dirCID, retriesLeft, maxRetries, logContext }) {
  const logger = genericLogger.child(logContext)

  const ipfsAddRespArr = await ipfsAddImages(
    content,
    {
      pin: false,
      onlyHash: true,
      timeout: 1000
    },
    logContext,
    enableIPFSAdd
  )

  // Ensure actual and expected dirCIDs match
  const ipfsAddRetryDirCID = ipfsAddRespArr[ipfsAddRespArr.length - 1].cid.toString()
  if (ipfsAddRetryDirCID !== dirCID) {
    if (--retriesLeft > 0) {
      logger.warn(`Image file validation failed - dirCIDs do not match for dirCID=${dirCID} ipfsAddRetryDirCID=${ipfsAddRetryDirCID}. ${retriesLeft} retries remaining out of ${maxRetries}. Retrying...`)
      // If the only hash logic fails on first attempt, successive only hash logic attempts will produce the same results. At this point, add to ipfs
      await _addToIpfsWithRetries({
        content,
        enableIPFSAdd: true,
        dirCID,
        retriesLeft,
        maxRetries,
        logContext,
        logger
      })
    } else {
      const errMsg = `Image file validation failed - dirCIDs do not match for dirCID=${dirCID} ipfsAddRetryDirCID=${ipfsAddRetryDirCID}. Failed after all ${maxRetries} retries.`
      logger.error(errMsg)
      throw new Error(errMsg)
    }
  }
}

module.exports = function (app) {
  app.get('/track_content_status', handleResponse(async (req, res) => {
    const redisKey = constructProcessKey(PROCESS_NAMES.transcode, req.query.uuid)
    const value = await redisClient.get(redisKey) || '{}'

    return successResponse(JSON.parse(value))
  }))

  /**
   * Store image in multiple-resolutions on disk + DB and make available via IPFS
   */
  app.post('/image_upload', authMiddleware, ensurePrimaryMiddleware, ensureStorageMiddleware, syncLockMiddleware, uploadTempDiskStorage.single('file'), handleResponseWithHeartbeat(async (req, res) => {
    if (!req.body.square || !(req.body.square === 'true' || req.body.square === 'false')) {
      return errorResponseBadRequest('Must provide square boolean param in request body')
    }
    if (!req.file) {
      return errorResponseBadRequest('Must provide image file in request body.')
    }

    const routestart = Date.now()
    const imageBufferOriginal = req.file.path
    const originalFileName = req.file.originalname
    const cnodeUserUUID = req.session.cnodeUserUUID

    // Resize the images and add them to IPFS and filestorage
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
      } else /** req.body.square == 'false' */ {
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
    await _dirCIDIPFSVerificationWithRetries(req, resizeResp, dirCID)

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
      await DBManager.createNewDataRecord(createDirFileQueryObj, cnodeUserUUID, models.File, transaction)

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
        await DBManager.createNewDataRecord(createImageFileQueryObj, cnodeUserUUID, models.File, transaction)
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
  }))

  app.get('/ipfs_peer_info', handleResponse(async (req, res) => {
    const ipfs = req.app.get('ipfsAPI')
    const ipfsIDObj = await getIPFSPeerId(ipfs)
    if (req.query.caller_ipfs_id) {
      try {
        req.logger.info(`Connection to ${req.query.caller_ipfs_id}`)
        await ipfs.swarm.connect(req.query.caller_ipfs_id)
      } catch (e) {
        if (!e.message.includes('dial to self')) {
          req.logger.error(e)
        }
      }
    }
    return successResponse(ipfsIDObj)
  }))

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
  app.get('/ipfs/:CID', getCID)

  /**
   * Serve images hosted by creator node on IPFS.
   * @param req
   * @param req.query
   * @param {string} req.query.filename the actual filename to retrieve w/in the IPFS directory (e.g. 480x480.jpg)
   * @param {boolean} req.query.fromFS whether or not to retrieve directly from the filesystem and
   * rehydrate IPFS asynchronously
   * @dev This route does not handle responses by design, so we can pipe the gateway response.
   * TODO: It seems like handleResponse does work with piped responses, as seen from the track/stream endpoint.
   */
  app.get('/ipfs/:dirCID/:filename', getDirCID)

  /**
   * Serves information on existence of given cids
   * @param req
   * @param req.body
   * @param {string[]} req.body.cids the cids to check existence for, these cids can also be directories
   * @dev This route can have a large number of CIDs as input, therefore we use a POST request.
   */
  app.post('/batch_cids_exist', handleResponse(async (req, res) => {
    const { cids } = req.body

    if (cids && cids.length > BATCH_CID_ROUTE_LIMIT) {
      return errorResponseBadRequest(`Too many CIDs passed in, limit is ${BATCH_CID_ROUTE_LIMIT}`)
    }

    const queryResults = (await models.File.findAll({
      attributes: ['multihash', 'storagePath'],
      raw: true,
      where: {
        multihash: {
          [models.Sequelize.Op.in]: cids
        }
      }
    }))

    let cidExists = {}

    // Check if hash exists in disk in batches (to limit concurrent load)
    for (let i = 0; i < queryResults.length; i += BATCH_CID_EXISTS_CONCURRENCY_LIMIT) {
      const batch = queryResults.slice(i, i + BATCH_CID_EXISTS_CONCURRENCY_LIMIT)
      const exists = await Promise.all(batch.map(
        ({ storagePath }) => fs.pathExists(storagePath)
      ))
      batch.map(({ multihash }, idx) => {
        cidExists[multihash] = exists[idx]
      })

      await timeout(250)
    }

    const cidExistanceMap = {
      cids: cids.map(cid => ({ cid, exists: cidExists[cid] || false }))
    }

    return successResponse(cidExistanceMap)
  }))

  /**
   * Serves information on existence of given image cids
   * @param req
   * @param req.body
   * @param {string[]} req.body.cids the cids to check existence for, these cids should be directories containing original.jpg
   * @dev This route can have a large number of CIDs as input, therefore we use a POST request.
   */
  app.post('/batch_image_cids_exist', handleResponse(async (req, res) => {
    const { cids } = req.body

    if (cids && cids.length > BATCH_CID_ROUTE_LIMIT) {
      return errorResponseBadRequest(`Too many CIDs passed in, limit is ${BATCH_CID_ROUTE_LIMIT}`)
    }

    const queryResults = (await models.File.findAll({
      attributes: ['dirMultihash', 'storagePath'],
      raw: true,
      where: {
        dirMultihash: {
          [models.Sequelize.Op.in]: cids
        },
        fileName: 'original.jpg'
      }
    }))

    let cidExists = {}

    // Check if hash exists in disk in batches (to limit concurrent load)
    for (let i = 0; i < queryResults.length; i += BATCH_CID_EXISTS_CONCURRENCY_LIMIT) {
      const batch = queryResults.slice(i, i + BATCH_CID_EXISTS_CONCURRENCY_LIMIT)
      const exists = await Promise.all(batch.map(
        ({ storagePath }) => fs.pathExists(storagePath)
      ))
      batch.map(({ dirMultihash }, idx) => {
        cidExists[dirMultihash] = exists[idx]
      })

      await timeout(250)
    }

    const cidExistanceMap = {
      cids: cids.map(cid => ({ cid, exists: cidExists[cid] || false }))
    }

    return successResponse(cidExistanceMap)
  }))

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
    if (!filePath) return sendResponse(req, res, errorResponseBadRequest(`Invalid request, no path provided`))

    // check that signature is correct and delegateWallet is registered on chain
    const recoveredWallet = recoverWallet({ filePath, delegateWallet, timestamp }, signature).toLowerCase()
    const libs = req.app.get('audiusLibs')
    const creatorNodes = await getAllRegisteredCNodes(libs)
    const foundDelegateWallet = creatorNodes.some(node => node.delegateOwnerWallet.toLowerCase() === recoveredWallet)
    if ((recoveredWallet !== delegateWallet) || !foundDelegateWallet) {
      return sendResponse(req, res, errorResponseUnauthorized(`Invalid wallet signature`))
    }
    const filePathNormalized = path.normalize(filePath)

    // check that the regex works and verify it's not blacklisted
    const matchObj = DiskManager.extractCIDsFromFSPath(filePathNormalized)
    if (!matchObj) return sendResponse(req, res, errorResponseBadRequest(`Invalid filePathNormalized provided`))

    const { outer, inner } = matchObj
    let isServable = await BlacklistManager.isServable(outer, trackId)
    if (!isServable) {
      return sendResponse(req, res, errorResponseForbidden(`CID=${outer} has been blacklisted by this node.`))
    }

    res.setHeader('Content-Disposition', contentDisposition(outer))

    // inner will only be set for image dir CID
    // if there's an inner CID, check if CID is blacklisted and set content disposition header
    if (inner) {
      isServable = await BlacklistManager.isServable(inner, trackId)
      if (!isServable) {
        return sendResponse(req, res, errorResponseForbidden(`CID=${inner} has been blacklisted by this node.`))
      }
      res.setHeader('Content-Disposition', contentDisposition(inner))
    }

    try {
      return await streamFromFileSystem(req, res, filePathNormalized)
    } catch (e) {
      return sendResponse(req, res, errorResponseNotFound(`File with path not found`))
    }
  })
}

module.exports.getCID = getCID
