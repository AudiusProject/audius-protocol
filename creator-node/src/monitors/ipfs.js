const { ipfs } = require('../ipfsClient')

/**
 * Performs a diagnostic test on IPFS operations to
 * confirm functionality:
 *   - Adds a file
 *   - Gets a file
 */
const getIPFSReadWriteStatus = async () => {
  try {
    const start = Date.now()
    const timestamp = start.toString()
    const content = Buffer.from(timestamp)

    // Add new buffer created from timestamp (without pin)
    const results = await ipfs.add(content, { pin: false })
    const hash = results[0].hash // "Qm...WW"

    // Retrieve and validate hash from local node
    const ipfsResp = await ipfs.get(hash)
    const ipfsRespStr = ipfsResp[0].content.toString()
    if (ipfsRespStr !== timestamp) {
      throw new Error('Read bytes differ from written bytes')
    }

    const duration = Date.now() - start

    return JSON.stringify({ hash, duration })
  } catch (e) {
    return null
  }
}

/**
 * Performs a diagnostic test on IPFS operations to
 * confirm functionality:
 *   - Pins a file
 * Note: Not currently used as we don't pin.
 */
const getIPFSPinStatus = async () => {
  try {
    const start = Date.now()
    const timestamp = start.toString()
    const content = Buffer.from(timestamp)

    // Add new buffer created from timestamp (without pin)
    const results = await ipfs.add(content, { pin: false })
    const hash = results[0].hash // "Qm...WW"

    await ipfs.pin.add(hash)
    await ipfs.pin.rm(hash)

    const duration = `${Date.now() - start}ms`

    return JSON.stringify({ hash, duration })
  } catch (e) {
    return null
  }
}

module.exports = {
  getIPFSReadWriteStatus,
  getIPFSPinStatus
}
