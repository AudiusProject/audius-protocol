import type Logger from 'bunyan'

import util from 'util'
import path from 'path'
import fs from 'fs-extra'
import CID from 'cids'
import { chunk } from 'lodash'

import DbManager from './dbManager'
import redisClient from './redis'
import config from './config'
import { logger as genericLogger } from './logging'
import { tracing } from './tracer'

const models = require('./models')
const exec = util.promisify(require('child_process').exec)

// regex to check if a directory or just a regular file
// if directory - will have both outer and inner properties in match.groups
// else - will have just outer property, no inner
const CID_DIRECTORY_REGEX =
  /\/(?<outer>Qm[a-zA-Z0-9]{44})\/?(?<inner>Qm[a-zA-Z0-9]{44})?/

// Prefix for redis keys that store which files to delete for a user
const REDIS_DEL_FILE_KEY_PREFIX = 'filePathsToDeleteFor'

const DAYS_BEFORE_PRUNING_ORPHANED_CONTENT = 7

// variable to cache if we've run `ensureDirPathExists` in getTmpTrackUploadArtifactsPath so we don't run
// it every time a track is uploaded
let TMP_TRACK_ARTIFACTS_CREATED = false

/**
 * Return the storagePath from the config
 */
export function getConfigStoragePath() {
  return config.get('storagePath')
}

/**
 *
 * @param {string} path the path to get the size for
 * @returns the string output of stdout
 */
export async function getDirSize(path: string) {
  const stdout = await _execShellCommand(`du -sh ${path}`)
  return stdout
}

/**
 * Empties the tmp track artifacts directory of any old artifacts
 */
export async function emptyTmpTrackUploadArtifacts() {
  const dirPath = await getTmpTrackUploadArtifactsPath()
  const dirSize = await getDirSize(dirPath)
  await fs.emptyDir(dirPath)

  return dirSize
}

/**
 * Returns the folder that stores track artifacts uploaded by creators. The reason this is all stored together
 * is we should be able to delete the contents of this folder without scanning through other folders with the
 * naming scheme.
 */
export async function getTmpTrackUploadArtifactsPath() {
  const dirPath = path.join(
    config.get('storagePath'),
    'files',
    'tmp_track_artifacts'
  )
  if (!TMP_TRACK_ARTIFACTS_CREATED) {
    await ensureDirPathExists(dirPath)
    TMP_TRACK_ARTIFACTS_CREATED = true
  }
  return dirPath
}

/**
 * Construct the path to a file or directory given a CID
 *
 * eg. if you have a file CID `Qmabcxyz`, use this function to get the path /file_storage/files/cxy/Qmabcxyz
 * eg. if you have a dir CID `Qmdir123`, use this function to get the path /file_storage/files/r12/Qmdir123/
 * Use `computeFilePathInDir` if you want to get the path for a file inside a directory.
 *
 * @dev Returns a path with the three characters before the last character
 *      eg QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6 will be eg /file_storage/muU/QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6
 * @param {String} cid file system destination, either filename or directory
 */
export async function computeFilePath(cid: string, ensurePathExists = true) {
  try {
    CID.isCID(new CID(cid))
  } catch (e: any) {
    tracing.recordException(e)
    genericLogger.error(`CID invalid, cid=${cid}, error=${e.toString()}`)
    throw new Error(
      `Please pass in a valid cid to computeFilePath. Passed in ${cid} ${e.message}`
    )
  }

  // This is the directory path that file with cid will go into.
  // The reason for nesting `files` inside `/file_storage` is because legacy nodes store files at the root of `/file_storage`, and
  // that can cause potential collisions if we're creating large amounts of subdirectories. A way to mitigate this is create one
  // directory in the root `/file_storage` and all other directories inside of it like `file_storage/files/<directoryID>/<cid>
  const directoryID = cid.slice(-4, -1)
  const parentDirPath = path.join(getConfigStoragePath(), 'files', directoryID)
  // in order to easily dev against the older and newer paths, the line below is the legacy storage path
  // const parentDirPath = getConfigStoragePath()

  // create the subdirectories in parentDirHash if they don't exist
  if (ensurePathExists) {
    await ensureDirPathExists(parentDirPath)
  }

  return path.join(parentDirPath, cid)
}

/**
 * Construct the legacy path to a file or directory given a CID
 */
export function computeLegacyFilePath(cid: string) {
  if (!isValidCID(cid)) {
    throw new Error(`[computeLegacyFilePath] [CID=${cid}] Invalid CID.`)
  }
  return path.join(getConfigStoragePath(), cid)
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

/**
 * Given a directory name and a file name, construct the full file system path for a directory and a folder inside a directory
 *
 * eg if you're manually computing the file path to an file `Qmabcxyz` inside a dir `Qmdir123`, use this function to get the
 * path with both the dir and the file /file_storage/files/r12/Qmdir123/Qmabcxyz
 * Use `computeFilePath` if you just want to get to the path of a file or directory.
 *
 * @param {String} dirName directory name
 * @param {String} fileName file name
 */
export async function computeFilePathInDir(dirName: string, fileName: string) {
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
      `Please pass in a valid cid to computeFilePathInDir for dirName and fileName. Passed in dirName: ${dirName} fileName: ${fileName} ${e.message}`
    )
  }

  const parentDirPath = await computeFilePath(dirName)
  const absolutePath = path.join(parentDirPath, fileName)
  genericLogger.info(`File path computed, absolutePath=${absolutePath}`)
  return absolutePath
}

/**
 * Given a directory path, this function will create the dirPath if it doesn't exist
 * If it does exist, it will not overwrite, effectively a no-op
 * @param {*} dirPath fs directory path to create if it does not exist
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

/**
 * Given a file system path, extract CID's from the path and returns obj
 * @param {String} fsPath file system path like /file_storage/files/r12/Qmdir123/Qmabcxyz
 * @returns {Object} {isDir: Boolean, outer: CID, inner: CID|null}
 *    outer should always be defined and can either be a file if not dir, or the dir name if dir
 *    inner will be defined if the file is inside the dir matched by the outer match group
 */
export function extractCIDsFromFSPath(fsPath: string) {
  const match = CID_DIRECTORY_REGEX.exec(fsPath)
  if (!match || !match.groups) {
    genericLogger.info(
      `Input path does not match cid directory pattern, fsPath=${fsPath}`
    )
    return null
  }

  let ret = null
  if (match && match.groups && match.groups.outer && match.groups.inner) {
    ret = {
      isDir: true,
      outer: match.groups.outer,
      inner: match.groups.inner
    }
  } else if (match.groups.outer && !match.groups.inner) {
    ret = { isDir: false, outer: match.groups.outer, inner: null }
  }

  return ret
}

export async function deleteFileOrDir(pathToFileOrDir: string) {
  // Base case - delete single file (not a directory)
  if (!(await fs.lstat(pathToFileOrDir)).isDirectory()) {
    await fs.unlink(pathToFileOrDir)
    return
  }

  // Recursively remove all contents of directory
  for (const file of await fs.readdir(pathToFileOrDir)) {
    const childPath = path.join(pathToFileOrDir, file)
    if ((await fs.lstat(childPath)).isDirectory()) {
      await deleteFileOrDir(childPath)
    } else {
      await fs.unlink(childPath)
    }
  }

  // Remove actual directory
  await fs.rmdir(pathToFileOrDir)
}

/**
 * Recursively deletes an array of file paths and their subdirectories in paginated chunks.
 * @param {string[]} storagePaths the file paths to delete
 * @param {number} batchSize the number of concurrent deletes to perform
 * @param {Logger} logger
 * @returns {number} number of files successfully deleted
 */
export async function batchDeleteFileOrDir(
  storagePaths: string[],
  batchSize: number,
  logger: Logger
) {
  let numFilesDeleted = 0
  const batches = chunk(storagePaths, batchSize)
  const promiseResults = []
  for (const batchOfStoragePaths of batches) {
    const promiseResultsForBatch = await Promise.allSettled(
      batchOfStoragePaths.map((storagePath) => deleteFileOrDir(storagePath))
    )
    promiseResults.push(...promiseResultsForBatch)
  }

  // Count number of files successfully deleted and log errors
  for (const promiseResult of promiseResults) {
    if (promiseResult.status === 'fulfilled') {
      numFilesDeleted++
    } else {
      logger.error(`Could not delete file: ${promiseResult?.reason?.stack}`)
    }
  }
  return numFilesDeleted
}

/**
 * Adds path to redis set for every file of the given user.
 * DOES NOT DELETE. Call deleteAllCNodeUserDataFromDisk() to delete the data that was added to redis.
 * Uses pagination to avoid loading all files in memory for users with a lot of data.
 * @param {string} walletPublicKey the wallet of the user to delete all data for
 * @param {Logger} logger
 * @return number of file paths added to redis
 */
export async function gatherCNodeUserDataToDelete(
  walletPublicKey: string,
  logger: Logger
) {
  const FILES_PER_QUERY = 10_000
  const redisSetKey = `${REDIS_DEL_FILE_KEY_PREFIX}${walletPublicKey}`
  await redisClient.del(redisSetKey)

  const cnodeUser = await models.CNodeUser.findOne({
    where: { walletPublicKey }
  })
  if (!cnodeUser) throw new Error('No cnodeUser found')
  const { cnodeUserUUID } = cnodeUser
  logger.info(
    `Fetching data to delete from disk for cnodeUserUUID: ${cnodeUserUUID}`
  )

  // Add files to delete to redis, paginated by storagePath, starting at the lowest real character (space)
  let prevStoragePath = ' '
  let numFilesAdded = 0
  let filePaths = []
  do {
    filePaths = await DbManager.getCNodeUserFilesFromDb(
      cnodeUserUUID,
      prevStoragePath,
      FILES_PER_QUERY
    )
    if (filePaths.length) {
      numFilesAdded = await redisClient.sadd(redisSetKey, filePaths)
      prevStoragePath = filePaths[filePaths.length - 1]
    } else numFilesAdded = 0
  } while (filePaths.length === FILES_PER_QUERY || numFilesAdded > 0)
  // Nothing left to paginate if the last page wasn't full length and didn't contain new files

  return redisClient.scard(redisSetKey)
}

/**
 * Deletes from disk each file path that was added by gatherCNodeUserDataToDelete().
 * Uses pagination to avoid loading all files in memory for users with a lot of data.
 * @param {string} walletPublicKey the wallet of the user to delete all data for
 * @param {number} numFilesToDelete the number of file paths in redis
 * @param {bunyan.Logger} logger
 * @return number of files deleted
 */
export async function deleteAllCNodeUserDataFromDisk(
  walletPublicKey: string,
  numFilesToDelete: number,
  logger: Logger
) {
  const FILES_PER_REDIS_QUERY = 10_000
  const FILES_PER_DELETION_BATCH = 100
  const redisSetKey = `${REDIS_DEL_FILE_KEY_PREFIX}${walletPublicKey}`
  try {
    // Read file paths from redis and delete them
    let numFilesDeleted = 0
    for (let i = 0; i < numFilesToDelete; i += FILES_PER_REDIS_QUERY) {
      const filePathsToDelete = await redisClient.spop(
        redisSetKey,
        FILES_PER_REDIS_QUERY
      )
      if (!filePathsToDelete?.length) return numFilesDeleted

      numFilesDeleted += await batchDeleteFileOrDir(
        filePathsToDelete,
        FILES_PER_DELETION_BATCH,
        logger
      )
    }
    return numFilesDeleted
  } finally {
    await redisClient.del(redisSetKey)
  }
}

export async function clearFilePathsToDelete(walletPublicKey: string) {
  const redisSetKey = `${REDIS_DEL_FILE_KEY_PREFIX}${walletPublicKey}`
  await redisClient.del(redisSetKey)
}

// lists all the folders in /file_storage/files/
export async function listSubdirectoriesInFiles() {
  const subdirectories = []
  const fileStorageFilesDirPath = path.join(getConfigStoragePath(), 'files') // /file_storage/files
  try {
    // returns list of directories like
    // `
    // .
    // ./d8A
    // ./Pyx
    // ./BJg
    // ./nVU
    // `
    const stdout = await _execShellCommand(
      `cd ${fileStorageFilesDirPath}; find . -maxdepth 1`
    )
    // stdout is a string so split on newline and remove any empty strings
    // clean any . and ./ results since find can include these to reference relative paths
    for (const dir of stdout.split('\n')) {
      const dirTrimmed = dir.replace('.', '').replace('/', '').trim()
      // if dirTrimmed is a non-null string
      if (dirTrimmed) {
        subdirectories.push(`${fileStorageFilesDirPath}/${dirTrimmed}`)
      }
    }

    return subdirectories
  } catch (e) {
    genericLogger.error(
      `Error in diskManager - listSubdirectoriesInFiles: ${e}`
    )
  }
}

// list all the CIDs in /file_storage/files/AqN
// returns mapping of {cid: filePath, cid: filePath ...}
export async function listNestedCIDsInFilePath(
  filesSubdirectory: string
): Promise<Record<string, string>> {
  const cidsToFilePathMap: Record<string, string> = {}
  // find files older than DAYS_BEFORE_PRUNING_ORPHANED_CONTENT days in filesSubdirectory (eg /file_storage/files/AqN)
  try {
    const stdout = await _execShellCommand(
      `find ${filesSubdirectory} -mtime +${DAYS_BEFORE_PRUNING_ORPHANED_CONTENT}`
    )

    for (const file of stdout.split('\n')) {
      const fileTrimmed = file.trim()
      // if fileTrimmed is a non-null string and is not just equal to base directory
      if (fileTrimmed && fileTrimmed !== filesSubdirectory) {
        const parts = fileTrimmed.split('/')
        // returns the last CID in the event of dirCID
        const leafCID = parts[parts.length - 1]
        cidsToFilePathMap[leafCID] = fileTrimmed
      }
    }

    return cidsToFilePathMap
  } catch (e) {
    genericLogger.error(`Error in diskManager - listNestedCIDsInFilePath: ${e}`)
    return {}
  }
}

export async function sweepSubdirectoriesInFiles(
  redoJob = true
): Promise<void> {
  const subdirectories = await listSubdirectoriesInFiles()
  if (!subdirectories) return

  for (let i = 0; i < subdirectories.length; i += 1) {
    try {
      const subdirectory = subdirectories[i]

      const cidsToFilePathMap = await listNestedCIDsInFilePath(subdirectory)
      const cidsInSubdirectory = Object.keys(cidsToFilePathMap)

      const queryResults = await models.File.findAll({
        attributes: ['multihash', 'storagePath'],
        raw: true,
        where: {
          multihash: {
            [models.Sequelize.Op.in]: cidsInSubdirectory
          }
        }
      })

      genericLogger.debug(
        `diskManager#sweepSubdirectoriesInFiles - iteration ${i} out of ${
          subdirectories.length
        }. subdirectory: ${subdirectory}. got ${
          Object.keys(cidsToFilePathMap).length
        } files in folder and ${
          queryResults.length
        } results from db. files: ${Object.keys(
          cidsToFilePathMap
        ).toString()}. db records: ${JSON.stringify(queryResults)}`
      )

      const cidsInDB = new Set()
      for (const file of queryResults) {
        cidsInDB.add(file.multihash)
      }

      const cidsToDelete = []
      const cidsNotToDelete = []
      // iterate through all files on disk and check if db contains it
      for (const cid of cidsInSubdirectory) {
        // if db doesn't contain file, log as okay to delete
        if (!cidsInDB.has(cid)) {
          cidsToDelete.push(cid)
        } else cidsNotToDelete.push(cid)
      }

      if (cidsNotToDelete.length > 0) {
        genericLogger.debug(
          `diskmanager.js - not safe to delete ${cidsNotToDelete.toString()}`
        )
      }

      if (cidsToDelete.length > 0) {
        genericLogger.info(
          `diskmanager.js - safe to delete ${cidsToDelete.toString()}`
        )

        // gate deleting files on disk with the same env var
        if (config.get('syncForceWipeEnabled')) {
          await _execShellCommand(
            `rm ${cidsToDelete.map((cid) => cidsToFilePathMap[cid]).join(' ')}`
          )
        }
      }
    } catch (e: any) {
      tracing.recordException(e)
      genericLogger.error(
        `diskManager#sweepSubdirectoriesInFiles - error: ${e}`
      )
    }
  }

  // keep calling this function recursively without an await so the original function scope can close
  if (redoJob) return sweepSubdirectoriesInFiles()
}

export async function _execShellCommand(cmd: string, log = false) {
  if (log)
    genericLogger.info(`diskManager - about to call _execShellCommand: ${cmd}`)
  const { stdout, stderr } = await exec(`${cmd}`, {
    maxBuffer: 1024 * 1024 * 5
  }) // 5mb buffer
  if (stderr) throw stderr

  return stdout
}
