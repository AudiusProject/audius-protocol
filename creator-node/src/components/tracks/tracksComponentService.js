const {
  logger: genericLogger,
  logInfoWithDuration,
  getStartTime
} = require('../../logging')

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

module.exports = {
  handleTrackContentRoute
}
