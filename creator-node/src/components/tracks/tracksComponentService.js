const {
  logger: genericLogger,
  logInfoWithDuration,
  getStartTime
} = require('../../logging')

const config = require('../../config')

const TrackHandOffManager = require('./TrackHandOffManager')
const TrackContentUploadManager = require('./trackContentUploadManager')

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
  const {
    fileName,
    fileDir,
    fileDestination,
    session: { cnodeUserUUID }
  } = requestProps

  const routeTimeStart = getStartTime()

  // Create track transcode and segments, and save all to disk
  const codeBlockTimeStart = getStartTime()
  const { transcodeFilePath, segmentFileNames } =
    await TrackContentUploadManager.transcodeAndSegment(
      { logContext },
      { fileName, fileDir }
    )
  logInfoWithDuration(
    { logger, startTime: codeBlockTimeStart },
    `Successfully re-encoded track file=${fileName}`
  )

  const resp = await TrackContentUploadManager.processTranscodeAndSegments(
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
  return TrackContentUploadManager.transcodeAndSegment(
    { logContext },
    { fileName, fileDir }
  )
}

async function handleTrackHandOff({ logContext }, requestProps) {
  const {
    fileName,
    fileDir,
    fileDestination,
    session,
    libs,
    AsyncProcessingQueue
  } = requestProps
  const { cnodeUserUUID } = session
  const logger = genericLogger.child(logContext)

  const codeBlockTimeStart = getStartTime()

  // If the Content Ndoe is not initialized yet, the spID will not
  // have been set yet. If so, just continue with regular track upload
  // rather than wait
  let transcodeFilePath, segmentFileNames, sp
  if (config.get('spID')) {
    const resp = await TrackHandOffManager.handOffTrack(libs, requestProps)
    transcodeFilePath = resp.transcodeFilePath
    segmentFileNames = resp.segmentFileNames
    sp = resp.sp
  }

  // Let current node handle the track if handoff fails
  if (!transcodeFilePath || !segmentFileNames) {
    logInfoWithDuration(
      { logger, startTime: codeBlockTimeStart },
      `Failed to hand off track. Retrying upload to current node..`
    )

    await AsyncProcessingQueue.addTrackContentUploadTask({
      logContext, // request id here is same as uuid
      req: {
        session: { cnodeUserUUID },
        fileName,
        fileDir,
        fileDestination
      }
    })
  } else {
    // Finish with the rest of track upload flow
    logInfoWithDuration(
      { logger, startTime: codeBlockTimeStart },
      `Succesfully handed off transcoding and segmenting to sp=${sp}. Wrapping up remainder of track association..`
    )

    await AsyncProcessingQueue.addProcessTranscodeAndSegmentTask({
      logContext,
      req: {
        session: { cnodeUserUUID },
        fileName,
        fileDir,
        fileDestination,
        transcodeFilePath,
        segmentFileNames
      }
    })
  }
}

module.exports = {
  handleTrackContentRoute,
  handleTranscodeAndSegment,
  handleTrackHandOff
}
