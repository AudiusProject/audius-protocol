const path = require('path')
const axios = require('axios')
const fs = require('fs')
const fsExtra = require('fs-extra')
const stream = require('stream')
const FormData = require('form-data')
const { promisify } = require('util')
const fsReadDir = promisify(fs.readdir)
const pipeline = promisify(stream.pipeline)

const config = require('../../config.js')
const { logger: genericLogger, logInfoWithDuration, getStartTime } = require('../../logging')
const { getSegmentsDuration } = require('../../segmentDuration')
const TranscodingQueue = require('../../TranscodingQueue')
const models = require('../../models')
const DBManager = require('../../dbManager')
const fileManager = require('../../fileManager')
const FileProcessingQueue = require('../../FileProcessingQueue')
const Utils = require('../../utils')

const SaveFileToIPFSConcurrencyLimit = 10

const ENABLE_IPFS_ADD_TRACKS = config.get('enableIPFSAddTracks')
const NUMBER_OF_SPS_FOR_HANDOFF_TRACK = 3
const SELF_ENDPOINT = config.get('creatorNodeEndpoint')

/**
 * Upload track segment files and make avail - will later be associated with Audius track
 *
 * Also the logic used in /track_content_async route. Params are extracted to keys that are necessary for the job so that
 * we can pass this task into a worker queue.
 *
 * @param {Object} logContext the context of the request used to create a generic logger
 * @param {Object} requestProps more request specific context, NOT the req object from Express
 * @returns a success or error server response
 * @dev - Prune upload artifacts after successful and failed uploads. Make call without awaiting, and let async queue clean up.
 */
const handleTrackContentRoute = async ({ logContext }, requestProps) => {
  const logger = genericLogger.child(logContext)
  const cnodeUserUUID = requestProps.session.cnodeUserUUID
  const { fileName, fileDir, fileDestination } = requestProps

  const routeTimeStart = getStartTime()

  // Create track transcode and segments, and save all to disk
  let codeBlockTimeStart = getStartTime()
  const {
    transcodedFilePath,
    segmentFileNames,
    segmentFileNamesToPath
  } = await transcodeAndSegment({ logContext }, { fileName, fileDir })
  logInfoWithDuration({ logger, startTime: codeBlockTimeStart }, `Successfully re-encoded track file=${fileName}`)

  // Save transcode and segment files (in parallel) to ipfs and retrieve multihashes
  codeBlockTimeStart = getStartTime()
  const transcodeFileIPFSResp = await fileManager.saveFileToIPFSFromFS(
    { logContext },
    cnodeUserUUID,
    transcodedFilePath,
    ENABLE_IPFS_ADD_TRACKS
  )

  let segmentFileIPFSResps = []
  for (let i = 0; i < segmentFileNames.length; i += SaveFileToIPFSConcurrencyLimit) {
    const segmentFileNamesSlice = segmentFileNames.slice(i, i + SaveFileToIPFSConcurrencyLimit)

    const sliceResps = await Promise.all(segmentFileNamesSlice.map(async (segmentFileName) => {
      const segmentAbsolutePath = segmentFileNamesToPath[segmentFileName]
      const { multihash, dstPath } = await fileManager.saveFileToIPFSFromFS(
        { logContext },
        cnodeUserUUID,
        segmentAbsolutePath,
        ENABLE_IPFS_ADD_TRACKS
      )
      return { multihash, segmentFileName, dstPath }
    }))

    segmentFileIPFSResps = segmentFileIPFSResps.concat(sliceResps)
  }
  logInfoWithDuration({ logger, startTime: codeBlockTimeStart }, `Successfully saved transcode and segment files to IPFS for file=${fileName}`)

  // Retrieve all segment durations as map(segment srcFilePath => segment duration)
  codeBlockTimeStart = getStartTime()
  const segmentDurations = await getSegmentsDuration(fileName, fileDestination)
  logInfoWithDuration({ logger, startTime: codeBlockTimeStart }, `Successfully retrieved segment duration for file=${fileName}`)

  // For all segments, build array of (segment multihash, segment duration)
  let trackSegments = segmentFileIPFSResps.map((segmentFileIPFSResp) => {
    return {
      multihash: segmentFileIPFSResp.multihash,
      duration: segmentDurations[segmentFileIPFSResp.segmentFileName]
    }
  })

  // exclude 0-length segments that are sometimes outputted by ffmpeg segmentation
  trackSegments = trackSegments.filter(trackSegment => trackSegment.duration)

  // error if there are no track segments
  if (!trackSegments || !trackSegments.length) {
    // Prune upload artifacts
    fileManager.removeTrackFolder({ logContext }, fileDir)

    throw new Error('Track upload failed - no track segments')
  }

  // Record entries for transcode and segment files in DB
  codeBlockTimeStart = getStartTime()
  const transaction = await models.sequelize.transaction()
  let transcodeFileUUID
  try {
    // Record transcode file entry in DB
    const createTranscodeFileQueryObj = {
      multihash: transcodeFileIPFSResp.multihash,
      sourceFile: fileName,
      storagePath: transcodeFileIPFSResp.dstPath,
      type: 'copy320' // TODO - replace with models enum
    }
    const file = await DBManager.createNewDataRecord(createTranscodeFileQueryObj, cnodeUserUUID, models.File, transaction)
    transcodeFileUUID = file.fileUUID

    // Record all segment file entries in DB
    // Must be written sequentially to ensure clock values are correctly incremented and populated
    for (const { multihash, dstPath } of segmentFileIPFSResps) {
      const createSegmentFileQueryObj = {
        multihash,
        sourceFile: fileName,
        storagePath: dstPath,
        type: 'track' // TODO - replace with models enum
      }
      await DBManager.createNewDataRecord(createSegmentFileQueryObj, cnodeUserUUID, models.File, transaction)
    }

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()

    // Prune upload artifacts
    fileManager.removeTrackFolder({ logContext }, fileDir)

    throw new Error(e.toString())
  }
  logInfoWithDuration({ logger, startTime: codeBlockTimeStart }, `Successfully updated DB for file=${fileName}`)

  // Prune upload artifacts after success
  fileManager.removeTrackFolder({ logContext }, fileDir)

  logInfoWithDuration({ logger, startTime: routeTimeStart }, `Successfully handled track content for file=${fileName}`)
  return {
    transcodedTrackCID: transcodeFileIPFSResp.multihash,
    transcodedTrackUUID: transcodeFileUUID,
    track_segments: trackSegments,
    source_file: fileName
  }
}

/**
 * Create track transcode and segments, and save all to disk. Removes temp file dir of track data if failed to
 * segment or transcode.
 * @param {Object} transcodeAndSegmentParams
 * @param {string} transcodeAndSegmentParams.fileName the file name of the uploaded track (<cid>.<file type extension>)
 * @param {string} transcodeAndSegmentParams.fileDir the dir path of the temp track artifacts
 * @param {Object} transcodeAndSegmentParams.logContext
 * @returns the transcode and segment paths
 */
async function transcodeAndSegment ({ logContext }, { fileName, fileDir }) {
  let transcodedFilePath
  let segmentFileNames
  let segmentFileNamesToPath
  try {
    const transcode = await Promise.all([
      TranscodingQueue.segment(fileDir, fileName, { logContext }),
      TranscodingQueue.transcode320(fileDir, fileName, { logContext })
    ])
    // this is misleading, not actually paths but the segment file names.
    // refactor to return the segment path
    segmentFileNames = transcode[0].fileNames
    segmentFileNamesToPath = transcode[0].fileNamesToPath
    transcodedFilePath = transcode[1].filePath
  } catch (err) {
    // Prune upload artifacts
    fileManager.removeTrackFolder({ logContext }, fileDir)

    throw new Error(err.toString())
  }

  // ? do we want to expose the file path routes?
  return { transcodedFilePath, segmentFileNames, segmentFileNamesToPath, fileName }
}

// { logContext, fileName, fileDir, uuid, headers, libs }
async function handleTrackHandOff (req) {
  const { libs, logContext } = req
  const logger = genericLogger.child(logContext)
  logger.info('BANANA seleting randaom sps')
  const sps = await selectRandomSPs(libs)

  logger.info({ sps }, 'BANANA selected random sps')
  let successfulHandOff = false
  for (let sp of sps) {
    if (successfulHandOff) break
    // hard code cus lazy
    sp = 'http://cn2_creator-node_1:4001'
    try {
      logger.info(`BANANA handing off to sp=${sp}`)
      await handOffTrack({ sp, req })
      successfulHandOff = true
    } catch (e) {
      // delete tmp dir here if fails and continue
      logger.warn(`BANANA Could not hand off track to sp=${sp} err=${e.toString()}`)
    }
  }
}

async function selectRandomSPs (libs, numberOfSPs = NUMBER_OF_SPS_FOR_HANDOFF_TRACK) {
  let allSPs = await libs.ethContracts.getServiceProviderList('content-node')
  allSPs = allSPs.map(sp => sp.endpoint)

  const validSPs = new Set()
  while (validSPs.size < numberOfSPs) {
    const index = getRandomInt(allSPs.length)
    // do not pick self or a node that has already been chosen
    if (
      allSPs[index] === SELF_ENDPOINT ||
      validSPs.has(allSPs[index])
    ) {
      continue
    }
    validSPs.add(allSPs[index]) // filter out selFFFF
  }

  return Array.from(validSPs)
}

function getRandomInt (max) {
  return Math.floor(Math.random() * max)
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

// If any call fails -> throw error
async function handOffTrack ({ sp, req }) {
  const logger = genericLogger.child(req.logContext)

  logger.info({ sp }, 'BANANA doing health check')
  await axios({
    url: `${sp}/health_check`,
    method: 'get'
  })

  // TODO: handle backwards compat dawg... should be fine bc it will 404 and throw
  const requestID = req.uuid
  const originalTrackFormData = await createFormData(req.fileDir + '/' + req.fileName)
  logger.info({ sp }, 'BANANA posting t/s')
  // await axios({
  //   url: `${sp}/transcode_and_segment`,
  //   method: 'post',
  //   headers: req.headers,
  //   formData,
  //   requestID,
  //   // Set content length headers (only applicable in server/node environments).
  //   // See: https://github.com/axios/axios/issues/1362
  //   maxContentLength: Infinity,
  //   maxBodyLength: Infinity
  // })
  await axios.post(
    `${sp}/transcode_and_segment`,
    originalTrackFormData,
    {
      headers: {
        ...originalTrackFormData.getHeaders(),
        'X-Request-ID': requestID
      },
      adapter: require('axios/lib/adapters/http'),
      // Set content length headers (only applicable in server/node environments).
      // See: https://github.com/axios/axios/issues/1362
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    }
  )

  // TODO: Make sure this comes without the extension
  logger.info({ sp, requestID }, 'BANANA polling time')
  const { fileName, transcodedFilePath, segmentFilePaths } = await pollProcessingStatus(
    // FileProcessingQueue.PROCESS_NAMES.transcodeAndSegment, // ???? why is this an ampty obj
    'transcodeAndSegment',
    requestID,
    sp
  )

  // Get transcode and write to tmp disk
  const transcodePath = fileManager.getTmpTrackUploadArtifactsWithFileNamePath(fileName)
  const transcodeFilePath = path.join(transcodePath, fileName + '-dl.mp3')

  logger.info({ sp, transcodedFilePath, segmentFilePaths }, 'BANANA getting transcode')

  let res = await axios({
    url: `${sp}/transcode_and_segment`,
    method: 'get',
    query: { fileName: fileName + '-dl.mp3', fileType: 'transcode' },
    responseType: 'stream'
  })

  // await pipeline(res.data, fs.createWriteStream(res.data, transcodeFilePath))
  await Utils.writeStreamToFileSystem(
    res.data,
    transcodeFilePath
  )

  // Get segments and write to tmp disk
  const segmentsPath = fileManager.getTmpSegmentsPath(fileName)
  const numberOfSegments = await fsReadDir(segmentsPath).length

  for (let i = 0; i < numberOfSegments; i++) {
    const segmentFileName = getSegmentFileName(i)
    logger.info({ sp, segmentFileName }, 'BANANA getting segments')

    res = await axios({
      url: `${sp}/transcode_and_segment`,
      method: 'get',
      route: '/transcode_and_segment',
      query: { fileName: segmentFileName, fileType: 'segment' },
      responseType: 'stream'
    })

    // await pipeline(res.data, fs.createWriteStream(res.data, segmentFileName))
    await Utils.writeStreamToFileSystem(
      res.data,
      segmentFileName
    )
  }
}

function getSegmentFileName (index) {
  const suffix = ('00000' + index).slice(-5)
  return `segment${suffix}.ts`
}

const MAX_TRACK_HANDOFF_TIMEOUT_MS = 180000 // 3min
const POLL_STATUS_INTERVAL_MS = 10000 // 10s
async function pollProcessingStatus (taskType, uuid, sp) {
  const start = Date.now()
  while (Date.now() - start < MAX_TRACK_HANDOFF_TIMEOUT_MS) {
    try {
      const { status, resp } = await getTrackContentProcessingStatus(sp, uuid, taskType)
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
      console.error(`Failed to poll for processing status, ${e}`)
    }

    await Utils.timeout(POLL_STATUS_INTERVAL_MS)
  }

  // TODO: update MAX_TRACK_TRANSCODE_TIMEOUT if generalizing this method
  throw new Error(`${taskType} took over ${MAX_TRACK_HANDOFF_TIMEOUT_MS}ms. uuid=${uuid}`)
}

/**
 * Gets the task progress given the task type and uuid associated with the task
 * @param {string} uuid the uuid of the track transcoding task
 * @returns the status, and the success or failed response if the task is complete
 */
async function getTrackContentProcessingStatus (sp, uuid, taskType) {
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

module.exports = {
  handleTrackContentRoute,
  handleTrackHandOff,
  selectRandomSPs,
  transcodeAndSegment
}
