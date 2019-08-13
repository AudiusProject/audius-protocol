const { saveFileFromBuffer, upload } = require('../fileManager')
const { handleResponse, sendResponse, successResponse, errorResponseBadRequest, errorResponseServerError, errorResponseNotFound } = require('../apiHelpers')

const models = require('../models')
const authMiddleware = require('../authMiddleware')
const nodeSyncMiddleware = require('../redis').nodeSyncMiddleware
const { logger } = require('../logging')
let config = require('../config.js')
let Redis = require('ioredis')
let client = new Redis(config.get('redisPort'), config.get('redisHost'))

module.exports = function (app) {
  // upload image file and make avail
  // TODO(ss) - input validation
  app.post('/image_upload', authMiddleware, nodeSyncMiddleware, upload.single('file'), handleResponse(async (req, res) => {
    const { multihash } = await saveFileFromBuffer(req, req.file.buffer)
    return successResponse({ 'image_file_multihash': multihash })
  }))

  // upload metadata to IPFS and save in Files table
  app.post('/metadata', authMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    const ipfs = req.app.get('ipfsAPI')
    const metadataJSON = req.body
    const metadataBuffer = ipfs.types.Buffer.from(JSON.stringify(metadataJSON))
    const { multihash } = await saveFileFromBuffer(req, metadataBuffer)
    return successResponse({ 'metadataMultihash': multihash })
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
