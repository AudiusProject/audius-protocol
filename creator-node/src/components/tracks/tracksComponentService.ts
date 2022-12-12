import type { LogContext } from '../../utils'
import {
  logger as genericLogger,
  logInfoWithDuration,
  getStartTime
} from '../../logging'

import { handOff } from './TrackTranscodeHandoffManager'
import {
  transcodeAndSegment,
  processTranscodeAndSegments
} from './trackContentUploadManager'

/**
 * Upload track segment files and make avail - will later be associated with Audius track
 *
 * Also the logic used in /track_content_async route. Params are extracted to keys that are necessary for the job so that
 * we can pass this task into a worker queue.
 *
 * @param {LogContext} logContext the context of the request used to create a generic logger
 * @param {Object} requestProps more request specific context, NOT the req object from Express
 * @returns a success or error server response
 *
 * upload track segment files and make avail - will later be associated with Audius track
 * @dev - Prune upload artifacts after successful and failed uploads. Make call without awaiting, and let async queue clean up.
 */
export const handleTrackContentRoute = async (
  { logContext }: { logContext: LogContext },
  requestProps: {
    fileName: string
    fileDir: string
    fileDestination: string
    cnodeUserUUID: string
  }
) => {
  const logger = genericLogger.child(logContext)
  const { fileName, fileDir, fileDestination, cnodeUserUUID } = requestProps

  const routeTimeStart = getStartTime()

  // Create track transcode and segments, and save all to disk
  const codeBlockTimeStart = getStartTime()
  const { transcodeFilePath, segmentFileNames } = await transcodeAndSegment(
    { logContext },
    { fileName, fileDir }
  )
  logInfoWithDuration(
    { logger, startTime: codeBlockTimeStart },
    `Successfully re-encoded track file=${fileName}`
  )

  const resp = await processTranscodeAndSegments(
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

export async function handleTranscodeAndSegment(
  { logContext }: { logContext: LogContext },
  {
    fileName,
    fileDir
  }: {
    fileName: string
    fileDir: string
  }
) {
  return transcodeAndSegment({ logContext }, { fileName, fileDir })
}

export async function handleTranscodeHandOff(
  { logContext }: { logContext: LogContext },
  {
    libs,
    fileName,
    fileDir,
    fileNameNoExtension,
    fileDestination,
    session,
    headers
  }: {
    libs: any
    fileName: string
    fileDir: string
    fileNameNoExtension: string
    fileDestination: string
    session: any
    headers: Record<string, string>
  }
) {
  return handOff(
    { logContext },
    {
      libs,
      fileName,
      fileDir,
      fileNameNoExtension,
      fileDestination,
      session,
      headers
    }
  )
}
