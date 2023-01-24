import type { LogContext } from '../../utils'
import type Logger from 'bunyan'

import axios from 'axios'
import fs from 'fs-extra'
import FormData from 'form-data'
import _ from 'lodash'
import config from '../../config'
import { writeStreamToFileSystem } from '../../utils'
import { asyncRetry } from '../../utils/asyncRetry'
import { logger as genericLogger } from '../../logging'
import { generateTimestampAndSignatureForSPVerification } from '../../apiSigning'
import { removeTrackFolder } from '../../fileManager'

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
const ASYNC_RETRY_NOT_ON_404_MAX_TIMEOUT_MS = 5000

type HandoffState =
  | 'Initialized'
  | 'SelectingRandomSps'
  | 'HandingOffToSps'
  | 'PollingForTranscode'
  | 'FetchingFilesAndWritingToFs'

// Handles sending a transcode and segment request to an available node in the network
const logContext = {}
let logger = genericLogger.child(logContext)

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
export async function handOff(
  { logContext }: { logContext: LogContext },
  req: {
    libs: any
    fileName: string
    fileDir: string
    fileNameNoExtension: string
    fileDestination: string
    headers: Record<string, string>
    session: any
  }
) {
  const logger = initLogger(logContext)

  const decisionTree: { state: HandoffState; sp: string } = {
    state: 'Initialized',
    sp: ''
  }
  const libs = req.libs
  let resp = {}

  let sps
  try {
    decisionTree.state = 'SelectingRandomSps'
    sps = await selectRandomSPs(libs)
  } catch (e: any) {
    logger.warn(`Could not select random SPs: ${e.message}`)
    return resp
  }

  for (const sp of sps) {
    decisionTree.sp = sp
    try {
      logger.info(`Handing track off to sp=${sp}`)
      decisionTree.state = 'HandingOffToSps'

      const transcodeAndSegmentUUID = await sendTrackToSp({ sp, req })

      decisionTree.state = 'PollingForTranscode'
      const polledTranscodeResponse = await pollForTranscode({
        sp,
        uuid: transcodeAndSegmentUUID
      })

      decisionTree.state = 'FetchingFilesAndWritingToFs'
      const localFilePaths = await fetchFilesAndWriteToFs({
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
    } catch (e: any) {
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
 * Select a default number of random Content Nodes, excluding self
 * @param {Object} libs
 * @returns array of healthy Content Nodes for transcode hand off
 */
export async function selectRandomSPs(libs: any) {
  const allSPs: { endpoint: string }[] =
    await libs.ethContracts.getServiceProviderList('content-node')
  const allValidSPs = allSPs
    .map((sp) => sp.endpoint)
    .filter((endpoint: string) => endpoint !== CREATOR_NODE_ENDPOINT)

  // If there are less Content Nodes than the default number, set the cap to the number
  // of available SPs. This will probably only happen in local dev :shrugs:
  const numOfSPsToSelect =
    allValidSPs.length < NUMBER_OF_SPS_FOR_HANDOFF_TRACK
      ? allValidSPs.length
      : NUMBER_OF_SPS_FOR_HANDOFF_TRACK

  return _.sampleSize(allValidSPs, numOfSPsToSelect)
}

/**
 * Sends the uploaded track artifact to the passed in sp
 * @param {Object} param
 * @param {string} param.sp the Content Node to hand off the track to
 * @param {Object} param.req request object with the params {fileDir, fileName, fileNameNoExtension}
 * @returns the transcoding job uuid
 */
export async function sendTrackToSp({
  sp,
  req
}: {
  sp: string
  req: { fileDir: string; fileName: string; fileNameNoExtension: string }
}) {
  const { fileDir, fileName, fileNameNoExtension } = req

  await fetchHealthCheck(sp)

  logger.info({ sp }, `Sending off transcode and segmenting request...`)
  const transcodeAndSegmentUUID = await sendTranscodeAndSegmentRequest({
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
export async function pollForTranscode({
  uuid,
  sp
}: {
  uuid: string
  sp: string
}) {
  logger.info({ sp }, `Polling for transcode and segments with uuid=${uuid}...`)

  return asyncRetry({
    logger: logger,
    asyncFn: async (bail, num) => {
      if (num === 50) {
        bail(
          new Error(`Transcode handoff max attempts reached for uuid=${uuid}`)
        )
        return
      }

      const { status, resp } = await fetchTranscodeProcessingStatus({
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
        bail(new Error(`Transcode handoff failed: uuid=${uuid}, error=${resp}`))
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
export async function fetchFilesAndWriteToFs({
  fileNameNoExtension,
  transcodeFilePath,
  segmentFileNames,
  segmentFilePaths,
  m3u8FilePath,
  fileDir,
  sp
}: {
  fileNameNoExtension: string
  transcodeFilePath: string
  segmentFileNames: string[]
  segmentFilePaths: string[]
  m3u8FilePath: string
  fileDir: string
  sp: string
}) {
  let res

  // TODO: parallelize?

  try {
    // Get segments and write to tmp disk
    logger.info({ sp }, `Fetching ${segmentFileNames.length} segments...`)
    for (let i = 0; i < segmentFileNames.length; i++) {
      const segmentFileName = segmentFileNames[i]
      const segmentFilePath = segmentFilePaths[i]

      res = await fetchSegment(sp, segmentFileName, fileNameNoExtension)
      await writeStreamToFileSystem(res.data, segmentFilePath)
    }

    // Get transcode and write to tmp disk
    logger.info({ sp, transcodeFilePath }, 'Fetching transcode...')
    res = await fetchTranscode(sp, fileNameNoExtension)
    await writeStreamToFileSystem(res.data, transcodeFilePath)

    // Get m3u8 file and write to tmp disk
    logger.info({ sp, m3u8FilePath }, 'Fetching m3u8...')
    res = await fetchM3U8File(sp, fileNameNoExtension)
    await writeStreamToFileSystem(res.data, m3u8FilePath)
  } catch (e: any) {
    logger.error(
      `Could not complete writing files to disk: ${e.message}. Removing files..`
    )
    await removeTrackFolder({ logContext }, fileDir)
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
export async function sendTranscodeAndSegmentRequest({
  sp,
  fileDir,
  fileName,
  fileNameNoExtension
}: {
  sp: string
  fileDir: string
  fileName: string
  fileNameNoExtension: string
}) {
  const originalTrackFormData = await createFormData(fileDir + '/' + fileName)

  // TODO: make this constant. perhaps in a class
  const spID = config.get('spID')
  const { timestamp, signature } =
    generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

  const resp = await asyncRetryNotOn404({
    logger: logger,
    asyncFn: async () => {
      // idk why typescript doesn't like `maxContextLength` and `maxBodyLength`
      // @ts-ignore
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
    logLabel: 'transcode and segment',
    options: {
      maxTimeout: ASYNC_RETRY_NOT_ON_404_MAX_TIMEOUT_MS
    }
  })

  return resp.data.data.uuid
}

/**
 * Creates the form data necessary to send over transcode and segment request
 * @param {string} pathToFile path to the uploaded track artifact
 * @returns formData object passed in axios to send a transcode and segment request
 */
export async function createFormData(pathToFile: string) {
  const fileExists = await fs.pathExists(pathToFile)
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
export async function fetchHealthCheck(sp: string) {
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
export async function fetchTranscodeProcessingStatus({
  sp,
  uuid
}: {
  sp: string
  uuid: string
}) {
  const spID = config.get('spID')
  const { timestamp, signature } =
    generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

  const { data: body } = await asyncRetryNotOn404({
    logger: logger,
    asyncFn: async () => {
      return axios({
        url: `${sp}/async_processing_status`,
        params: { uuid, timestamp, signature, spID },
        method: 'get',
        timeout: FETCH_PROCESSING_STATUS_TIMEOUT_MS
      })
    },
    logLabel: 'fetch track content processing status',
    options: {
      maxTimeout: ASYNC_RETRY_NOT_ON_404_MAX_TIMEOUT_MS
    }
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
export async function fetchSegment(
  sp: string,
  segmentFileName: string,
  fileNameNoExtension: string
) {
  const spID = config.get('spID')
  const { timestamp, signature } =
    generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

  return asyncRetryNotOn404({
    logger: logger,
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
    logLabel: 'fetch segment',
    options: {
      maxTimeout: ASYNC_RETRY_NOT_ON_404_MAX_TIMEOUT_MS
    }
  })
}

/**
 * Fetches a transcode
 * @param {string} sp the endpoint of the Content Node to fetch the transcode from
 * @param {string} fileNameNoExtension the file name of the uploaded track artifact without extension
 * @returns
 */
export async function fetchTranscode(sp: string, fileNameNoExtension: string) {
  const transcodeFileName = fileNameNoExtension + '-dl.mp3'
  const spID = config.get('spID')
  const { timestamp, signature } =
    generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

  return asyncRetryNotOn404({
    logger: logger,
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
    logLabel: 'fetch transcode',
    options: {
      maxTimeout: ASYNC_RETRY_NOT_ON_404_MAX_TIMEOUT_MS
    }
  })
}

/**
 * Fetches a m3u8
 * @param {string} sp the endpoint of the Content Node to fetch the transcode from
 * @param {string} fileNameNoExtension the file name of the uploaded track artifact without extension
 * @returns
 */
export async function fetchM3U8File(sp: string, fileNameNoExtension: string) {
  const m3u8FileName = fileNameNoExtension + '.m3u8'
  const spID = config.get('spID')
  const { timestamp, signature } =
    generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

  return asyncRetryNotOn404({
    logger: logger,
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
    logLabel: 'fetch m3u8',
    options: {
      maxTimeout: ASYNC_RETRY_NOT_ON_404_MAX_TIMEOUT_MS
    }
  })
}

/**
 * Initializes the log context and logger
 * @param {Object} logContext
 */
export function initLogger(logContext: Object) {
  logger = genericLogger.child(logContext)

  return logger
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
export function asyncRetryNotOn404({
  logger,
  asyncFn: inputAsyncFn,
  logLabel,
  options = {}
}: {
  logger: Logger
  asyncFn: (...arg: any[]) => any
  logLabel: string
  options: Object
}) {
  const asyncFn = async (bail: (...arg: any) => any) => {
    let resp
    try {
      resp = await inputAsyncFn()
    } catch (e: any) {
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
