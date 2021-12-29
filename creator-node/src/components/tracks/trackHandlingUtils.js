const TranscodingQueue = require('../../TranscodingQueue')
const fileManager = require('../../fileManager')

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

module.exports = {
  transcodeAndSegment
}
