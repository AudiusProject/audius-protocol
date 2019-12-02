const path = require('path')
const assert = require('assert')
const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const multer = require('multer')
const getUuid = require('uuid/v4')

const config = require('./config')
const models = require('./models')

const MAX_AUDIO_FILE_SIZE = parseInt(config.get('maxAudioFileSizeBytes')) // Default = 250,000,000 bytes = 250MB
const MAX_MEMORY_FILE_SIZE = parseInt(config.get('maxMemoryFileSizeBytes')) // Default = 50,000,000 bytes = 50MB

const ALLOWED_UPLOAD_FILE_EXTENSIONS = config.get('allowedUploadFileExtensions') // default set in config.json
const AUDIO_MIME_TYPE_REGEX = /audio\/(.*)/

/**
 * (1) Add file to IPFS; (2) save file to disk;
 * (3) pin file via IPFS; (4) save file ref to DB
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
 * - Add and pin file to IPFS.
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

  // Adding a file through js-ipfs-api pins by default
  // Ensuring this multihash is available through garbage collection
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

/** Save file to disk given IPFS multihash, and ensure is pinned.
 *  Steps:
 *  - If file already stored on disk, return immediately.
 *  - If file not already stored, fetch from IPFS and store.
 *    - If multihash already pinned by local inode, retrieve file.
 *    - If multihash not already pinned, fetch file from IPFS.
 *  - Write file to disk.
 *  - Pin file to local inode if not already.
 */
async function saveFileForMultihash (req, multihash, expectedStoragePath) {
  // If file already stored on disk, return immediately.
  if (fs.existsSync(expectedStoragePath)) {
    req.logger.info(`File already stored at ${expectedStoragePath} for ${multihash}`)
    return expectedStoragePath
  }

  // If file not already stored, fetch from IPFS and store at storagePath.
  const ipfs = req.app.get('ipfsAPI')
  let fileBuffer = null
  req.logger.info(`Storing file at ${expectedStoragePath} for track multihash ${multihash}`)

  // If multihash already pinned by local INode, cat file from local ipfs node
  req.logger.info(`checking if ${multihash} already pinned by local ipfs node`)
  try {
    fileBuffer = await ipfs.cat(multihash)
    req.logger.info(`Retrieved file for ${multihash} from local ipfs node`)
  } catch (e) {
    req.logger.info(`Multihash ${multihash} is not available on local ipfs node`)
  }

  // If file not already pinned by local INode, fetch from IPFS.
  if (fileBuffer === null) {
    req.logger.info(`Attempting to get ${multihash} from IPFS`)
    const output = await ipfs.get(multihash)
    if (output.length !== 1) throw new Error('Audius track segment multihash must map to 1 file')
    fileBuffer = output[0].content
    req.logger.info(`retrieved file for multihash ${multihash} from path ${output[0].path}`)
  }

  // Write file to disk.
  const storagePath = path.join(req.app.get('storagePath'), multihash)
  assert.strictEqual(storagePath, expectedStoragePath)
  req.logger.info(`writing file to ${storagePath}...`)
  await writeFile(storagePath, fileBuffer)
  req.logger.info(`wrote file to ${storagePath}`)

  req.logger.info(`\nAdded file: ${multihash} at ${storagePath}`)
  return storagePath
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

function getFileExtension (fileName) {
  return (fileName.lastIndexOf('.') >= 0) ? fileName.substr(fileName.lastIndexOf('.')).toLowerCase() : ''
}

module.exports = { saveFileFromBuffer, saveFileToIPFSFromFS, saveFileForMultihash, removeTrackFolder, upload, trackFileUpload }
