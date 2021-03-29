const { CID } = require('ipfs-http-client-latest')

const config = require('./config')
const { logger } = require('./logging')

// 30 Second ipfs timeout
const IPFS_PIN_TIMEOUT = 30 /* sec */ * 1000 /* ms */

/**
 * Pin CIDs from config
 * Is a best-effort operation - will swallow any errors
 *
 * @param {IPFS} ipfs
 */
const pinCID = async (ipfs) => {
  try {
    logger.info(`Starting Pin CID`)
    const addCIDs = config.get('pinAddCIDs')
      .split(',')
      .filter(cid => cid !== '')
      .map(cid => new CID(cid))
    const removeCIDs = []

    // Build list of CIDs currently pinned that are not in addCIDs list list for future removal
    for await (const { cid } of ipfs.pin.ls({ type: 'recursive' })) {
      if (!addCIDs.some(addCID => addCID.equals(cid))) {
        removeCIDs.push(cid)
      }
    }

    // Pin every CID in addCIDs list
    for (const cid of addCIDs) {
      try {
        await ipfs.pin.add(cid, { recursive: true, timeout: IPFS_PIN_TIMEOUT })
        logger.info(`Pin CID: ${cid.toString()}`)
      } catch (err) {
        logger.error(`Unable to pin CID: ${cid.toString()} with err: ${err.message}`)
      }
    }

    // Unpin every CID in removeCIDs list
    for (const cid of removeCIDs) {
      try {
        await ipfs.pin.rm(cid, { recursive: true, timeout: IPFS_PIN_TIMEOUT })
        logger.info(`Remove pin CID: ${cid.toString()}`)
      } catch (err) {
        logger.error(`Unable to remove pin CID: ${cid.toString()} with err: ${err.message}`)
      }
    }

    logger.info(`Finished Pin CID`)
  } catch (error) {
    logger.error(`Unable to run pinCID ${error.message}`)
  }
}

module.exports = { pinCID }
