const { Buffer } = require('ipfs-http-client')
const Redis = require('ioredis')
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)

const { saveFileFromBuffer, upload } = require('../fileManager')
const { handleResponse, sendResponse, successResponse, errorResponseBadRequest, errorResponseServerError, errorResponseNotFound } = require('../apiHelpers')

const models = require('../models')
const authMiddleware = require('../authMiddleware')
const nodeSyncMiddleware = require('../redis').nodeSyncMiddleware
const { logger } = require('../logging')
const config = require('../config.js')
const redisClient = new Redis(config.get('redisPort'), config.get('redisHost'))
const resizeImage = require('../resizeImage')

module.exports = function (app) {
  /** Store image in multiple-resolutions on disk + DB and make available via IPFS */
  app.post('/image_upload', authMiddleware, nodeSyncMiddleware, upload.single('file'), handleResponse(async (req, res) => {
    const ipfs = req.app.get('ipfsAPI')

    if (!req.body.square) return errorResponseBadRequest('Must provide square boolean param in request body')
    const squareFormat = (req.body.square === 'true')

    const imageBufferOriginal = req.file.buffer

    // Resize image to desired resolutions
    const imageBuffer1000x1000 = await resizeImage(req, imageBufferOriginal, 1000, squareFormat)
    const imageBuffer480x480 = await resizeImage(req, imageBufferOriginal, 480, squareFormat)
    const imageBuffer150x150 = await resizeImage(req, imageBufferOriginal, 150, squareFormat)
    
    const imageBuffers = [imageBuffer1000x1000, imageBuffer480x480, imageBuffer150x150, imageBufferOriginal]

    // Add directory with all images to IPFS
    const resp = await ipfs.add([
      { path: path.join(req.file.originalname, '1000x1000'), content: imageBuffer1000x1000 },
      { path: path.join(req.file.originalname, '480x480'), content: imageBuffer480x480 },
      { path: path.join(req.file.originalname, '150x150'), content: imageBuffer150x150 },
      { path: path.join(req.file.originalname, 'original'), content: imageBufferOriginal }
    ],
    { pin: true }
    )

    // Get dir CID (last entry in returned array)
    const dirCID = resp[resp.length - 1].hash
    const originalCID = resp[resp.length-2].hash

    // Save each file to disk + DB
    for (let i = 0; i < resp.length - 1; i++) {
      const fileResp = resp[i]

      // Save file to disk
      const destPath = path.join(req.app.get('storagePath'), fileResp.hash)
      await writeFile(destPath, imageBuffers[i])

      // Save file reference to DB
      const dbResp = await models.File.findOrCreate({ where:
        {
          cnodeUserUUID: req.userId,
          multihash: fileResp.hash,
          sourceFile: fileResp.path,
          storagePath: destPath
        }
      })
      const file = dbResp[0].dataValues

      req.logger.info('Added file', fileResp, file)
    }

    return successResponse({ dirCID, originalCID })
  }))

  /** upload metadata to IPFS and save in Files table */
  app.post('/metadata', authMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    const metadataJSON = req.body
    const metadataBuffer = Buffer.from(JSON.stringify(metadataJSON))
    const { multihash } = await saveFileFromBuffer(req, metadataBuffer)
    return successResponse({ 'metadataMultihash': multihash })
  }))

  app.get('/ipfs_peer_info', handleResponse(async (req, res) => {
    const ipfs = req.app.get('ipfsAPI')
    let ipfsIDObj = await ipfs.id()
    return successResponse(ipfsIDObj)
  }))

  // Serve audius network IPFS segments
  // This route does not handle responses by design, so we can pipe the gateway response
  app.get('/ipfs/:multihash', async (req, res) => {
    if (!(req.params && req.params.multihash)) {
      return sendResponse(req, res, errorResponseBadRequest(`Invalid request, no multihash provided`))
    }

    // Do not act as a public gateway. Only serve IPFS files that are tracked by this creator node.
    const reqMultihash = req.params.multihash
    // let queryResults = await models.File.findOne({ where: { multihash: reqMultihash } })
    // if (!queryResults) {
    //   return sendResponse(req, res, errorResponseNotFound(`No file found for provided segment multihash: ${reqMultihash}`))
    // }

    redisClient.incr('ipfsStandaloneReqs')
    let totalStandaloneIpfsReqs = parseInt(await redisClient.get('ipfsStandaloneReqs'))
    logger.info(`IPFS Standalone Request - ${reqMultihash}`)
    logger.info(`IPFS Stats - Standalone Requests: ${totalStandaloneIpfsReqs}`)

    const ipfs = req.app.get('ipfsAPI')
    try {
      ipfs.catReadableStream(reqMultihash)
        .on('data', streamData => { res.write(streamData) })
        .on('end', () => { res.end() })
        .on('error', e => { throw e })
    } catch (e) {
      return sendResponse(req, res, errorResponseServerError(e.message))
    }
  })
}
