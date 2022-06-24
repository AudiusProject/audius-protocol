const fs = require('fs')
const uuid = require('uuid/v4')
const path = require('path')
const crypto = require('crypto')

const DiskManager = require('../../src/diskManager')

const {
  handleTrackContentRoute
} = require('../../src/components/tracks/tracksComponentService')

const uploadTrack = async (filePath, cnodeUserUUID, blacklistManager) => {
  const { fileUUID, fileDir } = saveFileToStorage(filePath)
  const resp = await handleTrackContentRoute(
    {
      logContext: {
        requestID: uuid(),
        requestMethod: 'POST',
        requestHostname: '127.0.0.1',
        requestUrl: '/track_content_async'
      }
    },
    {
      fileName: `${fileUUID}.mp3`,
      fileDir,
      fileDestination: fileDir,
      cnodeUserUUID
    }
  )

  return resp
}

const saveFileToStorage = (filePath) => {
  const file = fs.readFileSync(filePath)
  const fileName = uuid()
  const fileDir = path.join(
    DiskManager.getTmpTrackUploadArtifactsPath(),
    fileName
  )
  fs.mkdirSync(fileDir)
  fs.mkdirSync(fileDir + '/segments')
  fs.writeFileSync(path.join(fileDir, `${fileName}.mp3`), file)

  return { fileUUID: fileName, fileDir }
}

const computeFilesHash = function (multihashes) {
  const multihashString = `${multihashes.join(',')}`
  const filesHash = crypto
    .createHash('md5')
    .update(multihashString)
    .digest('hex')
  return filesHash
}

module.exports = {
  uploadTrack,
  saveFileToStorage,
  computeFilesHash
}
