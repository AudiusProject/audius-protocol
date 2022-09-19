import type { ReadStream } from 'fs-extra'

import fs from 'fs-extra'
import path from 'path'
import stream from 'stream'
import { promisify } from 'util'

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
  req.logger.info(
    `Beginning validateStateForImageDirCIDAndReturnFileUUID for imageDirCID ${imageDirCID}`
  )

  // Ensure file exists for dirCID
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

  // Ensure dir exists on disk
  if (!(await fs.pathExists(dirFile.storagePath))) {
    throw new Error(
      `No dir found on disk for imageDirCID ${imageDirCID} at expected path ${dirFile.storagePath}`
    )
  }

  const imageFiles = await models.File.findAll({
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
    imageFiles.map(async function (imageFile: { storagePath: string }) {
      if (!(await fs.pathExists(imageFile.storagePath))) {
        throw new Error(
          `No file found on disk for imageDirCID ${imageDirCID} image file at path ${imageFile.storagePath}`
        )
      }
    })
  )

  req.logger.info(
    `Completed validateStateForImageDirCIDAndReturnFileUUID for imageDirCID ${imageDirCID}`
  )
  return dirFile.fileUUID
}
