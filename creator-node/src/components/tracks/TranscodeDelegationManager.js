const axios = require('axios')
const fs = require('fs')
const fsExtra = require('fs-extra')
const FormData = require('form-data')

const config = require('../../config.js')
const Utils = require('../../utils')
const { logger: genericLogger } = require('../../logging')
const {
  generateTimestampAndSignatureForSPVerification
} = require('../../apiSigning')

const CREATOR_NODE_ENDPOINT = config.get('creatorNodeEndpoint')
const DELEGATE_PRIVATE_KEY = config.get('delegatePrivateKey')

const NUMBER_OF_SPS_FOR_HANDOFF_TRACK = 3
const HAND_OFF_STATES = Object.freeze({
  INITIALIZED: 'INITIALIZED',
  SELECTING_RANDOM_SPS: 'SELECTING_RANDOM_SPS',
  HANDING_OFF_TO_SP: 'HANDING_OFF_TO_SP',
  POLLING_FOR_TRANSCODE: 'POLLING_FOR_TRANSCODE',
  FETCHING_FILES_AND_WRITING_TO_FS: 'FETCHING_FILES_AND_WRITING_TO_FS'
})

class TranscodeDelegationManager {
  static logger = genericLogger.child({})

  static async handOff({ logContext }, req) {
    TranscodeDelegationManager.initLogger(logContext)

    const decisionTree = { state: HAND_OFF_STATES.INITIALIZED }
    const libs = req.libs
    let resp = {}

    let sps
    try {
      decisionTree.state = HAND_OFF_STATES.SELECTING_RANDOM_SPS
      sps = await TranscodeDelegationManager.selectRandomSPs(libs)
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
          await TranscodeDelegationManager.sendTrackToSp({ sp, req })

        decisionTree.state = HAND_OFF_STATES.POLLING_FOR_TRANSCODE
        const polledTranscodeResponse =
          await TranscodeDelegationManager.pollForTranscode({
            sp,
            uuid: transcodeAndSegmentUUID
          })

        decisionTree.state = HAND_OFF_STATES.FETCHING_FILES_AND_WRITING_TO_FS
        const localFilePaths =
          await TranscodeDelegationManager.fetchFilesAndWriteToFs({
            ...polledTranscodeResponse,
            sp,
            fileNameNoExtension: req.fileNameNoExtension
          })

        resp = localFilePaths

        // If any of these fields are not present, throw and retry onto the next sp
        if (
          !resp.transcodeFilePath ||
          !resp.segmentFileNames ||
          !resp.m3u8FilePath
        ) {
          throw new Error(
            `Missing fields from transcode fetching response. Actual response=${JSON.stringify(
              resp
            )}`
          )
        }

        // If the above asserts passed, break out of the loop
        break
      } catch (e) {
        // TODO: delete tmp dir in external SP if fails and continue
        logger.warn(
          `Could not hand off track: state=${JSON.stringify(
            decisionTree
          )} err=${e.toString()}`
        )
        console.error(e)
      }
    }

    return resp
  }

  // If any call fails -> throw error

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
      // do not pick self or a node that has already been chosen
      if (currentSP === CREATOR_NODE_ENDPOINT || validSPs.has(currentSP)) {
        continue
      }
      validSPs.add(currentSP)
    }

    return Array.from(validSPs)
  }

  static async sendTrackToSp({ sp, req }) {
    const { fileDir, fileName, fileNameNoExtension, uuid: requestID } = req

    await TranscodeDelegationManager.fetchHealthCheck(sp)

    logger.info({ sp }, `Sending off transcode and segmenting request...`)
    const transcodeAndSegmentUUID =
      await TranscodeDelegationManager.sendTranscodeAndSegmentRequest({
        sp,
        fileDir,
        fileName,
        fileNameNoExtension
      })

    return transcodeAndSegmentUUID
  }

  static async pollForTranscode({ uuid, sp }) {
    logger.info(
      { sp },
      `Polling for transcode and segments with uuid=${uuid}...`
    )

    return Utils.asyncRetry({
      asyncFn: async (bail, num) => {
        if (num === 50) {
          bail(
            new Error(`Transcode handoff max attempts reached for uuid=${uuid}`)
          )
          return
        }

        const { status, resp } =
          await TranscodeDelegationManager.fetchTranscodeProcessingStatus({
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
      asyncFnTask: 'polling transcode',
      retries: 50,
      minTimeout: 10000,
      maxTimeout: 10000
    })
  }

  static async fetchFilesAndWriteToFs({
    fileNameNoExtension,
    transcodeFilePath,
    segmentFileNames,
    segmentFilePaths,
    m3u8FilePath,
    sp
  }) {
    let res

    // TODO: parallelize?

    // TODO: if any part of the below fails, we should remove any tmp dirs

    // Get segments and write to tmp disk
    logger.info({ sp }, `Fetching ${segmentFileNames.length} segments...`)
    for (let i = 0; i < segmentFileNames.length; i++) {
      const segmentFileName = segmentFileNames[i]
      const segmentFilePath = segmentFilePaths[i]

      res = await TranscodeDelegationManager.fetchSegment(
        sp,
        segmentFileName,
        fileNameNoExtension
      )
      await Utils.writeStreamToFileSystem(res.data, segmentFilePath)
    }

    // Get transcode and write to tmp disk
    logger.info({ sp, transcodeFilePath }, 'Fetching transcode...')
    res = await TranscodeDelegationManager.fetchTranscode(
      sp,
      fileNameNoExtension
    )
    await Utils.writeStreamToFileSystem(res.data, transcodeFilePath)

    // Get m3u8 file and write to tmp disk
    logger.info({ sp, m3u8FilePath }, 'Fetching m3u8...')
    res = await TranscodeDelegationManager.fetchM3U8File(
      sp,
      fileNameNoExtension
    )
    await Utils.writeStreamToFileSystem(res.data, m3u8FilePath)

    return {
      transcodeFilePath,
      segmentFileNames,
      m3u8FilePath
    }
  }

  static async sendTranscodeAndSegmentRequest({
    sp,
    fileDir,
    fileName,
    fileNameNoExtension
  }) {
    const originalTrackFormData =
      await TranscodeDelegationManager.createFormData(fileDir + '/' + fileName)

    // TODO: make this constant. perhaps in a class
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    const resp = await Utils.asyncRetry({
      asyncFn: axios,
      asyncFnParams: {
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
        timeout: 5000 // 5s
      },
      asyncFnTask: 'transcode and segment'
    })

    return resp.data.data.uuid
  }

  static async createFormData(pathToFile) {
    const fileExists = await fsExtra.pathExists(pathToFile)
    if (!fileExists) {
      throw new Error(`File does not exist at path=${pathToFile}`)
    }

    const formData = new FormData()
    formData.append('file', fs.createReadStream(pathToFile))

    return formData
  }

  static async fetchHealthCheck(sp) {
    await axios({
      url: `${sp}/health_check`,
      method: 'get',
      timeout: 5000 // 5s
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

    const { data: body } = await Utils.asyncRetry({
      asyncFn: axios,
      asyncFnParams: {
        url: `${sp}/async_processing_status`,
        params: { uuid, timestamp, signature, spID },
        method: 'get',
        timeout: 5000 // 5s
      },
      asyncFnTask: 'fetch track content processing status'
    })

    return body.data
  }

  static async fetchSegment(sp, segmentFileName, fileNameNoExtension) {
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    return Utils.asyncRetry({
      asyncFn: axios,
      asyncFnParams: {
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
        timeout: 15000 // 15s
      },
      asyncFnTask: 'fetch segment'
    })
  }

  static async fetchTranscode(sp, fileNameNoExtension) {
    const transcodeFileName = fileNameNoExtension + '-dl.mp3'
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    return Utils.asyncRetry({
      asyncFn: axios,
      asyncFnParams: {
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
        timeout: 15000 // 15s
      },
      asyncFnTask: 'fetch transcode'
    })
  }

  static async fetchM3U8File(sp, fileNameNoExtension) {
    const m3u8FileName = fileNameNoExtension + '.m3u8'
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    return Utils.asyncRetry({
      asyncFn: axios,
      asyncFnParams: {
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
        timeout: 15000 // 15s
      },
      asyncFnTask: 'fetch m3u8'
    })
  }

  /**
   * Initializes the log context
   * @param {Object} logContext
   */
  static initLogger(logContext) {
    logger = genericLogger.child(logContext)
  }
}

module.exports = TranscodeDelegationManager
