const fs = require('fs-extra')
const uuid = require('uuid/v4')
const path = require('path')
const crypto = require('crypto')

const DiskManager = require('../../src/diskManager')

const {
  handleTrackContentRoute
} = require('../../src/components/tracks/tracksComponentService')

const uploadTrack = async (filePath, cnodeUserUUID) => {
  const { fileUUID, fileDir } = await saveFileToStorage(filePath)
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

const saveFileToStorage = async (filePath) => {
  const file = await fs.readFile(filePath)
  const fileName = uuid()
  const fileDir = path.join(
    await DiskManager.getTmpTrackUploadArtifactsPath(),
    fileName
  )
  await fs.mkdir(fileDir)
  await fs.mkdir(fileDir + '/segments')
  await fs.writeFile(path.join(fileDir, `${fileName}.mp3`), file)

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
