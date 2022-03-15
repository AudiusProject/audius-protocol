const axios = require('axios')
const fs = require('fs')
const fsExtra = require('fs-extra')
const FormData = require('form-data')

const config = require('../../config.js')
const Utils = require('../../utils')
const { logger: genericLogger } = require('../../logging')
const {
  generateTimestampAndSignatureForSPVerification
} = require('../../apiSigning')

const CREATOR_NODE_ENDPOINT = config.get('creatorNodeEndpoint')
const DELEGATE_PRIVATE_KEY = config.get('delegatePrivateKey')
const NUMBER_OF_SPS_FOR_HANDOFF_TRACK = 3
const MAX_TRACK_HANDOFF_TIMEOUT_MS = 180000 // 3min
const POLL_STATUS_INTERVAL_MS = 10000 // 10s

async function handOffTrack(libs, req) {
  const logger = genericLogger.child(req.logContext)
  const sps = await selectRandomSPs(libs)

  for (const sp of sps) {
    try {
      logger.info(`Handing track off to sp=${sp}`)

      const { transcodeFilePath, segmentFileNames } = await handOffTrackHelper({
        sp,
        req
      })

      return { transcodeFilePath, segmentFileNames, sp }
    } catch (e) {
      // TODO: delete tmp dir in external SP if fails and continue
      logger.warn(`Could not hand off track to sp=${sp} err=${e.toString()}`)
    }
  }

  return {}
}

// If any call fails -> throw error
async function handOffTrackHelper({ sp, req }) {
  const {
    logContext,
    fileDir,
    fileName,
    fileNameNoExtension,
    uuid: requestID,
    AsyncProcessingQueue
  } = req
  const logger = genericLogger.child(logContext)

  await fetchHealthCheck(sp)

  logger.info({ sp }, `Sending off transcode and segmenting request...`)
  const transcodeAndSegmentUUID = await sendTranscodeAndSegmentRequest({
    requestID,
    logger,
    sp,
    fileDir,
    fileName,
    fileNameNoExtension
  })

  // TODO: use logWithDuration?
  logger.info(
    { sp },
    `Polling for transcode and segments with uuid=${transcodeAndSegmentUUID}...`
  )
  const { transcodeFilePath, segmentFileNames, segmentFilePaths, m3u8Path } =
    await pollProcessingStatus({
      logger,
      taskType: AsyncProcessingQueue.PROCESS_NAMES.transcodeAndSegment,
      uuid: transcodeAndSegmentUUID,
      sp
    })

  let res

  // TODO: parallelize?

  // TODO: if any part of the below fails, we should remove any tmp dirs

  // Get segments and write to tmp disk
  logger.info({ sp }, `Fetching ${segmentFileNames.length} segments...`)
  for (let i = 0; i < segmentFileNames.length; i++) {
    const segmentFileName = segmentFileNames[i]
    const segmentFilePath = segmentFilePaths[i]

    res = await fetchSegment(sp, segmentFileName, fileNameNoExtension)
    await Utils.writeStreamToFileSystem(res.data, segmentFilePath)
  }

  // Get transcode and write to tmp disk
  logger.info({ sp, transcodeFilePath }, 'Fetching transcode...')
  const transcodeFileName = fileNameNoExtension + '-dl.mp3'
  res = await fetchTranscode(sp, transcodeFileName, fileNameNoExtension)
  await Utils.writeStreamToFileSystem(res.data, transcodeFilePath)

  // Get m3u8 file and write to tmp disk
  logger.info({ sp, m3u8Path }, 'Fetching m3u8...')
  const m3u8FileName = fileNameNoExtension + '.m3u8'
  res = await fetchM3U8File(sp, m3u8FileName, fileNameNoExtension)
  await Utils.writeStreamToFileSystem(res.data, m3u8Path)

  return {
    transcodeFilePath,
    segmentFileNames,
    m3u8Path
  }
}

async function selectRandomSPs(
  libs,
  numberOfSPs = NUMBER_OF_SPS_FOR_HANDOFF_TRACK
) {
  let allSPs = await libs.ethContracts.getServiceProviderList('content-node')
  allSPs = allSPs.map((sp) => sp.endpoint)

  const validSPs = new Set()
  while (validSPs.size < numberOfSPs) {
    const index = Utils.getRandomInt(allSPs.length)
    const currentSP = allSPs[index]
    // do not pick self or a node that has already been chosen
    if (currentSP === CREATOR_NODE_ENDPOINT || validSPs.has(currentSP)) {
      continue
    }
    validSPs.add(currentSP)
  }

  return Array.from(validSPs)
}

// TODO: this is the same polling fn in libs. consider initializing libs to use, or copy over fn
async function pollProcessingStatus({ logger, taskType, uuid, sp }) {
  const start = Date.now()
  while (Date.now() - start < MAX_TRACK_HANDOFF_TIMEOUT_MS) {
    try {
      const { status, resp } = await fetchTrackContentProcessingStatus(sp, uuid)
      // Should have a body structure of:
      //   { transcodedTrackCID, transcodedTrackUUID, track_segments, source_file }
      if (status && status === 'DONE') return resp
      if (status && status === 'FAILED') {
        throw new Error(`${taskType} failed: uuid=${uuid}, error=${resp}`)
      }
    } catch (e) {
      // Catch errors here and swallow them. Errors don't signify that the track
      // upload has failed, just that we were unable to establish a connection to the node.
      // This allows p olling to retry
      logger.error(`Failed to poll for processing status, ${e}`)
    }

    await Utils.timeout(POLL_STATUS_INTERVAL_MS)
  }

  throw new Error(
    `${taskType} took over ${MAX_TRACK_HANDOFF_TIMEOUT_MS}ms. uuid=${uuid}`
  )
}

async function sendTranscodeAndSegmentRequest({
  sp,
  fileDir,
  fileName,
  fileNameNoExtension
}) {
  const originalTrackFormData = await createFormData(fileDir + '/' + fileName)

  // TODO: make this constant. perhaps in a class
  const spID = config.get('spID')
  const { timestamp, signature } =
    generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

  const resp = await axios.post(
    `${sp}/transcode_and_segment`,
    originalTrackFormData,
    {
      headers: {
        ...originalTrackFormData.getHeaders()
      },
      params: {
        use_uuid_in_path: fileNameNoExtension,
        timestamp,
        signature,
        spID
      },
      adapter: require('axios/lib/adapters/http'),
      // Set content length headers (only applicable in server/node environments).
      // See: https://github.com/axios/axios/issues/1362
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    }
  )

  return resp.data.data.uuid
}

async function createFormData(pathToFile) {
  const fileExists = await fsExtra.pathExists(pathToFile)
  if (!fileExists) {
    throw new Error(`File does not exist at path=${pathToFile}`)
  }

  const formData = new FormData()
  formData.append('file', fs.createReadStream(pathToFile))

  return formData
}

async function fetchHealthCheck(sp) {
  await axios({
    url: `${sp}/health_check`,
    method: 'get'
  })
}

/**
 * Gets the task progress given the task type and uuid associated with the task
 * @param {string} sp the current sp selected for track processing
 * @param {string} uuid the uuid of the track transcoding task
 * @returns the status, and the success or failed response if the task is complete
 */
async function fetchTrackContentProcessingStatus(sp, uuid) {
  const spID = config.get('spID')
  const { timestamp, signature } =
    generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

  const { data: body } = await axios({
    url: `${sp}/track_content_status`,
    params: { uuid, timestamp, signature, spID },
    method: 'get'
  })

  return body.data
}

async function fetchSegment(sp, segmentFileName, fileNameNoExtension) {
  const spID = config.get('spID')
  const { timestamp, signature } =
    generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

  return axios({
    url: `${sp}/transcode_and_segment`,
    method: 'get',
    params: {
      fileName: segmentFileName,
      fileType: 'segment',
      uuidInPath: fileNameNoExtension,
      timestamp,
      signature,
      spID
    },
    responseType: 'stream'
  })
}

async function fetchTranscode(sp, transcodeFileName, fileNameNoExtension) {
  const spID = config.get('spID')
  const { timestamp, signature } =
    generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

  return axios({
    url: `${sp}/transcode_and_segment`,
    method: 'get',
    params: {
      fileName: transcodeFileName,
      fileType: 'transcode',
      uuidInPath: fileNameNoExtension,
      timestamp,
      signature,
      spID
    },
    responseType: 'stream'
  })
}

async function fetchM3U8File(sp, m3u8FileName, fileNameNoExtension) {
  const spID = config.get('spID')
  const { timestamp, signature } =
    generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

  return axios({
    url: `${sp}/transcode_and_segment`,
    method: 'get',
    params: {
      fileName: m3u8FileName,
      fileType: 'm3u8',
      uuidInPath: fileNameNoExtension,
      timestamp,
      signature,
      spID
    },
    responseType: 'stream'
  })
}

module.exports = {
  selectRandomSPs,
  handOffTrack
}
