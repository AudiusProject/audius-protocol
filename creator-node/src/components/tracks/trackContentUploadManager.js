const path = require('path')

const {
  getStartTime,
  logInfoWithDuration,
  logger: genericLogger
} = require('../../logging')
const { getSegmentsDuration } = require('../../segmentDuration')

const config = require('../../config.js')
const models = require('../../models')

const DBManager = require('../../dbManager')
const TranscodingQueue = require('../../TranscodingQueue')
const FileManager = require('../../fileManager')

const SAVE_FILE_TO_IPFS_CONCURRENCY_LIMIT = 10
const ENABLE_IPFS_ADD_TRACKS = config.get('enableIPFSAddTracks')

/**
 * Manages track content upload in IPFS, the DB, and the file system
 */
class TrackContentUploadManager {
  /**
   * Create track transcode and segments, and save all to disk. Removes temp file dir of track data if failed to
   * segment or transcode.
   * @param {Object} logContext
   * @param {Object} transcodeAndSegmentParams
   * @param {string} transcodeAndSegmentParams.fileName the file name of the uploaded track (<cid>.<file type extension>)
   * @param {string} transcodeAndSegmentParams.fileDir the dir path of the temp track artifacts
   * @returns an Object with the structure: 
   * {
      transcodeFilePath {string}: the path to the transcode file,
      segmentFileNames {string[]}: a list of segment file names; will have the structure `segment<number>.ts`,
      segmentFilePaths {string[]}: a list of segment file paths,
      m3u8FilePath {string}: the path to the m3u8 file,
      fileName {string}: the original upload track file name
    } 
   */
  static async transcodeAndSegment({ logContext }, { fileName, fileDir }) {
    let transcodeFilePath, segmentFileNames, segmentFilePaths, m3u8FilePath
    try {
      const response = await Promise.all([
        TranscodingQueue.segment(fileDir, fileName, { logContext }),
        TranscodingQueue.transcode320(fileDir, fileName, { logContext })
      ])

      segmentFileNames = response[0].segments.fileNames
      segmentFilePaths = response[0].segments.filePaths
      m3u8FilePath = response[0].m3u8FilePath
      transcodeFilePath = response[1].transcodeFilePath
    } catch (err) {
      // Prune upload artifacts
      FileManager.removeTrackFolder({ logContext }, fileDir)

      throw new Error(err.toString())
    }

    return {
      transcodeFilePath,
      segmentFileNames,
      segmentFilePaths,
      m3u8FilePath,
      fileName
    }
  }

  // Helper methods for TrackContentUploadManager

  /**
   * 1. Batch saves the transcode and segments to IPFS and to local dir
   * 2. Fetches segment duration to build a map of <segment CID: duration>
   * 3. Adds transcode and segments to DB in Files table
   * 4. Removes the upload artifacts after successful processing
   * @param {Object} logContext
   * @param {Object} param
   * @param {Object} param.cnodeUserUUID the current user's cnodeUserUUID
   * @param {string} param.fileName the filename of the uploaded artifact
   * @param {string} param.fileDir the directory of where the filename is uploaded
   * @param {string} param.fileDestination the folder to which the uploaded file has been saved	to
   * @param {string} param.transcodeFilePath the path of where the transcode exists
   * @param {string[]} param.segmentFileNames a list of segment file names from the segmenting job
   * @returns {Object}
   *  returns
   *  {
   *    trancodedTrackCID {string} : the transcoded track's CID representation,
   *    transcodedTrackUUID {string} : the transcoded track's UUID in the Files table,
   *    track_segments {string[]} : the list of segments CIDs,
   *    source_file {string} : the filename of the uploaded artifact
   *  }
   */
  static async processTranscodeAndSegments(
    { logContext },
    {
      cnodeUserUUID,
      fileName,
      fileDir,
      fileDestination,
      transcodeFilePath,
      segmentFileNames
    }
  ) {
    const logger = genericLogger.child(logContext)

    let codeBlockTimeStart = getStartTime()
    const { segmentFileIPFSResps, transcodeFileIPFSResp } =
      await batchSaveFileToIPFSAndCopyFromFS({
        cnodeUserUUID,
        fileDir,
        logContext,
        transcodeFilePath,
        segmentFileNames
      })
    logInfoWithDuration(
      { logger, startTime: codeBlockTimeStart },
      `Successfully saved transcode and segment files to IPFS for file=${fileName}`
    )

    // Retrieve all segment durations as map(segment srcFilePath => segment duration)
    codeBlockTimeStart = getStartTime()
    const segmentDurations = await getSegmentsDuration(
      fileName,
      fileDestination
    )
    logInfoWithDuration(
      { logger, startTime: codeBlockTimeStart },
      `Successfully retrieved segment duration for file=${fileName}`
    )

    const trackSegments = createSegmentToDurationMap({
      segmentFileIPFSResps,
      segmentDurations,
      logContext,
      fileDir
    })

    codeBlockTimeStart = getStartTime()
    const transcodeFileUUID = await addFilesToDb({
      transcodeFileIPFSResp,
      fileName,
      fileDir,
      cnodeUserUUID,
      segmentFileIPFSResps,
      logContext,
      logger
    })
    logInfoWithDuration(
      { logger, startTime: codeBlockTimeStart },
      `Successfully updated DB for file=${fileName}`
    )

    FileManager.removeTrackFolder({ logContext }, fileDir)

    return {
      transcodedTrackCID: transcodeFileIPFSResp.multihash,
      transcodedTrackUUID: transcodeFileUUID,
      track_segments: trackSegments,
      source_file: fileName
    }
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
async function addFilesToDb({
  transcodeFileIPFSResp,
  fileName,
  fileDir,
  cnodeUserUUID,
  segmentFileIPFSResps,
  logContext
}) {
  const transaction = await models.sequelize.transaction()
  let transcodeFileUUID
  try {
    // Record transcode file entry in DB
    const createTranscodeFileQueryObj = {
      multihash: transcodeFileIPFSResp.multihash,
      sourceFile: fileName,
      storagePath: transcodeFileIPFSResp.dstPath,
      type: models.File.Types.copy320
    }
    const file = await DBManager.createNewDataRecord(
      createTranscodeFileQueryObj,
      cnodeUserUUID,
      models.File,
      transaction
    )
    transcodeFileUUID = file.fileUUID

    // Record all segment file entries in DB
    // Must be written sequentially to ensure clock values are correctly incremented and populated
    for (const { multihash, dstPath } of segmentFileIPFSResps) {
      const createSegmentFileQueryObj = {
        multihash,
        sourceFile: fileName,
        storagePath: dstPath,
        type: models.File.Types.track
      }
      await DBManager.createNewDataRecord(
        createSegmentFileQueryObj,
        cnodeUserUUID,
        models.File,
        transaction
      )
    }

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()

    // Prune upload artifacts
    FileManager.removeTrackFolder({ logContext }, fileDir)

    throw new Error(e.toString())
  }

  return transcodeFileUUID
}

/**
 * For all segments, build array of (segment multihash, segment duration)
 * @param {Object} params
 * @param {Object} params.segmentFileIPFSResps an array of { multihash, srcPath: segmentFilePath, dstPath }
 * @param {Object} params.segmentDurations mapping of segment filePath (segmentName) => segment duration
 * @param {string} params.fileDir the dir path of the temp track artifacts
 * @param {Object} params.logContext
 * @returns an array of track segments with the structure { multihash, duration }
 */
function createSegmentToDurationMap({
  segmentFileIPFSResps,
  segmentDurations,
  fileDir,
  logContext
}) {
  let trackSegments = segmentFileIPFSResps.map((segmentFileIPFSResp) => {
    return {
      multihash: segmentFileIPFSResp.multihash,
      duration: segmentDurations[segmentFileIPFSResp.srcPath]
    }
  })

  // exclude 0-length segments that are sometimes outputted by ffmpeg segmentation
  trackSegments = trackSegments.filter((trackSegment) => trackSegment.duration)

  // error if there are no track segments
  if (!trackSegments || !trackSegments.length) {
    // Prune upload artifacts
    FileManager.removeTrackFolder({ logContext }, fileDir)

    throw new Error('Track upload failed - no track segments')
  }

  return trackSegments
}

/**
 * Save transcode and segment files (in parallel batches) to ipfs and copy to disk.
 * @param {Object} batchParams
 * @param {string} batchParams.cnodeUserUUID the observed user's uuid
 * @param {string} batchParams.fileDir the dir path of the temp track artifacts
 * @param {Object} batchParams.logContext
 * @param {string} batchParams.transcodeFilePath the transcoded track path
 * @param {string} batchParams.segmentFilePaths the segments path
 * @returns an object of array of segment multihashes, src paths, and dest paths and transcode multihash and path
 */
async function batchSaveFileToIPFSAndCopyFromFS({
  cnodeUserUUID,
  fileDir,
  logContext,
  transcodeFilePath,
  segmentFileNames
}) {
  const multihash = await FileManager.saveFileToIPFSFromFS(
    { logContext },
    cnodeUserUUID,
    transcodeFilePath,
    ENABLE_IPFS_ADD_TRACKS
  )
  const dstPath = await FileManager.copyMultihashToFs(
    multihash,
    transcodeFilePath,
    logContext
  )
  const transcodeFileIPFSResp = { multihash, dstPath }

  let segmentFileIPFSResps = []
  for (
    let i = 0;
    i < segmentFileNames.length;
    i += SAVE_FILE_TO_IPFS_CONCURRENCY_LIMIT
  ) {
    const segmentFileNameSlice = segmentFileNames.slice(
      i,
      i + SAVE_FILE_TO_IPFS_CONCURRENCY_LIMIT
    )

    const sliceResps = await Promise.all(
      segmentFileNameSlice.map(async (segmentFileName) => {
        const segmentAbsolutePath = path.join(
          fileDir,
          'segments',
          segmentFileName
        )
        const multihash = await FileManager.saveFileToIPFSFromFS(
          { logContext: logContext },
          cnodeUserUUID,
          segmentAbsolutePath,
          ENABLE_IPFS_ADD_TRACKS
        )
        const dstPath = await FileManager.copyMultihashToFs(
          multihash,
          segmentAbsolutePath,
          logContext
        )
        return { multihash, srcPath: segmentFileName, dstPath }
      })
    )

    segmentFileIPFSResps = segmentFileIPFSResps.concat(sliceResps)
  }

  return { segmentFileIPFSResps, transcodeFileIPFSResp }
}

module.exports = TrackContentUploadManager
