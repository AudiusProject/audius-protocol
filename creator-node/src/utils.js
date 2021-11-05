const { recoverPersonalSignature } = require('eth-sig-util')
const fs = require('fs-extra')
const path = require('path')
const { BufferListStream } = require('bl')
const axios = require('axios')
const spawn = require('child_process').spawn
const { promisify } = require('util')

const { logger: genericLogger } = require('./logging')
const models = require('./models')
const { ipfs, ipfsLatest } = require('./ipfsClient')
const redis = require('./redis')
const config = require('./config')
const BlacklistManager = require('./blacklistManager')
const { generateTimestampAndSignature } = require('./apiSigning')
const { ipfsAddNonImages } = require('./ipfsAdd')

const readFile = promisify(fs.readFile)

const THIRTY_MINUTES_IN_SECONDS = 60 * 30
const TEN_MINUTES_IN_SECONDS = 60 * 10

let ipfsIDObj

class Utils {
  static verifySignature (data, sig) {
    return recoverPersonalSignature({ data, sig })
  }

  static async timeout (ms, log = true) {
    if (log) {
      console.log(`starting timeout of ${ms}`)
    }
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Ensure DB and disk records exist for dirCID and its contents
 * Return fileUUID for dir DB record
 * This function does not do further validation since image_upload provides remaining guarantees
 */
async function validateStateForImageDirCIDAndReturnFileUUID (req, imageDirCID) {
  // This handles case where a user/track metadata obj contains no image CID
  if (!imageDirCID) {
    return null
  }
  req.logger.info(`Beginning validateStateForImageDirCIDAndReturnFileUUID for imageDirCID ${imageDirCID}`)

  // Ensure file exists for dirCID
  const dirFile = await models.File.findOne({
    where: { multihash: imageDirCID, cnodeUserUUID: req.session.cnodeUserUUID, type: 'dir' }
  })
  if (!dirFile) {
    throw new Error(`No file stored in DB for imageDirCID ${imageDirCID}`)
  }

  // Ensure dir exists on disk
  if (!(await fs.pathExists(dirFile.storagePath))) {
    throw new Error(`No dir found on disk for imageDirCID ${imageDirCID} at expected path ${dirFile.storagePath}`)
  }

  const imageFiles = await models.File.findAll({
    where: { dirMultihash: imageDirCID, cnodeUserUUID: req.session.cnodeUserUUID, type: 'image' }
  })
  if (!imageFiles) {
    throw new Error(`No image file records found in DB for imageDirCID ${imageDirCID}`)
  }

  // Ensure every file exists on disk
  await Promise.all(imageFiles.map(async function (imageFile) {
    if (!(await fs.pathExists(imageFile.storagePath))) {
      throw new Error(`No file found on disk for imageDirCID ${imageDirCID} image file at path ${imageFile.path}`)
    }
  }))

  req.logger.info(`Completed validateStateForImageDirCIDAndReturnFileUUID for imageDirCID ${imageDirCID}`)
  return dirFile.fileUUID
}

async function getIPFSPeerId (ipfs) {
  // Assumes the ipfs id returns the correct address from IPFS. May need to set the correct values in
  // the IPFS pod. Command is:
  // ipfs config --json Addresses.Announce '["/ip4/<public ip>/tcp/<public port>"]'
  // the public port is the port mapped to IPFS' port 4001
  if (!ipfsIDObj) {
    ipfsIDObj = await ipfs.id()
    setInterval(async () => {
      ipfsIDObj = await ipfs.id()
    }, TEN_MINUTES_IN_SECONDS * 1000)
  }

  return ipfsIDObj
}

/**
 * Cat single byte of file at given filepath. If ipfs.cat() call takes longer than the timeout time or
 * something goes wrong, an error will be thrown.
*/
const ipfsSingleByteCat = (path, logContext, timeout = 1000) => {
  const logger = genericLogger.child(logContext)

  return new Promise(async (resolve, reject) => {
    const start = Date.now()

    try {
      // ipfs.cat() returns an AsyncIterator<Buffer> and its results are iterated over in a for-loop
      // don't keep track of the results as this call is a proof-of-concept that the file exists in ipfs
      /* eslint-disable-next-line no-unused-vars */
      for await (const chunk of ipfsLatest.cat(path, { length: 1, timeout })) {
        continue
      }
      logger.info(`ipfsSingleByteCat - Retrieved ${path} in ${Date.now() - start}ms`)
      resolve()
    } catch (e) {
      // Expected message for e is `TimeoutError: Request timed out`
      // if it's not that message, log out the error
      if (!e.message.includes('Request timed out')) {
        logger.error(`ipfsSingleByteCat - Error: ${e}`)
      }
      reject(e)
    }
  })
}

/**
 * Stat of a file at given filepath. If ipfs.files.stat() call takes longer than the timeout time or
 * something goes wrong, an error will be thrown.
*/
const ipfsStat = (CID, logContext, timeout = 1000) => {
  const logger = genericLogger.child(logContext)

  return new Promise(async (resolve, reject) => {
    const start = Date.now()
    const timeoutRef = setTimeout(() => {
      logger.error(`ipfsStat - Timeout`)
      reject(new Error('IPFS Stat Timeout'))
    }, timeout)

    try {
      const stats = await ipfsLatest.files.stat(`/ipfs/${CID}`)
      logger.info(`ipfsStat - Retrieved ${CID} in ${Date.now() - start}ms`)
      clearTimeout(timeoutRef)
      resolve(stats)
    } catch (e) {
      logger.error(`ipfsStat - Error: ${e}`)
      reject(e)
    }
  })
}

/**
 * Call ipfs.cat on a path with optional timeout and length parameters
 * @param {*} serviceRegistry
 * @param {*} logger
 * @param {*} path IPFS cid for file
 * @param {*} timeout timeout for IPFS op in ms
 * @param {*} length length of data to retrieve from file
 * @returns {Buffer}
 */
const ipfsCat = ({ ipfsLatest }, logger, path, timeout = 1000, length = null) => new Promise(async (resolve, reject) => {
  const start = Date.now()

  try {
    let chunks = []
    let options = {}
    if (length) options.length = length
    if (timeout) options.timeout = timeout

    // using a js timeout because IPFS cat sometimes does not resolve the timeout and gets
    // stuck in this function indefinitely
    // make this timeout 2x the regular timeout to account for possible latency of transferring a large file
    setTimeout(() => {
      return reject(new Error('ipfsCat timed out'))
    }, 2 * timeout)

    // ipfsLatest.cat() returns an AsyncIterator<Buffer> and its results are iterated over in a for-loop
    /* eslint-disable-next-line no-unused-vars */
    for await (const chunk of ipfsLatest.cat(path, options)) {
      chunks.push(chunk)
    }
    logger.debug(`ipfsCat - Retrieved ${path} in ${Date.now() - start}ms`)
    resolve(Buffer.concat(chunks))
  } catch (e) {
    reject(e)
  }
})

/**
 * Call ipfs.get on a path with an optional timeout
 * @param {*} serviceRegistry
 * @param {*} logger
 * @param {String} path IPFS cid for file
 * @param {Number} timeout timeout in ms
 * @returns {BufferListStream}
 */
const ipfsGet = ({ ipfsLatest }, logger, path, timeout = 1000) => new Promise(async (resolve, reject) => {
  const start = Date.now()

  try {
    let chunks = []
    let options = {}
    if (timeout) options.timeout = timeout

    // using a js timeout because IPFS get sometimes does not resolve the timeout and gets
    // stuck in this function indefinitely
    // make this timeout 2x the regular timeout to account for possible latency of transferring a large file
    setTimeout(() => {
      return reject(new Error('ipfsGet timed out'))
    }, 2 * timeout)

    // ipfsLatest.get() returns an AsyncIterator<Buffer> and its results are iterated over in a for-loop
    /* eslint-disable-next-line no-unused-vars */
    for await (const file of ipfsLatest.get(path, options)) {
      if (!file.content) continue

      const content = new BufferListStream()
      for await (const chunk of file.content) {
        content.append(chunk)
      }
      resolve(content)
    }
    logger.info(`ipfsGet - Retrieved ${path} in ${Date.now() - start}ms`)
    resolve(Buffer.concat(chunks))
  } catch (e) {
    reject(e)
  }
})

async function findCIDInNetwork (filePath, cid, logger, libs, trackId = null, excludeList = []) {
  const attemptedStateFix = await getIfAttemptedStateFix(filePath)
  if (attemptedStateFix) return

  // get list of creator nodes
  const creatorNodes = await getAllRegisteredCNodes(libs)
  if (!creatorNodes.length) return

  // Remove excluded nodes from list of creator nodes, no-op if empty list or nothing passed in
  const creatorNodesFiltered = creatorNodes.filter(c => !excludeList.includes(c.endpoint))

  // generate signature
  const delegateWallet = config.get('delegateOwnerWallet').toLowerCase()
  const { signature, timestamp } = generateTimestampAndSignature({ filePath, delegateWallet }, config.get('delegatePrivateKey'))
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

        // verify that the file written matches the hash expected if added to ipfs
        const ipfsHashOnly = await ipfsAddNonImages(filePath, { onlyHash: true, timeout: 2000 })

        if (cid !== ipfsHashOnly) {
          await fs.unlink(filePath)
          logger.error(`findCIDInNetwork - File contents don't match IPFS hash cid: ${cid} result: ${ipfsHashOnly}`)
        }

        logger.info(`findCIDInNetwork - successfully fetched file ${filePath} from node ${node.endpoint}`)
        break
      }
    } catch (e) {
      logger.error(`findCIDInNetwork error - ${e.toString()}`)
      // since this is a function running in the background intended to fix state, don't error
      // and stop the flow of execution for functions that call it
      continue
    }
  }
}

/**
 * Get all Content Nodes registered on chain, excluding self
 * Fetches from Redis if available, else fetches from chain and updates Redis value
 * @returns {Object[]} array of SP objects with schema { owner, endpoint, spID, type, blockNumber, delegateOwnerWallet }
 */
async function getAllRegisteredCNodes (libs, logger) {
  const cacheKey = 'all_registered_cnodes'

  let CNodes
  try {
    // Fetch from Redis if present
    const cnodesList = await redis.get(cacheKey)
    if (cnodesList) {
      return JSON.parse(cnodesList)
    }

    // Else, fetch from chain
    let creatorNodes = await libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderList('content-node')

    // Filter out self endpoint
    creatorNodes = creatorNodes.filter(node => node.endpoint !== config.get('creatorNodeEndpoint'))

    // Write fetched value to Redis with 30min expiry
    await redis.set(cacheKey, JSON.stringify(creatorNodes), 'EX', THIRTY_MINUTES_IN_SECONDS)

    CNodes = creatorNodes
  } catch (e) {
    if (logger) {
      logger.error(`Error getting values in getAllRegisteredCNodes: ${e.message}`)
    } else {
      console.error(`Error getting values in getAllRegisteredCNodes: ${e.message}`)
    }

    CNodes = []
  }

  return CNodes
}

/**
 * Return if a fix has already been attempted in today for this filePath
 * @param {String} filePath path of CID on the file system
 */
async function getIfAttemptedStateFix (filePath) {
  // key is `attempted_fs_fixes:<today's date>`
  // the date function just generates the ISOString and removes the timestamp component
  const key = `attempted_fs_fixes:${new Date().toISOString().split('T')[0]}`
  const firstTime = await redis.sadd(key, filePath)
  await redis.expire(key, 60 * 60 * 24) // expire one day after final write

  // if firstTime is 1, it's a new key. existing key returns 0
  return !firstTime
}

async function rehydrateIpfsFromFsIfNecessary (multihash, storagePath, logContext, filename = null) {
  const logger = genericLogger.child(logContext)

  if (await BlacklistManager.CIDIsInBlacklist(multihash)) {
    logger.info(`rehydrateIpfsFromFsIfNecessary - CID ${multihash} is in blacklist; Skipping rehydrate.`)
    return
  }

  let ipfsPath = multihash
  if (filename != null) {
    // Indicates we are retrieving a directory multihash
    ipfsPath = `${multihash}/${filename}`
  }

  let rehydrateNecessary = false
  try {
    await ipfsSingleByteCat(ipfsPath, logContext)
  } catch (e) {
    // Do not attempt to rehydrate as file, if cat() indicates CID is of a dir.
    if (e.message.includes('this dag node is a directory')) {
      throw new Error(e.message)
    }
    rehydrateNecessary = true
    logger.info(`rehydrateIpfsFromFsIfNecessary - error condition met ${ipfsPath}, ${e}`)
  }
  if (!rehydrateNecessary) return
  // Timed out, must re-add from FS
  if (!filename) {
    logger.info(`rehydrateIpfsFromFsIfNecessary - Re-adding file - ${multihash}, stg path: ${storagePath}`)
    try {
      if (fs.existsSync(storagePath)) {
        let addResp = await ipfs.addFromFs(storagePath, { pin: false })
        logger.info(`rehydrateIpfsFromFsIfNecessary - Re-added file - ${multihash}, stg path: ${storagePath},  ${JSON.stringify(addResp)}`)
      } else {
        logger.info(`rehydrateIpfsFromFsIfNecessary - Failed to find on disk, file - ${multihash}, stg path: ${storagePath}`)
      }
    } catch (e) {
      logger.error(`rehydrateIpfsFromFsIfNecessary - failed to addFromFs ${e}, Re-adding file - ${multihash}, stg path: ${storagePath}`)
    }
  } else {
    logger.info(`rehydrateIpfsFromFsIfNecessary - Re-adding dir ${multihash}, stg path: ${storagePath}, filename: ${filename}, ipfsPath: ${ipfsPath}`)
    let findOriginalFileQuery = await models.File.findAll({
      where: {
        dirMultihash: multihash,
        type: 'image'
      }
    })
    // Add entire directory to recreate original operation
    // Required to ensure same dirCID as data store
    let ipfsAddArray = []
    for (var entry of findOriginalFileQuery) {
      let sourceFilePath = entry.storagePath
      try {
        let bufferedFile = await readFile(sourceFilePath)
        let originalSource = entry.sourceFile
        ipfsAddArray.push({
          path: originalSource,
          content: bufferedFile
        })
      } catch (e) {
        logger.info(`rehydrateIpfsFromFsIfNecessary - ERROR BUILDING IPFS ADD ARRAY ${e}, ${entry}`)
      }
    }

    try {
      let addResp = await ipfs.add(ipfsAddArray, { pin: false })
      logger.info(`rehydrateIpfsFromFsIfNecessary - addResp ${JSON.stringify(addResp)}`)
    } catch (e) {
      logger.error(`rehydrateIpfsFromFsIfNecessary - addResp ${e}, ${ipfsAddArray}`)
    }
  }
}

async function rehydrateIpfsDirFromFsIfNecessary (dirHash, logContext) {
  const logger = genericLogger.child(logContext)

  if (await BlacklistManager.CIDIsInBlacklist(dirHash)) {
    logger.info(`rehydrateIpfsFromFsIfNecessary - CID ${dirHash} is in blacklist; Skipping rehydrate.`)
    return
  }

  let findOriginalFileQuery = await models.File.findAll({
    where: {
      dirMultihash: dirHash,
      type: 'image'
    }
  })

  let rehydrateNecessary = false
  for (let entry of findOriginalFileQuery) {
    const filename = entry.fileName
    let ipfsPath = `${dirHash}/${filename}`
    logger.info(`rehydrateIpfsDirFromFsIfNecessary, ipfsPath: ${ipfsPath}`)
    try {
      await ipfsSingleByteCat(ipfsPath, logContext)
    } catch (e) {
      rehydrateNecessary = true
      logger.info(`rehydrateIpfsDirFromFsIfNecessary - error condition met ${ipfsPath}, ${e}`)
      break
    }
  }

  logger.info(`rehydrateIpfsDirFromFsIfNecessary, dir=${dirHash} - required = ${rehydrateNecessary}`)
  if (!rehydrateNecessary) return

  // Add entire directory to recreate original operation
  // Required to ensure same dirCID as data store
  let ipfsAddArray = []
  for (let entry of findOriginalFileQuery) {
    let sourceFilePath = entry.storagePath
    try {
      let bufferedFile = await readFile(sourceFilePath)
      let originalSource = entry.sourceFile
      ipfsAddArray.push({
        path: originalSource,
        content: bufferedFile
      })
    } catch (e) {
      logger.info(`rehydrateIpfsDirFromFsIfNecessary - ERROR BUILDING IPFS ADD ARRAY ${e}, ${entry}`)
    }
  }
  try {
    let addResp = await ipfs.add(ipfsAddArray, { pin: false })
    logger.info(`rehydrateIpfsDirFromFsIfNecessary - ${JSON.stringify(addResp)}`)
  } catch (e) {
    logger.info(`rehydrateIpfsDirFromFsIfNecessary - ERROR ADDING DIR TO IPFS ${e}`)
  }
}

async function createDirForFile (fileStoragePath) {
  const dir = path.dirname(fileStoragePath)
  await fs.ensureDir(dir)
}

async function writeStreamToFileSystem (stream, expectedStoragePath, createDir = false) {
  if (createDir) {
    await createDirForFile(expectedStoragePath)
  }

  const destinationStream = fs.createWriteStream(expectedStoragePath)
  stream.pipe(destinationStream)
  return new Promise((resolve, reject) => {
    destinationStream.on('finish', () => {
      resolve()
    })
    destinationStream.on('error', err => { reject(err) })
    stream.on('error', err => { destinationStream.end(); reject(err) })
  })
}

/**
 * Generic function to run shell commands, eg `ls -alh`
 * @param {String} command Command you want to execute from the shell eg `ls`
 * @param {Array} args array of string quoted arguments to pass eg ['-alh']
 * @param {Object} logger logger object with context
 */
async function runShellCommand (command, args, logger) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args)
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (data) => (stdout += data.toString()))
    proc.stderr.on('data', (data) => (stderr += data.toString()))

    proc.on('close', (code) => {
      if (code === 0) {
        logger.info(`Successfully executed command ${command} ${args} with output: \n${stdout}`)
        resolve()
      } else {
        logger.error(`Error while executing command ${command} ${args} with stdout: \n${stdout}, \nstderr: \n${stderr}`)
        reject(new Error(`Error while executing command ${command} ${args}`))
      }
    })
  })
}

module.exports = Utils
module.exports.validateStateForImageDirCIDAndReturnFileUUID = validateStateForImageDirCIDAndReturnFileUUID
module.exports.getIPFSPeerId = getIPFSPeerId
module.exports.rehydrateIpfsFromFsIfNecessary = rehydrateIpfsFromFsIfNecessary
module.exports.rehydrateIpfsDirFromFsIfNecessary = rehydrateIpfsDirFromFsIfNecessary
module.exports.ipfsSingleByteCat = ipfsSingleByteCat
module.exports.ipfsCat = ipfsCat
module.exports.ipfsGet = ipfsGet
module.exports.ipfsStat = ipfsStat
module.exports.writeStreamToFileSystem = writeStreamToFileSystem
module.exports.getAllRegisteredCNodes = getAllRegisteredCNodes
module.exports.findCIDInNetwork = findCIDInNetwork
module.exports.runShellCommand = runShellCommand
