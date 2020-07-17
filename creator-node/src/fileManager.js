const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const multer = require('multer')
const getUuid = require('uuid/v4')
const axios = require('axios')

const config = require('./config')
const models = require('./models')
const Utils = require('./utils')

const MAX_AUDIO_FILE_SIZE = parseInt(config.get('maxAudioFileSizeBytes')) // Default = 250,000,000 bytes = 250MB
const MAX_MEMORY_FILE_SIZE = parseInt(config.get('maxMemoryFileSizeBytes')) // Default = 50,000,000 bytes = 50MB

const ALLOWED_UPLOAD_FILE_EXTENSIONS = config.get('allowedUploadFileExtensions') // default set in config.json
const AUDIO_MIME_TYPE_REGEX = /audio\/(.*)/

/**
 * (1) Add file to IPFS; (2) save file to disk;
 * (3) add file via IPFS; (4) save file ref to DB
 * @dev - only call this function when file is not already stored to disk
 *      - if it is, then use saveFileToIPFSFromFS()
 */
async function saveFileFromBuffer (req, buffer, fileType) {
  // make sure user has authenticated before saving file
  if (!req.session.cnodeUserUUID) {
    throw new Error('User must be authenticated to save a file')
  }

  const ipfs = req.app.get('ipfsAPI')

  const multihash = (await ipfs.add(buffer, { pin: false }))[0].hash

  const dstPath = path.join(req.app.get('storagePath'), multihash)

  await writeFile(dstPath, buffer)

  // add reference to file to database
  const file = (await models.File.findOrCreate({ where: {
    cnodeUserUUID: req.session.cnodeUserUUID,
    multihash: multihash,
    sourceFile: req.fileName,
    storagePath: dstPath,
    type: fileType
  } }))[0].dataValues

  req.logger.info('\nAdded file:', multihash, 'file id', file.fileUUID)
  return { multihash: multihash, fileUUID: file.fileUUID }
}

/**
 * Save file to IPFS given file path.
 * - Add file to IPFS.
 * - Re-save file to disk under multihash.
 * - Save reference to file in DB.
 */
async function saveFileToIPFSFromFS (req, srcPath, fileType, sourceFile, transaction = null) {
  // make sure user has authenticated before saving file
  if (!req.session.cnodeUserUUID) {
    throw new Error('User must be authenticated to save a file')
  }

  const ipfs = req.app.get('ipfsAPI')

  req.logger.info(`beginning saveFileToIPFSFromFS for srcPath ${srcPath}`)

  let codeBlockTimeStart = Date.now()

  const multihash = (await ipfs.addFromFs(srcPath, { pin: false }))[0].hash
  req.logger.info(`Time taken in saveFileToIpfsFromFS to add: ${Date.now() - codeBlockTimeStart}`)
  codeBlockTimeStart = Date.now()
  const dstPath = path.join(req.app.get('storagePath'), multihash)

  // store segment file copy under multihash for easy future retrieval
  fs.copyFileSync(srcPath, dstPath)

  req.logger.info(`Time taken in saveFileToIpfsFromFS to copyFileSync: ${Date.now() - codeBlockTimeStart}`)

  // add reference to file to database
  const queryObj = { where: {
    cnodeUserUUID: req.session.cnodeUserUUID,
    multihash: multihash,
    sourceFile: sourceFile,
    storagePath: dstPath,
    type: fileType
  } }
  if (transaction) {
    queryObj.transaction = transaction
  }
  const file = ((await models.File.findOrCreate(queryObj))[0].dataValues)

  req.logger.info(`Added file: ${multihash} for fileUUID ${file.fileUUID} from sourceFile ${sourceFile}`)
  return { multihash: multihash, fileUUID: file.fileUUID }
}

/**
 * Save file to disk given IPFS multihash, and ensure availability.
 * This will only work for non-dir files
 * Steps:
 *  - If file already stored on disk, return immediately and store to disk.
 *  - If file not already stored, fetch from IPFS and store to disk.
 *    - If multihash available on local inode, retrieve file.
 *    - If multihash not available locally, fetch file from IPFS.
 *  - If file is not available via IPFS try other cnode gateways for user's replica set.
 *  - Add file to local inode if not already.
 */
async function saveFileForMultihash (req, multihash, expectedStoragePath, gatewaysToTry) {
  // If file already stored on disk, return immediately.
  if (fs.existsSync(expectedStoragePath)) {
    req.logger.info(`File already stored at ${expectedStoragePath} for ${multihash}`)
    return expectedStoragePath
  }

  // If file not already stored, fetch and store at storagePath.
  let fileFound = false

  // If multihash already available on local INode, cat file from local ipfs node
  req.logger.debug(`checking if ${multihash} already available on local ipfs node`)
  try {
    let fileBuffer = await Utils.ipfsCat(multihash, req, 500)
    fileFound = true
    req.logger.debug(`Retrieved file for ${multihash} from local ipfs node`)
    // Write file to disk.
    await writeFile(expectedStoragePath, fileBuffer)
    req.logger.info(`wrote file to ${expectedStoragePath}, obtained via ipfs cat`)
  } catch (e) {
    req.logger.info(`Multihash ${multihash} is not available on local ipfs node`)
  }

  // If file not already available on local INode, fetch from IPFS.
  if (!fileFound) {
    req.logger.debug(`Attempting to get ${multihash} from IPFS`)
    try {
      // ipfsGet returns a BufferList object, not a buffer
      // not compatible into writeFile directly
      let fileBL = await Utils.ipfsGet(multihash, req, 2000)
      req.logger.debug(`retrieved file for multihash ${multihash} from local ipfs node`)

      // Write file to disk.
      const destinationStream = fs.createWriteStream(expectedStoragePath)
      fileBL.pipe(destinationStream)
      await new Promise((resolve, reject) => {
        destinationStream.on('finish', () => { resolve() })
        fileBL.on('error', err => { destinationStream.end(); reject(err) })
      })
      req.logger.info(`wrote file to ${expectedStoragePath}, obtained via ipfs get`)
    } catch (e) {
      req.logger.info(`Failed to retrieve file for multihash ${multihash} from IPFS ${e.message}`)
    }
  }

  // if file is still null, try to fetch from other cnode gateways with onlyFS=true
  if (!fileFound) {
    try {
      let response
      // ..replace(/\/$/, "") removes trailing slashes
      req.logger.debug(`Attempting to fetch multihash ${multihash} by racing replica set endpoints`)

      const urls = gatewaysToTry.map(endpoint => `${endpoint.replace(/\/$/, '')}/ipfs/${multihash}`)

      // TODO make this more parallel
      for (let index = 0; index < urls.length; index++) {
        const url = urls[index]
        try {
          const resp = await axios({
            method: 'get',
            url,
            responseType: 'stream',
            timeout: 4000 /* ms */
          })
          if (resp.data) {
            response = resp
            break
          }
        } catch (e) {
          continue
        }
      }

      if (!response || !response.data) {
        throw new Error(`Couldn't find files on other creator nodes`)
      }

      const destinationStream = fs.createWriteStream(expectedStoragePath)
      response.data.pipe(destinationStream)
      await new Promise((resolve, reject) => {
        destinationStream.on('finish', () => { resolve() })
        response.data.on('error', err => { destinationStream.end(); reject(err) })
      })

      req.logger.info(`wrote file to ${expectedStoragePath}`)
    } catch (e) {
      throw new Error(`Failed to retrieve file for multihash ${multihash} from other creator node gateways: ${e.message}`)
    }
  }

  // for debugging purposes - dont' delete. verifies that the contents of the file match the file's cid
  // const ipfs = req.app.get('ipfsLatestAPI')
  // const content = fs.readFileSync(expectedStoragePath)
  // for await (const result of ipfs.add(content, { onlyHash: true })) {
  //   if (multihash !== result.path) {
  //     console.error(`File contents don't match IPFS hash multihash: ${multihash} result.path: ${result.path}`)
  //   }
  //   else console.log("files matched", multihash)
  // }

  return expectedStoragePath
}

/** (1) Remove all files in requested fileDir
 *  (2) Confirm the only subdirectory is 'fileDir/segments'
 *  (3) Remove all files in 'fileDir/segments' - throw if any subdirectories found
 *  (4) Remove 'fileDir/segments' and fileDir
 */
function removeTrackFolder (req, fileDir) {
  try {
    let fileDirInfo = fs.lstatSync(fileDir)
    if (!fileDirInfo.isDirectory()) {
      throw new Error('Expected directory input')
    }

    const files = fs.readdirSync(fileDir)
    // Remove all files in working track folder
    files.forEach((file, index) => {
      let curPath = path.join(fileDir, file)
      if (fs.lstatSync(curPath).isDirectory()) {
        // Only the 'segments' subdirectory is expected
        if (file !== 'segments') {
          throw new Error(`Unexpected subdirectory in ${fileDir} - ${curPath}`)
        }
        const segmentFiles = fs.readdirSync(curPath)
        segmentFiles.forEach((sFile, sIndex) => {
          let curSegmentPath = path.join(curPath, sFile)
          // Throw if a subdirectory found in <uuid>/segments
          if (fs.lstatSync(curSegmentPath).isDirectory()) {
            throw new Error(`Unexpected subdirectory in segments ${fileDir} - ${curPath}`)
          }

          // Remove segment file
          fs.unlinkSync(curSegmentPath)
        })
        fs.rmdirSync(curPath)
      } else {
        // Remove file
        req.logger.info(`Removing ${curPath}`)
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(fileDir)
  } catch (err) {
    req.logger.error(`Error removing ${fileDir}. ${err}`)
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
    const fileDir = path.join(req.app.get('storagePath'), randomFileName)

    // create directories for original file and segments
    fs.mkdirSync(fileDir)
    fs.mkdirSync(fileDir + '/segments')

    req.fileDir = fileDir
    const fileExtension = getFileExtension(file.originalname)
    req.fileName = randomFileName + fileExtension

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
    // the function should call `cb` with a boolean to indicate if the file should be accepted
    if (ALLOWED_UPLOAD_FILE_EXTENSIONS.includes(getFileExtension(file.originalname).slice(1)) && AUDIO_MIME_TYPE_REGEX.test(file.mimetype)) {
      req.logger.info(`Filetype : ${getFileExtension(file.originalname).slice(1)}`)
      req.logger.info(`Mimetype: ${file.mimetype}`)
      cb(null, true)
    } else {
      req.fileFilterError = `File type not accepted. Must be one of [${ALLOWED_UPLOAD_FILE_EXTENSIONS}]`
      cb(null, false)
    }
  }
})

const handleTrackContentUpload = (req, res, next) => {
  trackFileUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.fileSizeError = err
      }
    }
    next()
  })
}

function getFileExtension (fileName) {
  return (fileName.lastIndexOf('.') >= 0) ? fileName.substr(fileName.lastIndexOf('.')).toLowerCase() : ''
}

module.exports = {
  saveFileFromBuffer,
  saveFileToIPFSFromFS,
  saveFileForMultihash,
  removeTrackFolder,
  upload,
  uploadTempDiskStorage,
  trackFileUpload,
  handleTrackContentUpload
}
