const path = require('path')
const fs = require('fs-extra')
const multer = require('multer')
const getUuid = require('uuid/v4')
const axios = require('axios')
const promiseAny = require('promise.any')

const config = require('./config')
const Utils = require('./utils')
const DiskManager = require('./diskManager')
const { logger: genericLogger } = require('./logging')
const { sendResponse, errorResponseBadRequest } = require('./apiHelpers')

const MAX_AUDIO_FILE_SIZE = parseInt(config.get('maxAudioFileSizeBytes')) // Default = 250,000,000 bytes = 250MB
const MAX_MEMORY_FILE_SIZE = parseInt(config.get('maxMemoryFileSizeBytes')) // Default = 50,000,000 bytes = 50MB

const ALLOWED_UPLOAD_FILE_EXTENSIONS = config.get('allowedUploadFileExtensions') // default set in config.json
const AUDIO_MIME_TYPE_REGEX = /audio\/(.*)/

/**
 * Adds file to IPFS then saves file to disk under /multihash name
 */
async function saveFileFromBufferToIPFSAndDisk (req, buffer) {
  // make sure user has authenticated before saving file
  if (!req.session.cnodeUserUUID) {
    throw new Error('User must be authenticated to save a file')
  }

  const ipfs = req.app.get('ipfsAPI')

  // Add to IPFS without pinning and retrieve multihash
  const multihash = (await ipfs.add(buffer, { pin: false }))[0].hash

  // Write file to disk by multihash for future retrieval
  const dstPath = DiskManager.computeFilePath(multihash)
  await fs.writeFile(dstPath, buffer)

  return { multihash, dstPath }
}

/**
 * Given file path on disk, adds file to IPFS + re-saves under /multihash name
 *
 * @dev - only call this function when file is already stored to disk, else use saveFileFromBufferToIPFSAndDisk()
 */
async function saveFileToIPFSFromFS ({ logContext }, cnodeUserUUID, srcPath, ipfs) {
  const logger = genericLogger.child(logContext)

  // make sure user has authenticated before saving file
  if (!cnodeUserUUID) {
    throw new Error('User must be authenticated to save a file')
  }

  // Add to IPFS without pinning and retrieve multihash
  let multihash = (await ipfs.addFromFs(srcPath, { pin: false }))[0].hash

  // store file copy by multihash for future retrieval
  const dstPath = DiskManager.computeFilePath(multihash)

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

  return { multihash, dstPath }
}

/**
 * Given a CID, saves the file to disk. Steps to achieve that:
 * 1. do the prep work to save the file to the local file system including
 * creating directories, changing IPFS gateway urls before calling _saveFileForMultihashToFS
 * 2. attempt to fetch the CID from a variety of sources
 * 3. throws error if failure, couldn't find the file or file contents don't match CID;
 *    returns expectedStoragePath if successful
 * @param {Object} serviceRegistry
 * @param {Object} logger
 * @param {String} multihash IPFS cid
 * @param {String} expectedStoragePath file system path similar to `/file_storage/Qm1`
 *                  for non dir files and `/file_storage/Qmdir/Qm2` for dir files
 * @param {Array} gatewaysToTry List of gateway endpoints to try
 * @param {String?} fileNameForImage file name if the multihash is image in dir.
 *                  eg original.jpg or 150x150.jpg
 */
async function saveFileForMultihashToFS (serviceRegistry, logger, multihash, expectedStoragePath, gatewaysToTry, fileNameForImage = null) {
  const { ipfsLatest } = serviceRegistry

  // stores all the stages of this function along with associated information relevant to that step
  // in the try catch below, if any of the nested try/catches throw, it will be caught by the top level try/catch
  // so we only need to print it once in the global catch or after everthing finishes except for any return statements
  let decisionTree = []

  try {
    // will be modified to directory compatible route later if directory
    // TODO - don't concat url's by hand like this, use module like urljoin
    // ..replace(/\/$/, "") removes trailing slashes
    let gatewayUrlsMapped = gatewaysToTry.map(endpoint => `${endpoint.replace(/\/$/, '')}/ipfs/${multihash}`)

    const parsedStoragePath = path.parse(expectedStoragePath).dir

    decisionTree.push({ stage: 'About to start running saveFileForMultihashToFS',
      val: {
        multihash,
        gatewaysToTry,
        gatewayUrlsMapped,
        expectedStoragePath,
        parsedStoragePath
      },
      time: Date.now()
    })

    // Create dir at expected storage path in which to store retrieved data
    try {
      // calling this on an existing directory doesn't overwrite the existing data or throw an error
      // the mkdir recursive is equivalent to `mkdir -p`
      await fs.mkdir(parsedStoragePath, { recursive: true })
      decisionTree.push({ stage: 'Successfully called mkdir on local file system', vals: parsedStoragePath, time: Date.now() })
    } catch (e) {
      decisionTree.push({ stage: 'Error calling mkdir on local file system', vals: parsedStoragePath, time: Date.now() })
      throw new Error(`Error making directory at ${parsedStoragePath} - ${e.message}`)
    }

    // regex match to check if a directory or just a regular file
    // if directory will have both outer and inner properties in match.groups
    // else will have just outer
    const matchObj = DiskManager.extractCIDsFromFSPath(expectedStoragePath)

    // if this is a directory, make it compatible with our dir cid gateway url
    if (matchObj && matchObj.isDir && matchObj.outer && fileNameForImage) {
      // override gateway urls to make it compatible with directory given an endpoint
      // eg. before running the line below gatewayUrlsMapped looks like [https://endpoint.co/ipfs/Qm111, https://endpoint.co/ipfs/Qm222 ...]
      // in the case of a directory, override the gatewayUrlsMapped array to look like
      // [https://endpoint.co/ipfs/Qm111/150x150.jpg, https://endpoint.co/ipfs/Qm222/150x150.jpg ...]
      // ..replace(/\/$/, "") removes trailing slashes
      gatewayUrlsMapped = gatewaysToTry.map(endpoint => `${endpoint.replace(/\/$/, '')}/ipfs/${matchObj.outer}/${fileNameForImage}`)
      decisionTree.push({ stage: 'Updated gatewayUrlsMapped', vals: gatewayUrlsMapped, time: Date.now() })
    }

    /**
     * Attempts to fetch CID:
     *  - If file already stored on disk, return immediately.
     *  - If file not already stored, request from user's replica set gateways in parallel.
     *  - If not found, call ipfs.cat(timeout=1000ms)
     *  - If not found, call ipfs.get(timeout=1000ms)
     * Each step, if successful, stores retrieved file to disk.
     */

    // If file already stored on disk, return immediately.
    if (await fs.pathExists(expectedStoragePath)) {
      logger.debug(`File already stored at ${expectedStoragePath} for ${multihash}`)
      decisionTree.push({ stage: 'File already stored on disk', vals: [expectedStoragePath, multihash], time: Date.now() })
      // since this is early exit, print the decision tree here
      _printDecisionTreeObj(decisionTree, logger)

      return expectedStoragePath
    }

    // If file not already stored, fetch and store at storagePath.
    let fileFound = false

    // First try to fetch from other cnode gateways if user has non-empty replica set.
    if (gatewayUrlsMapped.length > 0) {
      try {
        let response
        logger.debug(`Attempting to fetch multihash ${multihash} by racing replica set endpoints`)
        decisionTree.push({ stage: 'About to race requests via gateways', vals: gatewayUrlsMapped, time: Date.now() })

        const GatewayRetrievalConcurrencyLimit = 5

        for (let i = 0; i < gatewayUrlsMapped.length; i += GatewayRetrievalConcurrencyLimit) {
          const gatewayUrlsSlice = gatewayUrlsMapped.slice(i, i + GatewayRetrievalConcurrencyLimit)
          decisionTree.push({ stage: 'Fetching from gateways', vals: gatewayUrlsSlice, time: Date.now() })

          /**
           * promiseAny(promises) resolves to the first promise that resolves, or rejects if all reject
           * Each internal request must reject after a timeout to ensure this does not wait forever
           */
          try {
            const resp = await promiseAny(gatewayUrlsSlice.map(
              async url => {
                const gatewayResp = await axios({
                  method: 'get',
                  url,
                  responseType: 'stream',
                  timeout: 20000 /* 20 sec - higher timeout to allow enough time to fetch copy320 */
                })

                if (gatewayResp.data) {
                  decisionTree.push({ stage: 'Retrieved file from gateway', vals: url, time: Date.now() })
                  return gatewayResp
                }
              }
            ))

            // promiseAny resolution means file was successfully retrieved -> short-circuit loop
            if (resp.data) {
              response = resp
              break
            }

            /**
             * Log promiseAny rejection and continue to next loop iteration
             * This just means that file retrieval failed from current gatewayUrlsSlice
             */
          } catch (e) {
            logger.error(`Error fetching file from gateways ${gatewayUrlsSlice}`)
            decisionTree.push({ stage: 'Could not retrieve file from gateways', vals: gatewayUrlsSlice, time: Date.now() })

            continue
          }
        }

        if (!response || !response.data) {
          decisionTree.push({ stage: `Couldn't find files on other creator nodes, after trying URLs`, vals: null, time: Date.now() })
          throw new Error(`Couldn't find files on other creator nodes, after trying URLs: ${gatewayUrlsMapped.toString()}`)
        }

        // Write file to disk
        await Utils.writeStreamToFileSystem(response.data, expectedStoragePath)
        fileFound = true

        decisionTree.push({ stage: 'Wrote file to file system after fetching from gateway', vals: expectedStoragePath, time: Date.now() })
        logger.info(`wrote file to ${expectedStoragePath}`)
      } catch (e) {
        const errorMsg = `Failed to retrieve file for multihash ${multihash} from other creator node gateways`
        decisionTree.push({ stage: errorMsg, vals: e.message, time: Date.now() })
        logger.warn(`${errorMsg} || ${e.message}`)
      }
    }

    // If file not found through gateways, check local ipfs node.
    if (!fileFound) {
      logger.debug(`checking if ${multihash} already available on local ipfs node`)
      try {
        decisionTree.push({ stage: 'About to retrieve file from local ipfs node with cat', vals: multihash, time: Date.now() })

        // ipfsCat returns a Buffer
        let fileBuffer = await Utils.ipfsCat(serviceRegistry, logger, multihash, 1000)

        fileFound = true
        logger.debug(`Retrieved file for ${multihash} from  with cat`)
        decisionTree.push({ stage: 'Retrieved file from local ipfs node with cat', vals: multihash, time: Date.now() })

        // Write file to disk.
        await fs.writeFile(expectedStoragePath, fileBuffer)

        logger.info(`wrote file to ${expectedStoragePath}, obtained via ipfs cat`)
        decisionTree.push({ stage: 'Wrote file to disk', vals: expectedStoragePath, time: Date.now() })
      } catch (e) {
        logger.warn(`Multihash ${multihash} is not available on local ipfs node ${e.message}`)
        decisionTree.push({ stage: 'File not available on local ipfs node with cat', vals: multihash, time: Date.now() })
      }
    }

    // If file not already available on local ipfs node or via gateways, fetch from IPFS.
    if (!fileFound) {
      logger.debug(`Attempting to get ${multihash} from IPFS`)
      try {
        decisionTree.push({ stage: 'About to retrieve file from local ipfs node with get', vals: multihash, time: Date.now() })

        // ipfsGet returns a BufferListStream object which is not a buffer
        // not compatible into writeFile directly, but it can be streamed to a file
        let fileBL = await Utils.ipfsGet(serviceRegistry, logger, multihash, 1000)

        logger.debug(`retrieved file for multihash ${multihash} from local ipfs node`)
        decisionTree.push({ stage: 'Retrieved file from local ipfs node with get', vals: multihash, time: Date.now() })

        // Write file to disk.
        await Utils.writeStreamToFileSystem(fileBL, expectedStoragePath)

        fileFound = true
        logger.info(`wrote file to ${expectedStoragePath}, obtained via ipfs get`)
        decisionTree.push({ stage: 'Wrote file to disk', vals: expectedStoragePath, time: Date.now() })
      } catch (e) {
        logger.warn(`Failed to retrieve file for multihash ${multihash} from IPFS ${e.message}`)
        decisionTree.push({ stage: 'File not available on local ipfs node with ipfs get', vals: multihash, time: Date.now() })
      }
    }

    // error if file was not found on any gateway or ipfs
    if (!fileFound) {
      decisionTree.push({ stage: 'Failed to retrieve file for multihash after trying ipfs & other creator node gateways', vals: multihash, time: Date.now() })
      throw new Error(`Failed to retrieve file for multihash ${multihash} after trying ipfs & other creator node gateways`)
    }

    // verify that the contents of the file match the file's cid
    try {
      decisionTree.push({ stage: 'About to verify the file contents for the CID', vals: multihash, time: Date.now() })
      const content = fs.createReadStream(expectedStoragePath)
      for await (const result of ipfsLatest.add(content, { onlyHash: true, timeout: 10000 })) {
        if (multihash !== result.cid.toString()) {
          decisionTree.push({ stage: `File contents don't match IPFS hash multihash`, vals: result.cid.toString(), time: Date.now() })
          // delete this file because the next time we run sync and we see it on disk, we'll assume we have it and it's correct
          await fs.unlink(expectedStoragePath)
          throw new Error(`File contents don't match IPFS hash multihash: ${multihash} result: ${result.cid.toString()}`)
        }
      }
      decisionTree.push({ stage: 'Successfully verified the file contents for the CID', vals: multihash, time: Date.now() })
    } catch (e) {
      decisionTree.push({ stage: `Error during content verification for multihash`, vals: multihash, time: Date.now() })
      throw new Error(`Error during content verification for multihash ${multihash} ${e.message}`)
    }

    _printDecisionTreeObj(decisionTree, logger)
    return expectedStoragePath
  } catch (e) {
    decisionTree.push({ stage: `saveFileForMultihashToFS error`, vals: e.message, time: Date.now() })
    _printDecisionTreeObj(decisionTree, logger)
    throw new Error(`saveFileForMultihashToFS - ${e}`)
  }
}

const _printDecisionTreeObj = (decisionTree, logger) => {
  try {
    logger.info('saveFileForMultihashToFS decision tree', JSON.stringify(decisionTree))
  } catch (e) {
    logger.error('error printing saveFileForMultihashToFS decision tree', decisionTree)
  }
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
async function removeTrackFolder ({ logContext }, fileDir) {
  const logger = genericLogger.child(logContext)
  try {
    logger.info(`Removing track folder at fileDir ${fileDir}...`)
    if (!fileDir) {
      throw new Error('Cannot remove null fileDir')
    }

    let fileDirInfo = await fs.lstat(fileDir)
    if (!fileDirInfo.isDirectory()) {
      throw new Error('Expected directory input')
    }

    // Remove all contents of track dir (process sequentially to limit cpu load)
    const files = await fs.readdir(fileDir)
    for (const file of files) {
      let curPath = path.join(fileDir, file)

      if ((await fs.lstat(curPath)).isDirectory()) {
        // Only the 'segments' subdirectory is expected
        if (file !== 'segments') {
          throw new Error(`Unexpected subdirectory in ${fileDir} - ${curPath}`)
        }

        // Delete each segment file inside /fileDir/segments/ (process sequentially to limit cpu load)
        const segmentFiles = await fs.readdir(curPath)
        for (const segmentFile of segmentFiles) {
          let curSegmentPath = path.join(curPath, segmentFile)

          // Throw if a subdirectory found in /fileDir/segments/
          if ((await fs.lstat(curSegmentPath)).isDirectory()) {
            throw new Error(`Unexpected subdirectory in segments ${fileDir} - ${curPath}`)
          }

          // Delete segment file
          await fs.unlink(curSegmentPath)
        }

        // Delete /fileDir/segments/ directory after all its contents have been deleted
        await fs.rmdir(curPath)
      } else {
        // Delete file inside /fileDir/
        logger.info(`Removing ${curPath}`)
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
    // save file under randomly named folders to avoid collisions
    const randomFileName = getUuid()
    const fileDir = path.join(DiskManager.getTmpTrackUploadArtifactsPath(), randomFileName)

    // create directories for original file and segments
    fs.mkdirSync(fileDir)
    fs.mkdirSync(fileDir + '/segments')

    req.fileDir = fileDir
    const fileExtension = getFileExtension(file.originalname)
    req.fileName = randomFileName + fileExtension

    req.logger.info(`Created track disk storage: ${req.fileDir}, ${req.fileName}`)
    cb(null, fileDir)
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
      checkFileType(req, { fileName: file.originalname, fileMimeType: file.mimetype })
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

function getFileExtension (fileName) {
  return (fileName.lastIndexOf('.') >= 0) ? fileName.substr(fileName.lastIndexOf('.')).toLowerCase() : ''
}

/**
 * Checks the file type. Throws an error if not accepted.
 * @param {Object} req express request object
 * @param {Object} param
 * @param {string} param.fileName the file name
 * @param {string} param.fileMimeType the file type
 */
function checkFileType (logger, { fileName, fileMimeType }) {
  const fileExtension = getFileExtension(fileName).slice(1)
  // the function should call `cb` with a boolean to indicate if the file should be accepted
  if (ALLOWED_UPLOAD_FILE_EXTENSIONS.includes(fileExtension) && AUDIO_MIME_TYPE_REGEX.test(fileMimeType)) {
    logger.info(`Filetype: ${fileExtension}`)
    logger.info(`Mimetype: ${fileMimeType}`)
  } else {
    throw new Error(`File type not accepted. Must be one of [${ALLOWED_UPLOAD_FILE_EXTENSIONS}] with mime type matching ${AUDIO_MIME_TYPE_REGEX}, got file ${fileExtension} with mime ${fileMimeType}`)
  }
}

/**
 * Checks the file size. Throws an error if file is too big.
 * @param {number} fileSize file size in bytes
 */
function checkFileSize (fileSize) {
  if (fileSize > MAX_AUDIO_FILE_SIZE) {
    throw new Error(`File exceeded maximum size (${MAX_AUDIO_FILE_SIZE}): fileSize=${fileSize}`)
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
function checkFileMiddleware (req, res, next) {
  const { filename: fileName, filetype: fileMimeType, filesize: fileSize } = req.headers
  try {
    if (!fileName || !fileMimeType || !fileSize) {
      throw new Error(`Some/all file data not present: fileName=${fileName} fileType=${fileMimeType} fileSize=${fileSize}`)
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
function hasEnoughStorageSpace ({ storagePathSize, storagePathUsed, maxStorageUsedPercent }) {
  // If these values are not present, the Content Node did not initialize properly.
  if (
    storagePathSize === null ||
    storagePathSize === undefined ||
    storagePathUsed === null ||
    storagePathUsed === undefined
  ) { return false }

  return (100 * storagePathUsed / storagePathSize) < maxStorageUsedPercent
}

module.exports = {
  saveFileFromBufferToIPFSAndDisk,
  saveFileToIPFSFromFS,
  saveFileForMultihashToFS,
  removeTrackFolder,
  upload,
  uploadTempDiskStorage,
  trackFileUpload,
  handleTrackContentUpload,
  hasEnoughStorageSpace,
  getFileExtension,
  checkFileMiddleware
}
