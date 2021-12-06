const { promisify } = require('util')
const fs = require('fs-extra')
const fsStat = promisify(fs.stat)

const { getRequestRange, formatContentRange } = require('../../../utils/requestRange')

const FILE_CACHE_EXPIRY_SECONDS = 5 * 60

async function getFileStoragePathFromDb ({ cid, redisClient, models }) {
  const cacheKey = getStoragePathQueryCacheKey(cid)

  let storagePath = await redisClient.get(cacheKey)
  if (!storagePath) {
    // Don't serve if not found in DB.
    const queryResults = await models.File.findOne({
      where: {
        multihash: cid
      },
      order: [['clock', 'DESC']]
    })
    if (!queryResults) {
      // errorResponseNotFound
      throw new Error(`No valid file found for provided CID: ${cid}`)
    }

    // errorResponseBadRequest
    if (queryResults.type === 'dir') {
      throw new Error('this dag node is a directory')
    }

    storagePath = queryResults.storagePath
  }

  return storagePath
}

async function updateRedisCache ({ redisClient, cid, storagePath }) {
  const cacheKey = getStoragePathQueryCacheKey(cid)

  redisClient.set(cacheKey, storagePath, 'EX', FILE_CACHE_EXPIRY_SECONDS)
  redisClient.incr('ipfsStandaloneReqs')
  const totalStandaloneIpfsReqs = parseInt(await redisClient.get('ipfsStandaloneReqs'))

  return totalStandaloneIpfsReqs
}

// Gets a CID, streaming from the filesystem if available and falling back to IPFS if not
async function serveCID ({ cid, libs, RehydrateIpfsQueue, ipfsStat, storagePath, req, res, ipfsAPI, trackId, findCIDInNetwork }) {
  // Add a rehydration task to the queue to be processed in the background.
  // If this call errors, ignore the exception thrown.
  RehydrateIpfsQueue.addRehydrateIpfsFromFsIfNecessaryTask(cid, storagePath, { logContext: req.logContext })

  // Attempt to stream file to client from filesystem
  try {
    req.logger.info(`Retrieving ${storagePath} directly from filesystem`)
    return await streamFromFileSystem(req, res, storagePath)
  } catch (e) {
    req.logger.warn(`Failed to retrieve ${storagePath} from FS`, e)

    // ugly nested try/catch but don't want findCIDInNetwork to stop execution of the rest of the route
    try {
      await findCIDInNetwork(storagePath, cid, req.logger, libs, trackId)
      return await streamFromFileSystem(req, res, storagePath)
    } catch (e) {
      req.logger.error(`Error calling findCIDInNetwork for path ${storagePath}`, e)
    }
  }

  try {
    // Add content length headers
    // If the IPFS stat call fails or timesout, an error is thrown
    await streamFromIpfs({ ipfsAPI, ipfsStat, cid, req, res })
  } catch (e) {
    // Unset the cache-control header so that a bad response is not cached
    res.removeHeader('cache-control')

    throw e
  }
}

/**
 * Helper method to stream file from file system on creator node
 * Serves partial content using range requests
 */
async function streamFromFileSystem (req, res, path) {
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
        // return sendResponse(req, res, errorResponseRangeNotSatisfiable('Range not satisfiable'))
        throw new Error('Range not satisfiable')
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

async function streamFromIpfs ({ ipfsAPI, ipfsStat, cid, res, req }) {
  const stat = await ipfsStat(cid, req.logContext, 500)
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
        // return sendResponse(req, res, errorResponseRangeNotSatisfiable('Range not satisfiable'))
        throw new Error('Range not satisfiable')
      }

      // set end in case end is undefined or null
      end = end || (stat.size - 1)

      // Set length to be end - start + 1 so it matches behavior of fs.createReadStream
      const length = end - start + 1
      stream = ipfsAPI.catReadableStream(
        cid, { offset: start, length }
      )
      // Add a content range header to the response
      res.set('Content-Range', formatContentRange(start, end, stat.size))
      res.set('Content-Length', end - start + 1)
      // set 206 "Partial Content" success status response code
      res.status(206)
    } else {
      stream = ipfsAPI.catReadableStream(cid)
      res.set('Content-Length', stat.size)
    }

    stream
      .on('data', streamData => { res.write(streamData) })
      .on('end', () => { res.end(); resolve() })
      .on('error', e => { reject(e) })
  })
}

async function getStoragePathQueryCacheKey (path) {
  return `storagePathQuery:${path}`
}

module.exports = {
  getFileStoragePathFromDb,
  updateRedisCache,
  serveCID
}
