const { Buffer } = require('ipfs-http-client')
const Redis = require('ioredis')

const { saveFileFromBuffer, upload } = require('../fileManager')
const { handleResponse, sendResponse, successResponse, errorResponseBadRequest, errorResponseServerError, errorResponseNotFound } = require('../apiHelpers')

const models = require('../models')
const authMiddleware = require('../authMiddleware')
const nodeSyncMiddleware = require('../redis').nodeSyncMiddleware
const { logger } = require('../logging')
const config = require('../config.js')
const client = new Redis(config.get('redisPort'), config.get('redisHost'))
const resizeImage = require('../resizeImage')

module.exports = function (app) {
  /** Store image on disk + DB and make available via IPFS */
  app.post('/image_upload', authMiddleware, nodeSyncMiddleware, upload.single('file'), handleResponse(async (req, res) => {
    // TODO: input validation
    // TODO: switch to saveFileToIPFSFromFS
    const { multihash } = await saveFileFromBuffer(req, req.file.buffer)
    return successResponse({ 'image_file_multihash': multihash })
  }))

  app.post('/image_upload2', upload.single('file'), handleResponse(async (req, res) => {
    req.logger.info('TEST')
    const resizedImage = resizeImage(req, req.file.buffer, 1000, true)
    return successResponse(resizedImage)
    // // const { multihash } = await saveFileFromBuffer(req, req.file.buffer)
    // return successResponse({ 'image': resizedImage })
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
    let queryResults = await models.File.findOne({ where: { multihash: reqMultihash } })
    if (!queryResults) {
      return sendResponse(req, res, errorResponseNotFound(`No file found for provided segment multihash: ${reqMultihash}`))
    }

    client.incr('ipfsStandaloneReqs')
    let totalStandaloneIpfsReqs = parseInt(await client.get('ipfsStandaloneReqs'))
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
