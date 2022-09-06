const { recoverPersonalSignature } = require('eth-sig-util')
const fs = require('fs-extra')
const path = require('path')
const axios = require('axios')
const spawn = require('child_process').spawn
const stream = require('stream')
const { promisify } = require('util')

const { logger: genericLogger } = require('../logging')
const asyncRetry = require('./asyncRetry')
const models = require('../models')
const redis = require('../redis')
const config = require('../config')
const { generateTimestampAndSignature } = require('../apiSigning')
const { libs } = require('@audius/sdk')

const pipeline = promisify(stream.pipeline)
const LibsUtils = libs.Utils

const THIRTY_MINUTES_IN_SECONDS = 60 * 30

export const EMPTY_FILE_CID = 'QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH' // deterministic CID for a 0 byte, completely empty file

export function verifySignature(data, sig) {
  return recoverPersonalSignature({ data, sig })
}

export async function timeout(ms, log = true) {
  if (log) {
    genericLogger.info(`starting timeout of ${ms}`)
  }
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generates a random number from [0, max)
 * @param {number} max the max random number. exclusive
 */
export function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}

/**
 * Ensure DB and disk records exist for dirCID and its contents
 * Return fileUUID for dir DB record
 * This function does not do further validation since image_upload provides remaining guarantees
 */
export async function validateStateForImageDirCIDAndReturnFileUUID(
  req,
  imageDirCID
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
    imageFiles.map(async function (imageFile) {
      if (!(await fs.pathExists(imageFile.storagePath))) {
        throw new Error(
          `No file found on disk for imageDirCID ${imageDirCID} image file at path ${imageFile.path}`
        )
      }
    })
  )

  req.logger.info(
    `Completed validateStateForImageDirCIDAndReturnFileUUID for imageDirCID ${imageDirCID}`
  )
  return dirFile.fileUUID
}

/**
 * Fetches a CID from the Content Node network, verifies content, and writes to disk up to numRetries times.
 * If the fetch request is unauthorized or bad, or if the target content is delisted or not found, do not retry on
 * the particular Content Node.
 * Also do not retry if after content verifications that recently written content is not what is expected.
 *
 * @param {String} filePath location of the file on disk
 * @param {String} cid content hash of the file
 * @param {Object} logger logger object
 * @param {Object} libs libs instance
 * @param {Integer?} trackId optional trackId that corresponds to the cid, see file_lookup route for more info
 * @param {Array?} excludeList optional array of content nodes to exclude in network wide search
 * @param {number?} [numRetries=5] the number of retries to attempt to fetch cid, write to disk, and verify
 * @returns {Boolean} returns true if the file was found in the network
 */
export async function findCIDInNetwork(
  filePath,
  cid,
  logger,
  libs,
  trackId = null,
  excludeList = [],
  numRetries = 5
) {
  if (!config.get('findCIDInNetworkEnabled')) return false

  const attemptedStateFix = await getIfAttemptedStateFix(filePath)
  if (attemptedStateFix) return false

  // Get all registered Content Nodes
  const creatorNodes = await getAllRegisteredCNodes(libs)
  if (!creatorNodes.length) return false

  // Remove excluded nodes from list of creator nodes or self, no-op if empty list or nothing passed in
  const creatorNodesFiltered = creatorNodes.filter(
    (c) =>
      !excludeList.includes(c.endpoint) ||
      config.get('creatorNodeEndpoint') !== c.endpoint
  )

  // Generate signature to auth fetching files
  const delegateWallet = config.get('delegateOwnerWallet').toLowerCase()
  const { signature, timestamp } = generateTimestampAndSignature(
    { filePath, delegateWallet },
    config.get('delegatePrivateKey')
  )

  let found = false
  for (const { endpoint } of creatorNodesFiltered) {
    if (found) break

    try {
      found = await asyncRetry({
        asyncFn: async (bail) => {
          let response
          try {
            response = await axios({
              method: 'get',
              url: `${endpoint}/file_lookup`,
              params: {
                filePath,
                timestamp,
                delegateWallet,
                signature,
                trackId
              },
              responseType: 'stream',
              timeout: 1000
            })
          } catch (e) {
            if (
              e.response?.status === 403 || // delist
              e.response?.status === 401 || // unauth
              e.response?.status === 400 || // bad req
              e.response?.status === 404 // not found
            ) {
              bail(
                new Error(
                  `Content is not available with statusCode=${e.response?.status}`
                )
              )
              return
            }

            throw new Error(
              `Failed to fetch content with statusCode=${e.response?.status}. Retrying..`
            )
          }

          if (!response || !response.data) {
            throw new Error('Received empty response from file lookup')
          }

          await writeStreamToFileSystem(
            response.data,
            filePath,
            /* createDir */ true
          )

          const CIDMatchesExpected = await verifyCIDMatchesExpected({
            cid,
            path: filePath,
            logger
          })

          if (!CIDMatchesExpected) {
            try {
              await fs.unlink(filePath)
            } catch (e) {
              logger.error(`Could not remove file at path=${path}`)
            }

            throw new Error('CID does not match what is expected to be')
          }

          logger.info(
            `Successfully fetched CID=${cid} file=${filePath} from node ${endpoint}`
          )

          return true
        },
        logger,
        logLabel: 'findCIDInNetwork',
        options: {
          retries: numRetries,
          minTimeout: 3000
        }
      })
    } catch (e) {
      // Do not error and stop the flow of execution for functions that call it
      logger.error(
        `findCIDInNetwork error from ${endpoint} for ${cid} - ${e.message}`
      )
    }
  }

  return found
}

/**
 * Get all Content Nodes registered on chain, excluding self
 * Fetches from Redis if available, else fetches from chain and updates Redis value
 * @returns {Object[]} array of SP objects with schema { owner, endpoint, spID, type, blockNumber, delegateOwnerWallet }
 */
export async function getAllRegisteredCNodes(libs, logger) {
  const cacheKey = 'all_registered_cnodes'

  let CNodes
  try {
    // Fetch from Redis if present
    const cnodesList = await redis.get(cacheKey)
    if (cnodesList) {
      return JSON.parse(cnodesList)
    }

    // Else, fetch from chain
    let creatorNodes =
      await libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(
        'content-node'
      )

    // Filter out self endpoint
    creatorNodes = creatorNodes.filter(
      (node) => node.endpoint !== config.get('creatorNodeEndpoint')
    )

    // Write fetched value to Redis with 30min expiry
    await redis.set(
      cacheKey,
      JSON.stringify(creatorNodes),
      'EX',
      THIRTY_MINUTES_IN_SECONDS
    )

    CNodes = creatorNodes
  } catch (e) {
    if (logger) {
      logger.error(
        `Error getting values in getAllRegisteredCNodes: ${e.message}`
      )
    } else {
      console.error(
        `Error getting values in getAllRegisteredCNodes: ${e.message}`
      )
    }

    CNodes = []
  }

  return CNodes
}

/**
 * Return if a fix has already been attempted in today for this filePath
 * @param {String} filePath path of CID on the file system
 */
export async function getIfAttemptedStateFix(filePath) {
  // key is `attempted_fs_fixes:<today's date>`
  // the date function just generates the ISOString and removes the timestamp component
  const key = `attempted_fs_fixes:${new Date().toISOString().split('T')[0]}`
  const firstTime = await redis.sadd(key, filePath)
  await redis.expire(key, 60 * 60 * 24) // expire one day after final write

  // if firstTime is 1, it's a new key. existing key returns 0
  return !firstTime
}

export async function createDirForFile(fileStoragePath) {
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
  inputStream,
  expectedStoragePath,
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
  inputStream,
  expectedStoragePath
) {
  // https://nodejs.org/en/docs/guides/backpressuring-in-streams/
  await pipeline(
    inputStream, // input stream
    fs.createWriteStream(expectedStoragePath) // output stream
  )
}

/**
 * Generic function to run shell commands, eg `ls -alh`
 * @param {String} command Command you want to execute from the shell eg `ls`
 * @param {Array} args array of string quoted arguments to pass eg ['-alh']
 * @param {Object} logger logger object with context
 */
export async function runShellCommand(command, args, logger) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args)
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (data) => (stdout += data.toString()))
    proc.stderr.on('data', (data) => (stderr += data.toString()))

    proc.on('close', (code) => {
      if (code === 0) {
        logger.info(
          `Successfully executed command ${command} ${args} with output: \n${stdout}`
        )
        resolve()
      } else {
        logger.error(
          `Error while executing command ${command} ${args} with stdout: \n${stdout}, \nstderr: \n${stderr}`
        )
        reject(new Error(`Error while executing command ${command} ${args}`))
      }
    })
  })
}

/**
 * A current node should handle a track transcode if there is enough room in the TranscodingQueue to accept more jobs
 *
 * If there is not enough room, if the spID is not set after app init, then the current node should still accept the transcode task
 * @param {Object} param
 * @param {boolean} param.transcodingQueueCanAcceptMoreJobs flag to determine if TranscodingQueue can accept more jobs
 * @param {number} param.spID the spID of the current node
 * @returns whether or not the current node can handle the transcode
 */
export function currentNodeShouldHandleTranscode({
  transcodingQueueCanAcceptMoreJobs,
  spID
}) {
  // If the TranscodingQueue is available, let current node handle transcode
  if (transcodingQueueCanAcceptMoreJobs) return true

  // Else, if spID is not initialized, the track cannot be handed off to another node to transcode.
  // Continue with the upload on the current node.
  const currentNodeShouldHandleTranscode = !Number.isInteger(spID)

  return currentNodeShouldHandleTranscode
}

/**
 * Verify that the file written matches the hash expected
 * @param {Object} param
 * @param {string} param.cid target cid
 * @param {string} param.path the path at which the cid exists
 * @param {Object} param.logger
 * @returns boolean if the cid is proper or not
 */
export async function verifyCIDMatchesExpected({ cid, path, logger }) {
  const fileSize = (await fs.stat(path)).size
  const fileIsEmpty = fileSize === 0

  // there is one case where an empty file could be valid, check for that CID explicitly
  if (fileIsEmpty && cid !== EMPTY_FILE_CID) {
    logger.error(`File has no content, content length is 0: ${cid}`)
    return false
  }

  const expectedCID = await LibsUtils.fileHasher.generateNonImageCid(path)

  const isCIDProper = cid === expectedCID
  if (!isCIDProper) {
    logger.error(
      `File contents and hash don't match. CID: ${cid} expectedCID: ${expectedCID}`
    )
  }

  return isCIDProper
}

module.exports.timeout = timeout
module.exports.verifySignature = verifySignature
module.exports.getRandomInt = getRandomInt
module.exports.validateStateForImageDirCIDAndReturnFileUUID =
  validateStateForImageDirCIDAndReturnFileUUID
module.exports.writeStreamToFileSystem = writeStreamToFileSystem
module.exports.getAllRegisteredCNodes = getAllRegisteredCNodes
module.exports.findCIDInNetwork = findCIDInNetwork
module.exports.runShellCommand = runShellCommand
module.exports.currentNodeShouldHandleTranscode =
  currentNodeShouldHandleTranscode
module.exports.verifyCIDMatchesExpected = verifyCIDMatchesExpected
module.exports.EMPTY_FILE_CID = EMPTY_FILE_CID
