const {
  logger: genericLogger,
  logInfoWithDuration,
  getStartTime
} = require('../../logging')

const FileProcessingQueue = require('../../FileProcessingQueue')
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

  const resp = await TrackHandlingUtils.processTrackTranscodeAndSegments(
    { logContext },
    {
      cnodeUserUUID,
      fileName,
      fileDir,
      transcodeFilePath,
      segmentFileNames,
      fileDestination
    }
  )
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
  const {
    libs,
    logContext,
    fileName,
    fileDir,
    fileDestination,
    cnodeUserUUID
  } = req

  const logger = genericLogger.child(logContext)

  let codeBlockTimeStart = getStartTime()

  const { transcodeFilePath, segmentFileNames, sp } =
    await TrackHandOffUtils.handOffTrack(libs, req)

  if (!transcodeFilePath || !segmentFileNames) {
    // Let current node handle the track if handoff fails
    await FileProcessingQueue.addTrackContentUploadTask({
      logContext,
      req: {
        session: { cnodeUserUUID },
        fileName,
        fileDir,
        fileDestination
      }
    })

    logInfoWithDuration(
      { logger, startTime: codeBlockTimeStart },
      `BANANA Failed to hand off track. Retrying upload to current node..`
    )
  } else {
    // Finish with the rest of track upload flow
    await FileProcessingQueue.addProcessTrackTranscodeAndSegments({
      logContext,
      req: {
        cnodeUserUUID,
        fileName,
        fileDir,
        fileDestination,
        transcodeFilePath,
        segmentFileNames
      }
    })

    logInfoWithDuration(
      { logger, startTime: codeBlockTimeStart },
      `BANANA Succesfully handed off transcoding and segmenting to sp=${sp}. Wrapping up remainder of track association..`
    )
  }
}

module.exports = {
  handleTrackContentRoute,
  handleTranscodeAndSegment,
  handleTrackHandOff
}
