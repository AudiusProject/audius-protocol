const Redis = require('ioredis')
const fs = require('fs')
var contentDisposition = require('content-disposition')

const { uploadTempDiskStorage } = require('../fileManager')
const { handleResponse, sendResponse, successResponse, errorResponseBadRequest, errorResponseServerError, errorResponseNotFound, errorResponseForbidden } = require('../apiHelpers')

const models = require('../models')
const { logger } = require('../logging')
const config = require('../config.js')
const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))
const { authMiddleware, syncLockMiddleware, triggerSecondarySyncs } = require('../middlewares')
const { getIPFSPeerId, rehydrateIpfsFromFsIfNecessary, ipfsSingleByteCat } = require('../utils')
const ImageProcessingQueue = require('../ImageProcessingQueue')

module.exports = function (app) {
  /** Store image in multiple-resolutions on disk + DB and make available via IPFS */
  app.post('/image_upload', authMiddleware, syncLockMiddleware, uploadTempDiskStorage.single('file'), handleResponse(async (req, res) => {
    if (!req.body.square || !(req.body.square === 'true' || req.body.square === 'false')) {
      return errorResponseBadRequest('Must provide square boolean param in request body')
    }
    if (!req.file) {
      return errorResponseBadRequest('Must provide image file in request body.')
    }
    let routestart = Date.now()

    const imageBufferOriginal = req.file.path
    const originalFileName = req.file.originalname
    let resizeResp

    // Resize the images and add them to IPFS and filestorage
    try {
      if (req.body.square === 'true') {
        resizeResp = await ImageProcessingQueue.resizeImage({
          file: imageBufferOriginal,
          fileName: originalFileName,
          storagePath: req.app.get('storagePath'),
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
          storagePath: req.app.get('storagePath'),
          sizes: {
            '640x.jpg': 640,
            '2000x.jpg': 2000
          },
          square: false,
          logContext: req.logContext
        })
      }

      req.logger.info('ipfs add resp', resizeResp)
    } catch (e) {
      return errorResponseServerError(e)
    }

    const t = await models.sequelize.transaction()
    // Add the created files to the DB
    try {
      // Save dir file reference to DB
      const dir = (await models.File.findOrCreate({ where: {
        cnodeUserUUID: req.session.cnodeUserUUID,
        multihash: resizeResp.dir.dirCID,
        sourceFile: null,
        storagePath: resizeResp.dir.dirDestPath,
        type: 'dir'
      },
      transaction: t }))[0].dataValues

      // Save each file to the DB
      await Promise.all(resizeResp.files.map(async (fileResp) => {
        const file = (await models.File.findOrCreate({ where: {
          cnodeUserUUID: req.session.cnodeUserUUID,
          multihash: fileResp.multihash,
          sourceFile: fileResp.sourceFile,
          storagePath: fileResp.storagePath,
          type: 'image',
          dirMultihash: resizeResp.dir.dirCID,
          fileName: fileResp.sourceFile.split('/').slice(-1)[0]
        },
        transaction: t }))[0].dataValues

        req.logger.info('Added file', fileResp, file)
      }))

      req.logger.info('Added all files for dir', dir)
      req.logger.info(`route time = ${Date.now() - routestart}`)

      await t.commit()
      triggerSecondarySyncs(req)
      return successResponse({ dirCID: resizeResp.dir.dirCID })
    } catch (e) {
      await t.rollback()
      return errorResponseServerError(e)
    }
  }))

  app.get('/ipfs_peer_info', handleResponse(async (req, res) => {
    const ipfs = req.app.get('ipfsAPI')
    const ipfsIDObj = await getIPFSPeerId(ipfs, config)
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
   * @dev This route does not handle responses by design, so we can pipe the response to client.
   */
  app.get('/ipfs/:CID', async (req, res) => {
    if (!(req.params && req.params.CID)) {
      return sendResponse(req, res, errorResponseBadRequest(`Invalid request, no CID provided`))
    }

    // Do not act as a public gateway. Only serve IPFS files that are hosted by this creator node.
    const CID = req.params.CID

    // Don't serve if blacklisted.
    if (await req.app.get('blacklistManager').CIDIsInBlacklist(CID)) {
      return sendResponse(req, res, errorResponseForbidden(`CID ${CID} has been blacklisted by this node.`))
    }

    // Don't serve if not found in DB.
    const queryResults = await models.File.findOne({ where: {
      multihash: CID,
      // All other file types are valid and can be served through this route.
      type: { [models.Sequelize.Op.ne]: 'dir' } // Op.ne = notequal
    } })
    if (!queryResults) {
      return sendResponse(req, res, errorResponseNotFound(`No valid file found for provided CID: ${CID}`))
    }

    redisClient.incr('ipfsStandaloneReqs')
    const totalStandaloneIpfsReqs = parseInt(await redisClient.get('ipfsStandaloneReqs'))
    logger.info(`IPFS Standalone Request - ${CID}`)
    logger.info(`IPFS Stats - Standalone Requests: ${totalStandaloneIpfsReqs}`)

    // Conditionally rehydrate from filestorage to IPFS.
    try {
      await rehydrateIpfsFromFsIfNecessary(
        req,
        CID,
        queryResults.storagePath
      )
    } catch (e) {
      // If rehydrate throws error, return 500 without attempting to stream file.
      return sendResponse(req, res, errorResponseServerError(e.message))
    }

    // If client has provided filename, set filename in header to be auto-populated in download prompt.
    if (req.query.filename) {
      res.setHeader('Content-Disposition', contentDisposition(req.query.filename))
    }

    // Stream file to client.
    try {
      // Cat 1 byte of CID in ipfs to determine if file exists
      // If the request takes under 500ms, stream the file from ipfs
      // else if the request takes over 500ms, throw an error and stream the file from file system
      await ipfsSingleByteCat(CID, req, 500)

      // Stream file from ipfs if cat one byte takes under 500ms
      // If catReadableStream() promise is rejected, throw an error and stream from file system
      await new Promise((resolve, reject) => {
        req.app.get('ipfsAPI').catReadableStream(CID)
          .on('data', streamData => { res.write(streamData) })
          .on('end', () => { res.end(); resolve() })
          .on('error', e => { reject(e) })
      })
    } catch (e) {
      // ipfsCatSingleByte took over 500ms, try streaming from file system and
      // return the response from helper method
      return streamFromFileSystem(req, res, queryResults.storagePath)
    }
  })

  // Helper method to stream file from file system on creator node
  const streamFromFileSystem = async (req, res, path) => {
    try {
      // If file cannot be found on disk, throw error
      if (!fs.existsSync(path)) {
        return sendResponse(req, res, errorResponseServerError('File could not be found on disk.'))
      }

      // Stream file from file system
      const fileStream = fs.createReadStream(path)
      await new Promise((resolve, reject) => {
        fileStream
          .on('open', () => fileStream.pipe(res))
          .on('end', () => { res.end(); resolve() })
          .on('error', e => { reject(e) })
      })
    } catch (e) {
      // Unable to stream from file system. Throw a server error message
      return sendResponse(req, res, errorResponseServerError(e.message))
    }
  }

  /**
   * Serve images hosted by creator node on IPFS.
   * @dev This route does not handle responses by design, so we can pipe the gateway response.
   */
  app.get('/ipfs/:dirCID/:filename', async (req, res) => {
    if (!(req.params && req.params.dirCID && req.params.filename)) {
      return sendResponse(req, res, errorResponseBadRequest(`Invalid request, no multihash provided`))
    }

    // Do not act as a public gateway. Only serve IPFS files that are tracked by this creator node.
    const dirCID = req.params.dirCID
    const filename = req.params.filename

    const queryResults = await models.File.findOne({ where: {
      multihash: dirCID,
      type: 'dir'
    } })
    if (!queryResults) {
      return sendResponse(req, res, errorResponseNotFound(`No dir entry found for provided dirCID: ${dirCID}`))
    }

    // Conditionally re-add from filestorage to IPFS
    try {
      await rehydrateIpfsFromFsIfNecessary(
        req,
        dirCID,
        queryResults.storagePath,
        filename
      )
    } catch (e) {
      // If rehydrate throws error, return 500 without attempting to stream file.
      return sendResponse(req, res, errorResponseServerError(e.message))
    }

    // TODO - check if file with filename is also stored in CNODE

    const ipfsPath = `${dirCID}/${filename}`

    redisClient.incr('ipfsStandaloneReqs')
    const totalStandaloneIpfsReqs = parseInt(await redisClient.get('ipfsStandaloneReqs'))
    logger.info(`IPFS Standalone Request - ${ipfsPath}`)
    logger.info(`IPFS Stats - Standalone Requests: ${totalStandaloneIpfsReqs}`)

    try {
      await new Promise((resolve, reject) => {
        req.app.get('ipfsAPI').catReadableStream(ipfsPath)
          .on('data', streamData => { res.write(streamData) })
          .on('end', () => { res.end(); resolve() })
          .on('error', e => { reject(e) })
      })
    } catch (e) {
      return sendResponse(req, res, errorResponseServerError(e.message))
    }
  })
}
