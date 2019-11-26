const { recoverPersonalSignature } = require('eth-sig-util')

const models = require('./models')

class Utils {
  static verifySignature (data, signature) {
    return recoverPersonalSignature({ data: data, sig: signature })
  }

  static async timeout (ms) {
    console.log(`starting timeout of ${ms}`)
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

async function getFileUUIDForImageCID (req, imageCID) {
  const ipfs = req.app.get('ipfsAPI')

  if (imageCID) { // assumes imageCIDs are optional params
    // Ensure CID points to a dir, not file
    let cidIsFile = false
    try {
      await ipfs.cat(imageCID, { length: 1 })
      cidIsFile = true
    } catch (e) {
      // Ensure file exists for dirCID
      const dirFile = await models.File.findOne({
        where: { multihash: imageCID, cnodeUserUUID: req.session.cnodeUserUUID, type: 'dir' }
      })
      if (!dirFile) {
        throw new Error(`No file stored in DB for dir CID ${imageCID}`)
      }

      // Ensure file refs exist in DB for every file in dir
      const dirContents = await ipfs.ls(imageCID)
      req.logger.info(dirContents)

      for (let fileObj of dirContents) {
        if (!fileObj.hasOwnProperty('hash') || !fileObj.hash) {
          throw new Error(`Malformatted dir contents for dirCID ${imageCID}. Cannot process.`)
        }

        const imageFile = await models.File.findOne({
          where: { multihash: fileObj.hash, cnodeUserUUID: req.session.cnodeUserUUID, type: 'image' }
        })
        if (!imageFile) {
          throw new Error(`No file ref stored in DB for CID ${fileObj.hash} in dirCID ${imageCID}`)
        }
        return dirFile.fileUUID
      }
    }
    if (cidIsFile) {
      throw new Error(`CID ${imageCID} must point to a valid directory on IPFS`)
    }
  } else return null
}

async function getIPFSPeerId (ipfs, config) {
  const ipfsClusterIP = config.get('ipfsClusterIP')
  const ipfsClusterPort = config.get('ipfsClusterPort')

  let ipfsIDObj = await ipfs.id()

  // if it's a real host and port, generate a new ipfs id and override the addresses with this value
  // if it's local or these variables aren't passed in, just return the regular ipfs.id() result
  if (ipfsClusterIP && ipfsClusterPort !== null && ipfsClusterIP !== '127.0.0.1' && ipfsClusterPort !== 0) {
    const addressStr = `/ip4/${ipfsClusterIP}/tcp/${ipfsClusterPort}/ipfs/${ipfsIDObj.id}`
    ipfsIDObj.addresses = [addressStr]
  }

  return ipfsIDObj
}

async function ensureMultihashPresent (ipfs, multihash, storagePath) {
  // Confirm availability by catting single byte locally
  let timeoutPromise = new Promise((resolve, reject) => {
    let wait = setTimeout(() => {
      clearTimeout(wait)
      console.log(`Failed to retrieve ${multihash}`)
      reject(new Error('TIMEOUT'))
    }, 200)
  })

  let ipfsSingleByteCat = new Promise(async (resolve, reject) => {
    // Cat single byte
    await ipfs.cat(multihash, { length: 1 })
    console.log(`Retrieved ${multihash} in <200ms`)
    resolve('SUCCESS')
  })

  try {
    await Promise.race([
      timeoutPromise,
      ipfsSingleByteCat])
  } catch (e) {
    // Timed out, must re-add from FS
    console.log(`Re-adding ${multihash}, stg path: ${storagePath}`)
    let addResp = await ipfs.addFromFs(storagePath, { pin: false })
    console.log(`Re-added ${multihash}, stg path: ${storagePath},  ${addResp}`)
  }
}

module.exports = Utils
module.exports.getFileUUIDForImageCID = getFileUUIDForImageCID
module.exports.getIPFSPeerId = getIPFSPeerId
module.exports.ensureMultihashPresent = ensureMultihashPresent
