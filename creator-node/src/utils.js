const { recoverPersonalSignature } = require('eth-sig-util')
const fs = require('fs-extra')
const path = require('path')
const axios = require('axios')
const spawn = require('child_process').spawn
const stream = require('stream')
const retry = require('async-retry')
const { promisify } = require('util')
const pipeline = promisify(stream.pipeline)

const models = require('./models')
const redis = require('./redis')
const config = require('./config')
const { generateTimestampAndSignature } = require('./apiSigning')
const { generateNonImageMultihash } = require('./fileHasher')

const THIRTY_MINUTES_IN_SECONDS = 60 * 30

class Utils {
  static verifySignature(data, sig) {
    return recoverPersonalSignature({ data, sig })
  }

  static async timeout(ms, log = true) {
    if (log) {
      console.log(`starting timeout of ${ms}`)
    }
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  static getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }
}

/**
 * Ensure DB and disk records exist for dirCID and its contents
 * Return fileUUID for dir DB record
 * This function does not do further validation since image_upload provides remaining guarantees
 */
async function validateStateForImageDirCIDAndReturnFileUUID(req, imageDirCID) {
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
 *
 * @param {String} filePath location of the file on disk
 * @param {String} cid content hash of the file
 * @param {Object} logger logger object
 * @param {Object} libs libs instance
 * @param {Integer?} trackId optional trackId that corresponds to the cid, see file_lookup route for more info
 * @param {Array?} excludeList optional array of content nodes to exclude in network wide search
 * @returns {Boolean} returns true if the file was found in the network
 */
async function findCIDInNetwork(
  filePath,
  cid,
  logger,
  libs,
  trackId = null,
  excludeList = []
) {
  let found = false

  const attemptedStateFix = await getIfAttemptedStateFix(filePath)
  if (attemptedStateFix) return

  // get list of creator nodes
  const creatorNodes = await getAllRegisteredCNodes(libs)
  if (!creatorNodes.length) return

  // Remove excluded nodes from list of creator nodes, no-op if empty list or nothing passed in
  const creatorNodesFiltered = creatorNodes.filter(
    (c) => !excludeList.includes(c.endpoint)
  )

  // generate signature
  const delegateWallet = config.get('delegateOwnerWallet').toLowerCase()
  const { signature, timestamp } = generateTimestampAndSignature(
    { filePath, delegateWallet },
    config.get('delegatePrivateKey')
  )
  let node

  for (let index = 0; index < creatorNodesFiltered.length; index++) {
    node = creatorNodesFiltered[index]
    try {
      const resp = await axios({
        method: 'get',
        url: `${node.endpoint}/file_lookup`,
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
      if (resp.data) {
        await writeStreamToFileSystem(resp.data, filePath, /* createDir */ true)

        // Verify that the file written matches the hash expected
        const ipfsHashOnly = await generateNonImageMultihash(filePath)

        if (cid !== ipfsHashOnly) {
          await fs.unlink(filePath)
          logger.error(
            `findCIDInNetwork - File contents don't match IPFS hash cid: ${cid} result: ${ipfsHashOnly}`
          )
        }
        found = true
        logger.info(
          `findCIDInNetwork - successfully fetched file ${filePath} from node ${node.endpoint}`
        )
        break
      }
    } catch (e) {
      logger.error(`findCIDInNetwork error - ${e.toString()}`)
      // since this is a function running in the background intended to fix state, don't error
      // and stop the flow of execution for functions that call it
      continue
    }
  }

  return found
}

/**
 * Get all Content Nodes registered on chain, excluding self
 * Fetches from Redis if available, else fetches from chain and updates Redis value
 * @returns {Object[]} array of SP objects with schema { owner, endpoint, spID, type, blockNumber, delegateOwnerWallet }
 */
async function getAllRegisteredCNodes(libs, logger) {
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
async function getIfAttemptedStateFix(filePath) {
  // key is `attempted_fs_fixes:<today's date>`
  // the date function just generates the ISOString and removes the timestamp component
  const key = `attempted_fs_fixes:${new Date().toISOString().split('T')[0]}`
  const firstTime = await redis.sadd(key, filePath)
  await redis.expire(key, 60 * 60 * 24) // expire one day after final write

  // if firstTime is 1, it's a new key. existing key returns 0
  return !firstTime
}

async function createDirForFile(fileStoragePath) {
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
async function writeStreamToFileSystem(
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
async function _streamFileToDiskHelper(inputStream, expectedStoragePath) {
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
async function runShellCommand(command, args, logger) {
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
 * A current node can handle a track transcode if:
 * 1. There is enough room in the TranscodingQueue to accept more jobs
 * 2. The spID is set after app init
 * 3. AsyncProcessingQueue libs instance is initialized
 * @param {Object} param
 * @param {boolean} param.transcodingQueueCanAcceptMoreJobs flag to determine if TranscodingQueue can accept more jobs
 * @param {number} param.spID the spID of the current node
 * @param {Object} param.libs the libs instance in AsyncProcessingQueue
 * @returns whether or not the current node can handle the transcode
 */
function canCurrentNodeHandleTranscode({
  transcodingQueueCanAcceptMoreJobs,
  spID,
  libs
}) {
  const currentNodeSPIdIsInitialized = Number.isInteger(spID)
  const libsInstanceIsInitialized = libs !== null

  return (
    transcodingQueueCanAcceptMoreJobs &&
    currentNodeSPIdIsInitialized &&
    libsInstanceIsInitialized
  )
}

/**
 * Wrapper around async-retry API.
 * @param {Object} param
 * @param {func} param.asyncFn the fn to asynchronously retry
 * @param {Object} param.asyncFnParams the params to pass into the fn. takes in 1 object
 * @param {number} [retries=5] the max number of retries. defaulted to 5
 * @param {number} [minTimeout=1000] minimum time to wait after first retry. defaulted to 1000ms
 * @param {number} [maxTimeout=5000] maximum time to wait after first retry. defaulted to 5000ms
 * @returns the fn response if success, or throws an error
 */
function asyncRetry({
  asyncFn,
  asyncFnParams,
  asyncFnTask,
  retries = 5,
  minTimeout = 1000, // default for async-retry
  maxTimeout = 5000
}) {
  return retry(
    async () => {
      if (asyncFnParams) {
        return asyncFn(asyncFnParams)
      }

      return asyncFn()
    },
    {
      retries,
      minTimeout,
      maxTimeout,
      onRetry: (err, i) => {
        if (err) {
          console.log(`${asyncFnTask} ${i} retry error: `, err)
        }
      }
    }
  )
}

module.exports = Utils
module.exports.validateStateForImageDirCIDAndReturnFileUUID =
  validateStateForImageDirCIDAndReturnFileUUID
module.exports.writeStreamToFileSystem = writeStreamToFileSystem
module.exports.getAllRegisteredCNodes = getAllRegisteredCNodes
module.exports.findCIDInNetwork = findCIDInNetwork
module.exports.runShellCommand = runShellCommand
module.exports.canCurrentNodeHandleTranscode = canCurrentNodeHandleTranscode
module.exports.asyncRetry = asyncRetry
