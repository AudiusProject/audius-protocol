import type { ReadStream } from 'fs-extra'

import CID from 'cids'
import fs from 'fs-extra'
import path from 'path'
import stream from 'stream'
import { promisify } from 'util'

import { logger as genericLogger } from '../logging'
import { tracing } from '../tracer'
import config from '../config'

const redis = require('../redis')
const models = require('../models')
const pipeline = promisify(stream.pipeline)

export async function createDirForFile(fileStoragePath: string) {
  const dir = path.dirname(fileStoragePath)
  await fs.ensureDir(dir)
}

/**
 * Given an input stream and a destination file path, this function writes the contents
 * of the stream to disk at expectedStoragePath
 * @param {stream} inputStream Stream to persist to disk
 * @param {String} expectedStoragePath path in local file system to store. includes the file name
 * @param {Boolean?} createDir if true, will ensure the expectedStoragePath path exists so we don't have errors from folders missing
 */
export async function writeStreamToFileSystem(
  inputStream: ReadStream,
  expectedStoragePath: string,
  createDir = false
) {
  if (createDir) {
    await createDirForFile(expectedStoragePath)
  }

  await _streamFileToDiskHelper(inputStream, expectedStoragePath)
}

/**
 * Cleaner way to handle piping data between streams since this handles all
 * events such as finish, error, end etc in addition to being async/awaited
 * @param {stream} inputStream Stream to persist to disk
 * @param {String} expectedStoragePath path in local file system to store
 */
export async function _streamFileToDiskHelper(
  inputStream: ReadStream,
  expectedStoragePath: string
) {
  // https://nodejs.org/en/docs/guides/backpressuring-in-streams/
  await pipeline(
    inputStream, // input stream
    fs.createWriteStream(expectedStoragePath) // output stream
  )
}

/**
 * Return if a fix has already been attempted in today for this filePath
 * @param {String} filePath path of CID on the file system
 * @returns Boolean false if has not attempted state fix before, true if it has
 */
export async function getIfAttemptedStateFix(filePath: string) {
  // key is `attempted_fs_fixes:<today's date>`
  // the date function just generates the ISOString and removes the timestamp component
  const key = `attempted_fs_fixes:${new Date().toISOString().split('T')[0]}`
  const firstTime = await redis.sadd(key, filePath)
  await redis.expire(key, 60 * 60 * 24) // expire one day after final write

  // if firstTime is 1, it's a new key. existing key returns 0
  return !firstTime
}

export async function deleteAttemptedStateFixes() {
  // key is `attempted_fs_fixes:<today's date>`
  // the date function just generates the ISOString and removes the timestamp component
  const key = `attempted_fs_fixes:${new Date().toISOString().split('T')[0]}`
  await redis.del(key)
}

/**
 * Ensure DB and disk records exist for dirCID and its contents
 * Return fileUUID for dir DB record
 * This function does not do further validation since image_upload provides remaining guarantees
 */
export async function validateStateForImageDirCIDAndReturnFileUUID(
  req: any,
  imageDirCID: string
) {
  // This handles case where a user/track metadata obj contains no image CID
  if (!imageDirCID) {
    return null
  }
  req.logger.debug(
    `Beginning validateStateForImageDirCIDAndReturnFileUUID for imageDirCID ${imageDirCID}`
  )

  // Ensure db row exists for dirCID
  const dirFile = await models.File.findOne({
    where: {
      multihash: imageDirCID,
      cnodeUserUUID: req.session.cnodeUserUUID,
      type: 'dir'
    }
  })
  if (!dirFile) {
    throw new Error(`No file stored in DB for imageDirCID ${imageDirCID}`)
  }

  const imageFiles: { storagePath: string; multihash: string }[] =
    await models.File.findAll({
      where: {
        dirMultihash: imageDirCID,
        cnodeUserUUID: req.session.cnodeUserUUID,
        type: 'image'
      }
    })
  if (!imageFiles) {
    throw new Error(
      `No image file records found in DB for imageDirCID ${imageDirCID}`
    )
  }

  // Ensure every file exists on disk
  await Promise.all(
    imageFiles.map(async function (imageFile) {
      const computedFilePath = computeFilePathInDir(
        imageDirCID,
        imageFile.multihash
      )
      if (
        !(await fs.pathExists(computedFilePath)) &&
        !(await fs.pathExists(imageFile.storagePath))
      ) {
        throw new Error(
          `No file found on disk for imageDirCID ${imageDirCID} image file at computedFilePath ${computedFilePath} or fallback db storagePath ${imageFile.storagePath}`
        )
      }
    })
  )

  req.logger.debug(
    `Completed validateStateForImageDirCIDAndReturnFileUUID for imageDirCID ${imageDirCID}`
  )
  return dirFile.fileUUID
}

function _getStorageLocationForCID(cid: string) {
  try {
    CID.isCID(new CID(cid))
  } catch (e: any) {
    tracing.recordException(e)
    genericLogger.error(`CID invalid, cid=${cid}, error=${e.toString()}`)
    throw new Error(`Please pass in a valid cid. Passed in ${cid} ${e.message}`)
  }

  // This is the directory path that file with cid will go into.
  // The reason for nesting `files` inside `/file_storage` is because legacy nodes store files at the root of `/file_storage`, and
  // that can cause potential collisions if we're creating large amounts of subdirectories. A way to mitigate this is create one
  // directory in the root `/file_storage` and all other directories inside of it like `file_storage/files/<directoryID>/<cid>
  const directoryID = cid.slice(-4, -1)
  const storageLocationForCid = path.join(
    config.get('storagePath'),
    'files',
    directoryID
  )
  // in order to easily dev against the older and newer paths, the line below is the legacy storage path
  // const storageLocationForCid = getConfigStoragePath()

  return storageLocationForCid
}

/**
 * Construct the path to a file or directory given a CID.
 * This function does not ensure the path returned exists on disk, so use it for read-only operations
 * (like /ipfs retrieval) or tasks where a subsequent step will already ensure the path exists (like syncs).
 *
 * eg. if you have a file CID `Qmabcxyz`, use this function to get the path /file_storage/files/cxy/Qmabcxyz
 * eg. if you have a dir CID `Qmdir123`, use this function to get the path /file_storage/files/r12/Qmdir123/
 * Use `computeFilePathInDir` if you want to get the path for a file inside a directory.
 *
 * @dev Returns a path with the three characters before the last character
 *      eg QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6 will be eg /file_storage/muU/QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6
 * @param {String} cid file system destination, either filename or directory
 */
export function computeFilePath(cid: string) {
  const storageLocationForCid = _getStorageLocationForCID(cid)
  return path.join(storageLocationForCid, cid)
}

/**
 * Use for operations where it's necessary to ensure that the path exists before using it.
 * @see computeFilePath - does the same thing but also performs the equivalent of 'mkdir -p'
 */
export async function computeFilePathAndEnsureItExists(cid: string) {
  const parentDirPath = _getStorageLocationForCID(cid)

  // create the subdirectories in parentDirHash if they don't exist
  await ensureDirPathExists(parentDirPath)

  return path.join(parentDirPath, cid)
}

/**
 * Construct the legacy path to a file or directory given a CID
 */
export function computeLegacyFilePath(cid: string) {
  if (!isValidCID(cid)) {
    throw new Error(`[computeLegacyFilePath] [CID=${cid}] Invalid CID.`)
  }
  return path.join(config.get('storagePath'), cid)
}

/**
 * Boolean function to check if arg is a valid CID
 */
export function isValidCID(cid: string) {
  try {
    // Will throw if `new CID(cid)` fails
    // CID.isCID() returns boolean
    return CID.isCID(new CID(cid))
  } catch (e) {
    return false
  }
}

function _validateFileAndDir(dirName: string, fileName: string) {
  if (!dirName || !fileName) {
    genericLogger.error(
      `Invalid dirName and/or fileName, dirName=${dirName}, fileName=${fileName}`
    )
    throw new Error('Must pass in valid dirName and fileName')
  }

  try {
    CID.isCID(new CID(dirName))
    CID.isCID(new CID(fileName))
  } catch (e: any) {
    genericLogger.error(
      `CID invalid, dirName=${dirName}, fileName=${fileName}, error=${e.toString()}`
    )
    throw new Error(
      `Please pass in a valid cid for dirName and fileName. Passed in dirName: ${dirName} fileName: ${fileName} ${e.message}`
    )
  }
}

/**
 * Given a directory name and a file name, construct the full file system path for a directory and a folder inside a directory.
 * This function does not ensure the path returned exists on disk, so use it for read-only operations
 * (like /ipfs retrieval) or tasks where a subsequent step will already ensure the path exists (like syncs).
 *
 * eg if you're manually computing the file path to an file `Qmabcxyz` inside a dir `Qmdir123`, use this function to get the
 * path with both the dir and the file /file_storage/files/r12/Qmdir123/Qmabcxyz
 * Use `computeFilePath` if you just want to get to the path of a file or directory.
 *
 * @param {String} dirName directory name
 * @param {String} fileName file name
 */
export function computeFilePathInDir(dirName: string, fileName: string) {
  _validateFileAndDir(dirName, fileName)

  const parentDirPath = computeFilePath(dirName)
  const absolutePath = path.join(parentDirPath, fileName)
  genericLogger.debug(`File path computed, absolutePath=${absolutePath}`)
  return absolutePath
}

/**
 * Use for operations where it's necessary to ensure that the path exists before using it.
 * @see computeFilePathInDir - does the same thing but also performs the equivalent of 'mkdir -p'
 */
export async function computeFilePathInDirAndEnsureItExists(
  dirName: string,
  fileName: string
) {
  _validateFileAndDir(dirName, fileName)

  const parentDirPath = computeFilePath(dirName)
  await ensureDirPathExists(parentDirPath)
  const absolutePath = path.join(parentDirPath, fileName)
  genericLogger.debug(`File path computed, absolutePath=${absolutePath}`)
  return absolutePath
}

/**
 * Given a directory path, this function will create the dirPath if it doesn't exist
 * If it does exist, it will not overwrite, effectively a no-op
 * @param {string} dirPath fs directory path to create if it does not exist
 */
export async function ensureDirPathExists(dirPath: string) {
  try {
    // the mkdir recursive option is equivalent to `mkdir -p` and should created nested folders several levels deep
    await fs.mkdir(dirPath, { recursive: true })
  } catch (e: any) {
    genericLogger.error(
      `Error making directory, dirName=${dirPath}, error=${e.toString()}`
    )
    throw new Error(`Error making directory at ${dirPath} - ${e.message}`)
  }
}
