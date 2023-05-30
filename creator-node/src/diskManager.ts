import type Logger from 'bunyan'

import path from 'path'
import fs from 'fs-extra'
import { chunk, isEqual, isEmpty } from 'lodash'

import DbManager from './dbManager'
import redisClient from './redis'
import config from './config'
import {
  logger as genericLogger,
  getStartTime,
  logErrorWithDuration
} from './logging'
import { tracing } from './tracer'
import { execShellCommand, runShellCommand } from './utils/runShellCommand'
import { verifyCIDMatchesExpected } from './utils/cidUtils'
import { timeout, getCharsInRanges } from './utils/utils'
import {
  ensureDirPathExists,
  computeFilePath,
  computeFilePathAndEnsureItExists,
  computeFilePathInDirAndEnsureItExists
} from './utils/fsUtils'
import { clusterUtilsForPrimary } from './utils/cluster/clusterUtilsForPrimary'
import { fetchFileFromNetworkAndSaveToFS } from './fileManager'
import BlacklistManager from './blacklistManager'

const models = require('./models')

// regex to check if a directory or just a regular file
// if directory - will have both outer and inner properties in match.groups
// else - will have just outer property, no inner
const CID_DIRECTORY_REGEX =
  /\/(?<outer>Qm[a-zA-Z0-9]{44})\/?(?<inner>Qm[a-zA-Z0-9]{44})?/

// Prefix for redis keys that store which files to delete for a user
const REDIS_DEL_FILE_KEY_PREFIX = 'filePathsToDeleteFor'

const DAYS_BEFORE_PRUNING_ORPHANED_CONTENT = 4

const DB_QUERY_SUCCESS_CHECK_STR = `sweep_db_query_success_${Math.floor(
  Math.random() * 10000
)}`

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
  const stdout = await execShellCommand(`du -sh ${path}`)
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
  if (!cnodeUser) return 0 // User is already wiped if no db record exists
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
    const stdout = await execShellCommand(
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
    const stdout = await execShellCommand(
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
  // infinite while loop with terminal conditions and a delay between iterations
  while (true) {
    const subdirectories = await listSubdirectoriesInFiles()
    if (!subdirectories) return

    for (let i = 0; i < subdirectories.length; i += 1) {
      try {
        const subdirectory = subdirectories[i]

        const cidsToFilePathMap = await listNestedCIDsInFilePath(subdirectory)
        const cidsInSubdirectory = Object.keys(cidsToFilePathMap)

        if (cidsInSubdirectory.length === 0) {
          continue
        }

        const queryResults =
          // add a `query_success` row to the result so we know the query ran successfully
          // shouldn't need this because sequelize should throw an error, but when deleting
          // from disk paranoia is probably justified
          (
            await models.sequelize.query(
              `(SELECT "multihash" FROM "Files" WHERE "multihash" IN (:cidsInSubdirectory)) 
              UNION
              (SELECT '${DB_QUERY_SUCCESS_CHECK_STR}');`,
              { replacements: { cidsInSubdirectory } }
            )
          )[0]

        genericLogger.debug(
          `diskManager#sweepSubdirectoriesInFiles - iteration ${i} out of ${subdirectories.length
          }. subdirectory: ${subdirectory}. got ${Object.keys(cidsToFilePathMap).length
          } files in folder and ${queryResults.length
          } results from db. files: ${Object.keys(
            cidsToFilePathMap
          ).toString()}. db records: ${JSON.stringify(queryResults)}`
        )

        const cidsInDB = new Set()
        let foundSuccessRow = false
        for (const file of queryResults) {
          if (file.multihash === `${DB_QUERY_SUCCESS_CHECK_STR}`)
            foundSuccessRow = true
          else cidsInDB.add(file.multihash)
        }

        if (!foundSuccessRow)
          throw new Error(`DB did not return expected success row`)

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
          if (config.get('backgroundDiskCleanupDeleteEnabled')) {
            await execShellCommand(
              `rm ${cidsToDelete
                .map((cid) => cidsToFilePathMap[cid])
                .join(' '), true}`
            )
          }
        }
      } catch (e: any) {
        tracing.recordException(e)
        genericLogger.error(
          `diskManager#sweepSubdirectoriesInFiles - error: ${e}`
        )
      }

      // Wait 10sec between batches to reduce server load
      await timeout(10000)
    }

    // keep calling this function recursively without an await so the original function scope can close
    // Only call again if backgroundDiskCleanupDeleteEnabled = true, to prevent re-processing infinitely
    if (!redoJob || !config.get('backgroundDiskCleanupDeleteEnabled')) return
    await timeout(1000)
  }
}

/**
 * Performs the equivalent of Unix `touch` command - make file at given path with ctime and mtime of now.
 */
async function _touch(path: string) {
  // Set mtime to now, and on error (file not found) create new file which will by default have mtime of now
  const now = new Date()
  try {
    await fs.utimes(path, now, now)
  } catch (e: any) {
    const fd = await fs.open(path, 'w')
    await fs.close(fd)
  }
}

type FileRecord = {
  storagePath: string
  multihash: string
  fileUUID: string
  skipped: boolean
  dirMultihash?: string
  fileName?: string
  trackBlockchainId?: number
}

async function _copyLegacyFiles(
  fileRecords: FileRecord[],
  prometheusRegistry: any,
  logger: Logger
): Promise<
  {
    legacyPath: string
    nonLegacyPath: string
  }[]
> {
  const erroredPaths: { [path: string]: [error: string] } = {}
  const copiedPaths: {
    legacyPath: string
    nonLegacyPath: string
  }[] = []
  for (const fileRecord of fileRecords) {
    const legacyPath = fileRecord.storagePath
    let nonLegacyPath = ''
    try {
      // Compute new path
      const nonLegacyPathInfo = extractCIDsFromFSPath(legacyPath)
      if (!nonLegacyPathInfo) throw new Error('Unable to extract CID from path')
      if (!nonLegacyPathInfo.inner && !nonLegacyPathInfo.outer) {
        throw new Error('Extracted empty CID from path')
      }

      // Ensure new path's parent exists
      nonLegacyPath = await (nonLegacyPathInfo.isDir
        ? computeFilePathInDirAndEnsureItExists(
          nonLegacyPathInfo.outer,
          nonLegacyPathInfo.inner!
        )
        : computeFilePathAndEnsureItExists(nonLegacyPathInfo.outer))

      // Copy to new path, overwriting if it already exists
      try {
        // Set the file's mtime to now so disk pruning doesn't delete it before we update db
        await _touch(nonLegacyPath)
        await fs.copyFile(legacyPath, nonLegacyPath)
        // Update mtime again just in case copyFile changed it
        const now = new Date()
        await fs.utimes(nonLegacyPath, now, now)

        // Verify that the correct contents were copied
        const cidMatchesExpected = await verifyCIDMatchesExpected({
          cid: fileRecord.multihash,
          path: nonLegacyPath,
          logger
        })
        if (!cidMatchesExpected) {
          logger.warn(
            'CID does not match what is expected to be based on contents hash, but contents were copied anyway'
          )
        }
        copiedPaths.push({ legacyPath, nonLegacyPath })
      } catch (copyError: any) {
        if (copyError.message.includes('ENOSPC')) {
          // If we see a ENOSPC error, log out the disk space and inode details from the system
          await Promise.all([
            runShellCommand(`df`, ['-h'], logger),
            runShellCommand(`df`, ['-ih'], logger)
          ])
          throw copyError
        } else if (copyError.message.includes('ENOENT')) {
          // If we see an ENOENT error ("no such file"), try fetching the file from network
          let success, error
          try {
            try {
              await fs.unlink(nonLegacyPath)
            } catch (e) {
              logger.error(
                `_copyLegacyFiles() could not remove 'touch'ed file at storageLocation=${nonLegacyPath}`
              )
            }
            ; ({ success, error } = await _migrateFileByFetchingFromNetwork(
              fileRecord,
              logger
            ))
          } catch (fetchFallbackError: any) {
            success = false
            error = fetchFallbackError
          }

          // Add delay between calls since each call will make an internal request to every node
          await timeout(1000)

          if (success) {
            copiedPaths.push({ legacyPath, nonLegacyPath })
          } else {
            throw new Error(
              `Legacy fetch from network fallback error: ${error}. Copy error: ${copyError}`
            )
          }
        } else throw copyError
      }
    } catch (e: any) {
      // If the file is skipped (blacklisted) then we don't care if it failed to copy
      if (fileRecord.skipped && nonLegacyPath?.length) {
        copiedPaths.push({ legacyPath, nonLegacyPath })
      } else {
        erroredPaths[legacyPath] = e.toString()
      }
    }
  }

  // Record results in Prometheus metric and log errors
  _recordLegacyMigrationMetrics(
    copiedPaths.length,
    Object.keys(erroredPaths).length,
    prometheusRegistry,
    logger
  )
  if (!isEmpty(erroredPaths)) {
    logger.warn(
      `Failed to copy some legacy files: ${JSON.stringify(erroredPaths)}`
    )
  }

  return copiedPaths
}

/**
 * Creates pagination windows and calls the given function to query for CIDs within the windows.
 * There's a separate [min, max] window for letters and numbers:
 * - for letters: [Qmaa, Qmzz]
 * - for numbers [Qma0, Qmz9]
 *
 * We don't have any CIDs that start with Qm[0,9], so that's why for numbers we:
 * - start at Qma0 instead of Qm00; and
 * - end at Qmz9 instead of Qm99
 *
 * At each window, we find all CIDs in the window by appending:
 * - '0000000000000000000000000000000000000000000' to the min; and
 * - 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' to the max
 * @param func the function to call on each pagination window (there are 936 windows)
 */
async function _callFuncOnAllCidsPaginated(
  func: (minCid: string, maxCid: string) => Promise<void>
) {
  // We don't have any CIDs that start with Qm[0,9], so just Qm[a,z] is sufficient
  for (const char1 of getCharsInRanges('az')) {
    // Loop [Qm*a,Qm*z] and [Qm*0,Qm*9]
    for (const char2 of getCharsInRanges('az', '09')) {
      // For each permutation, search in the pagination window of a-z and 0-9.
      // I.e., window Qm**a through Qm**z and window Qm**0 through Qm**9
      await func(
        'Qm' + char1 + char2 + '0000000000000000000000000000000000000000000',
        'Qm' + char1 + char2 + 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'
      )
    }
  }
}

const _migrateNonDirFilesWithLegacyStoragePaths = async (
  queryDelayMs: number,
  batchSize: number,
  prometheusRegistry: any,
  logger: Logger
) =>
  _callFuncOnAllCidsPaginated(async (minCid, maxCid) => {
    // Query for legacy storagePaths in the pagination range until no new results are returned
    let newResultsFound = true
    let results: FileRecord[] = []
    while (newResultsFound) {
      const prevResults = results
      results = await DbManager.getNonDirLegacyStoragePathRecords(
        minCid,
        maxCid,
        batchSize
      )
      if (results.length) {
        newResultsFound = !isEqual(prevResults, results)
        const copiedFilePaths = await _copyLegacyFiles(
          results,
          prometheusRegistry,
          logger
        )
        await DbManager.updateLegacyPathDbRows(copiedFilePaths, logger)
      } else {
        newResultsFound = false
      }
      await timeout(queryDelayMs) // Avoid spamming fast queries
    }
  })

const _migrateDirsWithLegacyStoragePaths = async (
  queryDelayMs: number,
  batchSize: number,
  logger: Logger
) =>
  _callFuncOnAllCidsPaginated(async (minCid, maxCid) => {
    // Query for legacy storagePaths in the pagination range until no new results are returned
    let newResultsFound = true
    let results: FileRecord[] = []
    while (newResultsFound) {
      const prevResults = results
      results = await DbManager.getDirLegacyStoragePathRecords(
        minCid,
        maxCid,
        batchSize
      )
      if (results.length) {
        newResultsFound = !isEqual(prevResults, results)
        const legacyAndNonLegacyPaths = results.map((fileRecord) => {
          return {
            legacyPath: fileRecord.storagePath,
            nonLegacyPath: computeFilePath(fileRecord.multihash)
          }
        })
        await DbManager.updateLegacyPathDbRows(legacyAndNonLegacyPaths, logger)
      } else {
        newResultsFound = false
      }
      await timeout(queryDelayMs) // Avoid spamming fast queries
    }
  })

async function _migrateFileByFetchingFromNetwork(
  fileRecord: FileRecord,
  logger: Logger
): Promise<{ success: boolean; error: any }> {
  const fetchStartTime = getStartTime()
  // Will retry internally
  const { error, storagePath } = await fetchFileFromNetworkAndSaveToFS(
    {}, // libs param is unused, so empty object is sufficient
    logger,
    fileRecord.multihash,
    fileRecord.dirMultihash,
    [] /** targetGateways - empty to try all nodes */,
    fileRecord.fileName,
    fileRecord.trackBlockchainId,
    2 /** numRetries */
  )

  if (error) {
    // If copying errored because the file is delisted, we can ignore the error and update the db storagePath
    const isServable = await BlacklistManager.isServable(fileRecord.multihash)
    if (!isServable && fileRecord.skipped) {
      await models.File.update(
        { storagePath },
        {
          where: { fileUUID: fileRecord.fileUUID }
        }
      )
      return { success: true, error: '' }
    }
    logErrorWithDuration(
      { logger, startTime: fetchStartTime },
      `Error fixing fileRecord ${JSON.stringify(fileRecord)}: ${error}`
    )
    return { success: false, error }
  } else {
    // Update file's storagePath in DB to newly saved location, and ensure it's not marked as skipped
    await models.File.update(
      { storagePath },
      {
        where: { fileUUID: fileRecord.fileUUID, skipped: false }
      }
    )
    return { success: true, error: '' }
  }
}

const _migrateFilesWithCustomStoragePaths = async (
  queryDelayMs: number,
  batchSize: number,
  prometheusRegistry: any,
  logger: Logger
) =>
  _callFuncOnAllCidsPaginated(async (minCid, maxCid) => {
    // Query for custom storagePaths in the pagination range until no new results are returned
    let newResultsFound
    let results: FileRecord[] = []
    while (newResultsFound) {
      const prevResults = results
      results = await DbManager.getCustomStoragePathsRecords(
        minCid,
        maxCid,
        batchSize
      )
      if (results.length) {
        newResultsFound = !isEqual(prevResults, results)
        // Process sequentially to minimize load since this is not time-sensitive
        let numFilesMigratedSuccessfully = 0
        let numFilesFailedToMigrate = 0
        for (const fileRecord of results) {
          let success, error
          try {
            ; ({ success, error } = await _migrateFileByFetchingFromNetwork(
              fileRecord,
              logger
            ))
          } catch (e: any) {
            success = false
            error = e
          }
          if (success) {
            numFilesMigratedSuccessfully++
          } else {
            numFilesFailedToMigrate++
            logger.error(
              `Error fixing fileRecord (custom) ${JSON.stringify(
                fileRecord
              )}: ${error}`
            )
          }

          // Add delay between calls since each call will make an internal request to every node
          await timeout(1000)
        }

        _recordCustomMigrationMetrics(
          numFilesMigratedSuccessfully,
          numFilesFailedToMigrate,
          prometheusRegistry,
          logger
        )
      } else {
        newResultsFound = false
      }
      await timeout(queryDelayMs) // Avoid spamming fast queries
    }
  })

function _recordLegacyMigrationMetrics(
  numSuccess: number,
  numFailure: number,
  prometheusRegistry: any,
  logger: Logger
) {
  _recordMigrationMetrics(
    true,
    numSuccess,
    numFailure,
    prometheusRegistry,
    logger
  )
}

function _recordCustomMigrationMetrics(
  numSuccess: number,
  numFailure: number,
  prometheusRegistry: any,
  logger: Logger
) {
  _recordMigrationMetrics(
    false,
    numSuccess,
    numFailure,
    prometheusRegistry,
    logger
  )
}

function _recordMigrationMetrics(
  legacy: boolean,
  numSuccess: number,
  numFailure: number,
  prometheusRegistry: any,
  logger: Logger
) {
  const metricName = legacy
    ? prometheusRegistry.metricNames.FILES_MIGRATED_FROM_LEGACY_PATH_GAUGE
    : prometheusRegistry.metricNames.FILES_MIGRATED_FROM_CUSTOM_PATH_GAUGE
  if (numSuccess > 0) {
    clusterUtilsForPrimary.sendMetricToWorker(
      {
        metricType: 'GAUGE_INC',
        metricName,
        metricValue: numSuccess,
        metricLabels: { result: 'success' }
      },
      prometheusRegistry,
      logger
    )
  }
  if (numFailure > 0) {
    clusterUtilsForPrimary.sendMetricToWorker(
      {
        metricType: 'GAUGE_INC',
        metricName,
        metricValue: numFailure,
        metricLabels: { result: 'failure' }
      },
      prometheusRegistry,
      logger
    )
  }
}

function _resetStoragePathMetrics(prometheusRegistry: any, logger: Logger) {
  try {
    // Reset metric for legacy migrations
    clusterUtilsForPrimary.sendMetricToWorker(
      {
        metricType: 'GAUGE_SET',
        metricName:
          prometheusRegistry.metricNames.FILES_MIGRATED_FROM_LEGACY_PATH_GAUGE,
        metricValue: 0,
        metricLabels: { result: 'success' }
      },
      prometheusRegistry,
      logger
    )
    clusterUtilsForPrimary.sendMetricToWorker(
      {
        metricType: 'GAUGE_SET',
        metricName:
          prometheusRegistry.metricNames.FILES_MIGRATED_FROM_LEGACY_PATH_GAUGE,
        metricValue: 0,
        metricLabels: { result: 'failure' }
      },
      prometheusRegistry,
      logger
    )

    // Reset metric for custom migrations
    clusterUtilsForPrimary.sendMetricToWorker(
      {
        metricType: 'GAUGE_SET',
        metricName:
          prometheusRegistry.metricNames.FILES_MIGRATED_FROM_CUSTOM_PATH_GAUGE,
        metricValue: 0,
        metricLabels: { result: 'success' }
      },
      prometheusRegistry,
      logger
    )
    clusterUtilsForPrimary.sendMetricToWorker(
      {
        metricType: 'GAUGE_SET',
        metricName:
          prometheusRegistry.metricNames.FILES_MIGRATED_FROM_CUSTOM_PATH_GAUGE,
        metricValue: 0,
        metricLabels: { result: 'failure' }
      },
      prometheusRegistry,
      logger
    )
  } catch (e: any) {
    logger.error(`Failed to reset counts of migrated storagePaths: ${e}`)
  }
}

async function _recordTotalUnmigratedStoragePathsMetric(
  prometheusRegistry: any,
  logger: Logger
) {
  try {
    clusterUtilsForPrimary.sendMetricToWorker(
      {
        metricType: 'GAUGE_SET',
        metricName:
          prometheusRegistry.metricNames.TOTAL_UNMIGRATED_STORAGE_PATHS_GAUGE,
        metricValue: await DbManager.getNumLegacyStoragePathsRecords(),
        metricLabels: { type: 'legacy' }
      },
      prometheusRegistry,
      logger
    )
    clusterUtilsForPrimary.sendMetricToWorker(
      {
        metricType: 'GAUGE_SET',
        metricName:
          prometheusRegistry.metricNames.TOTAL_UNMIGRATED_STORAGE_PATHS_GAUGE,
        metricValue: await DbManager.getNumCustomStoragePathsRecords(),
        metricLabels: { type: 'custom' }
      },
      prometheusRegistry,
      logger
    )
  } catch (e: any) {
    logger.error(
      `Failed to record total count of unmigrated storagePaths: ${e}`
    )
  }
}

/**
 * For non-directory files and then later for files, this:
 * 1. Finds rows in the Files table that have a legacy storagePath (/file_storage/<CID or dirCID>)
 * 2. Copies the file to to the non-legacy path (/file_storage/files/<CID or dirCID>)
 * 3. Updates the row in the Files table to reflect the new storagePath
 * 4. Increments Prometheus metric `filesMigratedFromLegacyPath` to reflect the number of files moved
 *
 * Then, for files with custom storage paths, this:
 * 1. Finds rows in the Files table that have a custom storagePath (not /file_storage/<CID> and not /file_storage/files/<CID>)
 * 2. Finds the file in network and saves it to the standard path (/file_storage/files/*)
 * 3. Updates the row in the Files table to reflect the new storagePath
 * 4. Increments Prometheus metric `filesMigratedFromCustomPath` to reflect the number of files moved
 * @param queryDelayMs millis to wait between SQL queries
 * @param prometheusRegistry registry to record Prometheus metrics
 * @param logger logger to print errors to
 */
export async function migrateFilesWithNonStandardStoragePaths(
  queryDelayMs: number,
  prometheusRegistry: any,
  logger: Logger
): Promise<void> {
  const BATCH_SIZE = 5_000

  // infinite while loop with a delay between iterations
  while (true) {
    // Reset gauges on each run so the metrics aren't infinitely increasing, and record total # of unmigrated paths
    _resetStoragePathMetrics(prometheusRegistry, logger)
    await _recordTotalUnmigratedStoragePathsMetric(prometheusRegistry, logger)

    // Legacy storagePaths (/<storagePath env>/CID)
    if (config.get('migrateFilesWithLegacyStoragePath')) {
      try {
        await _migrateNonDirFilesWithLegacyStoragePaths(
          queryDelayMs,
          BATCH_SIZE,
          prometheusRegistry,
          logger
        )
        await _migrateDirsWithLegacyStoragePaths(
          queryDelayMs,
          BATCH_SIZE,
          logger
        )
      } catch (e: any) {
        logger.error(`Error migrating legacy storagePaths: ${e}`)
      }
    }

    // Custom storagePaths (not matching 'storagePath' env var)
    if (config.get('migrateFilesWithCustomStoragePath')) {
      try {
        await _migrateFilesWithCustomStoragePaths(
          queryDelayMs,
          BATCH_SIZE,
          prometheusRegistry,
          logger
        )
      } catch (e: any) {
        logger.error(`Error migrating custom storagePaths: ${e}`)
      }
    }

    queryDelayMs = 5000

    // Wait 10 minutes since the first queries for metrics can be heavy
    await timeout(10 * 60 * 1000)
  }
}
