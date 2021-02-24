const { CID } = require('ipfs-http-client-latest')

const config = require('./config')
const { logger } = require('./logging')

/**
 * Pin CIDs from config
 * @param {*} ipfs 
 */
const pinCID = async (ipfs) => {
  try {
    const addCIDs = config.get('pinAddCIDs')
      .split(',')
      .filter(cid => cid !== '')
      .map(cid => new CID(cid))

    for (const cid of addCIDs) {
      try {
        await ipfs.pin.add(cid, { recursive: true })
        logger.info(`Pin CID: ${cid.toString()}`)
      } catch (err) {
        logger.error(`Unable to pin CID: ${cid.toString()}`)
      }
    }

    const removeCIDs = config.get('pinRemoveCIDs')
      .split(',')
      .filter(cid => cid !== '')
      .map(cid => new CID(cid))

    for (const cid of removeCIDs) {
      try {
        await ipfs.pin.rm(cid, { recursive: true })
        logger.info(`Remove pin CID: ${cid.toString()}`)
      } catch (err) {
        logger.error(`Unable to remove pin CID: ${cid.toString()}`)
      }
    }

  } catch (error) {
    logger.error(`Unable to run pinCID ${error.message}`)
  }
}

module.exports = { pinCID }
