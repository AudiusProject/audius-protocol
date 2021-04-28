const request = require('supertest')
const fs = require('fs')
const uuid = require('uuid/v4')
const path = require('path')

const DiskManager = require('../../src/diskManager')

const { wait } = require('./utils')
const { handleTrackContentRoute } = require('../../src/components/tracks/tracksComponentService')

const uploadTrack = async (filePath, cnodeUserUUID) => {
  const { fileUUID, fileDir } = saveFileToStorage(filePath)
  const resp = await handleTrackContentRoute({
    logContext: {
      requestID: uuid(),
      requestMethod: 'POST',
      requestHostname: '127.0.0.1',
      requestUrl: '/track_content'
    }
  },
  {
    fileName: `${fileUUID}.mp3`,
    fileDir,
    fileDestination: fileDir,
    session: {
      cnodeUserUUID
    }
  })

  return resp.object
}

const saveFileToStorage = (filePath) => {
  const file = fs.readFileSync(filePath)
  const fileUUID = uuid()
  const fileDir = path.join(DiskManager.getTmpTrackUploadArtifactsPath(), fileUUID)
  fs.mkdirSync(fileDir)
  fs.mkdirSync(fileDir + '/segments')
  fs.writeFileSync(path.join(fileDir, `${fileUUID}.mp3`), file)

  return { fileUUID, fileDir }
}

const pollTrackTranscodeResponse = async (app, uuid, MAX_TRANSCODE_TRACK_TIMEOUT = 300000 /* 5 min */) => {
  const start = Date.now()
  while (Date.now() - start < MAX_TRANSCODE_TRACK_TIMEOUT) {
    const { body: { data: { status, resp } } } = await request(app)
      .get('/processing_status')
      .query({
        taskType: 'transcode',
        uuid: uuid
      })

    // Should have a body structure of:
    //   { transcodedTrackCID, transcodedTrackUUID, track_segments, source_file }
    if (status && status === 'DONE') return resp.object.data
    if (status && status === 'FAILED') return resp.object.error

    // Check the transcode status every 1s
    await wait(1000)
  }

  throw new Error(`Transcode exceeded max timeout=${MAX_TRANSCODE_TRACK_TIMEOUT}ms`)
}

module.exports = {
  uploadTrack,
  saveFileToStorage,
  pollTrackTranscodeResponse
}
