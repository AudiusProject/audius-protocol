const ipfsClient = require('ipfs-http-client')
const ipfsClientLatest = require('ipfs-http-client-latest')
const Hash = require('ipfs-only-hash')
const fs = require('fs')

const config = require('./config')
const { logger } = require('./logging')

const ENABLE_ASYNC_IPFS_ADD = config.get('enableAsyncIPFSAdd')

// Make ipfs clients exportable to be used in rehydrate queue
const ipfsAddr = config.get('ipfsHost')
if (!ipfsAddr) {
  throw new Error('Must set ipfsAddr')
}
const ipfs = ipfsClient(ipfsAddr, config.get('ipfsPort'))
const ipfsLatest = ipfsClientLatest({ host: ipfsAddr, port: config.get('ipfsPort'), protocol: 'http' })

async function logIpfsPeerIds () {
  const identity = await ipfs.id()
  // Pretty print the JSON obj with no filter fn (e.g. filter by string or number) and spacing of size 2
  logger.info(`Current IPFS Peer ID: ${JSON.stringify(identity, null, 2)}`)

  // init latest version of ipfs
  const identityLatest = await ipfsLatest.id()
  logger.info(`Current IPFS Peer ID (using latest version of ipfs client): ${JSON.stringify(identityLatest, null, 2)}`)
}

/**
 * Wrapper to ipfs.addToFs() -- This wrapper allows for ipfs calls to be made async or synchronous.
 * @param {Object} ipfs ipfs library -- can be two different versions (see ipfsClient.js)
 * @param {string|string[]} buffers
 * @param {Object?} config ipfs add config options
 * @param {string?} caller the name of the caller fn
 * @param {boolean?} isMetadata if the input data is of a metadata type. if so, always synchronously add to ipfs
 * @returns {string|string[]} hashes
 */
async function ipfsAddWrapper (ipfs, buffers, config = {}, caller = '', isMetadata = false) {
  // Either an array of hashes, or a hash
  // Note: the if case is specifically written for the `ipfsLatest` add api. See ipfs add code in `resizeImage.js`
  let onlyHashes = []
  let ipfsDaemonHashes
  if (Array.isArray(buffers)) {
    for (const { content } of buffers) {
      const hash = await Hash.of(content)
      onlyHashes.push(hash)
    }

    // Either an array of hashes, or a hash
    if (ENABLE_ASYNC_IPFS_ADD && !isMetadata) {
      logger.info(`${caller}[ipfsClient - ipfsAddWrapper()] onlyHash=${onlyHashes}`)
      ipfs.add(buffers, config) // Do not await it
    } else {
      ipfsDaemonHashes = await ipfs.add(buffers, config)
      logger.info(`${caller}[ipfsClient - ipfsAddWrapper()] onlyHash=${onlyHashes} ipfsDaemonHash=${ipfsDaemonHashes} isSameHash=${onlyHashes === ipfsDaemonHashes}`)
    }
  } else {
    onlyHashes = await Hash.of(buffers, { cidVersion: 0 })
    // Either an array of hashes, or a hash
    let ipfsDaemonHashes
    if (ENABLE_ASYNC_IPFS_ADD && !isMetadata) {
      logger.info(`${caller}[ipfsClient - ipfsAddWrapper()] onlyHash=${onlyHashes}`)
      ipfs.add(buffers, config) // Do not await it
    } else {
      ipfsDaemonHashes = (await ipfs.add(buffers, config))[0].hash
      logger.info(`${caller}[ipfsClient - ipfsAddWrapper()] onlyHash=${onlyHashes} ipfsDaemonHash=${ipfsDaemonHashes} isSameHash=${onlyHashes === ipfsDaemonHashes}`)
    }
  }

  // If content was added to ipfs daemon, prioritize using that hash response
  return ipfsDaemonHashes || onlyHashes
}

/**
 * Wrapper to ipfs.add() -- This wrapper allows for ipfs calls to be made async or synchronous.
 * @param {Object} ipfs ipfs library -- can be two different versions (see ipfsClient.js)
 * @param {string|string[]} srcPath
 * @param {Object?} config ipfs add config options
 * @param {string?} caller the name of the caller fn
 * @returns {string|string[]} hashes
 */
async function ipfsAddToFsWrapper (ipfs, srcPath, config = {}, caller = '') {
  const stream = fs.createReadStream(srcPath)
  const onlyHash = await Hash.of(stream, { cidVersion: 0 })

  let ipfsDaemonHash
  if (ENABLE_ASYNC_IPFS_ADD) {
    logger.info(`${caller}[ipfsClient - ipfsAddToFsWrapper()] onlyHash=${onlyHash}`)
    ipfs.addFromFs(srcPath, config) // Do not await it
  } else {
    ipfsDaemonHash = (await ipfs.addFromFs(srcPath, config))[0].hash
    logger.info(`${caller}[ipfsClient - ipfsAddToFsWrapper()] onlyHash=${onlyHash} ipfsDaemonHash=${ipfsDaemonHash} isSameHash=${onlyHash === ipfsDaemonHash}`)
  }

  // If content was added to ipfs daemon, prioritize using that hash response
  return ipfsDaemonHash || onlyHash
}

module.exports = { ipfs, ipfsLatest, logIpfsPeerIds, ipfsAddWrapper, ipfsAddToFsWrapper }
