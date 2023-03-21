const fs = require('fs-extra')
const uuid = require('uuid/v4')
const path = require('path')
const crypto = require('crypto')

const { getFileInformation } = require('../../src/ffmpeg')
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

const computeTranscodeDestinationPath = function (fileDir, fileName) {
  return path.resolve(fileDir, fileName.split('.')[0] + '-dl.mp3')
}

/**
 * Ignores milliseconds bc of inaccuracy in comparison due to how we transcode
 * e.g. Input file info shows:
 *    [mp3 @ 0x72367c0] Estimating duration from bitrate, this may be inaccurate
 *    Duration: 00:03:07.44, start: 0.000000, bitrate: 320 kb/s
 * and output file shows:
 *    Duration: 00:03:07.46, start: 0.023021, bitrate: 320 kb/s
 * Note these durations are the same after accounting for the start offset (not sure why thats there)
 */
const getAudioFileInformation = async function (filePath) {
  const info = await getFileInformation(filePath)
  if (!info) throw new Error('Failed to get file information')

  let duration = /Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/g.exec(info.toString())
  if (!duration) throw new Error('Failed to find file duration')
  duration = duration[1].split('.')[0]

  let metadata = {}
  // Extract the metadata properties using a regular expression
  const properties = /^\s{4}(\w+)\s+:(.+)/gm
  let match
  while ((match = properties.exec(info.toString())) !== null) {
    metadata[match[1]] = match[2].trim()
  }

  return {
    info,
    duration,
    metadata
  }
}

module.exports = {
  uploadTrack,
  saveFileToStorage,
  computeFilesHash,
  computeTranscodeDestinationPath,
  getAudioFileInformation
}
