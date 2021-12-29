const path = require('path')
const axios = require('axios')
const fs = require('fs')
const fsExtra = require('fs-extra')
const FormData = require('form-data')

const config = require('../../config.js')
const { logger: genericLogger, logInfoWithDuration, getStartTime } = require('../../logging')
const fileManager = require('../../fileManager')
const FileProcessingQueue = require('../../FileProcessingQueue')
const Utils = require('../../utils')

const SELF_ENDPOINT = config.get('creatorNodeEndpoint')
const NUMBER_OF_SPS_FOR_HANDOFF_TRACK = 3
const MAX_TRACK_HANDOFF_TIMEOUT_MS = 180000 / 3 // 3min/3
const POLL_STATUS_INTERVAL_MS = 10000 / 10 // 10s/10

// If any call fails -> throw error
async function handOffTrack ({ sp, req }) {
  const { logContext, fileDir, fileName, fileNameNoExtension, uuid: requestID } = req
  const logger = genericLogger.child(logContext)

  logger.info(`the tHINGS fileDir=${fileDir} fileName=${fileName} noExtension=${fileNameNoExtension} uuid for req=${requestID}`)
  await fetchHealthCheck(sp)

  await sendTranscodeAndSegmentRequest({ requestID, logger, sp, fileDir, fileName, fileNameNoExtension })

  // TODO: PROBLEM IS THAT IT'S PASSING IN A NEW UUID SO CAUSING FILE CANNOT BE FOUND.
  // REFACTOR THIS SHIT CUS ITS GETTING MESSYYYY
  logger.info({ sp, requestID }, 'BANANA polling time')
  // const { fileName, transcodedFilePath, segmentFileNames, segmentFileNamesToPath } = await pollProcessingStatus(
  const { transcodedFilePath, segmentFileNames } = await pollProcessingStatus({
    logger,
    // FileProcessingQueue.PROCESS_NAMES.transcodeAndSegment, // ???? why is this an ampty obj
    taskType: 'transcodeAndSegment',
    uuid: requestID,
    sp
  })

  let res

  // Get segments and write to tmp disk
  for (let segmentFileName of segmentFileNames) {
    logger.info({ sp, segmentFileName }, 'BANANA getting segments')

    res = await fetchSegment(res, sp, segmentFileName, fileNameNoExtension)

    // await pipeline(res.data, fs.createWriteStream(res.data, segmentFileName))
    await Utils.writeStreamToFileSystem(
      res.data,
      segmentFileName
    )
  }

  // Get transcode and write to tmp disk
  const transcodePath = fileManager.getTmpTrackUploadArtifactsWithCIDInPath(fileNameNoExtension)
  const transcodeFilePath = path.join(transcodePath, fileNameNoExtension + '-dl.mp3')

  logger.info({ sp, transcodedFilePath }, 'BANANA getting transcode')

  res = await fetchTranscode(res, sp, fileNameNoExtension)

  // await pipeline(res.data, fs.createWriteStream(res.data, transcodeFilePath))
  await Utils.writeStreamToFileSystem(
    res.data,
    transcodeFilePath
  )
}

async function selectRandomSPs (libs, numberOfSPs = NUMBER_OF_SPS_FOR_HANDOFF_TRACK) {
  let allSPs = await libs.ethContracts.getServiceProviderList('content-node')
  allSPs = allSPs.map(sp => sp.endpoint)

  const validSPs = new Set()
  while (validSPs.size < numberOfSPs) {
    const index = Utils.getRandomInt(allSPs.length)
    const currentSP = allSPs[index]
    // do not pick self or a node that has already been chosen
    if (currentSP === SELF_ENDPOINT || validSPs.has(currentSP)) {
      continue
    }
    validSPs.add(currentSP)
  }

  return Array.from(validSPs)
}

async function sendTranscodeAndSegmentRequest ({ requestID, logger, sp, fileDir, fileName, fileNameNoExtension }) {
  const originalTrackFormData = await createFormData(fileDir + '/' + fileName)
  logger.info({ sp }, 'BANANA posting t/s')

  await axios.post(
    `${sp}/transcode_and_segment`,
    originalTrackFormData,
    {
      headers: {
        ...originalTrackFormData.getHeaders(),
        'X-Request-ID': requestID
      },
      params: {
        use_cid_in_path: fileNameNoExtension
      },
      adapter: require('axios/lib/adapters/http'),
      // Set content length headers (only applicable in server/node environments).
      // See: https://github.com/axios/axios/issues/1362
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    }
  )
}

async function createFormData (pathToFile) {
  const fileExists = await fsExtra.pathExists(pathToFile)
  if (!fileExists) {
    throw new Error(`File does not exist at path=${pathToFile}`)
  }

  let formData = new FormData()
  formData.append('file', fs.createReadStream(pathToFile))

  return formData
}

async function pollProcessingStatus ({ logger, taskType, uuid, sp }) {
  const start = Date.now()
  while (Date.now() - start < MAX_TRACK_HANDOFF_TIMEOUT_MS) {
    try {
      const { status, resp } = await fetchTrackContentProcessingStatus(sp, uuid, taskType)
      // Should have a body structure of:
      //   { transcodedTrackCID, transcodedTrackUUID, track_segments, source_file }
      if (status && status === 'DONE') return resp
      if (status && status === 'FAILED') {
        throw new Error(`${taskType} failed: uuid=${uuid}, error=${resp}`)
      }
    } catch (e) {
      // Catch errors here and swallow them. Errors don't signify that the track
      // upload has failed, just that we were unable to establish a connection to the node.
      // This allows polling to retry
      logger.error(`Failed to poll for processing status, ${e}`)
    }

    await Utils.timeout(POLL_STATUS_INTERVAL_MS)
  }

  throw new Error(`${taskType} took over ${MAX_TRACK_HANDOFF_TIMEOUT_MS}ms. uuid=${uuid}`)
}

async function fetchHealthCheck (sp) {
  await axios({
    url: `${sp}/health_check`,
    method: 'get'
  })
}

/**
 * Gets the task progress given the task type and uuid associated with the task
 * @param {string} uuid the uuid of the track transcoding task
 * @returns the status, and the success or failed response if the task is complete
 */
async function fetchTrackContentProcessingStatus (sp, uuid, taskType) {
  const { data: body } = await axios({
    url: `${sp}/track_content_status`,
    params: {
      uuid,
      taskType
    },
    method: 'get'
  })

  return body.data
}

async function fetchTranscode (res, sp, fileNameNoExtension) {
  return axios({
    url: `${sp}/transcode_and_segment`,
    method: 'get',
    params: {
      fileName: fileNameNoExtension + '-dl.mp3',
      fileType: 'transcode',
      cidInPath: fileNameNoExtension
    },
    responseType: 'stream'
  })
}

async function fetchSegment (res, sp, segmentFileName, fileNameNoExtension) {
  return axios({
    url: `${sp}/transcode_and_segment`,
    method: 'get',
    params: {
      fileName: segmentFileName,
      fileType: 'segment',
      cidInPath: fileNameNoExtension
    },
    responseType: 'stream'
  })
}

module.exports = {
  selectRandomSPs,
  handOffTrack
}
