const path = require('path')

const config = require('../../config.js')
const { logger: genericLogger, logInfoWithDuration, getStartTime } = require('../../logging')
const { getSegmentsDuration } = require('../../segmentDuration')
const TranscodingQueue = require('../../TranscodingQueue')
const models = require('../../models')
const DBManager = require('../../dbManager')
const fileManager = require('../../fileManager')

const SaveFileToIPFSConcurrencyLimit = 10

const ENABLE_IPFS_ADD_TRACKS = config.get('enableIPFSAddTracks')

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
  const { fileName, fileDir } = requestProps

  const routeTimeStart = getStartTime()

  let codeBlockTimeStart = getStartTime()
  const { transcodedFilePath, segmentFilePaths } = await transcodeAndSegment({ cnodeUserUUID, fileName, fileDir, logContext })
  logInfoWithDuration({ logger, startTime: codeBlockTimeStart }, `Successfully re-encoded track file=${requestProps.fileName}`)

  codeBlockTimeStart = getStartTime()
  var { segmentFileIPFSResps, transcodeFileIPFSResp } = await batchSaveFileToIPFSAndCopyFromFS({
    cnodeUserUUID,
    fileName,
    fileDir,
    logContext,
    transcodedFilePath,
    segmentFilePaths
  })
  logInfoWithDuration({ logger, startTime: codeBlockTimeStart }, `Successfully saved transcode and segment files to IPFS for file=${requestProps.fileName}`)

  // Retrieve all segment durations as map(segment srcFilePath => segment duration)
  codeBlockTimeStart = getStartTime()
  const segmentDurations = await getSegmentsDuration(requestProps.fileName, requestProps.fileDestination)
  logInfoWithDuration({ logger, startTime: codeBlockTimeStart }, `Successfully retrieved segment duration for file=${requestProps.fileName}`)

  let trackSegments = parseSegments(segmentFileIPFSResps, segmentDurations, logContext, requestProps)

  codeBlockTimeStart = getStartTime()
  let transcodeFileUUID = await addFilesToDb({ transcodeFileIPFSResp, fileName, fileDir, cnodeUserUUID, segmentFileIPFSResps, logContext })
  logInfoWithDuration({ logger, startTime: codeBlockTimeStart }, `Successfully updated DB for file=${requestProps.fileName}`)

  // Prune upload artifacts after success
  fileManager.removeTrackFolder({ logContext }, requestProps.fileDir)

  logInfoWithDuration({ logger, startTime: routeTimeStart }, `Successfully handled track content for file=${requestProps.fileName}`)
  return {
    transcodedTrackCID: transcodeFileIPFSResp.multihash,
    transcodedTrackUUID: transcodeFileUUID,
    track_segments: trackSegments,
    source_file: requestProps.fileName
  }
}

/**
 * Record entries for transcode and segment files in DB
 * @param {Object} dbParams
 * @param {Object} dbParams.transcodeFileIPFSResp object of transcode multihash and path
 * @param {string} dbParams.fileName the file name of the uploaded track (<cid>.<file type extension>)
 * @param {string} dbParams.fileDir the dir path of the temp track artifacts
 * @param {string} dbParams.cnodeUserUUID the observed user's uuid
 * @param {Object} dbParams.segmentFileIPFSResps an array of { multihash, srcPath: segmentFilePath, dstPath }
 * @param {Object} dbParams.logContext
 * @returns the transcoded file's uuid
 */
async function addFilesToDb ({ transcodeFileIPFSResp, fileName, fileDir, cnodeUserUUID, segmentFileIPFSResps, logContext }) {
  const transaction = await models.sequelize.transaction()
  let transcodeFileUUID
  try {
    // Record transcode file entry in DB
    const createTranscodeFileQueryObj = {
      multihash: transcodeFileIPFSResp.multihash,
      sourceFile: fileName,
      storagePath: transcodeFileIPFSResp.dstPath,
      type: models.File.copy320
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
        type: models.File.track
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
  return transcodeFileUUID
}

/**
 * For all segments, build array of (segment multihash, segment duration)
 * @param {Object} parseParams
 * @param {Object} parseParams.segmentFileIPFSResps an array of { multihash, srcPath: segmentFilePath, dstPath }
 * @param {Object} parseParams.segmentDurations mapping of segment filePath (segmentName) => segment duration
 * @param {string} transcodeAndSegmentParams.fileDir the dir path of the temp track artifacts
 * @param {Object} parseParams.logContext
 * @returns an array of track segments with the structure { multihash, duration }
 */
function parseSegments ({ segmentFileIPFSResps, segmentDurations, logContext, fileDir }) {
  let trackSegments = segmentFileIPFSResps.map((segmentFileIPFSResp) => {
    return {
      multihash: segmentFileIPFSResp.multihash,
      duration: segmentDurations[segmentFileIPFSResp.srcPath]
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

  return trackSegments
}

/**
 * Create track transcode and segments, and save all to disk. Removes temp file dir of track data if failed to
 * segment or transcode.
 * @param {Object} transcodeAndSegmentParams
 * @param {string} transcodeAndSegmentParams.cnodeUserUUID the observed user's uuid
 * @param {string} transcodeAndSegmentParams.fileName the file name of the uploaded track (<cid>.<file type extension>)
 * @param {string} transcodeAndSegmentParams.fileDir the dir path of the temp track artifacts
 * @param {Object} transcodeAndSegmentParams.logContext
 * @returns the transcode and segment paths
 */
async function transcodeAndSegment ({ cnodeUserUUID, fileName, fileDir, logContext }) {
  let transcodedFilePath
  let segmentFilePaths
  try {
    const transcode = await Promise.all([
      TranscodingQueue.segment(fileDir, fileName, { logContext }),
      TranscodingQueue.transcode320(fileDir, fileName, { logContext })
    ])
    segmentFilePaths = transcode[0].filePaths
    transcodedFilePath = transcode[1].filePath
  } catch (err) {
    // Prune upload artifacts
    fileManager.removeTrackFolder({ logContext }, fileDir)

    throw new Error(err.toString())
  }

  return { transcodedFilePath, segmentFilePaths }
}

/**
 * Save transcode and segment files (in parallel batches) to ipfs and copy to disk.
 * @param {Object} batchParams
 * @param {string}  batchParams.cnodeUserUUID the observed user's uuid
 * @param {string}  batchParams.fileName the file name of the uploaded track (<cid>.<file type extension>)
 * @param {string}  batchParams.fileDir the dir path of the temp track artifacts
 * @param {Object}  batchParams.logContext
 * @param {string}  batchParams.transcodedFilePath the transcoded track path
 * @param {string}  batchParams.segmentFilePaths the segments path
 * @returns an object of array of segment multihashes, src paths, and dest paths and transcode multihash and path
 */
async function batchSaveFileToIPFSAndCopyFromFS ({
  cnodeUserUUID,
  fileName,
  fileDir,
  logContext,
  transcodedFilePath,
  segmentFilePaths
}) {
  const transcodeFileIPFSResp = await fileManager.saveFileToIPFSAndCopyFromFS(
    { logContext },
    cnodeUserUUID,
    transcodedFilePath,
    ENABLE_IPFS_ADD_TRACKS
  )

  let segmentFileIPFSResps = []
  for (let i = 0; i < segmentFilePaths.length; i += SaveFileToIPFSConcurrencyLimit) {
    const segmentFilePathsSlice = segmentFilePaths.slice(i, i + SaveFileToIPFSConcurrencyLimit)

    const sliceResps = await Promise.all(segmentFilePathsSlice.map(async (segmentFilePath) => {
      const segmentAbsolutePath = path.join(fileDir, 'segments', segmentFilePath)
      const { multihash, dstPath } = await fileManager.saveFileToIPFSAndCopyFromFS(
        { logContext: logContext },
        cnodeUserUUID,
        segmentAbsolutePath,
        ENABLE_IPFS_ADD_TRACKS
      )
      return { multihash, srcPath: segmentFilePath, dstPath }
    }))

    segmentFileIPFSResps = segmentFileIPFSResps.concat(sliceResps)
  }

  return { segmentFileIPFSResps, transcodeFileIPFSResp }
}

module.exports = {
  handleTrackContentRoute
}
