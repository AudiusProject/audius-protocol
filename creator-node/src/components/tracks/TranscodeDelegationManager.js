const axios = require('axios')
const fs = require('fs')
const fsExtra = require('fs-extra')
const FormData = require('form-data')
const retry = require('async-retry')

const config = require('../../config.js')
const Utils = require('../../utils')
const { logger: genericLogger } = require('../../logging')
const {
  generateTimestampAndSignatureForSPVerification
} = require('../../apiSigning')

const CREATOR_NODE_ENDPOINT = config.get('creatorNodeEndpoint')
const DELEGATE_PRIVATE_KEY = config.get('delegatePrivateKey')
const NUMBER_OF_SPS_FOR_HANDOFF_TRACK = 3

class TranscodeDelegationManager {
  static async handOff({ logContext }, req) {
    const decisionTree = { state: null }
    const libs = req.libs
    const logger = genericLogger.child(logContext)
    let resp = {}

    let sps
    try {
      decisionTree.state = 'SELECTING_RANDOM_SPS'
      sps = await TranscodeDelegationManager.selectRandomSPs(libs)
    } catch (e) {
      logger.warn(`Could not select random SPs: ${e.message}`)
      return resp
    }

    for (const sp of sps) {
      decisionTree.sp = sp
      try {
        logger.info(`Handing track off to sp=${sp}`)
        decisionTree.state = 'HANDING_OFF_TO_SP'

        const transcodeAndSegmentUUID =
          await TranscodeDelegationManager.handOffToSp(logger, { sp, req })

        decisionTree.state = 'POLLING_FOR_TRANSCODE'
        const polledTranscodeResponse =
          await TranscodeDelegationManager.pollForTranscode(logger, {
            sp,
            uuid: transcodeAndSegmentUUID
          })

        decisionTree.state = 'FETCHING_FILES_AND_WRITING_TO_FS'
        const localFilePaths =
          await TranscodeDelegationManager.fetchFilesAndWriteToFs(logger, {
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
          `Could not hand off track: state=${
            decisionTree.state
          } err=${e.toString()}`
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

  static async handOffToSp(logger, { sp, req }) {
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

  static async pollForTranscode(logger, { uuid, sp }) {
    logger.info(
      { sp },
      `Polling for transcode and segments with uuid=${uuid}...`
    )

    return this.asyncRetry({
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

  static async fetchFilesAndWriteToFs(
    logger,
    {
      fileNameNoExtension,
      transcodeFilePath,
      segmentFileNames,
      segmentFilePaths,
      m3u8FilePath,
      sp
    }
  ) {
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
    const transcodeFileName = fileNameNoExtension + '-dl.mp3'
    res = await TranscodeDelegationManager.fetchTranscode(
      sp,
      transcodeFileName,
      fileNameNoExtension
    )
    await Utils.writeStreamToFileSystem(res.data, transcodeFilePath)

    // Get m3u8 file and write to tmp disk
    logger.info({ sp, m3u8FilePath }, 'Fetching m3u8...')
    const m3u8FileName = fileNameNoExtension + '.m3u8'
    res = await TranscodeDelegationManager.fetchM3U8File(
      sp,
      m3u8FileName,
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

    const resp = await this.asyncRetry({
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
        maxBodyLength: Infinity
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
      method: 'get'
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

    const { data: body } = await this.asyncRetry({
      asyncFn: axios,
      asyncFnParams: {
        url: `${sp}/async_processing_status`,
        params: { uuid, timestamp, signature, spID },
        method: 'get'
      },
      asyncFnTask: 'fetch track content processing status'
    })

    return body.data
  }

  static async fetchSegment(sp, segmentFileName, fileNameNoExtension) {
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    return this.asyncRetry({
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
        responseType: 'stream'
      },
      asyncFnTask: 'fetch segment'
    })
  }

  static async fetchTranscode(sp, transcodeFileName, fileNameNoExtension) {
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    return this.asyncRetry({
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
        responseType: 'stream'
      },
      asyncFnTask: 'fetch transcode'
    })
  }

  static async fetchM3U8File(sp, m3u8FileName, fileNameNoExtension) {
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    return this.asyncRetry({
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
        responseType: 'stream'
      },
      asyncFnTask: 'fetch m3u8'
    })
  }

  /**
   * Wrapper around async-retry API.
   * @param {Object} param
   * @param {func} param.asyncFn the fn to asynchronously retry
   * @param {Object} param.asyncFnParams the params to pass into the fn. takes in 1 object
   * @param {number} [retries=5] the max number of retries. defaulted to 5
   * @param {number} [minTimeout=1000] minimum time to wait after first retry. defaulted to 1000ms
   * @param {number} [maxTimeout=5000] maximum time to wait after first retry. defaulted to 5000ms
   * @returns the fn response if success, or throws an error
   */
  static async asyncRetry({
    asyncFn,
    asyncFnParams,
    asyncFnTask,
    retries = 5,
    minTimeout = 1000, // default for async-retry
    maxTimeout = 5000
  }) {
    return retry(
      async () => {
        if (asyncFnParams) {
          return asyncFn(asyncFnParams)
        }

        return asyncFn()
      },
      {
        retries,
        minTimeout,
        maxTimeout,
        onRetry: (err, i) => {
          if (err) {
            console.log(`${asyncFnTask} ${i} retry error: `, err)
          }
        }
      }
    )
  }
}

module.exports = TranscodeDelegationManager
