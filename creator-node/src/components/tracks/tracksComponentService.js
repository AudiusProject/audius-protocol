const {
  logger: genericLogger,
  logInfoWithDuration,
  getStartTime
} = require('../../logging')
const { getSegmentsDuration } = require('../../segmentDuration')

const FileProcessingQueue = require('../../FileProcessingQueue')
const FileManager = require('../../fileManager')
const TrackHandOffUtils = require('./trackHandOffUtils')
const TrackHandlingUtils = require('./trackHandlingUtils')

/**
 * Upload track segment files and make avail - will later be associated with Audius track
 *
 * Also the logic used in /track_content_async route. Params are extracted to keys that are necessary for the job so that
 * we can pass this task into a worker queue.
 *
 * @param {Object} logContext the context of the request used to create a generic logger
 * @param {Object} requestProps more request specific context, NOT the req object from Express
 * @returns a success or error server response
 *
 * upload track segment files and make avail - will later be associated with Audius track
 * @dev - Prune upload artifacts after successful and failed uploads. Make call without awaiting, and let async queue clean up.
 */
const handleTrackContentRoute = async ({ logContext }, requestProps) => {
  const logger = genericLogger.child(logContext)
  const cnodeUserUUID = requestProps.session.cnodeUserUUID
  const { fileName, fileDir, fileDestination } = requestProps

  const routeTimeStart = getStartTime()

  // Create track transcode and segments, and save all to disk
  let codeBlockTimeStart = getStartTime()
  const { transcodeFilePath, segmentFileNames, segmentFileNamesToPath } =
    await TrackHandlingUtils.transcodeAndSegment(
      { logContext },
      { fileName, fileDir }
    )
  logInfoWithDuration(
    { logger, startTime: codeBlockTimeStart },
    `Successfully re-encoded track file=${fileName}`
  )

  const resp = await TrackHandlingUtils.processTrackTranscodeAndSegments({
    cnodeUserUUID,
    fileName,
    fileDir,
    logContext,
    transcodeFilePath,
    segmentFileNames,
    logger,
    fileDestination
  })
  logInfoWithDuration(
    { logger, startTime: routeTimeStart },
    `Successfully handled track content for file=${fileName}`
  )

  return resp
}

async function handleTranscodeAndSegment(
  { logContext },
  { fileName, fileDir }
) {
  return TrackHandlingUtils.transcodeAndSegment(
    { logContext },
    { fileName, fileDir }
  )
}

// { logContext, fileName, fileDir, uuid, headers, libs }
async function handleTrackHandOff(req) {
  const { libs, logContext, fileName, fileDir, fileDestination } = req
  const { cnodeUserUUID } = req.session
  const logger = genericLogger.child(logContext)
  logger.info('BANANA seleting randaom sps')

  const routeTimeStart = getStartTime()
  let codeBlockTimeStart = getStartTime()

  const sps = await TrackHandOffUtils.selectRandomSPs(libs)

  logger.info({ sps }, 'BANANA selected random sps')
  let successfulHandOff = false
  let sp, transcodeFilePath, segmentFileNames
  for (sp of sps) {
    if (successfulHandOff) break
    // hard code cus lazy
    sp = 'http://cn2_creator-node_1:4001'
    try {
      logger.info(`BANANA handing off to sp=${sp}`)(
        ({ transcodeFilePath, segmentFileNames } =
          await TrackHandOffUtils.handOffTrack({ sp, req }))
      )
      successfulHandOff = true
    } catch (e) {
      // delete tmp dir here if fails and continue
      logger.warn(
        `BANANA Could not hand off track to sp=${sp} err=${e.toString()}`
      )
    }
  }

  logInfoWithDuration(
    { logger, startTime: codeBlockTimeStart },
    `BANANA Succesfully handed off transcoding and segmenting to sp=${sp}`
  )

  codeBlockTimeStart = getStartTime()
  if (!successfulHandOff) {
    // Let current node handle the track if handoff fails
    await FileProcessingQueue.addTrackContentUploadTask({
      logContext: req.logContext,
      req: {
        fileName: req.fileName,
        fileDir: req.fileDir,
        fileDestination: req.file.destination,
        session: {
          cnodeUserUUID: req.session.cnodeUserUUID
        }
      }
    })
  } else {
    await FileProcessingQueue.add
  }

  // if (successfulHandOff) {
  //   // do rest of track stuff
  // } else {
  //   // go back to primary
  //   // throw error?
  // }

  // logInfoWithDuration(
  //   { logger, startTime: routeTimeStart },
  //   `Successfully handled track content for file=${fileName}`
  // )
}

module.exports = {
  handleTrackContentRoute,
  handleTranscodeAndSegment,
  handleTrackHandOff
}
