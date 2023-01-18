const path = require('path')
const fs = require('fs-extra')
const multer = require('multer')
const getUuid = require('uuid/v4')
const axios = require('axios')

const config = require('./config')
const Utils = require('./utils')
const { libs: audiusLibs } = require('@audius/sdk')
const DiskManager = require('./diskManager')
const { logger: genericLogger } = require('./logging')
const { sendResponse, errorResponseBadRequest } = require('./apiHelpers')
const DecisionTree = require('./utils/decisionTree')
const { asyncRetry } = require('./utils/asyncRetry')
const { getAllRegisteredCNodes } = require('./services/ContentNodeInfoManager')
const { getIfAttemptedStateFix } = require('./utils')

const LibsUtils = audiusLibs.Utils

const MAX_AUDIO_FILE_SIZE = parseInt(config.get('maxAudioFileSizeBytes')) // Default = 250,000,000 bytes = 250MB
const MAX_MEMORY_FILE_SIZE = parseInt(config.get('maxMemoryFileSizeBytes')) // Default = 50,000,000 bytes = 50MB
const ALLOWED_UPLOAD_FILE_EXTENSIONS = config.get('allowedUploadFileExtensions') // default set in config.json
const AUDIO_MIME_TYPE_REGEX = /audio\/(.*)/

/**
 * Saves file to disk under /multihash name
 */
async function saveFileFromBufferToDisk(req, buffer, numRetries = 5) {
  // Make sure user has authenticated before saving file
  if (!req.session.cnodeUserUUID) {
    throw new Error('User must be authenticated to save a file')
  }

  const cid = await LibsUtils.fileHasher.generateNonImageCid(
    buffer,
    genericLogger.child(req.logContext)
  )

  // Write file to disk by cid for future retrieval
  const dstPath = await Utils.computeFilePathAndEnsureItExists(cid)
  await fs.writeFile(dstPath, buffer)

  // verify that the contents of the file match the file's cid
  try {
    const fileSize = (await fs.stat(dstPath)).size
    const fileIsEmpty = fileSize === 0
    // there is one case where an empty file could be valid, check for that CID explicitly
    if (fileIsEmpty && cid !== Utils.EMPTY_FILE_CID) {
      throw new Error(`File has no content, content length is 0: ${cid}`)
    }

    const expectedCID = await LibsUtils.fileHasher.generateNonImageCid(
      dstPath,
      genericLogger.child(req.logContext)
    )
    if (cid !== expectedCID) {
      // delete this file because the next time we run sync and we see it on disk, we'll assume we have it and it's correct
      throw new Error(
        `File contents don't match their expected CID. CID: ${cid} expected CID: ${expectedCID}`
      )
    }
  } catch (e) {
    await removeFile(dstPath)
    if (numRetries > 0) {
      return saveFileFromBufferToDisk(req, buffer, numRetries - 1)
    }
    throw new Error(
      `saveFileFromBufferToDisk - Error during content verification for multihash ${cid} ${e.message}`
    )
  }

  return { cid, dstPath }
}

/**
 * Store file copy by CID for future retrieval
 * @param {String} multihash CID which will be computed into a destination path to copy to
 * @param {String} srcPath path to content to copy
 * @param {Object} logContext
 * @returns the destination path of where the content was copied to
 */
async function copyMultihashToFs(multihash, srcPath, logContext) {
  const logger = genericLogger.child(logContext)
  const dstPath = await Utils.computeFilePathAndEnsureItExists(multihash)

  try {
    await fs.copyFile(srcPath, dstPath)
  } catch (e) {
    // if we see a ENOSPC error, log out the disk space and inode details from the system
    if (e.message.includes('ENOSPC')) {
      await Promise.all([
        Utils.runShellCommand(`df`, ['-h'], logger),
        Utils.runShellCommand(`df`, ['-ih'], logger)
      ])
    }
    throw e
  }

  return dstPath
}

/**
 * Fetches a file from the target gateways (usually the replica set of a user),
 * then the network if it is not found on the target gateways.
 *
 * This is an internal function, not intended to be called directly outside FileManager
 *
 * Retries occur when:
 * - fetching from the target gateways result in 500s or 404s
 * - writing to fs fails
 * - verifying cids fails
 * - fetching from network gateways result in 500s
 *
 * @param {Object} param Object passed into function
 * @param {string[]} param.targetGatewayContentRoutes list of CN endpoints with /ipfs/<cid>
 * @param {string[]} param.nonTargetGatewayContentRoutes list of non-targetGateway CN endpoints with /ipfs/<cid>. this is an optimization used for falling back to fetching from non-replica set nodes
 * @param {string} param.multihash the target cid
 * @param {string} param.storageLocation the path to save the cid to
 * @param {number} param.numRetries the number of max retries
 * @param {number|undefined} param.trackId the trackId associated with a multihash if there is one
 * @param {Object} param.decisionTree instance of DecisionTree
 * @param {Object} param.logger
 */
async function fetchFileFromNetworkAndWriteToDisk({
  targetGatewayContentRoutes = [],
  nonTargetGatewayContentRoutes = [],
  multihash,
  storageLocation,
  numRetries,
  trackId,
  decisionTree,
  logger
}) {
  // First try to fetch from other cnode gateways if user has non-empty replica set.
  decisionTree.recordStage({
    name: 'About to fetch content via gateways'
  })

  // Note - Requests are intentionally not parallel to minimize additional load on gateways
  for (const contentUrl of targetGatewayContentRoutes) {
    decisionTree.recordStage({
      name: 'Fetching from target gateways',
      data: { targetGateway: contentUrl }
    })

    try {
      await _fetchFileFromNetworkAndWriteToDiskAscyncRetryHelper({
        contentUrl,
        trackId,
        multihash,
        decisionTree,
        storageLocation,
        logger,
        numRetries
      })

      decisionTree.recordStage({
        name: 'Successfully fetched CID from target gateway',
        data: { targetGateway: contentUrl }
      })

      // If successful, will reach this point in code. Return out of fn
      return
    } catch (e) {
      decisionTree.recordStage({
        name: 'Error - Could not retrieve file from gateway',
        data: {
          url: contentUrl,
          errorMsg: e.message,
          multihash
        }
      })
    }
  }

  // If file is not found in replica set, check network (remaining registered nodes)
  // this is the replacement for the old findCIDInNetwork call
  // short circuit calling the rest of the network if env var is not enabled or
  // the rest of the network has already been checked the network today
  if (!config.get('findCIDInNetworkEnabled'))
    throw new Error(`findCIDInNetworkEnabled = false`)

  const attemptedStateFix = await getIfAttemptedStateFix(storageLocation)
  if (attemptedStateFix)
    throw new Error(
      `Already attempted to find from network; Currently cannot try again`
    )

  for (const contentUrl of nonTargetGatewayContentRoutes) {
    decisionTree.recordStage({
      name: 'Fetching from non-replica set gateways from the rest of the network',
      data: { gateway: contentUrl }
    })

    try {
      await _fetchFileFromNetworkAndWriteToDiskAscyncRetryHelper({
        contentUrl,
        trackId,
        multihash,
        decisionTree,
        storageLocation,
        logger,
        numRetries
      })

      decisionTree.recordStage({
        name: 'Successfully fetched CID from non-replica set gateway',
        data: { gateway: contentUrl }
      })

      // If successful, will reach this point in code. Return out of fn
      return
    } catch (e) {
      decisionTree.recordStage({
        name: 'Error - Could not retrieve file from non-replica set gateway',
        data: {
          url: contentUrl,
          errorMsg: e.message,
          multihash
        }
      })
    }
  }

  decisionTree.recordStage({
    name: `Failed to find file from network`
  })

  // error if file was not found on any gateway
  const errorMsg = `Failed to retrieve file for multihash ${multihash} after trying entire network`
  decisionTree.recordStage({
    name: errorMsg
  })
  throw new Error(errorMsg)
}

/**
 * Helper for fetchFileFromNetworkAndWriteToDisk() that wraps asyncRetry logic
 * and parses response and error codes
 * @param {Object} param0
 * @param {string} param.contentUrl content gateway url eg example.io/ipfs/Qmxyz
 * @param {number|undefined} param.trackId the trackId associated with a multihash if there is one
 * @param {string} param.multihash the target cid
 * @param {Object} param.decisionTree instance of DecisionTree
 * @param {string} param.storageLocation the path to save the cid to
 * @param {Object} param.logger
 * @param {number} param.numRetries the number of max retries
 */
async function _fetchFileFromNetworkAndWriteToDiskAscyncRetryHelper({
  contentUrl,
  trackId,
  multihash,
  decisionTree,
  storageLocation,
  logger,
  numRetries
}) {
  await asyncRetry({
    asyncFn: async (bail, num) => {
      try {
        await fetchFileFromTargetGatewayAndWriteToDisk({
          contentUrl,
          trackId,
          multihash,
          decisionTree,
          storageLocation,
          logger
        })
      } catch (e) {
        /**
         * Abort retries if fetch fails with 403, 401, or 400 status code
         *
         * e.response.status will contain error from axios request inside fetchFileFromTargetGatewayAndWriteToDisk(), if one is thrown
         */
        if (
          e.response?.status === 403 || // delist
          e.response?.status === 401 || // unauth
          e.response?.status === 400 // bad request
        ) {
          decisionTree.recordStage({
            name: 'Could not fetch content from target gateway',
            data: {
              statusCode: e.response.status,
              url: contentUrl
            }
          })
          bail(
            new Error(
              `Content is delisted, request is unauthorized, or the request is bad with statusCode=${e.response?.status}`
            )
          )
          return
        }

        // Re-throw any other error to continue with retry logic
        const errorMsgStr = e.response?.status
          ? `statusCode=${e.response?.status}`
          : `error=${e.message}`
        if (num === numRetries + 1) {
          // Final error thrown
          throw new Error(
            `Failed to fetch content with ${errorMsgStr} after ${num} retries`
          )
        } else {
          throw new Error(
            `Failed to fetch content with ${errorMsgStr}. Retrying..`
          )
        }
      }
    },
    logger,
    log: false,
    options: {
      retries: numRetries
    }
  })
}

/**
 * Fetches a multihash via the /ipfs route, writes to disk, and verifies that the CID is what we
 * expect it to be with retries
 *
 * This is an internal function, not intended to be called directly outside FileManager
 * @param {Object} param
 * @param {string} param.contentUrl the target content node ipfs gateway route
 * @param {number} param.trackId the track id if one is associated with the multihash fetched
 * @param {Object} param.decisionTree an instance of DecisionTree
 * @param {string} param.storageLocation the path at which to save the fetched multihash from
 * @param {Object} param.logger
 */
async function fetchFileFromTargetGatewayAndWriteToDisk({
  contentUrl,
  trackId,
  multihash,
  decisionTree,
  storageLocation,
  logger
}) {
  const fetchReqParams = {
    method: 'get',
    url: contentUrl,
    responseType: 'stream',
    timeout: 20000 /* 20 sec - higher timeout to allow enough time to fetch copy320 */,
    params: { localOnly: true }
  }

  if (trackId) {
    fetchReqParams.params = {
      trackId
    }
  }

  // Will throw error on non-200 response
  const response = await axios(fetchReqParams)

  if (!response || !response.data) {
    throw new Error(`Received empty response`)
  }

  decisionTree.recordStage({
    name: 'Retrieved file from target gateway',
    data: { url: contentUrl }
  })

  await Utils.writeStreamToFileSystem(response.data, storageLocation)

  decisionTree.recordStage({
    name: 'Wrote file to file system after fetching from target gateway',
    data: { storageLocation }
  })

  const CIDMatchesExpected = await Utils.verifyCIDMatchesExpected({
    cid: multihash,
    path: storageLocation,
    logger,
    decisionTree
  })

  if (!CIDMatchesExpected) {
    try {
      await fs.unlink(storageLocation)
    } catch (e) {
      logger.error(
        `Could not remove file at storageLocation=${storageLocation}`
      )
    }
    throw new Error('CID does not match what is expected to be')
  }
}

/**
 * Given a CID, saves the file to disk. Steps to achieve that:
 * 1. do the prep work to save the file to the local file system including
 *    creating directories
 * 2. attempt to fetch the CID from user's replica set nodes followed by
 *    all other nodes in the network
 * 3. return boolean failure content retrieval or content verification failure
 * @param {Object} libs
 * @param {Object} logger
 * @param {String} multihash CID
 * @param {String?} dirCID image dir CID if applicable
 * @param {Array?} targetGateways List of gateway endpoints to try. May be all the registered Content Nodes, or just the user replica set.
 * @param {String?} fileNameForImage file name if the CID is image in dir.
 *                  eg original.jpg or 150x150.jpg
 * @param {number?} trackId if the CID is of a segment type, the trackId to which it belongs to
 * @param {number?} numRetries optional number of times to retry this function if there was an error during content verification
 * @return {error?: Error, storagePath?: String} object with nested fields containing error object or storagePath string
 */
async function fetchFileFromNetworkAndSaveToFS(
  libs,
  logger,
  multihash,
  dirCID = null,
  targetGateways = [],
  fileNameForImage = null,
  trackId = null,
  numRetries = 3
) {
  const decisionTree = new DecisionTree({
    name: `fetchFileFromNetworkAndSaveToFS() [multihash: ${multihash}][dirCID: ${dirCID}][fileNameForImage: ${fileNameForImage}][trackId: ${trackId}]`,
    logger
  })

  let storageLocation
  try {
    let targetGatewayContentRoutes
    let nonTargetGatewayContentRoutes

    const allContentNodes = (await getAllRegisteredCNodes(logger)).map(
      (gateway) => gateway.endpoint
    )

    // Remove target gateways + this self endpoint from list
    const nonTargetGateways = allContentNodes.filter(
      (c) =>
        !targetGateways.includes(c) && config.get('creatorNodeEndpoint') !== c
    )

    // if this is a directory, make it compatible with our dir cid gateway url
    // [https://endpoint.co/ipfs/Qm111/150x150.jpg, https://endpoint.co/ipfs/Qm222/150x150.jpg ...]
    if (dirCID && fileNameForImage) {
      targetGatewayContentRoutes = targetGateways.map(
        (endpoint) =>
          `${endpoint.replace(/\/$/, '')}/ipfs/${dirCID}/${fileNameForImage}`
      )
      nonTargetGatewayContentRoutes = nonTargetGateways.map(
        (endpoint) =>
          `${endpoint.replace(/\/$/, '')}/ipfs/${dirCID}/${fileNameForImage}`
      )
      decisionTree.recordStage({
        name: 'Set targetGatewayContentRoutes and nonTargetGatewayContentRoutes for dir',
        data: { nonTargetGatewayContentRoutes, targetGatewayContentRoutes }
      })

      storageLocation = await Utils.computeFilePathInDirAndEnsureItExists(
        dirCID,
        multihash
      )
    } else {
      // if it's not a directory, make it a regular gateway route
      // eg [https://endpoint.co/ipfs/Qm111, https://endpoint.co/ipfs/Qm222 ...]
      // TODO - don't concat url's by hand like this, use module like urljoin
      // ..replace(/\/$/, "") removes trailing slashes

      targetGatewayContentRoutes = targetGateways.map((endpoint) => {
        let baseUrl = `${endpoint.replace(/\/$/, '')}/ipfs/${multihash}`
        if (trackId) baseUrl += `?trackId=${trackId}`

        return baseUrl
      })

      nonTargetGatewayContentRoutes = nonTargetGateways.map((endpoint) => {
        let baseUrl = `${endpoint.replace(/\/$/, '')}/ipfs/${multihash}`
        if (trackId) baseUrl += `?trackId=${trackId}`

        return baseUrl
      })

      storageLocation = await Utils.computeFilePathAndEnsureItExists(multihash)

      decisionTree.recordStage({
        name: 'Set targetGatewayContentRoutes and nonTargetGatewayContentRoutes for non-dir file',
        data: { nonTargetGatewayContentRoutes, targetGatewayContentRoutes }
      })
    }

    decisionTree.recordStage({
      name: 'About to start running fetchFileFromNetworkAndSaveToFS()',
      data: {
        multihash,
        storageLocation
      },
      logLevel: 'debug'
    })

    /**
     * Attempts to fetch CID:
     *  - If file already stored on disk, return immediately
     *  - If file not already stored, request from user's replica set gateways in parallel and write to disk if file exists
     *  - If file does not exist on user's replica set, try the network and write to disk if file exists
     */

    if (await fs.pathExists(storageLocation)) {
      decisionTree.recordStage({
        name: 'Success - File already stored on disk',
        data: { storageLocation }
      })

      return { storagePath: storageLocation }
    }

    // Create dir at expected storage path in which to store retrieved data
    const storageLocationParentDir = path.parse(storageLocation).dir
    try {
      // calling this on an existing directory doesn't overwrite the existing data or throw an error
      // the mkdir recursive is equivalent to `mkdir -p`
      await fs.mkdir(storageLocationParentDir, { recursive: true })
      decisionTree.recordStage({
        name: 'Successfully called mkdir on local file system',
        data: {
          storageLocationParentDir
        }
      })
    } catch (e) {
      decisionTree.recordStage({
        name: 'Error calling mkdir on local file system',
        data: { storageLocationParentDir }
      })
      throw new Error(
        `Error making directory at ${storageLocationParentDir} - ${e.message}`
      )
    }

    // This function will throw error in any scenario where the file was not successfully saved to disk at expected `storageLocation`
    await fetchFileFromNetworkAndWriteToDisk({
      targetGatewayContentRoutes,
      nonTargetGatewayContentRoutes,
      multihash,
      storageLocation,
      numRetries,
      logger,
      decisionTree,
      trackId
    })
  } catch (e) {
    decisionTree.recordStage({
      name: 'fetchFileFromNetworkAndSaveToFS Error',
      data: { errorMsg: e.message }
    })

    return { error: e }
  } finally {
    decisionTree.printTree({ logLevel: 'debug' })
  }

  return { storagePath: storageLocation }
}

/**
 * Removes all upload artifacts for track from filesystem. After successful upload these artifacts
 *    are all redundant since all synced content is replicated outside the upload folder.
 * (1) Remove all files in requested fileDir
 * (2) Confirm the only subdirectory is 'fileDir/segments'
 * (3) Remove all files in 'fileDir/segments' - throw if any subdirectories found
 * (4) Remove 'fileDir/segments' and fileDir
 * @dev - Eventually this function execution should be moved off of main server process
 */
async function removeTrackFolder({ logContext }, fileDir) {
  const logger = genericLogger.child(logContext)
  try {
    const deleteTrackUploadArtifacts = config.get('deleteTrackUploadArtifacts')
    if (!deleteTrackUploadArtifacts) return

    if (!fileDir) {
      throw new Error('Cannot remove null fileDir')
    }

    const fileDirInfo = await fs.lstat(fileDir)
    if (!fileDirInfo.isDirectory()) {
      throw new Error('Expected directory input')
    }

    // Remove all contents of track dir (process sequentially to limit cpu load)
    const files = await fs.readdir(fileDir)
    for (const file of files) {
      const curPath = path.join(fileDir, file)

      if ((await fs.lstat(curPath)).isDirectory()) {
        // Only the 'segments' subdirectory is expected
        if (file !== 'segments') {
          throw new Error(`Unexpected subdirectory in ${fileDir} - ${curPath}`)
        }

        // Delete each segment file inside /fileDir/segments/ (process sequentially to limit cpu load)
        const segmentFiles = await fs.readdir(curPath)
        for (const segmentFile of segmentFiles) {
          const curSegmentPath = path.join(curPath, segmentFile)

          // Throw if a subdirectory found in /fileDir/segments/
          if ((await fs.lstat(curSegmentPath)).isDirectory()) {
            throw new Error(
              `Unexpected subdirectory in segments ${fileDir} - ${curPath}`
            )
          }

          // Delete segment file
          await fs.unlink(curSegmentPath)
        }

        // Delete /fileDir/segments/ directory after all its contents have been deleted
        await fs.rmdir(curPath)
      } else {
        // Delete file inside /fileDir/
        await fs.unlink(curPath)
      }
    }

    // Delete fileDir after all its contents have been deleted
    await fs.rmdir(fileDir)
    logger.info(`Removed track folder at fileDir ${fileDir}`)
    return null
  } catch (err) {
    logger.error(`Error removing ${fileDir}. ${err}`)
    return err
  }
}

const getRandomFileName = () => {
  return getUuid()
}

const getTmpTrackUploadArtifactsPathWithInputUUID = async (fileName) => {
  return path.join(await DiskManager.getTmpTrackUploadArtifactsPath(), fileName)
}

const getTmpSegmentsPath = async (fileName) => {
  return path.join(
    await DiskManager.getTmpTrackUploadArtifactsPath(),
    fileName,
    'segments'
  )
}

// Simple in-memory storage for metadata/generic files
const memoryStorage = multer.memoryStorage()
const upload = multer({
  limits: { fileSize: MAX_MEMORY_FILE_SIZE },
  storage: memoryStorage
})

// Simple temp storage for metadata/generic files
const tempDiskStorage = multer.diskStorage({})
const uploadTempDiskStorage = multer({
  limits: { fileSize: MAX_MEMORY_FILE_SIZE },
  storage: tempDiskStorage
})

// Custom on-disk storage for track files to prep for segmentation
const trackDiskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const asyncFn = async function () {
      let fileName
      if (req.query.uuid) {
        // Use the file name provided in the headers during track hand off
        fileName = req.query.uuid
      } else {
        // Save file under randomly named folders to avoid collisions
        fileName = getRandomFileName()
      }

      const fileDir = await getTmpTrackUploadArtifactsPathWithInputUUID(
        fileName
      )
      const segmentsDir = await getTmpSegmentsPath(fileName)

      // create directories for original file and segments
      await fs.mkdir(fileDir)
      await fs.mkdir(segmentsDir)

      req.fileDir = fileDir
      const fileExtension = getFileExtension(file.originalname)
      req.fileNameNoExtension = fileName
      req.fileName = fileName + fileExtension

      req.logger.debug(
        `Created track disk storage: ${req.fileDir}, ${req.fileName}`
      )
      cb(null, fileDir)
    }
    asyncFn()
  },
  filename: function (req, file, cb) {
    cb(null, req.fileName)
  }
})

const trackFileUpload = multer({
  storage: trackDiskStorage,
  limits: { fileSize: MAX_AUDIO_FILE_SIZE },
  fileFilter: function (req, file, cb) {
    try {
      checkFileType(req.logger, {
        fileName: file.originalname,
        fileMimeType: file.mimetype
      })
      cb(null, true)
    } catch (e) {
      req.fileFilterError = e.message
      cb(e)
    }
  }
})

const handleTrackContentUpload = (req, res, next) => {
  trackFileUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.fileSizeError = err
      } else if (err instanceof multer.MulterError) {
        req.logger.error(`Multer error: ${err}`)
      } else {
        req.logger.error(`Content upload error: ${err}`)
      }
    }
    next()
  })
}

function getFileExtension(fileName) {
  return fileName.lastIndexOf('.') >= 0
    ? fileName.substr(fileName.lastIndexOf('.')).toLowerCase()
    : ''
}

/**
 * Checks the file type. Throws an error if not accepted.
 * @param {Object} logger the logger instance from the express request object
 * @param {Object} param
 * @param {string} param.fileName the file name
 * @param {string} param.fileMimeType the file type
 */
function checkFileType(logger, { fileName, fileMimeType }) {
  const fileExtension = getFileExtension(fileName).slice(1)
  // the function should call `cb` with a boolean to indicate if the file should be accepted
  if (
    ALLOWED_UPLOAD_FILE_EXTENSIONS.includes(fileExtension) &&
    AUDIO_MIME_TYPE_REGEX.test(fileMimeType)
  ) {
    logger.debug(
      `fileManager#checkFileType - FileName: ${fileName}, Filetype: ${fileExtension}, Mimetype: ${fileMimeType}`
    )
  } else {
    throw new Error(
      `File type not accepted. Must be one of [${ALLOWED_UPLOAD_FILE_EXTENSIONS}] with mime type matching ${AUDIO_MIME_TYPE_REGEX}, got file ${fileExtension} with mime ${fileMimeType}`
    )
  }
}

/**
 * Checks the file size. Throws an error if file is too big.
 * @param {number} fileSize file size in bytes
 */
function checkFileSize(fileSize) {
  if (fileSize > MAX_AUDIO_FILE_SIZE) {
    throw new Error(
      `File exceeded maximum size (${MAX_AUDIO_FILE_SIZE}): fileSize=${fileSize}`
    )
  }
}

/**
 * The middleware fn that checks file data existence, and calls `checkFileType` and `checkFileSize`.
 * @param {Object} req express request object
 * @param {string} req.filename the file name
 * @param {string} req.filemimetype the file type
 * @param {number} req.filesize file size in bytes
 * @param {Object} res express response object
 * @param {function} next callback to proceed to the next handler
 */
function checkFileMiddleware(req, res, next) {
  const {
    filename: fileName,
    filetype: fileMimeType,
    filesize: fileSize
  } = req.headers
  try {
    if (!fileName || !fileMimeType || !fileSize) {
      throw new Error(
        `Some/all file data not present: fileName=${fileName} fileType=${fileMimeType} fileSize=${fileSize}`
      )
    }
    checkFileType(req.logger, { fileName, fileMimeType })
    checkFileSize(fileSize)
  } catch (e) {
    return sendResponse(req, res, errorResponseBadRequest(e.message))
  }

  return next()
}

/**
 * Checks if the Content Node storage has reached the `maxStorageUsedPercent` defined in the config. `storagePathSize`
 * and `storagePathUsed` are values taken off of the Content Node monitoring system.
 * @param {Object} param
 * @param {number} param.storagePathSize size of total storage
 * @param {number} param.storagePathUsed size of used storage
 * @param {number} param.maxStorageUsedPercent max storage percentage allowed in a CNode
 * @returns {boolean} true if enough storage; false if storage is equal to or over `maxStorageUsedPercent`
 */
function hasEnoughStorageSpace({
  storagePathSize,
  storagePathUsed,
  maxStorageUsedPercent
}) {
  // If these values are not present, the Content Node did not initialize properly.
  if (
    storagePathSize === null ||
    storagePathSize === undefined ||
    storagePathUsed === null ||
    storagePathUsed === undefined
  ) {
    return false
  }

  return (100 * storagePathUsed) / storagePathSize < maxStorageUsedPercent
}

/**
 * Remove file from location on disk
 * @param {String} storagePath path on disk for file
 * @returns null if successfully removed file or throws error if didn't successfully remove file
 */
async function removeFile(storagePath) {
  try {
    await fs.unlink(storagePath)
  } catch (err) {
    const fileDoesntExistError = err && err.code === 'ENOENT'
    if (!fileDoesntExistError) throw err
  }
}

module.exports = {
  saveFileFromBufferToDisk,
  fetchFileFromNetworkAndSaveToFS,
  removeTrackFolder,
  upload,
  uploadTempDiskStorage,
  trackFileUpload,
  handleTrackContentUpload,
  hasEnoughStorageSpace,
  getFileExtension,
  checkFileMiddleware,
  getTmpTrackUploadArtifactsPathWithInputUUID,
  getTmpSegmentsPath,
  copyMultihashToFs,
  fetchFileFromNetworkAndWriteToDisk
}
