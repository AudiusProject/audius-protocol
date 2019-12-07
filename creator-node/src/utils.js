const { recoverPersonalSignature } = require('eth-sig-util')
const fs = require('fs')

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

const wait = (ms) => new Promise((resolve, reject) => setTimeout(() => reject(new Error('Timeout')), ms))

const ipfsSingleByteCat = (path, req) => new Promise(async (resolve, reject) => {
  // Cat single byte
  const start = Date.now()
  let ipfs = req.app.get('ipfsAPI')
  await ipfs.cat(path, { length: 1 })
  req.logger.info(`ipfsSingleByteCat - Retrieved ${path} in ${Date.now() - start}ms`)
  resolve('SUCCESS')
})

async function rehydrateIpfsFromFsIfNecessary (req, multihash, storagePath, filename = null) {
  let ipfs = req.app.get('ipfsAPI')
  let ipfsPath = multihash
  if (filename != null) {
    // Indicates we are retrieving a directory multihash
    ipfsPath = `${multihash}/${filename}`
  }

  let rehydrateNecessary = false
  try {
    await Promise.race([
      wait(1000),
      ipfsSingleByteCat(ipfsPath, req)])
  } catch (e) {
    rehydrateNecessary = true
    console.log(`rehydrateIpfsFromFsIfNecessary - error condition met ${ipfsPath}, ${e}`)
  }
  if (!rehydrateNecessary) return
  // Timed out, must re-add from FS
  if (!filename) {
    req.logger.info(`rehydrateIpfsFromFsIfNecessary - Re-adding file - ${multihash}, stg path: ${storagePath}`)
    let addResp = await ipfs.addFromFs(storagePath, { pin: false })
    req.logger.info(`rehydrateIpfsFromFsIfNecessary - Re-added file - ${multihash}, stg path: ${storagePath},  ${JSON.stringify(addResp)}`)
  } else {
    req.logger.info(`rehydrateIpfsFromFsIfNecessary - Re-adding dir ${multihash}, stg path: ${storagePath}, filename: ${filename}, ipfsPath: ${ipfsPath}`)
    let findOriginalFileQuery = await models.File.findAll({
      where: {
        storagePath: { [models.Sequelize.Op.like]: `%${multihash}%` },
        type: 'image'
      }
    })
    // Add entire directory to recreate original operation
    // Required to ensure same dirCID as data store
    let ipfsAddArray = []
    for (var entry of findOriginalFileQuery) {
      let sourceFilePath = entry.storagePath
      let bufferedFile = fs.readFileSync(sourceFilePath)
      let originalSource = entry.sourceFile
      ipfsAddArray.push({
        path: originalSource,
        content: bufferedFile
      })
    }
    let addResp = await ipfs.add(ipfsAddArray, { pin: false })
    req.logger.info(`rehydrateIpfsFromFsIfNecessary - ${JSON.stringify(addResp)}`)
  }
}

async function rehydrateIpfsDirFromFsIfNecessary (req, dirHash) {
  req.logger.info(`rehydrateIpfsDirFromFsIfNecessary, dirHash: ${dirHash}`)
  let findOriginalFileQuery = await models.File.findAll({
    where: {
      storagePath: { [models.Sequelize.Op.like]: `%${dirHash}%` },
      type: 'image'
    }
  })

  let rehydrateNecessary = false
  for (let entry of findOriginalFileQuery) {
    let sourcePath = entry.sourceFile
    if (sourcePath.includes('blob')) {
      sourcePath = sourcePath.split('/')[1]
    }
    let ipfsPath = `${dirHash}/${sourcePath}`
    req.logger.info(`rehydrateIpfsDirFromFsIfNecessary, ipfsPath: ${ipfsPath}`)
    try {
      await Promise.race([
        wait(1000),
        ipfsSingleByteCat(ipfsPath, req)])
    } catch (e) {
      rehydrateNecessary = true
      console.log(`rehydrateIpfsDirFromFsIfNecessary - error condition met ${ipfsPath}, ${e}`)
      break
    }
  }

  console.log(`rehydrateIpfsDirFromFsIfNecessary, dir=${dirHash} - required = ${rehydrateNecessary}`)
  if (!rehydrateNecessary) return

  // Add entire directory to recreate original operation
  // Required to ensure same dirCID as data store
  let ipfsAddArray = []
  for (let entry of findOriginalFileQuery) {
    let sourceFilePath = entry.storagePath
    let bufferedFile = fs.readFileSync(sourceFilePath)
    let originalSource = entry.sourceFile
    ipfsAddArray.push({
      path: originalSource,
      content: bufferedFile
    })
  }
  let ipfs = req.app.get('ipfsAPI')
  let addResp = await ipfs.add(ipfsAddArray, { pin: false })
  req.logger.info(`rehydrateIpfsDirFromFsIfNecessary - ${JSON.stringify(addResp)}`)
}

module.exports = Utils
module.exports.getFileUUIDForImageCID = getFileUUIDForImageCID
module.exports.getIPFSPeerId = getIPFSPeerId
module.exports.rehydrateIpfsFromFsIfNecessary = rehydrateIpfsFromFsIfNecessary
module.exports.rehydrateIpfsDirFromFsIfNecessary = rehydrateIpfsDirFromFsIfNecessary
