import Utils from '../../utils'
const axios = require('axios')
const fs = require('fs')
const fsExtra = require('fs-extra')
const FormData = require('form-data')

const config = require('../../config.js')
const asyncRetry = require('../../utils/asyncRetry')
const { logger: genericLogger } = require('../../logging')
const {
  generateTimestampAndSignatureForSPVerification
} = require('../../apiSigning')
const { removeTrackFolder } = require('../../fileManager')

const CREATOR_NODE_ENDPOINT = config.get('creatorNodeEndpoint')
const DELEGATE_PRIVATE_KEY = config.get('delegatePrivateKey')

const NUMBER_OF_SPS_FOR_HANDOFF_TRACK = 3
const POLLING_TRANSCODE_AND_SEGMENTS_RETRIES = 50
const POLLING_TRANSCODE_AND_SEGMENTS_MIN_TIMEOUT = 1000
const POLLING_TRANSCODE_AND_SEGMENTS_MAX_TIMEOUT = 5000
const FETCH_STREAM_TIMEOUT_MS = 15000
const FETCH_PROCESSING_STATUS_TIMEOUT_MS = 5000
const FETCH_HEALTH_CHECK_TIMEOUT_MS = 5000
const SEND_TRANSCODE_AND_SEGMENT_REQUEST_TIMEOUT_MS = 5000
const HAND_OFF_STATES = Object.freeze({
  INITIALIZED: 'INITIALIZED',
  SELECTING_RANDOM_SPS: 'SELECTING_RANDOM_SPS',
  HANDING_OFF_TO_SP: 'HANDING_OFF_TO_SP',
  POLLING_FOR_TRANSCODE: 'POLLING_FOR_TRANSCODE',
  FETCHING_FILES_AND_WRITING_TO_FS: 'FETCHING_FILES_AND_WRITING_TO_FS'
})

// Handles sending a transcode and segment request to an available node in the network

class TrackTranscodeHandoffManager {
  static logContext = {}
  static logger = genericLogger.child(TrackTranscodeHandoffManager.logContext)

  /**
   * Wrapper function to:
   * 1. Select random Content Nodes in the network
   * 2. Iteratively:
   *    1. Send the uploaded track artifact to one of the randomly selected SPs
   *    2. Have the randomly selected SP transcode and segment the uploaded track artifact
   *    3. Poll the randomly selected SP to see if the transcoding is complete
   *    4. Fetch and write the files to current node disk if transcode is complete
   *
   *    If any of the nested steps above fail, move onto the next SP and try again
   * 3. Return the transcode path, segment paths, and m3u8 path upon success, or an empty object
   *    if the hand off was not successful
   * @param {Object} param
   * @param {Object} param.logContext
   * @param {Object} req request data that looks like:
   * {
   *    fileName,
   *    fileDir,
   *    fileNameNoExtension,
   *    fileDestination,
   *    cnodeUserUUID,
   *    headers
   * }
   *
   * See routes/tracks.js for more information
   * @returns
   */
  static async handOff({ logContext }, req) {
    const logger = TrackTranscodeHandoffManager.initLogger(logContext)

    const decisionTree = { state: HAND_OFF_STATES.INITIALIZED }
    const libs = req.libs
    let resp = {}

    let sps
    try {
      decisionTree.state = HAND_OFF_STATES.SELECTING_RANDOM_SPS
      sps = await TrackTranscodeHandoffManager.selectRandomSPs(libs)
    } catch (e) {
      logger.warn(`Could not select random SPs: ${e.message}`)
      return resp
    }

    for (const sp of sps) {
      decisionTree.sp = sp
      try {
        logger.info(`Handing track off to sp=${sp}`)
        decisionTree.state = HAND_OFF_STATES.HANDING_OFF_TO_SP

        const transcodeAndSegmentUUID =
          await TrackTranscodeHandoffManager.sendTrackToSp({ sp, req })

        decisionTree.state = HAND_OFF_STATES.POLLING_FOR_TRANSCODE
        const polledTranscodeResponse =
          await TrackTranscodeHandoffManager.pollForTranscode({
            sp,
            uuid: transcodeAndSegmentUUID
          })

        decisionTree.state = HAND_OFF_STATES.FETCHING_FILES_AND_WRITING_TO_FS
        const localFilePaths =
          await TrackTranscodeHandoffManager.fetchFilesAndWriteToFs({
            ...polledTranscodeResponse,
            sp,
            fileNameNoExtension: req.fileNameNoExtension
          })

        if (
          !localFilePaths ||
          !localFilePaths.transcodeFilePath ||
          !localFilePaths.segmentFileNames ||
          !localFilePaths.m3u8FilePath
        ) {
          throw new Error(
            `Missing fields from transcode fetching response. Actual response=${JSON.stringify(
              localFilePaths
            )}`
          )
        }

        resp = localFilePaths

        // If the responses are what we expect them to be, break out of the loop as transcode hand off
        // was successful
        break
      } catch (e) {
        logger.warn(
          `Could not hand off track: state=${JSON.stringify(
            decisionTree
          )} err=${e.toString()}`
        )
      }
    }

    return resp
  }

  /**
   * Select a default number of random Content Nodes
   * @param {Object} libs
   * @returns array of healthy Content Nodes for transcode hand off
   */
  static async selectRandomSPs(libs) {
    let allSPs = await libs.ethContracts.getServiceProviderList('content-node')
    allSPs = allSPs.map((sp) => sp.endpoint)

    // If there are less Content Nodes than the default number, set the cap to the number
    // of available SPs. This will probably only happen in local dev :shrugs:
    const numberOfSps =
      allSPs.length < NUMBER_OF_SPS_FOR_HANDOFF_TRACK
        ? allSPs.length
        : NUMBER_OF_SPS_FOR_HANDOFF_TRACK

    const validSPs = new Set()
    while (validSPs.size < numberOfSps) {
      const index = Utils.getRandomInt(allSPs.length)
      const currentSP = allSPs[index]

      if (currentSP === CREATOR_NODE_ENDPOINT || validSPs.has(currentSP)) {
        continue
      }
      validSPs.add(currentSP)
    }

    return Array.from(validSPs)
  }

  /**
   * Sends the uploaded track artifact to the passed in sp
   * @param {Object} param
   * @param {string} param.sp the Content Node to hand off the track to
   * @param {Object} param.req request object with the params {fileDir, fileName, fileNameNoExtension}
   * @returns the transcoding job uuid
   */
  static async sendTrackToSp({ sp, req }) {
    const logger = TrackTranscodeHandoffManager.logger
    const { fileDir, fileName, fileNameNoExtension } = req

    await TrackTranscodeHandoffManager.fetchHealthCheck(sp)

    logger.info({ sp }, `Sending off transcode and segmenting request...`)
    const transcodeAndSegmentUUID =
      await TrackTranscodeHandoffManager.sendTranscodeAndSegmentRequest({
        sp,
        fileDir,
        fileName,
        fileNameNoExtension
      })

    return transcodeAndSegmentUUID
  }

  /**
   * Polls for the transcode response given the uuid
   * @param {Object} param
   * @param {string} param.uuid the uuid of the transcode job used for polling
   * @param {string} param.sp the Content Node to poll the transcode job for
   * @returns the transcode job results
   */
  static async pollForTranscode({ uuid, sp }) {
    const logger = TrackTranscodeHandoffManager.logger
    logger.info(
      { sp },
      `Polling for transcode and segments with uuid=${uuid}...`
    )

    return asyncRetry({
      logger: TrackTranscodeHandoffManager.logger,
      asyncFn: async (bail, num) => {
        if (num === 50) {
          bail(
            new Error(`Transcode handoff max attempts reached for uuid=${uuid}`)
          )
          return
        }

        const { status, resp } =
          await TrackTranscodeHandoffManager.fetchTranscodeProcessingStatus({
            sp,
            uuid
          })

        // Have to throw errors to trigger a retry
        if (!status) {
          throw new Error(`Job for uuid=${uuid} has not begun yet...`)
        }

        if (status === 'IN_PROGRESS') {
          throw new Error(`In progress for uuid=${uuid}...`)
        }

        if (status === 'FAILED') {
          bail(
            new Error(`Transcode handoff failed: uuid=${uuid}, error=${resp}`)
          )
          return
        }

        if (status === 'DONE') {
          return resp
        }
      },
      logLabel: 'polling transcode',
      options: {
        retries: POLLING_TRANSCODE_AND_SEGMENTS_RETRIES,
        minTimeout: POLLING_TRANSCODE_AND_SEGMENTS_MIN_TIMEOUT,
        maxTimeout: POLLING_TRANSCODE_AND_SEGMENTS_MAX_TIMEOUT
      }
    })
  }

  /**
   * Fetches files from the Content Node that handled transcoding, and writes to current
   * node's filesystem.
   * @param {Object} param
   * @param {string} param.fileNameNoExtension the uploaded track artifact file name without the extension
   * @param {string} param.transcodeFilePath the transcode file path
   * @param {string[]} param.segmentFileNames an array of segment file names
   * @param {string} param.m3u8FilePath the m3u8 file path
   * @param {string} param.fileDir the file directory that holds the transcode, segments, and m3u8 file paths
   * @param {string} param.sp the Content Node to fetch the content from
   * @returns {Object}
   * {
   *    transcodeFilePath,
   *    segmentFileNames,
   *    m3u8FilePath
   * }
   */
  static async fetchFilesAndWriteToFs({
    fileNameNoExtension,
    transcodeFilePath,
    segmentFileNames,
    segmentFilePaths,
    m3u8FilePath,
    fileDir,
    sp
  }) {
    const logger = TrackTranscodeHandoffManager.logger

    let res

    // TODO: parallelize?

    try {
      // Get segments and write to tmp disk
      logger.info({ sp }, `Fetching ${segmentFileNames.length} segments...`)
      for (let i = 0; i < segmentFileNames.length; i++) {
        const segmentFileName = segmentFileNames[i]
        const segmentFilePath = segmentFilePaths[i]

        res = await TrackTranscodeHandoffManager.fetchSegment(
          sp,
          segmentFileName,
          fileNameNoExtension
        )
        await Utils.writeStreamToFileSystem(res.data, segmentFilePath)
      }

      // Get transcode and write to tmp disk
      logger.info({ sp, transcodeFilePath }, 'Fetching transcode...')
      res = await TrackTranscodeHandoffManager.fetchTranscode(
        sp,
        fileNameNoExtension
      )
      await Utils.writeStreamToFileSystem(res.data, transcodeFilePath)

      // Get m3u8 file and write to tmp disk
      logger.info({ sp, m3u8FilePath }, 'Fetching m3u8...')
      res = await TrackTranscodeHandoffManager.fetchM3U8File(
        sp,
        fileNameNoExtension
      )
      await Utils.writeStreamToFileSystem(res.data, m3u8FilePath)
    } catch (e) {
      logger.error(
        `Could not complete writing files to disk: ${e.message}. Removing files..`
      )
      removeTrackFolder(TrackTranscodeHandoffManager.logContext, fileDir)
      throw e
    }

    return {
      transcodeFilePath,
      segmentFileNames,
      m3u8FilePath
    }
  }

  /**
   * Send a transcode and segment request to the input Content Node
   * @param {Object} param
   * @param {string} param.sp the Content Node to send the transcode and segment request to
   * @param {string} param.fileDir the file directory that holds the transcode, segments, and m3u8 file paths
   * @param {string} param.fileName tthe uploaded track artifact file name
   * @param {string} param.fileNameNoExtension the uploaded track artifact file name without the extension
   * @returns the transcode and segment job uuid used for polling
   */
  static async sendTranscodeAndSegmentRequest({
    sp,
    fileDir,
    fileName,
    fileNameNoExtension
  }) {
    const originalTrackFormData =
      await TrackTranscodeHandoffManager.createFormData(
        fileDir + '/' + fileName
      )

    // TODO: make this constant. perhaps in a class
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    const resp = await TrackTranscodeHandoffManager.asyncRetryNotOn404({
      logger: TrackTranscodeHandoffManager.logger,
      asyncFn: async () => {
        return axios({
          url: `${sp}/transcode_and_segment`,
          method: 'post',
          data: originalTrackFormData,
          headers: {
            ...originalTrackFormData.getHeaders()
          },
          params: {
            uuid: fileNameNoExtension,
            timestamp,
            signature,
            spID
          },
          adapter: require('axios/lib/adapters/http'),
          // Set content length headers (only applicable in server/node environments).
          // See: https://github.com/axios/axios/issues/1362
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: SEND_TRANSCODE_AND_SEGMENT_REQUEST_TIMEOUT_MS
        })
      },
      logLabel: 'transcode and segment'
    })

    return resp.data.data.uuid
  }

  /**
   * Creates the form data necessary to send over transcode and segment request
   * @param {string} pathToFile path to the uploaded track artifact
   * @returns formData object passed in axios to send a transcode and segment request
   */
  static async createFormData(pathToFile) {
    const fileExists = await fsExtra.pathExists(pathToFile)
    if (!fileExists) {
      throw new Error(`File does not exist at path=${pathToFile}`)
    }

    const formData = new FormData()
    formData.append('file', fs.createReadStream(pathToFile))

    return formData
  }

  /**
   * Wrapper to fetch health check response
   * @param {string} sp the endpoint to the Content Node
   */
  static async fetchHealthCheck(sp) {
    await axios({
      url: `${sp}/health_check`,
      method: 'get',
      timeout: FETCH_HEALTH_CHECK_TIMEOUT_MS
    })
  }

  /**
   * Gets the status of the transcode processing
   * @param {Object} param
   * @param {string} param.sp the current sp selected for track processing
   * @param {string} param.uuid the uuid of the track transcoding task
   * @returns the status, and the success or failed response if the task is complete
   */
  static async fetchTranscodeProcessingStatus({ sp, uuid }) {
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    const { data: body } =
      await TrackTranscodeHandoffManager.asyncRetryNotOn404({
        logger: TrackTranscodeHandoffManager.logger,
        asyncFn: async () => {
          return axios({
            url: `${sp}/async_processing_status`,
            params: { uuid, timestamp, signature, spID },
            method: 'get',
            timeout: FETCH_PROCESSING_STATUS_TIMEOUT_MS
          })
        },
        logLabel: 'fetch track content processing status'
      })

    return body.data
  }

  /**
   * Fetches a segment from a sp
   * @param {string} sp the endpoint of the Content Node to fetch the segment from
   * @param {string} segmentFileName the filename of the segment
   * @param {string} fileNameNoExtension the file name of the uploaded track artifact without extension
   * @returns the fetched segment
   */
  static async fetchSegment(sp, segmentFileName, fileNameNoExtension) {
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    return TrackTranscodeHandoffManager.asyncRetryNotOn404({
      logger: TrackTranscodeHandoffManager.logger,
      asyncFn: async () => {
        return axios({
          url: `${sp}/transcode_and_segment`,
          method: 'get',
          params: {
            fileName: segmentFileName,
            fileType: 'segment',
            uuid: fileNameNoExtension,
            timestamp,
            signature,
            spID
          },
          responseType: 'stream',
          timeout: FETCH_STREAM_TIMEOUT_MS
        })
      },
      logLabel: 'fetch segment'
    })
  }

  /**
   * Fetches a transcode
   * @param {string} sp the endpoint of the Content Node to fetch the transcode from
   * @param {string} fileNameNoExtension the file name of the uploaded track artifact without extension
   * @returns
   */
  static async fetchTranscode(sp, fileNameNoExtension) {
    const transcodeFileName = fileNameNoExtension + '-dl.mp3'
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    return TrackTranscodeHandoffManager.asyncRetryNotOn404({
      logger: TrackTranscodeHandoffManager.logger,
      asyncFn: async () => {
        return axios({
          url: `${sp}/transcode_and_segment`,
          method: 'get',
          params: {
            fileName: transcodeFileName,
            fileType: 'transcode',
            uuid: fileNameNoExtension,
            timestamp,
            signature,
            spID
          },
          responseType: 'stream',
          timeout: FETCH_STREAM_TIMEOUT_MS
        })
      },
      logLabel: 'fetch transcode'
    })
  }

  /**
   * Fetches a m3u8
   * @param {string} sp the endpoint of the Content Node to fetch the transcode from
   * @param {string} fileNameNoExtension the file name of the uploaded track artifact without extension
   * @returns
   */
  static async fetchM3U8File(sp, fileNameNoExtension) {
    const m3u8FileName = fileNameNoExtension + '.m3u8'
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    return TrackTranscodeHandoffManager.asyncRetryNotOn404({
      logger: TrackTranscodeHandoffManager.logger,
      asyncFn: async () => {
        return axios({
          url: `${sp}/transcode_and_segment`,
          method: 'get',
          params: {
            fileName: m3u8FileName,
            fileType: 'm3u8',
            uuid: fileNameNoExtension,
            timestamp,
            signature,
            spID
          },
          responseType: 'stream',
          timeout: FETCH_STREAM_TIMEOUT_MS
        })
      },
      logLabel: 'fetch m3u8'
    })
  }

  /**
   * Initializes the log context and logger
   * @param {Object} logContext
   */
  static initLogger(logContext) {
    TrackTranscodeHandoffManager.logContext = logContext
    TrackTranscodeHandoffManager.logger = genericLogger.child(logContext)

    return TrackTranscodeHandoffManager.logger
  }

  /**
   * Wrapper around async-retry API, with no retry on 404. Used to handle backwards compatibility when
   * an SP has not yet upgraded and the route is not found.
   *
   * options described here https://github.com/tim-kos/node-retry#retrytimeoutsoptions
   *
   * @dev please deprecate this fn after all content nodes upgrade to 0.3.57
   * @param {Object} param
   * @param {Object} param.logger
   * @param {func} param.asyncFn the fn to asynchronously retry
   * @param {string} param.logLabel the task label used to print on retry. used for debugging purposes
   * @param {Object} param.options optional options. defaults to the params listed below if not explicitly passed in
   * @param {number} [param.options.factor=2] the exponential factor
   * @param {number} [param.options.retries=5] the max number of retries. defaulted to 5
   * @param {number} [param.options.minTimeout=1000] minimum number of ms to wait after first retry. defaulted to 1000ms
   * @param {number} [param.options.maxTimeout=5000] maximum number of ms between two retries. defaulted to 5000ms
   * @param {func} [param.options.onRetry] fn that gets called per retry
   * @returns the fn response if success, or throws an error
   */
  static asyncRetryNotOn404({
    logger,
    asyncFn: inputAsyncFn,
    logLabel,
    options = {}
  }) {
    const asyncFn = async (bail) => {
      let resp
      try {
        resp = await inputAsyncFn()
      } catch (e) {
        // If SP 404's, the SP has not upgraded. Bail without retries.
        // Else, just throw the caught error
        if (e.response && e.response.status === 404) {
          bail(new Error('Route not supported'))
          return
        }

        throw e
      }

      return resp
    }

    return asyncRetry({ logger, asyncFn, logLabel, options })
  }
}

module.exports = TrackTranscodeHandoffManager
